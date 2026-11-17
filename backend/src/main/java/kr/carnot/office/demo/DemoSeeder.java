package kr.carnot.office.demo;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;
import kr.carnot.office.account.OrgRepository;
import kr.carnot.office.account.UserRepository;
import kr.carnot.office.common.CarnotProperties;
import kr.carnot.office.store.Kind;
import kr.carnot.office.store.OrgDocKeys;
import kr.carnot.office.store.RecordRepository;
import kr.carnot.office.store.RecordRepository.Participation;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * 시연 데이터 넣기 (carnot.demo.enabled=true 이고 DB가 비어 있을 때 한 번).
 * demo/seed.json은 화면의 seedDemo() 결과를 그대로 내보낸 파일이에요.
 * 모든 시연 계정의 비밀번호는 carnot.demo.password (기본 demo1234) 예요. 운영에서는 켜지 마세요.
 */
@Component
public class DemoSeeder implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(DemoSeeder.class);
    private final CarnotProperties props;
    private final JdbcClient db;
    private final OrgRepository orgs;
    private final UserRepository users;
    private final RecordRepository records;
    private final PasswordEncoder enc;
    private final ObjectMapper om;

    public DemoSeeder(CarnotProperties props, JdbcClient db, OrgRepository orgs, UserRepository users, RecordRepository records, PasswordEncoder enc, ObjectMapper om) {
        this.props = props;
        this.db = db;
        this.orgs = orgs;
        this.users = users;
        this.records = records;
        this.enc = enc;
        this.om = om;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) throws Exception {
        if (!props.demo().enabled()) return;
        if (db.sql("SELECT count(*) FROM organizations").query(Integer.class).single() > 0) return;
        JsonNode s;
        try (InputStream in = new ClassPathResource("demo/seed.json").getInputStream()) {
            s = om.readTree(in);
        }
        seed(s);
        log.warn("시연 데이터를 넣었어요. 시연 계정 비밀번호는 모두 '{}'예요. 운영 환경에서는 DEMO_SEED를 끄세요.", props.demo().password());
    }

    public void seed(JsonNode s) {
        Map<String, String> personOrg = new HashMap<>();
        s.get("people").forEach(p -> personOrg.put(p.get("id").asText(), p.get("org").asText()));
        Map<String, String> entryOrg = new HashMap<>();
        s.get("entries").forEach(e -> entryOrg.put(e.get("id").asText(), e.get("org").asText()));

        // 기관
        for (var e : s.get("orgs").properties()) {
            ObjectNode o = (ObjectNode) e.getValue();
            String code = o.path("code").asText("");
            if (code.isEmpty()) code = "pending-" + e.getKey();
            orgs.insert(e.getKey(), code, o.path("number").asText(null), o.path("name").asText());
            records.upsert(Kind.ORG, e.getKey(), e.getKey(), null, o, null);
        }
        // 구성원 + 계정
        String hash = enc.encode(props.demo().password());
        for (JsonNode p : s.get("people")) {
            ObjectNode d = ((ObjectNode) p).deepCopy();
            String login = d.path("login").asText("");
            String acct = d.path("acct").asText("활성");
            boolean admin = d.path("admin").asBoolean(false);
            d.remove("login");
            d.remove("acct");
            d.remove("admin");
            String id = d.get("id").asText();
            records.upsert(Kind.PERSON, id, d.get("org").asText(), null, d, null);
            if (!login.isEmpty())
                users.insert(id, d.get("org").asText(), login, d.path("email").asText(null), "초대됨".equals(acct) ? null : hash,
                    "초대됨".equals(acct) ? hash : null, null, acct, admin);
        }
        for (JsonNode x : s.get("experts")) records.upsert(Kind.EXPERT, x.get("id").asText(), x.path("xo").asText("sa"), null, x, null);
        for (JsonNode p : s.get("projects")) {
            String id = p.get("id").asText();
            String lead = "";
            var ps = new java.util.ArrayList<Participation>();
            for (JsonNode q : p.path("parts")) {
                ps.add(new Participation(id, q.get("org").asText(), q.path("status").asText(), q.path("role").asText()));
                if ("주관".equals(q.path("role").asText())) lead = q.get("org").asText();
            }
            records.upsert(Kind.PROJECT, id, lead, id, p, null);
            records.replaceParticipants(id, ps);
        }
        for (JsonNode c : s.get("collect")) records.upsert(Kind.COLLECT, c.get("id").asText(), c.path("by").asText(), c.path("proj").asText(), c, null);

        // 기관 문서: 어느 기관 것인지 찾아 넣어요
        for (Kind k : Kind.values()) {
            if (k.access != Kind.Access.PRIVATE) continue;
            JsonNode col = s.get(k.stateKey);
            if (col == null) continue;
            if (k.map) {
                col.properties().forEach(e -> {
                    String org = entryOrg.getOrDefault(e.getKey().split("\\|")[0], "sa");
                    JsonNode v = e.getValue();
                    records.upsert(k, e.getKey(), org, null, v.isObject() ? v : om.createObjectNode().set("_v", v), null);
                });
            } else {
                for (JsonNode d : col) {
                    String org = d.path("org").asText("");
                    for (String f : new String[] {"by", "drafter", "pid"}) if (org.isEmpty()) org = personOrg.getOrDefault(d.path(f).asText(""), "");
                    if (org.isEmpty() && d.path("att").isArray() && d.path("att").size() > 0) org = personOrg.getOrDefault(d.path("att").get(0).asText(), "");
                    if (org.isEmpty()) org = "sa";
                    String proj = d.path("proj").asText("");
                    records.upsert(k, d.get("id").asText(), org, proj.isEmpty() ? null : proj, d, null);
                }
            }
        }
        // 기관 설정 묶음: 시연 데이터는 한 곳에 섞여 있어서 기관별로 나눠요
        for (Iterator<String> it = s.get("orgs").fieldNames(); it.hasNext(); ) {
            String org = it.next();
            for (String key : OrgDocKeys.ALL) {
                JsonNode v = s.get(key);
                if (v == null || v.isNull()) continue;
                records.putOrgDoc(org, key, onlyOrg(v, org, personOrg, s.get("orgs"), 0));
            }
        }
    }

    /** {사람아이디: ...} 나 {기관아이디: ...} 모양이면 그 기관 몫만 남겨요 (두 단계까지). */
    private JsonNode onlyOrg(JsonNode v, String org, Map<String, String> personOrg, JsonNode orgsNode, int depth) {
        if (!v.isObject() || depth > 1) return v;
        ObjectNode out = om.createObjectNode();
        v.properties().forEach(e -> {
            String k = e.getKey();
            if (personOrg.containsKey(k)) {
                if (org.equals(personOrg.get(k))) out.set(k, e.getValue());
            } else if (orgsNode.has(k)) {
                if (org.equals(k)) out.set(k, e.getValue());
            } else out.set(k, onlyOrg(e.getValue(), org, personOrg, orgsNode, depth + 1));
        });
        return out;
    }
}
