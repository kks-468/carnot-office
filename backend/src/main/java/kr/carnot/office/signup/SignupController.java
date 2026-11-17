package kr.carnot.office.signup;

import com.fasterxml.jackson.databind.node.ObjectNode;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.Map;
import kr.carnot.office.security.Sessions;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** /api/signup: 기관 가입 */
@RestController
@RequestMapping("/api/signup")
public class SignupController {
    private final SignupService signup;
    private final Sessions sessions;

    public SignupController(SignupService signup, Sessions sessions) {
        this.signup = signup;
        this.sessions = sessions;
    }

    record NumberReq(String number) {}
    record CodeReq(String code) {}
    record MailReq(String email) {}
    record MailVerifyReq(String email, String code) {}
    record OrgReq(ObjectNode org, ObjectNode person, String password) {}
    record JoinReq(String orgId, ObjectNode person, String password) {}

    @PostMapping("/check-number")
    public Map<String, Object> checkNumber(@RequestBody NumberReq r) {
        return signup.checkNumber(r.number());
    }

    @PostMapping("/check-code")
    public Map<String, Boolean> checkCode(@RequestBody CodeReq r) {
        return Map.of("ok", signup.codeFree(r.code()));
    }

    @PostMapping("/mail")
    public Map<String, Object> mail(@RequestBody MailReq r) {
        return signup.sendMailCode(r.email());
    }

    @PostMapping("/mail/verify")
    public ResponseEntity<Void> verify(@RequestBody MailVerifyReq r) {
        signup.verifyMailCode(r.email(), r.code());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/org")
    public Map<String, Object> org(@RequestBody OrgReq r, HttpServletRequest req, HttpServletResponse res) {
        var u = signup.createOrg(r.org(), r.person(), r.password());
        sessions.signIn(u, req, res);
        return Map.of("personId", u.personId(), "orgId", u.orgId(), "admin", true);
    }

    @PostMapping("/join")
    public ResponseEntity<Void> join(@RequestBody JoinReq r) {
        signup.join(r.orgId(), r.person(), r.password());
        return ResponseEntity.noContent().build();
    }
}
