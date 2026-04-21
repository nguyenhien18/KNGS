package com.conggiasu.exception;

import com.conggiasu.entity.enums.ErrorCode;
import org.springframework.http.HttpStatus;

public class AppException extends RuntimeException {
    private final ErrorCode errorCode;
    private final HttpStatus status;

    public AppException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
        this.status = null;
    }

    public AppException(HttpStatus status, String message) {
        super(message);
        this.errorCode = null;
        this.status = status;
    }

    public ErrorCode getErrorCode() {
        return errorCode;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
