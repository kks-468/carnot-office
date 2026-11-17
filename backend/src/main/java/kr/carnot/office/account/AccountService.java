package kr.carnot.office.account;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.time.OffsetDateTime;
import java.util.regex.Pattern;
import kr.carnot.office.common.ApiException;
import kr.carnot.office.common.Ids;
import kr.carnot.office.security.CurrentUser;
import kr.carnot.office.store.Kind;
import kr.carnot.office.store.RecordRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** 기관 관리자가 직원 계정을 만들고 · 멈추고 · 지워요. */
@Service
public class AccountService {
    public static final Pattern LOGIN = Pattern.compile("^[a-z0-9._-]{3,40}$");

    private final UserRepository users;
    private final RecordRepository records;
    private final PasswordEncoder enc;
    private final ObjectMapper om;
    private final Mailer mailer;

    public AccountService(UserRepository users, RecordRepository records, PasswordEncoder enc, ObjectMapper om, Mailer mailer) {
        this.users = users;
        this.records = records;
        this.enc = enc;
        this.om = om;
        this.mailer = mailer;
    }

    static void requireAdmin(CurrentUser me) {
        if (!me.admin()) throw ApiException.forbidden("기관 관리자만 할 수 있어요.");
    }

    public record Created(ObjectNode person, String tempPassword) {}

    /** 직원 계정 만들기: 구성원 문서 + 초대 상태 계정 + 임시 비밀번호(14일). */
    @Transactional
    public Created create(CurrentUser me, ObjectNode person) {
        requireAdmin(me);
        String name = text(person, "name");
        String login = text(person, "login").toLowerCase();
        if (name.isEmpty()) throw ApiException.bad("이름을 입력해 주세요.");
        if (!LOGIN.matcher(login).matches()) throw ApiException.bad("아이디는 영문 소문자·숫자·점(.)으로 3자 이상 입력해 주세요.");
        if (users.byLogin(me.orgId(), login).isPresent()) throw ApiException.bad("이미 쓰는 아이디예요.");
        String id = text(person, "id");
        if (id.isEmpty() || records.find(Kind.PERSON, id).isPresent()) id = "p" + Ids.next();
        ObjectNode p = person.deepCopy();
        p.put("id", id);
        p.put("org", me.orgId());
        p.remove("acct");
        p.remove("login");
        p.remove("admin");
        records.upsert(Kind.PERSON, id, me.orgId(), null, p, me.personId());
        String temp = Ids.tempPassword();
        String email = text(person, "email");
        users.insert(id, me.orgId(), login, email.isEmpty() ? null : email, null, enc.encode(temp), OffsetDateTime.now().plusDays(14), UserRow.INVITED, false);
        records.audit(me.personId(), me.orgId(), "account.create", "person", id, null);
        if (!email.isEmpty()) mailer.send(email, "[Carnot office] 계정이 만들어졌어요",
            name + "님, 계정이 만들어졌어요.\n아이디: " + login + "\n임시 비밀번호: " + temp + "\n로그인 화면의 ‘초대받은 직원 계정 활성화’에서 비밀번호를 정해 주세요. (14일 안에)");
        ObjectNode out = p.deepCopy();
        out.put("login", login);
        out.put("acct", UserRow.INVITED);
        return new Created(out, temp);
    }

    /** 계정 상태 바꾸기: 활성(승인·재개) · 중지 */
    @Transactional
    public void setStatus(CurrentUser me, String personId, String status) {
        requireAdmin(me);
        if (!UserRow.ACTIVE.equals(status) && !UserRow.STOPPED.equals(status)) throw ApiException.bad("바꿀 수 없는 상태예요.");
        var u = mine(me, personId);
        if (u.personId().equals(me.personId())) throw ApiException.bad("내 계정은 바꿀 수 없어요.");
        if (UserRow.INVITED.equals(u.status())) throw ApiException.bad("아직 활성화하지 않은 계정이에요.");
        if (UserRow.ACTIVE.equals(status) && u.passwordHash() == null) throw ApiException.bad("비밀번호를 정하지 않은 계정이에요.");
        users.setStatus(u.id(), status);
        records.audit(me.personId(), me.orgId(), "account.status", "person", personId, om.createObjectNode().put("status", status));
    }

    /** 임시 비밀번호를 새로 만들어 초대 상태로 돌려요. */
    @Transactional
    public String reset(CurrentUser me, String personId) {
        requireAdmin(me);
        var u = mine(me, personId);
        if (u.admin() && !u.personId().equals(me.personId())) throw ApiException.bad("다른 관리자 계정은 초기화할 수 없어요.");
        String temp = Ids.tempPassword();
        users.setTemp(u.id(), enc.encode(temp), OffsetDateTime.now().plusDays(14), UserRow.INVITED);
        if (u.email() != null) mailer.send(u.email(), "[Carnot office] 임시 비밀번호", "임시 비밀번호: " + temp + "\n‘초대받은 직원 계정 활성화’에서 새 비밀번호를 정해 주세요.");
        records.audit(me.personId(), me.orgId(), "account.reset", "person", personId, null);
        return temp;
    }

    /** 계정과 구성원 문서를 지워요. (과제 참여 명단 정리는 화면이 같이 저장해요) */
    @Transactional
    public void delete(CurrentUser me, String personId) {
        requireAdmin(me);
        if (personId.equals(me.personId())) throw ApiException.bad("내 계정은 지울 수 없어요.");
        var rec = records.find(Kind.PERSON, personId).orElseThrow(() -> ApiException.notFound("구성원을 찾지 못했어요."));
        if (!me.orgId().equals(rec.orgId())) throw ApiException.forbidden("우리 기관 구성원만 지울 수 있어요.");
        users.byPerson(personId).ifPresent(u -> {
            if (u.admin()) throw ApiException.bad("관리자 계정은 지울 수 없어요.");
            users.delete(u.id());
        });
        records.delete(Kind.PERSON, personId);
        records.audit(me.personId(), me.orgId(), "account.delete", "person", personId, null);
    }

    private UserRow mine(CurrentUser me, String personId) {
        var u = users.byPerson(personId).orElseThrow(() -> ApiException.notFound("계정을 찾지 못했어요."));
        if (!u.orgId().equals(me.orgId())) throw ApiException.forbidden("우리 기관 계정만 바꿀 수 있어요.");
        return u;
    }

    static String text(ObjectNode n, String f) {
        var v = n.get(f);
        return v == null || v.isNull() ? "" : v.asText("").trim();
    }
}
