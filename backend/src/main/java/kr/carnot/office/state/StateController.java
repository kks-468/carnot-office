package kr.carnot.office.state;

import com.fasterxml.jackson.databind.node.ObjectNode;
import kr.carnot.office.security.CurrentUser;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/** /api/state (불러오기) · /api/sync (바뀐 문서 저장) */
@RestController
public class StateController {
    private final StateService state;
    private final SyncService sync;

    public StateController(StateService state, SyncService sync) {
        this.state = state;
        this.sync = sync;
    }

    @GetMapping("/api/state")
    public ObjectNode load(@AuthenticationPrincipal CurrentUser u) {
        return state.load(u);
    }

    @PostMapping("/api/sync")
    public SyncService.Result save(@AuthenticationPrincipal CurrentUser u, @RequestBody SyncService.Batch b) {
        return sync.apply(u, b);
    }
}
