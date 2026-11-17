package kr.carnot.office.store;

import java.util.Arrays;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * 화면 상태(S)의 데이터 묶음과 저장 종류(kind)의 짝.
 * access는 누가 읽고 쓸 수 있는지를 정해요.
 */
public enum Kind {
    ORG("org", "orgs", true, Access.ORG_SELF),
    PERSON("person", "people", false, Access.PEOPLE),
    EXPERT("expert", "experts", false, Access.EXPERT),
    PROJECT("project", "projects", false, Access.PROJECT),
    COLLECT("collect", "collect", false, Access.PROJECT_CHILD),
    NOTICE("notice", "notices", false, Access.PRIVATE),
    CEVENT("cevent", "cevents", false, Access.PRIVATE),
    REPORT("report", "reports", false, Access.PRIVATE),
    APPR("appr", "appr", false, Access.PRIVATE),
    MEETING("meeting", "meetings", false, Access.PRIVATE),
    ENTRY("entry", "entries", false, Access.PRIVATE),
    RECEIPT("receipt", "receipts", false, Access.PRIVATE),
    DOC("doc", "docs", false, Access.PRIVATE),
    SCHED("sched", "sched", false, Access.PRIVATE),
    MADE("made", "made", true, Access.PRIVATE),
    FILE("file", "files", true, Access.PRIVATE);

    public enum Access {
        /** 우리 기관 문서만 */
        PRIVATE,
        /** 기관 정보: 자기 기관만 고쳐요 */
        ORG_SELF,
        /** 구성원: 자기 기관만 고치고, 계정 정보는 계정 API로만 바꿔요 */
        PEOPLE,
        /** 전문가: 기관 안에서 공유 범위(기관·팀·개인)에 따라 보여요 */
        EXPERT,
        /** 과제: 참여 기관이 함께 보고, 총괄기관 외에는 자기 기관 몫만 고쳐요 */
        PROJECT,
        /** 과제에 딸린 공유 문서 (자료 취합) */
        PROJECT_CHILD
    }

    public final String kind;
    /** 화면 상태 S의 키 */
    public final String stateKey;
    /** S[stateKey]가 배열이 아니라 {아이디: 값} 모양인지 */
    public final boolean map;
    public final Access access;

    Kind(String kind, String stateKey, boolean map, Access access) {
        this.kind = kind;
        this.stateKey = stateKey;
        this.map = map;
        this.access = access;
    }

    private static final Map<String, Kind> BY_KIND = Arrays.stream(values()).collect(Collectors.toMap(k -> k.kind, Function.identity()));

    public static Optional<Kind> of(String kind) {
        return Optional.ofNullable(BY_KIND.get(kind));
    }
}
