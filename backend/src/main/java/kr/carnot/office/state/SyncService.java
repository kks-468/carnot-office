package kr.carnot.office.state;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import kr.carnot.office.account.OrgRepository;
import kr.carnot.office.account.UserRepository;
import kr.carnot.office.common.ApiException;
import kr.carnot.office.security.CurrentUser;
import kr.carnot.office.store.Kind;
import kr.carnot.office.store.OrgDocKeys;
import kr.carnot.office.store.Rec;
import kr.carnot.office.store.RecordRepository;
import kr.carnot.office.store.RecordRepository.Participation;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 화면에서 바뀐 문서를 받아 권한을 확인하고 저장해요.
 * 권한이 없는 항목은 저장하지 않고 rejected로, 서버가 고쳐 저장한 항목은 corrected로 돌려줘요.
 */
@Service
public class SyncService {
    private final RecordRepository records;
    private final UserRepository users;
    private final OrgRepository orgs;
    private final ObjectMapper om;

    public SyncService(RecordRepository records, UserRepository users, OrgRepository orgs, ObjectMapper om) {
        this.records = records;
        this.users = users;
        this.orgs = orgs;
        this.om = om;
    }

    public record Item(String kind, String id, JsonNode data) {}
    public record Batch(List<Item> upserts, List<Item> deletes, Map<String, JsonNode> docs) {}
    public record Rejected(String kind, String id, String message) {}
    public record Result(int applied, List<Rejected> rejected, List<Item> corrected) {}

    @Transactional
    public Result apply(CurrentUser u, Batch b) {
        int applied = 0;
        List<Rejected> rejected = new ArrayList<>();
        List<Item> corrected = new ArrayList<>();
        Ctx c = new Ctx(u);
        for (Item it : b.upserts() == null ? List.<Item>of() : b.upserts()) {
            try {
                Item fixed = upsert(c, it);
                if (fixed != null) corrected.add(fixed);
                applied++;
            } catch (ApiException e) {
                rejected.add(new Rejected(it.kind(), it.id(), e.getMessage()));
            }
        }
        for (Item it : b.deletes() == null ? List.<Item>of() : b.deletes()) {
            try {
                delete(c, it);
                applied++;
            } catch (ApiException e) {
                rejected.add(new Rejected(it.kind(), it.id(), e.getMessage()));
            }
        }
        if (b.docs() != null)
            for (var e : b.docs().entrySet()) {
                if (!OrgDocKeys.ALL.contains(e.getKey())) {
                    rejected.add(new Rejected("doc", e.getKey(), "저장할 수 없는 항목이에요."));
                    continue;
                }
                if (AccessRules.PAY_WRITE.contains(e.getKey()) && !AccessRules.canPay(c.viewer())) {
                    rejected.add(new Rejected("doc", e.getKey(), "급여 정보는 열람 권한이 있는 사람만 고쳐요."));
                    continue;
                }
                records.putOrgDoc(u.orgId(), e.getKey(), e.getValue());
                applied++;
            }
        return new Result(applied, rejected, corrected);
    }

    /** 요청 하나를 처리하는 동안 쓰는 값들 */
    final class Ctx {
        final CurrentUser u;
        private Map<String, Participation> parts;
        private Set<String> myPeople;

        Ctx(CurrentUser u) {
            this.u = u;
        }

        Participation part(String projectId) {
            if (parts == null) parts = records.participationsOf(u.orgId()).stream().collect(Collectors.toMap(Participation::projectId, p -> p));
            return parts.get(projectId);
        }

        boolean accepted(String projectId) {
            var p = part(projectId);
            return p != null && "수락".equals(p.status());
        }

        boolean lead(String projectId) {
            var p = part(projectId);
            return p != null && "수락".equals(p.status()) && "주관".equals(p.role());
        }

        Set<String> myPeople() {
            if (myPeople == null) myPeople = records.byOrg(Kind.PERSON, u.orgId()).stream().map(Rec::id).collect(Collectors.toSet());
            return myPeople;
        }

        void reset() {
            parts = null;
            seen.clear();
        }

        private AccessRules.Viewer viewer;
        private final Map<String, Boolean> seen = new java.util.HashMap<>();

        AccessRules.Viewer viewer() {
            if (viewer == null) {
                JsonNode org = records.find(Kind.ORG, u.orgId()).map(Rec::data).orElse(null);
                JsonNode person = records.find(Kind.PERSON, u.personId()).map(Rec::data).orElse(null);
                viewer = new AccessRules.Viewer(u.personId(), u.admin(), person, org);
            }
            return viewer;
        }

