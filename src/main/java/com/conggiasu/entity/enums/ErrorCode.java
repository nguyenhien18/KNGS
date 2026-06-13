package com.conggiasu.entity.enums;

import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

public enum ErrorCode {
    UNCATEGORIZED_EXCEPTION(9999, "Lỗi hệ thống. Vui lòng thử lại sau.", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_KEY(1001, "Dữ liệu không hợp lệ", HttpStatus.BAD_REQUEST),
    UNAUTHORIZED(1002, "Bạn không có quyền thực hiện thao tác này", HttpStatus.FORBIDDEN),
    UNAUTHENTICATED(1003, "Chưa xác thực", HttpStatus.UNAUTHORIZED),
    DATA_INTEGRITY_VIOLATION(1004, "Dữ liệu đang bị ràng buộc, không thể thực hiện thao tác này", HttpStatus.BAD_REQUEST);

    private final int code;
    private final String message;
    private final HttpStatusCode statusCode;

    ErrorCode(int code, String message, HttpStatusCode statusCode) {
        this.code = code;
        this.message = message;
        this.statusCode = statusCode;
    }

    public int getCode() {
        return code;
    }

    public String getMessage() {
        return message;
    }

    public HttpStatusCode getStatusCode() {
        return statusCode;
    }
}
