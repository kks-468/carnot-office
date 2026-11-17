package kr.carnot.office.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import kr.carnot.office.common.ApiException;
import kr.carnot.office.common.CarnotProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

/**
 * Anthropic API 프록시. API 키는 서버 환경 변수(ANTHROPIC_API_KEY)에만 두고 브라우저로 보내지 않아요.
 * /stream: 글 생성(회의록 초안 등)을 글자 그대로 흘려보내요. /json: 영수증 사진 읽기 등 JSON 응답.
 */
@RestController
@RequestMapping("/api/ai")
public class AiController {
    private static final Logger log = LoggerFactory.getLogger(AiController.class);
    private static final URI API = URI.create("https://api.anthropic.com/v1/messages");
    private static final Set<String> IMAGE_TYPES = Set.of("image/jpeg", "image/png", "image/gif", "image/webp");
    private static final int MAX_PROMPT = 200_000;

    private final CarnotProperties props;
    private final ObjectMapper om;
    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();

    public AiController(CarnotProperties props, ObjectMapper om) {
        this.props = props;
        this.om = om;
    }

    public record Image(String media_type, String data) {}
    public record Req(String prompt, String tier, List<Image> images) {}

    @GetMapping("/status")
    public Map<String, Object> status() {
        return props.ai().enabled() ? Map.of("enabled", true, "model", props.ai().model()) : Map.of("enabled", false);
    }

    private String model(String tier) {
        return "quick".equals(tier) ? props.ai().modelQuick() : props.ai().model();
    }

    private void check(Req r) {
        if (!props.ai().enabled()) throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "none", "ANTHROPIC_API_KEY가 설정되지 않았어요.");
        if (r.prompt() == null || r.prompt().isBlank() || r.prompt().length() > MAX_PROMPT) throw ApiException.bad("프롬프트를 확인해 주세요.");
    }

    private HttpRequest.Builder req(ObjectNode body) throws Exception {
        return HttpRequest.newBuilder(API).timeout(Duration.ofMinutes(5))
            .header("x-api-key", props.ai().apiKey()).header("anthropic-version", "2023-06-01").header("content-type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(om.writeValueAsString(body)));
    }

    @PostMapping(value = "/stream")
    public ResponseEntity<StreamingResponseBody> stream(@RequestBody Req r) {
        check(r);
        ObjectNode body = om.createObjectNode();
        body.put("model", model(r.tier()));
        body.put("max_tokens", 4096);
        body.put("stream", true);
        ObjectNode msg = body.putArray("messages").addObject();
        msg.put("role", "user");
        msg.put("content", r.prompt());
        StreamingResponseBody out = os -> {
            try {
                HttpResponse<java.io.InputStream> res = http.send(req(body).build(), HttpResponse.BodyHandlers.ofInputStream());
                if (res.statusCode() >= 400) {
                    log.warn("[ai/stream] {}", res.statusCode());
                    return;
                }
                try (var in = new BufferedReader(new InputStreamReader(res.body(), StandardCharsets.UTF_8))) {
                    String line;
                    while ((line = in.readLine()) != null) {
                        if (!line.startsWith("data:")) continue;
                        JsonNode ev = om.readTree(line.substring(5).trim());
                        if ("content_block_delta".equals(ev.path("type").asText()) && "text_delta".equals(ev.path("delta").path("type").asText())) {
                            os.write(ev.path("delta").path("text").asText().getBytes(StandardCharsets.UTF_8));
                            os.flush();
                        }
                    }
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            } catch (Exception e) {
                log.warn("[ai/stream] {}", e.getMessage());
            }
        };
        return ResponseEntity.ok().contentType(new MediaType("text", "plain", StandardCharsets.UTF_8)).header("Cache-Control", "no-cache").header("X-Accel-Buffering", "no").body(out);
    }

    @PostMapping("/json")
    public JsonNode json(@RequestBody Req r) throws Exception {
        check(r);
        List<Image> imgs = r.images() == null ? List.of() : r.images();
        if (imgs.size() > 5 || imgs.stream().anyMatch(i -> i == null || !IMAGE_TYPES.contains(i.media_type()) || i.data() == null))
            throw ApiException.bad("이미지는 jpeg·png·gif·webp로 5장까지 보낼 수 있어요.");
        ObjectNode body = om.createObjectNode();
        body.put("model", model(r.tier()));
        body.put("max_tokens", 2048);
        ObjectNode msg = body.putArray("messages").addObject();
        msg.put("role", "user");
        ArrayNode content = msg.putArray("content");
        for (Image i : imgs) {
            ObjectNode c = content.addObject();
            c.put("type", "image");
            ObjectNode src = c.putObject("source");
            src.put("type", "base64");
            src.put("media_type", i.media_type());
            src.put("data", i.data());
        }
        content.addObject().put("type", "text").put("text", r.prompt() + "\n\n설명 없이 JSON만 출력하세요.");
        HttpResponse<String> res = http.send(req(body).build(), HttpResponse.BodyHandlers.ofString());
        if (res.statusCode() >= 400) throw new ApiException(HttpStatus.BAD_GATEWAY, "unavailable", "AI 응답을 받지 못했어요.");
        StringBuilder text = new StringBuilder();
        for (JsonNode b : om.readTree(res.body()).path("content")) if ("text".equals(b.path("type").asText())) text.append(b.path("text").asText());
        Matcher m = Pattern.compile("[\\[{][\\s\\S]*[\\]}]").matcher(text);
        if (!m.find()) throw new ApiException(HttpStatus.BAD_GATEWAY, "bad_output", "AI 응답에서 JSON을 찾지 못했어요.");
        return om.readTree(m.group());
    }
}
