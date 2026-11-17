package kr.carnot.office.account;

import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.HashMap;
import java.util.Map;
import kr.carnot.office.security.CurrentUser;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** /api/accounts: 직원 계정 관리 (기관 관리자) */
@RestController
@RequestMapping("/api/accounts")
public class AccountController {
    private final AccountService accounts;

    public AccountController(AccountService accounts) {
        this.accounts = accounts;
    }

    record StatusReq(String status) {}

    @PostMapping
    public Map<String, Object> create(@AuthenticationPrincipal CurrentUser me, @RequestBody ObjectNode person) {
        var c = accounts.create(me, person);
        Map<String, Object> out = new HashMap<>();
        out.put("person", c.person());
        out.put("tempPassword", c.tempPassword());
        return out;
    }

    @PostMapping("/{pid}/status")
    public ResponseEntity<Void> status(@AuthenticationPrincipal CurrentUser me, @PathVariable String pid, @RequestBody StatusReq r) {
        accounts.setStatus(me, pid, r.status());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{pid}/reset")
    public Map<String, String> reset(@AuthenticationPrincipal CurrentUser me, @PathVariable String pid) {
        return Map.of("tempPassword", accounts.reset(me, pid));
    }

    @DeleteMapping("/{pid}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal CurrentUser me, @PathVariable String pid) {
        accounts.delete(me, pid);
        return ResponseEntity.noContent().build();
    }
}
