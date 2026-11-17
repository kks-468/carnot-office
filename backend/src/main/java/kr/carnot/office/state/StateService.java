package kr.carnot.office.state;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import kr.carnot.office.account.UserRepository;
import kr.carnot.office.account.UserRow;
import kr.carnot.office.security.CurrentUser;
import kr.carnot.office.store.Kind;
import kr.carnot.office.store.Rec;
import kr.carnot.office.store.RecordRepository;
import kr.carnot.office.store.RecordRepository.Participation;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 로그인한 사람에게 보낼 화면 데이터를 모아요.
 * 우리 기관 문서는 모두, 다른 기관 것은 함께하는 과제에 필요한 만큼만 보내요.
 */
@Service
public class StateService {
    private final RecordRepository records;
    private final UserRepository users;
    private final JdbcClient db;
    private final ObjectMapper om;

    public StateService(RecordRepository records, UserRepository users, JdbcClient db, ObjectMapper om) {
        this.records = records;
        this.users = users;
        this.db = db;
        this.om = om;
    }

    static final Set<String> ACCEPTED = Set.of("수락");

    @Transactional(readOnly = true)
    public ObjectNode load(CurrentUser u) {
        ObjectNode out = om.createObjectNode();
        String me = u.orgId();

        // ---- 보는 사람과 열람 권한 ----
        AccessRules.Viewer viewer = viewer(u);
        boolean canPay = AccessRules.canPay(viewer);

        // ---- 과제 ---- (연구비 열람 권한이 없는 과제는 아예 보내지 않아요)
        List<Participation> mine = records.participationsOf(me);
        Set<String> joinedIds = mine.stream().filter(p -> ACCEPTED.contains(p.status())).map(Participation::projectId).collect(Collectors.toSet());
        Set<String> accepted = new HashSet<>();
        Set<String> hidden = new HashSet<>();
        Set<String> lead = mine.stream().filter(p -> ACCEPTED.contains(p.status()) && "주관".equals(p.role())).map(Participation::projectId).collect(Collectors.toSet());
        Set<String> allIds = mine.stream().map(Participation::projectId).collect(Collectors.toSet());
        ArrayNode projects = out.putArray("projects");
        Set<String> memberIds = new HashSet<>();
        for (Rec r : records.byIds(Kind.PROJECT, allIds)) {
            if (joinedIds.contains(r.id()) && !AccessRules.canResearch(viewer, r.id(), r.data())) {
                hidden.add(r.id());
                continue;
            }
            if (joinedIds.contains(r.id())) {
                accepted.add(r.id());
                ObjectNode d = r.data().deepCopy();
                if (!lead.contains(r.id())) d.remove("invites");
                projects.add(d);
                Json.items(d, "members").forEach(m -> memberIds.add(m.asText()));
            } else projects.add(redactProject(r.data(), me));
        }
        // 함께 참여 중인 기관 (과제별)
        Map<String, Set<String>> partnersByProject = new HashMap<>();
        for (Participation p : records.participantsOf(accepted))
            if (ACCEPTED.contains(p.status())) partnersByProject.computeIfAbsent(p.projectId(), k -> new HashSet<>()).add(p.orgId());
        Set<String> partners = new HashSet<>();
        partnersByProject.values().forEach(partners::addAll);
        partners.remove(me);

        // ---- 기관 ----
        ObjectNode orgs = out.putObject("orgs");
        db.sql("SELECT o.id, o.name, o.number, r.data FROM organizations o LEFT JOIN records r ON r.kind = 'org' AND r.id = o.id")
            .query((rs, i) -> {
                String id = rs.getString(1);
                ObjectNode d = rs.getString(4) == null ? om.createObjectNode() : (ObjectNode) readTree(rs.getString(4));
                if (id.equals(me)) orgs.set(id, d);
                else {
                    ObjectNode x = om.createObjectNode();
                    x.put("name", rs.getString(2));
                    if (rs.getString(3) != null) x.put("number", rs.getString(3));
                    Json.pick(d, x, "short", "type", "hidden", "numType");
                    if (!x.has("short")) x.put("short", rs.getString(2));
                    orgs.set(id, x);
                }
                return id;
            }).list();

        // ---- 구성원 ----
        ArrayNode people = out.putArray("people");
        Map<String, UserRow> acct = users.byOrg(me).stream().collect(Collectors.toMap(UserRow::personId, x -> x));
        String myUnit = "";
        for (Rec r : records.byOrg(Kind.PERSON, me)) {
            ObjectNode d = r.data().deepCopy();
            UserRow a = acct.get(r.id());
            if (a != null) {
                d.put("login", a.login());
                d.put("acct", a.status());
                if (a.admin()) d.put("admin", true);
            }
            if (r.id().equals(u.personId())) myUnit = Json.text(d, "unit");
            people.add(d);
        }
        for (Rec r : records.byIds(Kind.PERSON, memberIds)) {
            if (me.equals(r.orgId()) || !partners.contains(r.orgId())) continue;
            people.add(Json.pick(r.data(), om.createObjectNode(), "id", "name", "org", "unit", "role", "level"));
        }

        // ---- 전문가 ----
        ArrayNode experts = out.putArray("experts");
        JsonNode myOrg = orgs.get(me);
        for (Rec r : records.byOrg(Kind.EXPERT, me)) if (Visibility.expert(r.data(), u, myOrg, myUnit)) experts.add(r.data());

        // ---- 자료 취합 ----
        ArrayNode collect = out.putArray("collect");
        for (Rec r : records.byProjects(Kind.COLLECT, accepted)) {
            ObjectNode d = r.data().deepCopy();
            if ("prop".equals(Json.text(d, "kind")) && !lead.contains(r.projectId()) && d.get("subs") instanceof ObjectNode subs) {
                // 제안서 취합: 다른 기관 제출본은 총괄기관만 봐요
                List<String> keys = new ArrayList<>();
                subs.fieldNames().forEachRemaining(keys::add);
                for (String k : keys) if (!k.equals(me)) subs.set(k, Json.pick((ObjectNode) subs.get(k), om.createObjectNode(), "date"));
            }
            collect.add(d);
        }

        // ---- 우리 기관 문서 ---- (숨긴 과제의 집행·회의·일정·자료와 그 증빙은 빼요)
        Set<String> hiddenEntries = new HashSet<>();
        for (Kind k : Kind.values()) {
            if (k.access != Kind.Access.PRIVATE || k.map) continue;
            ArrayNode a = out.putArray(k.stateKey);
            for (Rec r : records.byOrg(k, me)) {
                if (r.projectId() != null && hidden.contains(r.projectId())) {
                    if (k == Kind.ENTRY) hiddenEntries.add(r.id());
                    continue;
                }
                a.add(r.data());
            }
        }
        for (Kind k : Kind.values()) {
            if (k.access != Kind.Access.PRIVATE || !k.map) continue;
            ObjectNode m = out.putObject(k.stateKey);
            for (Rec r : records.byOrg(k, me)) {
                if (hiddenEntries.contains(r.id().split("\\|")[0])) continue;
                m.set(r.id(), r.data().has("_v") && r.data().size() == 1 ? r.data().get("_v") : r.data());
            }
        }
        // 다른 참여 기관의 회의: 날짜·주제만 (비용·참석자는 그 기관만 봐요)
        ArrayNode meetings = (ArrayNode) out.get("meetings");
        for (Rec r : records.byProjects(Kind.MEETING, accepted)) {
            if (me.equals(r.orgId())) continue;
            ObjectNode d = Json.pick(r.data(), om.createObjectNode(), "id", "proj", "date", "start", "end", "topic", "status");
            ArrayNode att = d.putArray("att");
            List<JsonNode> a0 = Json.items(r.data(), "att");
            if (!a0.isEmpty()) att.add(a0.get(0));
            d.putArray("exp");
            d.put("org", r.orgId());
            d.put("ext", true);
            meetings.add(d);
        }
        // 다른 참여 기관이 '전체 공유'한 문서
        ArrayNode docs = (ArrayNode) out.get("docs");
        for (Rec r : records.byProjects(Kind.DOC, accepted)) if (!me.equals(r.orgId()) && "전체".equals(Json.text(r.data(), "share"))) docs.add(r.data());
        // 다른 참여 기관의 집행: 월별 합계만 (연구단 사업비 현황에 써요)
        ArrayNode entries = (ArrayNode) out.get("entries");
        Set<String> consortium = accepted.stream().filter(id -> partnersByProject.getOrDefault(id, Set.of()).size() > 1).collect(Collectors.toSet());
        if (!consortium.isEmpty())
            db.sql("""
                SELECT project_id, org_id, substr(data->>'date', 1, 7) AS ym, sum(coalesce((data->>'amount')::numeric, 0)) AS amt
                FROM records WHERE kind = 'entry' AND project_id IN (:p) AND org_id <> :me GROUP BY 1, 2, 3
                """).param("p", consortium).param("me", me)
                .query((rs, i) -> {
                    ObjectNode e = entries.addObject();
                    e.put("id", "agg:" + rs.getString(1) + ":" + rs.getString(2) + ":" + rs.getString(3));
                    e.put("proj", rs.getString(1));
                    e.put("org", rs.getString(2));
                    e.put("item", "");
                    e.put("sub", "");
                    e.put("date", rs.getString(3) + "-15");
                    e.put("desc", "");
                    e.put("amount", rs.getBigDecimal(4).longValue());
                    e.putObject("ev");
                    e.put("agg", true);
                    return 0;
                }).list();

        // ---- 기관 설정 묶음 ---- (급여 열람 권한이 없으면 볼 수 있는 과제의 인건비 계산에 필요한 사람 몫만)
        // 관리자가 '연구비 열람자에게 인건비 계산용 급여 보이기'를 끄면 자기 급여만 보내요.
        boolean forResearch = AccessRules.rule(viewer.org(), "pay").path("forResearch").asBoolean(true);
        Set<String> payPeople = forResearch ? new HashSet<>(memberIds) : new HashSet<>();
        payPeople.add(u.personId());
        for (Object[] kv : records.orgDocs(me)) {
            String key = (String) kv[0];
            JsonNode v = (JsonNode) kv[1];
            if (!canPay && AccessRules.PAY_READ.contains(key)) v = payOnly(key, v, payPeople);
            out.set(key, v);
        }

        ObjectNode meNode = out.putObject("me");
        meNode.put("personId", u.personId());
        meNode.put("orgId", me);
        meNode.put("admin", u.admin());
        meNode.put("canPay", canPay);
        return out;
    }

