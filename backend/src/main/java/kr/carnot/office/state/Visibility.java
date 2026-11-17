package kr.carnot.office.state;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.HashSet;
import java.util.Set;
import kr.carnot.office.security.CurrentUser;

/** 누가 무엇을 볼 수 있는지 (화면 core/org.js의 규칙과 같아요). */
final class Visibility {
    private Visibility() {}

    /** 이름이 name인 부서와 그 위 부서들 (화면의 unitPath). */
    static Set<String> unitPath(JsonNode org, String name) {
        Set<String> out = new HashSet<>();
        JsonNode units = org == null ? null : org.get("units");
        if (units == null || !units.isArray() || name == null) return out;
        String cur = name;
        while (cur != null && !cur.isEmpty() && out.add(cur)) {
            String parent = null;
            for (JsonNode u : units) if (cur.equals(Json.text(u, "name"))) parent = Json.text(u, "parent");
            cur = parent;
        }
        return out;
    }

    /** 전문가 공유 범위: 기관 전체 · 팀(부서) · 나만 (화면의 expVisible). */
    static boolean expert(ObjectNode x, CurrentUser u, JsonNode myOrg, String myUnit) {
        String xo = Json.text(x, "xo");
        if (!(xo.isEmpty() ? u.orgId() : xo).equals(u.orgId())) return false;
        String share = Json.text(x, "share");
        if (share.isEmpty()) share = "org";
        if (share.equals("org") || u.admin() || u.personId().equals(Json.text(x, "by"))) return true;
        if (share.equals("team") || share.equals("unit")) {
            String unit = Json.text(x, "unit");
            return !unit.isEmpty() && unitPath(myOrg, myUnit).contains(unit);
        }
        return false;
    }

    /** 전문가 고치기 (화면의 canEditExp). */
    static boolean expertEdit(ObjectNode x, CurrentUser u) {
        String by = Json.text(x, "by");
        String share = Json.text(x, "share");
        return u.admin() || u.personId().equals(by) || (by.isEmpty() && (share.isEmpty() || share.equals("org")));
    }
}
