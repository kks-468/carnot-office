package kr.carnot.office.state;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.Set;

/**
 * 열람 권한 (설정 → 열람 권한). 화면 core/acl.ts와 같은 규칙이에요.
 * 규칙: {all, members, level, units[], people[]} 중 하나라도 맞으면 볼 수 있고, 기관 관리자는 언제나 볼 수 있어요.
 * 정하지 않았을 때: 급여는 관리자만, 연구비는 과제 참여 인력·관리팀.
 */
final class AccessRules {
    private AccessRules() {}

    /** org: 기관 문서(acl·levels·units), person: 보는 사람 문서, admin: 기관 관리자 여부 */
    record Viewer(String personId, boolean admin, JsonNode person, JsonNode org) {}

    static JsonNode rule(JsonNode org, String scope) {
        JsonNode acl = org == null ? null : org.get("acl");
        if (scope.startsWith("proj:")) {
            JsonNode r = acl == null ? null : acl.path("projects").get(scope.substring(5));
            if (r != null && r.isObject()) return r;
            scope = "research";
        }
        JsonNode r = acl == null ? null : acl.get(scope);
        if (r != null && r.isObject()) return r;
        return scope.equals("pay") ? EMPTY : RESEARCH_DEFAULT;
    }

    private static final JsonNode EMPTY = new com.fasterxml.jackson.databind.ObjectMapper().createObjectNode();
    private static final JsonNode RESEARCH_DEFAULT = new com.fasterxml.jackson.databind.ObjectMapper().createObjectNode().put("members", true);

    static boolean allows(JsonNode rule, Viewer v, JsonNode project) {
        if (v.admin() || rule.path("all").asBoolean(false)) return true;
        for (JsonNode p : rule.path("people")) if (v.personId().equals(p.asText())) return true;
        String level = rule.path("level").asText("");
        if (!level.isEmpty() && v.org() != null && v.org().path("levels").isArray()) {
            int ri = -1, ui = -1, i = 0;
            String my = v.person() == null ? "" : v.person().path("level").asText("");
            for (JsonNode l : v.org().path("levels")) {
                if (level.equals(l.path("k").asText())) ri = i;
                if (my.equals(l.path("k").asText())) ui = i;
                i++;
            }
            if (ri >= 0 && ui >= 0 && ui <= ri) return true;
        }
        Set<String> path = Visibility.unitPath(v.org(), v.person() == null ? "" : v.person().path("unit").asText(""));
        for (JsonNode u : rule.path("units")) if (path.contains(u.asText())) return true;
        if (rule.path("members").asBoolean(false) && project != null) {
            for (JsonNode m : project.path("members")) if (v.personId().equals(m.asText())) return true;
            String team = project.path("team").asText("");
            if (!team.isEmpty() && path.contains(team)) return true;
        }
        return false;
    }

    static boolean canPay(Viewer v) {
        return allows(rule(v.org(), "pay"), v, null);
    }

    static boolean canResearch(Viewer v, String projectId, JsonNode project) {
        return allows(rule(v.org(), "proj:" + projectId), v, project);
    }

    /** 급여 정보 묶음 (권한이 없으면 걸러 보내고, 고치지 못해요) */
    static final Set<String> PAY_READ = Set.of("pay", "payFree", "pgrade", "raises", "leaveAdj");
    static final Set<String> PAY_WRITE = Set.of("pay", "payFree", "pgrade", "raises", "leaveAdj", "grades", "leaveSet", "ins");
}
