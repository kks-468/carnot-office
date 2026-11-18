package kr.carnot.office.account;

import java.time.OffsetDateTime;
import kr.carnot.office.common.ApiException;
import kr.carnot.office.common.Passwords;
import kr.carnot.office.security.CurrentUser;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** 로그인 · 첫 로그인 비밀번호 정하기 · 비밀번호 변경. */
@Service
public class AuthService {
    private static final int MAX_FAILS = 5;
    // 없는 아이디로 시도할 때도 비슷한 시간이 걸리도록 비교에 쓰는 해시
    private static final String DUMMY = "$2a$12$C6UzMDM.H6dfI/f/IKcEeO5X1oQyCq0B1bWb9j6s8w8Fq5r8kq4cS";

    private final OrgRepository orgs;
    private final UserRepository users;
    private final PasswordEncoder enc;

    public AuthService(OrgRepository orgs, UserRepository users, PasswordEncoder enc) {
        this.orgs = orgs;
        this.users = users;
        this.enc = enc;
    }

    static String norm(String s) {
        return s == null ? "" : s.trim().toLowerCase();
    }

    /** 로그인 결과: 관리자가 만든 계정이 임시 비밀번호로 처음 들어오면 user 없이 needNewPassword=true */
    public record LoginResult(CurrentUser user, boolean needNewPassword) {}

    @Transactional(noRollbackFor = ApiException.class)
    public LoginResult login(String orgCode, String login, String password) {
        if (norm(orgCode).isEmpty() || norm(login).isEmpty() || password == null || password.isEmpty())
            throw ApiException.bad("회사 아이디, 아이디, 비밀번호를 모두 입력해 주세요.");
        var u = orgs.byCode(norm(orgCode)).flatMap(o -> users.byLogin(o.id(), norm(login))).orElse(null);
        if (u == null) {
            enc.matches(password, DUMMY);
            throw ApiException.bad("회사 아이디, 아이디 또는 비밀번호를 확인해 주세요.");
        }
        if (u.lockedUntil() != null && u.lockedUntil().isAfter(OffsetDateTime.now()))
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "locked", "비밀번호를 여러 번 틀려 잠시 잠겼어요. 10분 뒤 다시 해 주세요.");
        if (UserRow.INVITED.equals(u.status())) {
            // 관리자가 만든 계정: 임시 비밀번호가 맞으면 새 비밀번호를 정하는 단계로 (세션은 아직 만들지 않아요)
            boolean ok = u.tempHash() != null && enc.matches(password, u.tempHash());
            if (!ok) {
                users.loginFailed(u.id(), u.failedCount() + 1 >= MAX_FAILS);
                throw ApiException.bad("회사 아이디, 아이디 또는 비밀번호를 확인해 주세요.");
            }
            if (u.tempExpiresAt() != null && u.tempExpiresAt().isBefore(OffsetDateTime.now()))
                throw ApiException.bad("임시 비밀번호가 만료됐어요. 기관 관리자에게 다시 만들어 달라고 해 주세요.");
            return new LoginResult(null, true);
        }
        if (u.passwordHash() == null || !enc.matches(password, u.passwordHash())) {
            users.loginFailed(u.id(), u.failedCount() + 1 >= MAX_FAILS);
            throw ApiException.bad("회사 아이디, 아이디 또는 비밀번호를 확인해 주세요.");
        }
        if (UserRow.STOPPED.equals(u.status())) throw ApiException.bad("사용이 중지된 계정이에요. 기관 관리자에게 문의해 주세요.");
        if (UserRow.REQUESTED.equals(u.status())) throw ApiException.bad("기관 관리자의 가입 승인을 기다리는 중이에요.");
        users.loginOk(u.id());
        return new LoginResult(toCurrent(u), false);
    }

    /** 초대받은 계정: 임시 비밀번호로 확인하고 새 비밀번호를 정해요. */
    @Transactional
    public CurrentUser activate(String orgCode, String login, String temp, String next) {
        var u = orgs.byCode(norm(orgCode)).flatMap(o -> users.byLogin(o.id(), norm(login)))
            .orElseThrow(() -> ApiException.bad("회사 아이디 또는 아이디를 확인해 주세요."));
        if (!UserRow.INVITED.equals(u.status())) throw ApiException.bad("이미 비밀번호를 정한 계정이에요. 로그인해 주세요.");
        if (u.tempHash() == null || temp == null || !enc.matches(temp, u.tempHash())) throw ApiException.bad("임시 비밀번호가 맞지 않아요.");
        if (u.tempExpiresAt() != null && u.tempExpiresAt().isBefore(OffsetDateTime.now()))
            throw ApiException.bad("임시 비밀번호가 만료됐어요. 기관 관리자에게 다시 만들어 달라고 해 주세요.");
        Passwords.require(next);
        users.setPassword(u.id(), enc.encode(next));
        users.loginOk(u.id());
        return toCurrent(users.byPerson(u.personId()).orElseThrow());
    }

    @Transactional
    public void changePassword(CurrentUser me, String current, String next) {
        var u = users.byPerson(me.personId()).orElseThrow(() -> ApiException.forbidden("계정을 찾지 못했어요."));
        if (u.passwordHash() == null || !enc.matches(current == null ? "" : current, u.passwordHash())) throw ApiException.bad("지금 비밀번호가 맞지 않아요.");
        Passwords.require(next);
        users.setPassword(u.id(), enc.encode(next));
    }

    static CurrentUser toCurrent(UserRow u) {
        return new CurrentUser(u.id(), u.personId(), u.orgId(), u.login(), u.admin());
    }
}