        /** 참여(수락) 중이고 연구비 열람 권한도 있는 과제인지 */
        boolean visible(String projectId) {
            if (projectId == null || projectId.isEmpty()) return true;
            return seen.computeIfAbsent(projectId, id -> accepted(id)
                && records.find(Kind.PROJECT, id).map(r -> AccessRules.canResearch(viewer(), id, r.data())).orElse(false));
        }
    }

    private static ApiException deny(String m) {
        return ApiException.forbidden(m);
    }

    private Kind kind(Item it) {
        if (it.id() == null || it.id().isBlank() || it.id().length() > 200) throw ApiException.bad("아이디가 없어요.");
        if (it.id().startsWith("agg:")) throw deny("합계 행은 저장하지 않아요.");
        return Kind.of(it.kind()).orElseThrow(() -> ApiException.bad("알 수 없는 종류예요: " + it.kind()));
    }

    private Item upsert(Ctx c, Item it) {
        Kind k = kind(it);
        String me = c.u.orgId();
        var existing = records.find(k, it.id());
        JsonNode raw = it.data();
        if (raw == null || raw.isNull()) throw ApiException.bad("내용이 없어요.");
        ObjectNode data = raw.isObject() ? (ObjectNode) raw.deepCopy() : om.createObjectNode().set("_v", raw);

        switch (k.access) {
            case PRIVATE -> {
                if (existing.isPresent() && !me.equals(existing.get().orgId())) throw deny("다른 기관 문서는 고칠 수 없어요.");
                if (existing.isPresent() && !c.visible(existing.get().projectId())) throw deny("열람 권한이 없는 과제예요.");
                if (data.has("org") && !k.map) data.put("org", me);
                if (data.has("ext")) throw deny("다른 기관 회의는 고칠 수 없어요.");
                String proj = Json.text(data, "proj");
                if (!proj.isEmpty() && (k == Kind.ENTRY || k == Kind.MEETING || k == Kind.SCHED || k == Kind.DOC) && !c.visible(proj))
                    throw deny("참여하지 않거나 열람 권한이 없는 과제예요.");
                records.upsert(k, it.id(), me, proj.isEmpty() ? null : proj, data, c.u.personId());
                return null;
            }
            case ORG_SELF -> {
                if (!it.id().equals(me)) throw deny("다른 기관 정보는 고칠 수 없어요.");
                if (!c.u.admin()) throw deny("기관 정보는 기관 관리자만 고쳐요.");
                var row = orgs.byId(me).orElseThrow();
                data.put("code", row.code());
                if (row.number() != null) data.put("number", row.number());
                String name = Json.text(data, "name").trim();
                if (!name.isEmpty() && !name.equals(row.name())) orgs.rename(me, name);
                records.upsert(k, me, me, null, data, c.u.personId());
                return null;
            }
            case PEOPLE -> {
                if (existing.isPresent() && !me.equals(existing.get().orgId())) throw deny("다른 기관 구성원은 고칠 수 없어요.");
                if (!c.u.admin() && !it.id().equals(c.u.personId())) throw deny("구성원 정보는 기관 관리자만 고쳐요.");
                if (existing.isEmpty() && users.byPerson(it.id()).isPresent()) throw deny("계정이 있는 구성원이에요.");
                data.put("id", it.id());
                data.put("org", me);
                data.remove("login");
                data.remove("acct");
                data.remove("admin");
                records.upsert(k, it.id(), me, null, data, c.u.personId());
                return null;
            }
            case EXPERT -> {
                if (existing.isPresent()) {
                    if (!me.equals(existing.get().orgId())) throw deny("다른 기관 전문가는 고칠 수 없어요.");
                    if (!Visibility.expertEdit(existing.get().data(), c.u)) throw deny("이 전문가는 등록한 사람이나 관리자만 고쳐요.");
                } else if (!data.has("by")) data.put("by", c.u.personId());
                data.put("xo", me);
                records.upsert(k, it.id(), me, null, data, c.u.personId());
                return null;
            }
            case PROJECT -> {
                return saveProject(c, it.id(), data, existing.orElse(null));
            }
            case PROJECT_CHILD -> {
                String proj = existing.map(Rec::projectId).orElse(Json.text(data, "proj"));
                if (proj == null || proj.isEmpty() || !c.visible(proj)) throw deny("참여하지 않거나 열람 권한이 없는 과제예요.");
                data.put("proj", proj);
                if (c.lead(proj)) {
                    records.upsert(k, it.id(), existing.map(Rec::orgId).orElse(me), proj, data, c.u.personId());
                    return null;
                }
                if (existing.isEmpty()) throw deny("자료 취합 요청은 총괄기관만 만들어요.");
                ObjectNode merged = existing.get().data().deepCopy();
                ObjectNode subs = merged.get("subs") instanceof ObjectNode s ? s : merged.putObject("subs");
                JsonNode mine = data.path("subs").get(me);
                if (mine == null) subs.remove(me);
                else subs.set(me, mine);
                records.upsert(k, it.id(), existing.get().orgId(), proj, merged, c.u.personId());
                return new Item(k.kind, it.id(), merged);
            }
        }
        throw new IllegalStateException();
    }

