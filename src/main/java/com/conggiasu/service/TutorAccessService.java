package com.conggiasu.service;

import com.conggiasu.entity.Tutor;
import com.conggiasu.entity.enums.TutorProfileStatus;
import com.conggiasu.entity.enums.UserStatus;
import com.conggiasu.exception.AppException;
import com.conggiasu.repository.TutorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TutorAccessService {
    private final TutorRepository tutorRepository;

    @Transactional(readOnly = true)
    public Long findTutorIdByUserId(Long userId) {
        return tutorRepository.findByUserId(userId)
            .orElseThrow(() -> new AppException(HttpStatus.BAD_REQUEST, "Tài khoản chưa có hồ sơ gia sư"))
            .getId();
    }

    @Transactional(readOnly = true)
    public Tutor findTutor(Long tutorId) {
        return tutorRepository.findById(tutorId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy gia sư"));
    }

    public void ensureTutorCanManageCourses(Tutor tutor) {
        if (tutor == null || tutor.getUser() == null) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Thông tin gia sư không hợp lệ");
        }
        if (tutor.getUser().getStatus() != UserStatus.ACTIVE) {
            throw new AppException(HttpStatus.FORBIDDEN, "Tài khoản gia sư đã bị khóa/không hoạt động");
        }
        if (tutor.getProfileStatus() != TutorProfileStatus.APPROVED) {
            throw new AppException(HttpStatus.FORBIDDEN, "Chỉ gia sư đã được duyệt mới có thể mở/sửa lớp");
        }
    }
}
