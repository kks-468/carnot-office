package kr.carnot.office.account;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class UserRepository {
    private final JdbcClient db;

    public UserRepository(JdbcClient db) {
        this.db = db;
    }

    private UserRow map(ResultSet rs, int i) throws SQLException {
        return new UserRow(rs.getLong("id"), rs.getString("person_id"), rs.getString("org_id"), rs.getString("login"), rs.getString("email"),
            rs.getString("password_hash"), rs.getString("temp_hash"), rs.getObject("temp_expires_at", OffsetDateTime.class), rs.getString("status"),
            rs.getBoolean("admin"), rs.getInt("failed_count"), rs.getObject("locked_until", OffsetDateTime.class));
    }

    public Optional<UserRow> byLogin(String orgId, String login) {
        return db.sql("SELECT * FROM users WHERE org_id = ? AND login = ?").param(orgId).param(login).query(this::map).optional();
    }

    public Optional<UserRow> byPerson(String personId) {
        return db.sql("SELECT * FROM users WHERE person_id = ?").param(personId).query(this::map).optional();
    }

    public List<UserRow> byOrg(String orgId) {
        return db.sql("SELECT * FROM users WHERE org_id = ?").param(orgId).query(this::map).list();
    }

    public long insert(String personId, String orgId, String login, String email, String passwordHash, String tempHash, OffsetDateTime tempExpires, String status, boolean admin) {
        return db.sql("""
            INSERT INTO users (person_id, org_id, login, email, password_hash, temp_hash, temp_expires_at, status, admin)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id
            """).param(personId).param(orgId).param(login).param(email).param(passwordHash).param(tempHash).param(tempExpires).param(status).param(admin)
            .query(Long.class).single();
    }

    public void loginFailed(long id, boolean lock) {
        db.sql("UPDATE users SET failed_count = failed_count + 1, locked_until = CASE WHEN ? THEN now() + interval '10 minutes' ELSE locked_until END WHERE id = ?")
            .param(lock).param(id).update();
    }

    public void loginOk(long id) {
        db.sql("UPDATE users SET failed_count = 0, locked_until = NULL, last_login_at = now() WHERE id = ?").param(id).update();
    }

    public void setPassword(long id, String hash) {
        db.sql("UPDATE users SET password_hash = ?, temp_hash = NULL, temp_expires_at = NULL, status = '활성', failed_count = 0, locked_until = NULL WHERE id = ?")
            .param(hash).param(id).update();
    }

    public void setTemp(long id, String tempHash, OffsetDateTime expires, String status) {
        db.sql("UPDATE users SET temp_hash = ?, temp_expires_at = ?, status = ? WHERE id = ?").param(tempHash).param(expires).param(status).param(id).update();
    }

    public void setStatus(long id, String status) {
        db.sql("UPDATE users SET status = ? WHERE id = ?").param(status).param(id).update();
    }

    public void delete(long id) {
        db.sql("DELETE FROM users WHERE id = ?").param(id).update();
    }
}
