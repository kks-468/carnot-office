package kr.carnot.office.common;

import java.util.regex.Pattern;

/** 비밀번호 규칙: 영문과 숫자를 섞어 8자 이상 (화면의 PW_OK와 같아요). */
public final class Passwords {
    private static final Pattern LETTER = Pattern.compile("[A-Za-z]");
    private static final Pattern DIGIT = Pattern.compile("\\d");

    private Passwords() {}

    public static boolean ok(String pw) {
        return pw != null && pw.length() >= 8 && pw.length() <= 128 && LETTER.matcher(pw).find() && DIGIT.matcher(pw).find();
    }

    public static void require(String pw) {
        if (!ok(pw)) throw ApiException.bad("비밀번호는 영문과 숫자를 섞어 8자 이상이어야 해요.");
    }
}
