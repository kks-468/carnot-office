package kr.carnot.office.project;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import kr.carnot.office.account.OrgRepository;
import kr.carnot.office.common.ApiException;
import kr.carnot.office.common.Ids;
import kr.carnot.office.security.CurrentUser;
import kr.carnot.office.store.Kind;
import kr.carnot.office.store.Rec;
import kr.carnot.office.store.RecordRepository;
import kr.carnot.office.store.RecordRepository.Participation;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 연구단 참여: 연구단 코드로 참여 신청 · 1회용 초대번호로 바로 참여 · 사업자번호로 초대할 기관 찾기.
 * 다른 기관의 과제는 화면에 없으니 서버가 찾아서 처리해요.
 */
@Service
public class ProjectService {
    private static final DateTimeFormatter D = DateTimeFormatter.ISO_LOCAL_DATE;
    private final RecordRepository records;
    private final OrgRepository orgs;
    private final JdbcClient db;
    private final ObjectMapper om;

    public ProjectService(RecordRepository records, OrgRepository orgs, JdbcClient db, ObjectMapper om) {
        this.records = records;
        this.orgs = orgs;
        this.db = db;
        this.om = om;
    }

    public record JoinReq(String code, String tier, String role, String msg, ObjectNode budget) {}

    @Transactional
    public Map<String, Object> join(CurrentUser u, JoinReq r) {
        String code = r.code() == null ? "" : r.code().trim().toUpperCase();
        if (code.isEmpty()) throw ApiException.bad("연구단 코드를 확인해 주세요.");
        String today = LocalDate.now().format(D);
        // 1) 1회용 초대번호
        var inv = db.sql("SELECT id FROM records WHERE kind = 'project' AND data->'invites' @> CAST(? AS jsonb)")
            .param("[{\"code\":\"" + code.replace("\"", "") + "\"}]").query(String.class).optional();
        if (inv.isPresent()) {
            Rec rec = records.find(Kind.PROJECT, inv.get()).orElseThrow();
            ObjectNode p = rec.data().deepCopy();
            ObjectNode v = null;
            for (JsonNode x : (ArrayNode) p.get("invites")) if (code.equals(x.path("code").asText())) v = (ObjectNode) x;
            String st = present(v, "used") ? "used" : present(v, "revoked") ? "revoked" : v.path("exp").asText("9999").compareTo(today) < 0 ? "expired" : "ok";
            ObjectNode q0 = partOf(p, u.orgId());
            String err = st.equals("used") ? "이미 사용한 초대번호예요." : st.equals("revoked") ? "폐기된 초대번호예요." : st.equals("expired") ? "만료된 초대번호예요."
                : q0 != null && "수락".equals(q0.path("status").asText()) ? "이미 참여 중인 과제예요." : null;
            if (err != null) throw ApiException.bad(err);
            if (q0 != null) {
                q0.put("status", "수락");
                q0.set("tier", v.get("tier"));
                q0.set("role", v.get("role"));
            } else {
                ObjectNode q = ((ArrayNode) p.withArray("parts")).addObject();
                q.put("org", u.orgId());
                q.set("role", v.get("role"));
                q.set("tier", v.get("tier"));
                q.put("status", "수락");
                q.set("budget", r.budget() == null ? om.createObjectNode() : r.budget());
                q.put("msg", "");
                q.put("reqDate", today);
                q.put("via", code);
            }
            ObjectNode used = v.putObject("used");
            used.put("org", u.orgId());
            used.put("date", today);
            used.put("by", u.personId());
            addMembers(p, u.orgId());
            String shortName = records.find(Kind.ORG, u.orgId()).map(o -> o.data().path("short").asText("")).orElse("");
            p.withArray("history").insert(0, today.replace("-", ".") + " " + shortName + " 초대번호로 참여 (" + v.path("tier").asText() + ")");
            save(rec, p, u);
            return Map.of("projectId", rec.id(), "phase", p.path("phase").asText(), "status", "수락");
        }
        // 2) 연구단 코드 → 참여 신청
        var hit = db.sql("SELECT id FROM records WHERE kind = 'project' AND data->>'code' = ? AND coalesce((data->>'consortium')::boolean, false) AND NOT coalesce((data->>'archived')::boolean, false)")
            .param(code).query(String.class).optional().orElseThrow(() -> ApiException.bad("연구단 코드를 확인해 주세요."));
        Rec rec = records.find(Kind.PROJECT, hit).orElseThrow();
        ObjectNode p = rec.data().deepCopy();
        if (partOf(p, u.orgId()) != null) throw ApiException.bad("이미 신청했거나 참여 중인 과제예요.");
        ObjectNode q = p.withArray("parts").addObject();
        q.put("org", u.orgId());
        q.put("role", r.role() == null || r.role().isBlank() ? "참여" : r.role());
        q.put("tier", r.tier() == null || r.tier().isBlank() ? "1세부" : r.tier());
        q.put("status", "신청 중");
        q.set("budget", r.budget() == null ? om.createObjectNode() : r.budget());
        q.put("msg", r.msg() == null ? "" : r.msg().trim());
        q.put("reqDate", today);
        save(rec, p, u);
        return Map.of("projectId", rec.id(), "phase", p.path("phase").asText(), "status", "신청 중");
    }