    AccessRules.Viewer viewer(CurrentUser u) {
        JsonNode org = records.find(Kind.ORG, u.orgId()).map(Rec::data).orElse(null);
        JsonNode person = records.find(Kind.PERSON, u.personId()).map(Rec::data).orElse(null);
        return new AccessRules.Viewer(u.personId(), u.admin(), person, org);
    }

    /** 급여 묶음에서 허용된 사람 몫만 남겨요. {연도: {사람: 값}} 또는 {사람: 값} 모양이에요. */
    JsonNode payOnly(String key, JsonNode v, Set<String> people) {
        if (key.equals("raises")) return om.createArrayNode();
        if (!v.isObject()) return v;
        ObjectNode out = om.createObjectNode();
        for (var e : v.properties()) {
            if (people.contains(e.getKey())) out.set(e.getKey(), e.getValue());
            else if (e.getValue().isObject() && !key.equals("leaveAdj")) {
                ObjectNode inner = om.createObjectNode();
                for (var f : e.getValue().properties()) if (people.contains(f.getKey())) inner.set(f.getKey(), f.getValue());
                out.set(e.getKey(), inner);
            }
        }
        return out;
    }

    /** 승인 전(신청·초대 중) 기관에는 과제 이름과 참여 상태만 보여요. */
    ObjectNode redactProject(ObjectNode p, String me) {
        ObjectNode d = Json.pick(p, om.createObjectNode(), "id", "name", "short", "phase", "consortium", "archived", "ministry", "start", "end", "year", "code");
        ArrayNode parts = d.putArray("parts");
        for (JsonNode q : Json.items(p, "parts")) {
            ObjectNode x = Json.pick((ObjectNode) q, om.createObjectNode(), "org", "role", "tier", "status", "reqDate", "msg");
            if (!me.equals(Json.text(q, "org"))) x.remove("msg");
            x.putObject("budget");
            parts.add(x);
        }
        d.putArray("members");
        d.putArray("years");
        d.putArray("events");
        d.putArray("history");
        d.putObject("plan");
        d.putObject("subplan");
        d.put("limited", true);
        return d;
    }

    private JsonNode readTree(String s) {
        try {
            return om.readTree(s);
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}
