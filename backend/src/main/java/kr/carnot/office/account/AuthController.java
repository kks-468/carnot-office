package kr.carnot.office.account;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.Map;
import kr.carnot.office.security.CurrentUser;
import kr.carnot.office.security.Sessions;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** /api/auth: 로그인 · 로그아웃 · 내 정보 · 계정 활성화 · 비밀번호 변경 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService auth;
    private final Sessions sessions;

    public AuthController(AuthService auth, Sessions sessions) {
        this.auth = auth;
        this.sessions = sessions;
    }

    record LoginReq(String orgCode, String login, String password) {}
    record ActivateReq(String orgCode, String login, String tempPassword, String newPassword) {}
    record PwReq(String current, String next) {}

    static Map<String, Object> me(CurrentUser u) {
        return Map.of("personId", u.personId(), "orgId", u.orgId(), "admin", u.admin());
    }

    /** 로그인 여부. 로그인 전이면 {} (CSRF 쿠키도 이때 받아요). */
    @GetMapping("/me")
    public Map<String, Object> current(@AuthenticationPrincipal CurrentUser u) {
        return u == null ? Map.of() : me(u);
    }

    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody LoginReq r, HttpServletRequest req, HttpServletResponse res) {
        CurrentUser u = auth.login(r.orgCode(), r.login(), r.password());
        sessions.signIn(u, req, res);
        return me(u);
    }

    @PostMapping("/activate")
    public Map<String, Object> activate(@RequestBody ActivateReq r, HttpServletRequest req, HttpServletResponse res) {
        CurrentUser u = auth.activate(r.orgCode(), r.login(), r.tempPassword(), r.newPassword());
        sessions.signIn(u, req, res);
        return me(u);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest req) {
        sessions.signOut(req);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/password")
    public ResponseEntity<Void> password(@AuthenticationPrincipal CurrentUser u, @RequestBody PwReq r) {
        if (u == null) return ResponseEntity.status(401).build();
        auth.changePassword(u, r.current(), r.next());
        return ResponseEntity.noContent().build();
    }
}