    /** 사업자번호로 초대할 기관을 찾고, 없으면 '미가입 기관' 자리를 만들어요. (주관 기관만) */
    @Transactional
    public Map<String, Object> resolveOrg(CurrentUser u, String number) {
        String n = number == null ? "" : number.trim();
        if (n.replaceAll("\\D", "").length() != 10) throw ApiException.bad("번호 10자리를 입력해 주세요.");
        boolean anyLead = records.participationsOf(u.orgId()).stream().anyMatch(p -> "주관".equals(p.role()) && "수락".equals(p.status()));
        if (!anyLead) throw ApiException.forbidden("주관 기관만 초대할 수 있어요.");
        var hit = orgs.byNumber(n);
        if (hit.isPresent()) {
            var o = hit.get();
            ObjectNode d = records.find(Kind.ORG, o.id()).map(Rec::data).orElse(om.createObjectNode());
            ObjectNode x = om.createObjectNode();
            x.put("name", o.name());
            x.put("short", d.path("short").asText(o.name()));
            x.put("number", n);
            if (OrgRepository.placeholder(o)) x.put("hidden", true);
            return Map.of("orgId", o.id(), "org", x, "hit", !OrgRepository.placeholder(o));
        }
        String id = "o" + Ids.next();
        ObjectNode x = om.createObjectNode();
        x.put("name", "미가입 기관 (" + n + ")");
        x.put("short", "미가입 기관");
        x.put("type", "기업");
        x.put("numType", "번호");
        x.put("number", n);
        x.putArray("subs");
        x.put("limit", 50000);
        x.put("hidden", true);
        orgs.insert(id, "pending-" + n.replaceAll("\\D", "") + "-" + Ids.digits(4), n, x.path("name").asText());
        records.upsert(Kind.ORG, id, id, null, x, u.personId());
        return Map.of("orgId", id, "org", x, "hit", false);
    }

    private static boolean present(JsonNode n, String f) {
        JsonNode x = n.get(f);
        return x != null && !x.isNull() && !(x.isTextual() && x.asText().isEmpty()) && !(x.isBoolean() && !x.asBoolean());
    }

    private static ObjectNode partOf(ObjectNode p, String org) {
        for (JsonNode q : p.withArray("parts")) if (org.equals(q.path("org").asText())) return (ObjectNode) q;
        return null;
    }

    private void addMembers(ObjectNode p, String org) {
        ArrayNode m = p.withArray("members");
        Set<String> have = new HashSet<>();
        m.forEach(x -> have.add(x.asText()));
        for (Rec r : records.byOrg(Kind.PERSON, org)) if (have.add(r.id())) m.add(r.id());
    }

    private void save(Rec rec, ObjectNode p, CurrentUser u) {
        records.upsert(Kind.PROJECT, rec.id(), rec.orgId(), rec.id(), p, u.personId());
        List<Participation> ps = new ArrayList<>();
        for (JsonNode q : p.withArray("parts"))
            ps.add(new Participation(rec.id(), q.path("org").asText(), q.path("status").asText("초대 중"), q.path("role").asText()));
        records.replaceParticipants(rec.id(), ps);
        records.audit(u.personId(), u.orgId(), "project.join", "project", rec.id(), null);
    }
}
