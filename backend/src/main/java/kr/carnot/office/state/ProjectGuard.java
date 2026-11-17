package kr.carnot.office.state;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

/**
 * 연구단 과제에서 총괄기관(주관)이 아닌 기관이 고칠 수 있는 곳만 받아들여요.
 * 저장된 과제를 바탕으로, 들어온 과제에서 '우리 기관 몫'만 옮겨 담아요.
 *
 * 고칠 수 있는 곳: 우리 기관 parts 항목(역할·구분 제외) · 참여 인력 중 우리 기관 사람 ·
 * 성과 목표의 우리 기관 칸(goals[].o[우리]) · 새 성과 목표 추가 · 우리 기관의 성과 실적/세부 연구/주요 공정/일정 ·
 * 우리 기관 월별 계획(plan, subplan) · 이력 추가 · 업무보고 메모(wrMem)
 */
final class ProjectGuard {
    private ProjectGuard() {}

    static ObjectNode mergeNonLead(ObjectNode stored, ObjectNode incoming, String me, Set<String> myPeople) {
        ObjectNode out = stored.deepCopy();
        String myStatus = "";
        for (JsonNode q : Json.items(stored, "parts")) if (me.equals(Json.text(q, "org"))) myStatus = Json.text(q, "status");
        boolean accepted = "수락".equals(myStatus);

        // parts: 우리 기관 항목
        ArrayNode parts = out.putArray("parts");
        JsonNode mineIn = null;
        for (JsonNode q : Json.items(incoming, "parts")) if (me.equals(Json.text(q, "org"))) mineIn = q;
        for (JsonNode q : Json.items(stored, "parts")) {
            if (!me.equals(Json.text(q, "org")) || mineIn == null) {
                parts.add(q);
                continue;
            }
            ObjectNode x;
            if (accepted) {
                x = ((ObjectNode) mineIn).deepCopy();
                x.set("role", q.get("role"));
                x.set("tier", q.get("tier"));
                x.set("status", q.get("status"));
            } else {
                // 초대받은 기관: 초대 수락(초대 중 → 수락)만 할 수 있어요
                x = ((ObjectNode) q).deepCopy();
                if ("초대 중".equals(myStatus) && "수락".equals(Json.text(mineIn, "status"))) x.put("status", "수락");
            }
            parts.add(x);
        }

        // members: 다른 기관 사람은 그대로, 우리 기관 사람은 들어온 대로
        ArrayNode members = out.putArray("members");
        Set<String> seen = new HashSet<>();
        for (JsonNode m : Json.items(stored, "members")) if (!myPeople.contains(m.asText()) && seen.add(m.asText())) members.add(m);
        for (JsonNode m : Json.items(incoming, "members")) if (myPeople.contains(m.asText()) && seen.add(m.asText())) members.add(m);

        if (!accepted) return out;

        // goals: 우리 기관 칸 + 새 목표
        Map<String, JsonNode> inGoals = byId(incoming, "goals");
        ArrayNode goals = out.putArray("goals");
        Set<String> had = new HashSet<>();
        for (JsonNode g : Json.items(stored, "goals")) {
            String id = Json.text(g, "id");
            had.add(id);
            ObjectNode x = ((ObjectNode) g).deepCopy();
            JsonNode gi = inGoals.get(id);
            if (gi != null) {
                ObjectNode o = x.get("o") instanceof ObjectNode on ? on : x.putObject("o");
                JsonNode mine = gi.path("o").get(me);
                if (mine == null) o.remove(me);
                else o.set(me, mine);
            }
            goals.add(x);
        }
        for (Map.Entry<String, JsonNode> e : inGoals.entrySet()) if (!had.contains(e.getKey())) goals.add(e.getValue());

        // 기관별 목록: 우리 기관 항목만 바꿀 수 있어요
        for (String f : new String[] {"outputs", "tasks", "miles", "events"}) {
            ArrayNode a = out.putArray(f);
            for (JsonNode x : Json.items(stored, f)) if (!me.equals(Json.text(x, "org"))) a.add(x);
            for (JsonNode x : Json.items(incoming, f)) if (me.equals(Json.text(x, "org"))) a.add(x);
        }

        // 우리 기관 월별 계획
        for (String f : new String[] {"plan", "subplan"}) {
            JsonNode in = incoming.path(f).get(me);
            if (in != null) {
                ObjectNode o = out.get(f) instanceof ObjectNode on ? on : out.putObject(f);
                o.set(me, in);
            }
        }
        // 이력은 늘어나기만 해요
        if (Json.items(incoming, "history").size() >= Json.items(stored, "history").size() && incoming.has("history")) out.set("history", incoming.get("history"));
        if (incoming.has("wrMem")) out.set("wrMem", incoming.get("wrMem"));
        return out;
    }

    private static Map<String, JsonNode> byId(JsonNode n, String f) {
        Map<String, JsonNode> m = new LinkedHashMap<>();
        for (JsonNode x : Json.items(n, f)) m.put(Json.text(x, "id"), x);
        return m;
    }
}
