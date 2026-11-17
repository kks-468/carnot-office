package kr.carnot.office.common;

import java.security.SecureRandom;

/** 화면(uid)과 같은 모양의 숫자 아이디와 임시 비밀번호를 만들어요. */
public final class Ids {
    private static final SecureRandom RND = new SecureRandom();
    private static final String PW_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    private static long last = 0;

    private Ids() {}

    /** 시간(ms)×1000 + 난수. 자바스크립트 숫자 범위 안에서 겹치지 않게 늘어나요. */
    public static synchronized long next() {
        long v = System.currentTimeMillis() * 1000 + RND.nextInt(1000);
        if (v <= last) v = last + 1;
        last = v;
        return v;
    }

    /** 영문+숫자가 섞인 임시 비밀번호. */
    public static String tempPassword() {
        StringBuilder sb = new StringBuilder("Cn");
        for (int i = 0; i < 8; i++) sb.append(PW_CHARS.charAt(RND.nextInt(PW_CHARS.length())));
        sb.append(RND.nextInt(10));
        return sb.toString();
    }

    public static String digits(int n) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < n; i++) sb.append(RND.nextInt(10));
        return sb.toString();
    }
}
