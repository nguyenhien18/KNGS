package com.conggiasu.service;

import com.conggiasu.exception.AppException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
public class AuthValueNormalizer {

    public String normalizeBlank(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    public String normalizeRequired(String value, String message) {
        String normalized = normalizeBlank(value);
        if (normalized == null) {
            throw new AppException(HttpStatus.BAD_REQUEST, message);
        }
        return normalized;
    }
}
