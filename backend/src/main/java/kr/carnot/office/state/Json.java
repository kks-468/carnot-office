package kr.carnot.office.state;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.ArrayList;
import java.util.List;

/** JSON 다루기 도우미. */
final class Json {
    private Json() {}

    static String text(JsonNode n, String f) {
        JsonNode v = n == null ? null : n.get(f);
        return v == null || v.isNull() ? "" : v.asText("");
    }

    static List<JsonNode> items(JsonNode n, String f) {
        List<JsonNode> out = new ArrayList<>();
        JsonNode a = n == null ? null : n.get(f);
        if (a != null && a.isArray()) a.forEach(out::add);
        return out;
    }

    static ObjectNode pick(ObjectNode src, ObjectNode dst, String... fields) {
        for (String f : fields) if (src.has(f)) dst.set(f, src.get(f));
        return dst;
    }

    static ArrayNode arr(ObjectNode o, String f) {
        JsonNode a = o.get(f);
        if (a instanceof ArrayNode an) return an;
        return o.putArray(f);
    }
}
