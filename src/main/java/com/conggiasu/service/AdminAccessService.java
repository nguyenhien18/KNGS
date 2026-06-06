package com.conggiasu.service;

import com.conggiasu.entity.User;
import com.conggiasu.entity.enums.UserRole;
import com.conggiasu.exception.AppException;
import com.conggiasu.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminAccessService {
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public User validateAdmin(Long adminUserId) {
        User admin = userRepository.findById(adminUserId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy quản trị viên"));
        if (admin.getRole() != UserRole.ADMIN) {
            throw new AppException(HttpStatus.FORBIDDEN, "Người dùng không phải quản trị viên");
        }
        return admin;
    }
}
