package kr.carnot.office.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.List;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.stereotype.Component;

/** 로그인 세션을 만들고 지워요. */
@Component
public class Sessions {
    private final SecurityContextRepository repo;

    public Sessions(SecurityContextRepository repo) {
        this.repo = repo;
    }

    public void signIn(CurrentUser u, HttpServletRequest req, HttpServletResponse res) {
        // 세션 고정 공격을 막으려고 로그인할 때 세션 아이디를 바꿔요.
        if (req.getSession(false) != null) req.changeSessionId();
        var auth = new UsernamePasswordAuthenticationToken(u, null,
            u.admin() ? List.of(new SimpleGrantedAuthority("ROLE_USER"), new SimpleGrantedAuthority("ROLE_ADMIN")) : List.of(new SimpleGrantedAuthority("ROLE_USER")));
        SecurityContext ctx = SecurityContextHolder.createEmptyContext();
        ctx.setAuthentication(auth);
        SecurityContextHolder.setContext(ctx);
        repo.saveContext(ctx, req, res);
    }

    public void signOut(HttpServletRequest req) {
        SecurityContextHolder.clearContext();
        var s = req.getSession(false);
        if (s != null) s.invalidate();
    }
}
