package com.conggiasu.service;

import com.conggiasu.config.AppUserPrincipal;
import com.conggiasu.entity.enums.UserRole;
import com.conggiasu.exception.AppException;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class CurrentUserService {
    public AppUserPrincipal principal() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof AppUserPrincipal principal)) {
            throw new AppException(HttpStatus.UNAUTHORIZED, "Chưa đăng nhập");
        }
        return principal;
    }

    public Long userId() {
        return principal().getId();
    }

    public UserRole role() {
        return principal().getRole();
    }

    public void requireRole(UserRole expected) {
        if (role() != expected) {
            throw new AppException(HttpStatus.FORBIDDEN, "Không đủ quyền");
        }
    }
}


