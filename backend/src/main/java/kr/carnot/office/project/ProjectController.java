package kr.carnot.office.project;

import java.util.Map;
import kr.carnot.office.security.CurrentUser;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/** 연구단 참여 신청 · 초대할 기관 찾기 */
@RestController
public class ProjectController {
    private final ProjectService projects;

    public ProjectController(ProjectService projects) {
        this.projects = projects;
    }

    record NumberReq(String number) {}

    @PostMapping("/api/projects/join")
    public Map<String, Object> join(@AuthenticationPrincipal CurrentUser u, @RequestBody ProjectService.JoinReq r) {
        return projects.join(u, r);
    }

    @PostMapping("/api/orgs/resolve")
    public Map<String, Object> resolve(@AuthenticationPrincipal CurrentUser u, @RequestBody NumberReq r) {
        return projects.resolveOrg(u, r.number());
    }
}
