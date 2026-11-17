package kr.carnot.office.signup;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.regex.Pattern;
import kr.carnot.office.account.AccountService;
import kr.carnot.office.account.Mailer;
import kr.carnot.office.account.OrgRepository;
import kr.carnot.office.account.UserRepository;
import kr.carnot.office.account.UserRow;
import kr.carnot.office.common.ApiException;
import kr.carnot.office.common.CarnotProperties;
import kr.carnot.office.common.Ids;
import kr.carnot.office.common.Passwords;
import kr.carnot.office.security.CurrentUser;
import kr.carnot.office.store.Kind;
import kr.carnot.office.store.RecordRepository;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** 기관 가입 (새 기관 만들기 · 이미 가입한 기관에 직원으로 가입 신청). */
@Service
public class SignupService {
    private static final Pattern CODE = Pattern.compile("^[a-z0-9]{3,20}$");
    private static final Pattern MAIL = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");
    private static final Pattern NUMBER = Pattern.compile("^\\d{3}-?\\d{2}-?\\d{5}$");

    private final OrgRepository orgs;
    private final UserRepository users;
    private final RecordRepository records;
    private final PasswordEncoder enc;
    private final Mailer mailer;
    private final JdbcClient db;
    private final CarnotProperties props;
    private final ObjectMapper om;

    public SignupService(OrgRepository orgs, UserRepository users, RecordRepository records, PasswordEncoder enc, Mailer mailer, JdbcClient db,
                         CarnotProperties props, ObjectMapper om) {
        this.orgs = orgs;
        this.users = users;
        this.records = records;
        this.enc = enc;
        this.mailer = mailer;
        this.db = db;
        this.props = props;
        this.om = om;
    }

    /** 사업자번호로 이미 가입한 기관인지 봐요. */
    public Map<String, Object> checkNumber(String number) {
        var o = orgs.byNumber(number == null ? "" : number.trim()).filter(x -> !OrgRepository.placeholder(x));
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("exists", o.isPresent());
        o.ifPresent(x -> {
            var rec = records.find(Kind.ORG, x.id()).map(r -> r.data()).orElse(om.createObjectNode());
            ObjectNode org = om.createObjectNode();
            org.put("id", x.id());
            org.put("name", x.name());
            org.put("code", x.code());
            org.put("number", x.number());
            org.set("short", rec.get("short"));
            org.set("type", rec.get("type"));
            org.set("units", rec.get("units"));
            out.put("org", org);
        });
        return out;
    }

    public boolean codeFree(String code) {
        String c = code == null ? "" : code.trim().toLowerCase();
        return CODE.matcher(c).matches() && orgs.byCode(c).isEmpty() && !c.equals("admin");
    }

    /** 이메일 인증번호 보내기 (10분). 메일 서버가 없고 시연 모드면 번호를 응답에 실어 줘요. */
    @Transactional
    public Map<String, Object> sendMailCode(String email) {
        String m = email == null ? "" : email.trim().toLowerCase();
        if (!MAIL.matcher(m).matches()) throw ApiException.bad("이메일 주소를 확인해 주세요.");
        String code = Ids.digits(6);
        db.sql("""
            INSERT INTO email_codes (email, code_hash, expires_at) VALUES (?, ?, now() + interval '10 minutes')
            ON CONFLICT (email) DO UPDATE SET code_hash = EXCLUDED.code_hash, expires_at = EXCLUDED.expires_at, tries = 0, verified_at = NULL
            """).param(m).param(enc.encode(code)).update();
        mailer.send(m, "[Carnot office] 이메일 인증번호", "인증번호: " + code + " (10분 안에 입력해 주세요)");
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("sent", true);
        if (!mailer.configured() && props.demo().enabled()) out.put("devCode", code);
        return out;
    }

    @Transactional(noRollbackFor = ApiException.class)
    public void verifyMailCode(String email, String code) {
        String m = email == null ? "" : email.trim().toLowerCase();
        var row = db.sql("SELECT code_hash, expires_at, tries FROM email_codes WHERE email = ?").param(m)
            .query((rs, i) -> new Object[] {rs.getString(1), rs.getObject(2, OffsetDateTime.class), rs.getInt(3)}).optional()
            .orElseThrow(() -> ApiException.bad("인증번호를 먼저 받아 주세요."));
        if ((int) row[2] >= 5) throw ApiException.bad("여러 번 틀렸어요. 인증번호를 다시 받아 주세요.");
        if (((OffsetDateTime) row[1]).isBefore(OffsetDateTime.now())) throw ApiException.bad("인증번호가 만료됐어요. 다시 받아 주세요.");
        if (code == null || !enc.matches(code.trim(), (String) row[0])) {
            db.sql("UPDATE email_codes SET tries = tries + 1 WHERE email = ?").param(m).update();
            throw ApiException.bad("인증번호가 맞지 않아요.");
        }
        db.sql("UPDATE email_codes SET verified_at = now() WHERE email = ?").param(m).update();
    }

