package kr.carnot.office.common;

import org.springframework.http.HttpStatus;

/** 화면에 그대로 보여 줄 수 있는 오류. code는 화면이 분기할 때, message는 사람에게 보여 줄 때 써요. */
public class ApiException extends RuntimeException {
    private final HttpStatus status;
    private final String code;

    public ApiException(HttpStatus status, String code, String message) {
        super(message);
        this.status = status;
        this.code = code;
    }

    public HttpStatus status() { return status; }
    public String code() { return code; }

    public static ApiException bad(String message) { return new ApiException(HttpStatus.BAD_REQUEST, "bad_request", message); }
    public static ApiException forbidden(String message) { return new ApiException(HttpStatus.FORBIDDEN, "forbidden", message); }
    public static ApiException notFound(String message) { return new ApiException(HttpStatus.NOT_FOUND, "not_found", message); }
    public static ApiException conflict(String message) { return new ApiException(HttpStatus.CONFLICT, "conflict", message); }
}
