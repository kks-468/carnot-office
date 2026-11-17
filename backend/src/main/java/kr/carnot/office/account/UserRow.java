package kr.carnot.office.account;

import java.time.OffsetDateTime;

/** users 표의 한 줄. */
public record UserRow(long id, String personId, String orgId, String login, String email, String passwordHash,
                      String tempHash, OffsetDateTime tempExpiresAt, String status, boolean admin,
                      int failedCount, OffsetDateTime lockedUntil) {

    public static final String ACTIVE = "활성";
    public static final String INVITED = "초대됨";
    public static final String STOPPED = "중지";
    public static final String REQUESTED = "가입 신청";
}
