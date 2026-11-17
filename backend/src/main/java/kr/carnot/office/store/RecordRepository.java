package kr.carnot.office.store;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

/** records · org_docs · project_orgs 표를 읽고 써요. */
@Repository
public class RecordRepository {
    private final JdbcClient db;
    private final ObjectMapper om;

    public RecordRepository(JdbcClient db, ObjectMapper om) {
        this.db = db;
        this.om = om;
    }

    private Rec map(ResultSet rs, int i) throws SQLException {
        return new Rec(rs.getString("kind"), rs.getString("id"), rs.getString("org_id"), rs.getString("project_id"), (ObjectNode) read(rs.getString("data")), rs.getLong("version"));
    }

    JsonNode read(String json) {
        try {
            return om.readTree(json);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException(e);
        }
    }

    String write(JsonNode n) {
        try {
            return om.writeValueAsString(n);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException(e);
        }
    }

    public Optional<Rec> find(Kind k, String id) {
        return db.sql("SELECT * FROM records WHERE kind = ? AND id = ?").param(k.kind).param(id).query(this::map).optional();
    }

    public List<Rec> byOrg(Kind k, String orgId) {
        return db.sql("SELECT * FROM records WHERE kind = ? AND org_id = ? ORDER BY seq").param(k.kind).param(orgId).query(this::map).list();
    }

    public List<Rec> byProjects(Kind k, Collection<String> projectIds) {
        if (projectIds.isEmpty()) return List.of();
        return db.sql("SELECT * FROM records WHERE kind = :k AND project_id IN (:p) ORDER BY seq").param("k", k.kind).param("p", projectIds).query(this::map).list();
    }

    public List<Rec> byIds(Kind k, Collection<String> ids) {
        if (ids.isEmpty()) return List.of();
        return db.sql("SELECT * FROM records WHERE kind = :k AND id IN (:ids) ORDER BY seq").param("k", k.kind).param("ids", ids).query(this::map).list();
    }

    public List<Rec> all(Kind k) {
        return db.sql("SELECT * FROM records WHERE kind = ? ORDER BY seq").param(k.kind).query(this::map).list();
    }

    /** 새로 넣거나 바꿔요. 바꿀 때는 버전을 1 올려요. */
    public void upsert(Kind k, String id, String orgId, String projectId, JsonNode data, String by) {
        db.sql("""
            INSERT INTO records (kind, id, org_id, project_id, data, updated_by) VALUES (?, ?, ?, ?, CAST(? AS jsonb), ?)
            ON CONFLICT (kind, id) DO UPDATE SET data = EXCLUDED.data, project_id = EXCLUDED.project_id,
              version = records.version + 1, updated_at = now(), updated_by = EXCLUDED.updated_by
            """).param(k.kind).param(id).param(orgId).param(projectId).param(write(data)).param(by).update();
    }

    public void delete(Kind k, String id) {
        db.sql("DELETE FROM records WHERE kind = ? AND id = ?").param(k.kind).param(id).update();
    }

    // ---- 기관 설정 묶음 ----
    public Optional<JsonNode> orgDoc(String orgId, String key) {
        return db.sql("SELECT data FROM org_docs WHERE org_id = ? AND key = ?").param(orgId).param(key).query((rs, i) -> read(rs.getString(1))).optional();
    }

    public List<Object[]> orgDocs(String orgId) {
        return db.sql("SELECT key, data FROM org_docs WHERE org_id = ?").param(orgId).query((rs, i) -> new Object[] {rs.getString(1), read(rs.getString(2))}).list();
    }

    public void putOrgDoc(String orgId, String key, JsonNode data) {
        db.sql("""
            INSERT INTO org_docs (org_id, key, data) VALUES (?, ?, CAST(? AS jsonb))
            ON CONFLICT (org_id, key) DO UPDATE SET data = EXCLUDED.data, updated_at = now()
            """).param(orgId).param(key).param(write(data)).update();
    }

    // ---- 과제 참여 기관 ----
    public record Participation(String projectId, String orgId, String status, String role) {}

    public List<Participation> participationsOf(String orgId) {
        return db.sql("SELECT * FROM project_orgs WHERE org_id = ?").param(orgId)
            .query((rs, i) -> new Participation(rs.getString("project_id"), rs.getString("org_id"), rs.getString("status"), rs.getString("role"))).list();
    }

    public List<Participation> participantsOf(Collection<String> projectIds) {
        if (projectIds.isEmpty()) return List.of();
        return db.sql("SELECT * FROM project_orgs WHERE project_id IN (:p)").param("p", projectIds)
            .query((rs, i) -> new Participation(rs.getString("project_id"), rs.getString("org_id"), rs.getString("status"), rs.getString("role"))).list();
    }

    public void replaceParticipants(String projectId, List<Participation> ps) {
        db.sql("DELETE FROM project_orgs WHERE project_id = ?").param(projectId).update();
        for (Participation p : ps)
            db.sql("INSERT INTO project_orgs (project_id, org_id, status, role) VALUES (?, ?, ?, ?) ON CONFLICT DO NOTHING")
                .param(projectId).param(p.orgId()).param(p.status()).param(p.role()).update();
    }

    public void audit(String personId, String orgId, String action, String kind, String recordId, JsonNode detail) {
        db.sql("INSERT INTO audit_log (person_id, org_id, action, kind, record_id, detail) VALUES (?, ?, ?, ?, ?, CAST(? AS jsonb))")
            .param(personId).param(orgId).param(action).param(kind).param(recordId).param(detail == null ? null : write(detail)).update();
    }
}