    private Item saveProject(Ctx c, String id, ObjectNode data, Rec existing) {
        String me = c.u.orgId();
        data.put("id", id);
        data.remove("limited");
        ObjectNode toSave;
        if (existing == null) {
            boolean selfLead = false;
            for (JsonNode q : Json.items(data, "parts")) {
                String org = Json.text(q, "org");
                String st = Json.text(q, "status");
                if (org.equals(me)) selfLead = "주관".equals(Json.text(q, "role")) && "수락".equals(st);
                else if ("수락".equals(st)) throw deny("다른 기관을 바로 참여시킬 수 없어요. 초대해 주세요.");
            }
            if (!selfLead) throw deny("새 과제는 우리 기관이 주관으로 만들어요.");
            toSave = data;
        } else {
            var p = c.part(id);
            if (p == null) throw deny("참여하지 않는 과제예요.");
            if (c.accepted(id) && !AccessRules.canResearch(c.viewer(), id, existing.data())) throw deny("열람 권한이 없는 과제예요.");
            toSave = c.lead(id) ? data : ProjectGuard.mergeNonLead(existing.data(), data, me, c.myPeople());
            // 주관 기관이 바뀌거나 사라지면 안 돼요
            if (c.lead(id)) {
                boolean still = Json.items(toSave, "parts").stream().anyMatch(q -> me.equals(Json.text(q, "org")) && "주관".equals(Json.text(q, "role")));
                if (!still) throw deny("주관 기관을 뺄 수 없어요.");
            }
        }
        // 새로 '수락'된 기관의 구성원을 참여 인력에 넣어요 (그 기관 사람은 다른 기관 화면에 없으니까 서버가 채워요)
        Set<String> before = new HashSet<>();
        if (existing != null) for (JsonNode q : Json.items(existing.data(), "parts")) if ("수락".equals(Json.text(q, "status"))) before.add(Json.text(q, "org"));
        ArrayNode members = Json.arr(toSave, "members");
        Set<String> have = new HashSet<>();
        members.forEach(m -> have.add(m.asText()));
        List<Participation> ps = new ArrayList<>();
        for (JsonNode q : Json.items(toSave, "parts")) {
            String org = Json.text(q, "org");
            String st = Json.text(q, "status");
            if (org.isEmpty()) continue;
            ps.add(new Participation(id, org, st.isEmpty() ? "초대 중" : st, Json.text(q, "role")));
            if ("수락".equals(st) && !before.contains(org) && existing != null && !org.equals(me))
                for (Rec r : records.byOrg(Kind.PERSON, org))
                    if (have.add(r.id())) members.add(r.id());
        }
        records.upsert(Kind.PROJECT, id, existing == null ? me : existing.orgId(), id, toSave, c.u.personId());
        records.replaceParticipants(id, ps);
        c.reset();
        return toSave.equals(data) ? null : new Item(Kind.PROJECT.kind, id, toSave);
    }

    private void delete(Ctx c, Item it) {
        Kind k = kind(it);
        String me = c.u.orgId();
        var existing = records.find(k, it.id());
        if (existing.isEmpty()) return;
        Rec r = existing.get();
        switch (k.access) {
            case PRIVATE -> {
                if (!me.equals(r.orgId())) throw deny("다른 기관 문서는 지울 수 없어요.");
                if (!c.visible(r.projectId())) throw deny("열람 권한이 없는 과제예요.");
            }
            case PEOPLE -> {
                if (!me.equals(r.orgId()) || !c.u.admin()) throw deny("구성원은 기관 관리자만 지워요.");
                if (users.byPerson(it.id()).isPresent()) throw deny("계정이 있는 구성원은 직원·급여에서 지워 주세요.");
            }
            case EXPERT -> {
                if (!me.equals(r.orgId()) || !Visibility.expertEdit(r.data(), c.u)) throw deny("이 전문가는 지울 수 없어요.");
            }
            case PROJECT -> {
                if (!c.lead(it.id())) throw deny("과제는 주관 기관만 지워요.");
                records.replaceParticipants(it.id(), List.of());
            }
            case PROJECT_CHILD -> {
                if (!c.lead(r.projectId())) throw deny("자료 취합 요청은 총괄기관만 지워요.");
            }
            case ORG_SELF -> throw deny("기관은 지울 수 없어요.");
        }
        records.delete(k, it.id());
        records.audit(c.u.personId(), me, "delete", k.kind, it.id(), null);
    }
}
