package kr.carnot.office.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import java.io.IOException;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/** 로그인 중에 계정이 중지·삭제되면 바로 로그아웃시켜요. */
@Component
public class AccountStatusFilter extends OncePerRequestFilter {
    private final JdbcClient db;

    public AccountStatusFilter(JdbcClient db) {
        this.db = db;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain) throws ServletException, IOException {
        Authentication a = SecurityContextHolder.getContext().getAuthentication();
        if (a != null && a.getPrincipal() instanceof CurrentUser u && req.getRequestURI().startsWith("/api/")) {
            String st = db.sql("SELECT status FROM users WHERE id = ?").param(u.userId()).query(String.class).optional().orElse(null);
            if (!"활성".equals(st)) {
                SecurityContextHolder.clearContext();
                HttpSession s = req.getSession(false);
                if (s != null) s.invalidate();
            }
        }
        chain.doFilter(req, res);
    }
}
