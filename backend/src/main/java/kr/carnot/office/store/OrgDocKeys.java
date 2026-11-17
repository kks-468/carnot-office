package kr.carnot.office.store;

import java.util.Set;

/** 기관마다 하나씩 통째로 저장하는 설정 묶음 (S의 키 이름 그대로). */
public final class OrgDocKeys {
    private OrgDocKeys() {}

    public static final Set<String> ALL = Set.of(
        "expGroups", "pay", "ins", "rkind", "raises", "payFree", "pgrade", "grades",
        "leaveAdj", "leaveSet", "stamps", "orgSeal", "docSeal", "ls", "docFooter", "docSign",
        "srcOv", "rates", "TPL");
}