    private boolean mailVerified(String email) {
        return db.sql("SELECT count(*) FROM email_codes WHERE email = ? AND verified_at > now() - interval '1 hour'")
            .param(email.trim().toLowerCase()).query(Integer.class).single() > 0;
    }

    /** 새 기관 가입: 기관 + 관리자 계정을 만들고 바로 로그인 상태로 돌려줘요. */
    @Transactional
    public CurrentUser createOrg(ObjectNode org, ObjectNode person, String password) {
        String code = txt(org, "code").toLowerCase();
        String name = txt(org, "name");
        String number = txt(org, "number");
        String login = txt(person, "login").toLowerCase();
        String email = txt(person, "email");
        if (name.isEmpty()) throw ApiException.bad("기관명을 입력해 주세요.");
        if (!NUMBER.matcher(number).matches()) throw ApiException.bad("사업자등록번호 10자리를 확인해 주세요.");
        if (!codeFree(code)) throw ApiException.bad("회사 아이디 중복 확인을 해 주세요.");
        if (txt(person, "name").isEmpty()) throw ApiException.bad("관리자 이름을 입력해 주세요.");
        if (!AccountService.LOGIN.matcher(login).matches()) throw ApiException.bad("아이디는 영문 소문자·숫자·점(.)으로 3자 이상 입력해 주세요.");
        if (email.isEmpty() || !mailVerified(email)) throw ApiException.bad("이메일 인증을 해 주세요.");
        Passwords.require(password);

        // 다른 기관이 초대해 둔 '미가입 기관' 자리가 있으면 그 아이디를 이어 써요 (초대가 바로 연결돼요).
        var existing = orgs.byNumber(number);
        String orgId;
        if (existing.isPresent()) {
            if (!OrgRepository.placeholder(existing.get())) throw ApiException.conflict("이미 가입한 기관이에요. 직원으로 가입 신청해 주세요.");
            orgId = existing.get().id();
            orgs.update(orgId, code, name);
        } else {
            orgId = "o" + Ids.next();
            orgs.insert(orgId, code, number, name);
        }
        ObjectNode o = org.deepCopy();
        o.remove("id");
        o.put("code", code);
        o.put("number", number);
        o.remove("hidden");
        records.upsert(Kind.ORG, orgId, orgId, null, o, null);

        String pid = "p" + Ids.next();
        ObjectNode p = person.deepCopy();
        p.put("id", pid);
        p.put("org", orgId);
        p.remove("login");
        p.remove("acct");
        p.remove("admin");
        records.upsert(Kind.PERSON, pid, orgId, null, p, pid);
        long uid = users.insert(pid, orgId, login, email, enc.encode(password), null, null, UserRow.ACTIVE, true);
        records.putOrgDoc(orgId, "rates", om.createObjectNode().set(pid, om.createObjectNode()));
        records.audit(pid, orgId, "signup.org", "org", orgId, null);
        return new CurrentUser(uid, pid, orgId, login, true);
    }

    /** 이미 가입한 기관에 직원으로 가입 신청 (관리자가 승인하면 로그인할 수 있어요). */
    @Transactional
    public void join(String orgId, ObjectNode person, String password) {
        var o = orgs.byId(orgId == null ? "" : orgId).filter(x -> !OrgRepository.placeholder(x)).orElseThrow(() -> ApiException.bad("기관을 찾지 못했어요."));
        String login = txt(person, "login").toLowerCase();
        String email = txt(person, "email");
        if (txt(person, "name").isEmpty()) throw ApiException.bad("이름을 입력해 주세요.");
        if (!AccountService.LOGIN.matcher(login).matches()) throw ApiException.bad("아이디는 영문 소문자·숫자·점(.)으로 3자 이상 입력해 주세요.");
        if (users.byLogin(o.id(), login).isPresent()) throw ApiException.bad("이미 쓰는 아이디예요.");
        if (!MAIL.matcher(email).matches()) throw ApiException.bad("이메일을 입력해 주세요.");
        Passwords.require(password);
        String pid = "p" + Ids.next();
        ObjectNode p = person.deepCopy();
        p.put("id", pid);
        p.put("org", o.id());
        p.remove("login");
        p.remove("acct");
        p.remove("admin");
        records.upsert(Kind.PERSON, pid, o.id(), null, p, pid);
        users.insert(pid, o.id(), login, email, enc.encode(password), null, null, UserRow.REQUESTED, false);
        records.audit(pid, o.id(), "signup.join", "person", pid, null);
    }

    private static String txt(ObjectNode n, String f) {
        var v = n == null ? null : n.get(f);
        return v == null || v.isNull() ? "" : v.asText("").trim();
    }
}
