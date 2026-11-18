package kr.carnot.office.web;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.LinkedHashMap;
import java.util.Map;
import kr.carnot.office.account.OrgRepository;
import kr.carnot.office.common.ApiException;
import kr.carnot.office.store.Kind;
import kr.carnot.office.store.Rec;
import kr.carnot.office.store.RecordRepository;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

/** 로그인 전에 보여 줄 회사 정보 (회사 주소 → 이름·로고). 다른 정보는 내보내지 않아요. */
@RestController
public class PublicController {
    private final OrgRepository orgs;
    private final RecordRepository records;

    public PublicController(OrgRepository orgs, RecordRepository records) {
        this.orgs = orgs;
        this.records = records;
    }

    @GetMapping("/api/public/orgs/{code}")
    public ResponseEntity<Map<String, Object>> org(@PathVariable String code) {
        var o = orgs.byCode(code.toLowerCase()).filter(x -> !OrgRepository.placeholder(x)).orElseThrow(() -> ApiException.notFound("등록되지 않은 회사 주소예요."));
        JsonNode d = records.find(Kind.ORG, o.id()).map(Rec::data).orElse(null);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("code", o.code());
        out.put("name", o.name());
        if (d != null && d.hasNonNull("short")) out.put("short", d.get("short").asText());
        if (d != null && d.hasNonNull("logo")) out.put("logo", d.get("logo").asText());
        return ResponseEntity.ok().cacheControl(CacheControl.noCache()).body(out);
    }
}
