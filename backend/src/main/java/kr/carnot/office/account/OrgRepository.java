package kr.carnot.office.account;

import java.util.Optional;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

/** organizations 표 (회사 아이디·사업자번호). */
@Repository
public class OrgRepository {
    private final JdbcClient db;

    public OrgRepository(JdbcClient db) {
        this.db = db;
    }

    public record OrgRow(String id, String code, String number, String name) {}

    public Optional<OrgRow> byCode(String code) {
        return db.sql("SELECT id, code, number, name FROM organizations WHERE code = ?").param(code)
            .query((rs, i) -> new OrgRow(rs.getString(1), rs.getString(2), rs.getString(3), rs.getString(4))).optional();
    }

    public Optional<OrgRow> byNumber(String number) {
        return db.sql("SELECT id, code, number, name FROM organizations WHERE number = ?").param(number)
            .query((rs, i) -> new OrgRow(rs.getString(1), rs.getString(2), rs.getString(3), rs.getString(4))).optional();
    }

    public Optional<OrgRow> byId(String id) {
        return db.sql("SELECT id, code, number, name FROM organizations WHERE id = ?").param(id)
            .query((rs, i) -> new OrgRow(rs.getString(1), rs.getString(2), rs.getString(3), rs.getString(4))).optional();
    }

    public void insert(String id, String code, String number, String name) {
        db.sql("INSERT INTO organizations (id, code, number, name) VALUES (?, ?, ?, ?)").param(id).param(code).param(number).param(name).update();
    }

    public void update(String id, String code, String name) {
        db.sql("UPDATE organizations SET code = ?, name = ? WHERE id = ?").param(code).param(name).param(id).update();
    }

    public void rename(String id, String name) {
        db.sql("UPDATE organizations SET name = ? WHERE id = ?").param(name).param(id).update();
    }

    /** 미가입 기관 자리(초대용)인지: 회사 아이디가 pending- 으로 시작해요. */
    public static boolean placeholder(OrgRow o) {
        return o.code().startsWith("pending-");
    }
}
