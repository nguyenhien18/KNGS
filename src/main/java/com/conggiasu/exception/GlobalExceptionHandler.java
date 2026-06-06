package com.conggiasu.exception;

import com.conggiasu.dto.response.ApiResponse;
import com.conggiasu.entity.enums.ErrorCode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);
    private static final String SYSTEM_ERROR_MESSAGE = "Lỗi hệ thống. Vui lòng thử lại sau.";

    @ExceptionHandler(AppException.class)
    public ResponseEntity<ApiResponse<Void>> handleAppException(AppException exception) {
        if (exception.getErrorCode() != null) {
            ErrorCode errorCode = exception.getErrorCode();
            if (errorCode.getStatusCode().is5xxServerError()) {
                log.error("Application exception occurred", exception);
                return systemErrorResponse();
            }
            return ResponseEntity.status(errorCode.getStatusCode())
                    .body(ApiResponse.<Void>builder()
                            .code(errorCode.getCode())
                            .message(errorCode.getMessage())
                            .build());
        }

        var status = exception.getStatus() == null ? ErrorCode.INVALID_KEY.getStatusCode() : exception.getStatus();
        if (status.is5xxServerError()) {
            log.error("Application exception occurred", exception);
            return systemErrorResponse();
        }
        return ResponseEntity.status(status)
                .body(ApiResponse.<Void>builder()
                        .code(ErrorCode.INVALID_KEY.getCode())
                        .message(exception.getMessage())
                        .build());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidationException(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
            .findFirst()
            .map(error -> error.getDefaultMessage())
            .orElse(ErrorCode.INVALID_KEY.getMessage());

        return ResponseEntity.badRequest()
                .body(ApiResponse.<Void>builder()
                        .code(ErrorCode.INVALID_KEY.getCode())
                        .message(message)
                        .build());
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccessDeniedException(AccessDeniedException ex) {
        return ResponseEntity.status(ErrorCode.UNAUTHORIZED.getStatusCode())
            .body(ApiResponse.<Void>builder()
                .code(ErrorCode.UNAUTHORIZED.getCode())
                .message(ErrorCode.UNAUTHORIZED.getMessage())
                .build());
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiResponse<Void>> handleDataIntegrityViolationException(DataIntegrityViolationException exception) {
        Throwable mostSpecificCause = exception.getMostSpecificCause();
        String rootMessage = mostSpecificCause != null ? mostSpecificCause.getMessage() : null;

        String message = ErrorCode.DATA_INTEGRITY_VIOLATION.getMessage();
        if (rootMessage != null && rootMessage.contains("Data truncated for column 'status'")) {
            message = "Cấu trúc cơ sở dữ liệu chưa khớp với cột trạng thái.";
        }

        return ResponseEntity.status(ErrorCode.DATA_INTEGRITY_VIOLATION.getStatusCode())
                .body(ApiResponse.<Void>builder()
                        .code(ErrorCode.DATA_INTEGRITY_VIOLATION.getCode())
                        .message(message)
                        .build());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleException(Exception ex) {
        log.error("Unhandled exception occurred", ex);
        return systemErrorResponse();
    }

    private ResponseEntity<ApiResponse<Void>> systemErrorResponse() {
        return ResponseEntity.internalServerError()
            .body(ApiResponse.<Void>builder()
                .code(ErrorCode.UNCATEGORIZED_EXCEPTION.getCode())
                .message(SYSTEM_ERROR_MESSAGE)
                .build());
    }
}
