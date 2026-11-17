package kr.carnot.office.security;

import java.io.Serializable;

/** 로그인한 사람. 세션에 저장돼요. */
public record CurrentUser(long userId, String personId, String orgId, String login, boolean admin) implements Serializable {}
