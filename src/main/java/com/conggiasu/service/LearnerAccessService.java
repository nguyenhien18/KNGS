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
public class LearnerAccessService {
    private final UserRepository userRepository;
    private final IdentityVerificationService identityVerificationService;

    @Transactional(readOnly = true)
    public User validateLearner(Long learnerUserId) {
        User user = userRepository.findById(learnerUserId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng"));
        if (user.getRole() != UserRole.LEARNER) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Người dùng không phải học viên");
        }
        return user;
    }

    public void ensureLearnerIdentityApproved(Long learnerUserId) {
        if (!identityVerificationService.isIdentityApproved(learnerUserId)) {
            throw new AppException(HttpStatus.FORBIDDEN, "Học viên cần xác minh danh tính trước khi tạo bài đăng");
        }
    }
}
