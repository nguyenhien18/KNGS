package com.conggiasu.service;

import com.conggiasu.dto.request.TutorUpsertRequest;
import com.conggiasu.dto.response.TutorSummaryResponse;
import com.conggiasu.entity.Tutor;
import com.conggiasu.entity.User;
import com.conggiasu.entity.enums.TutorProfileStatus;
import com.conggiasu.entity.enums.UserRole;
import com.conggiasu.exception.AppException;
import com.conggiasu.mapper.TutorSummaryMapper;
import com.conggiasu.repository.TutorRepository;
import com.conggiasu.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TutorProfileService {
    private final TutorRepository tutorRepository;
    private final UserRepository userRepository;
    private final TutorProfileMutationService tutorProfileMutationService;
    private final TutorCertificateSyncService tutorCertificateSyncService;
    private final NotificationService notificationService;
    private final TutorSummaryMapper tutorSummaryMapper;

    @Transactional(readOnly = true)
    public TutorSummaryResponse getTutorProfileByUserId(Long userId) {
        Tutor tutor = tutorRepository.findByUserId(userId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Người dùng chưa có hồ sơ gia sư"));
        return tutorSummaryMapper.toSummary(tutor);
    }

    @Transactional
    public TutorSummaryResponse createTutorProfileForUserId(Long userId, TutorUpsertRequest request) {
        if (tutorRepository.findByUserId(userId).isPresent()) {
            throw new AppException(HttpStatus.CONFLICT, "Người dùng đã có hồ sơ gia sư");
        }
        validateCreateRequestHasCertificates(request);
        return upsertTutorProfileByUserId(userId, request);
    }

    @Transactional
    public TutorSummaryResponse updateTutor(Long tutorId, TutorUpsertRequest request) {
        Tutor tutor = tutorRepository.findById(tutorId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy gia sư"));
        User user = tutor.getUser();
        tutorProfileMutationService.validateUserConflicts(user, request);

        tutorProfileMutationService.applyUserProfile(user, request);
        userRepository.save(user);

        tutorProfileMutationService.applyTutorRequest(tutor, request);
        markProfileForReReview(tutor);
        tutor = tutorRepository.save(tutor);
        if (request.getCertificates() != null) {
            tutorCertificateSyncService.replaceTutorCertificates(tutor, request.getCertificates());
        }
        notifyAdminTutorPendingReview(tutor, true);
        return tutorSummaryMapper.toSummary(tutor);
    }

    @Transactional
    public TutorSummaryResponse updateTutorByUserIdAndTutorId(Long userId, Long tutorId, TutorUpsertRequest request) {
        Tutor tutor = tutorRepository.findByUserId(userId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Người dùng chưa có hồ sơ gia sư"));
        if (!tutor.getId().equals(tutorId)) {
            throw new AppException(HttpStatus.FORBIDDEN, "Không đủ quyền cập nhật hồ sơ này");
        }
        return updateTutor(tutorId, request);
    }

    @Transactional
    public TutorSummaryResponse upsertTutorProfileByUserId(Long userId, TutorUpsertRequest request) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng"));

        if (user.getRole() != UserRole.TUTOR) {
            throw new AppException(HttpStatus.FORBIDDEN, "Tài khoản không phải gia sư");
        }

        tutorProfileMutationService.validateUserConflicts(user, request);
        tutorProfileMutationService.applyUserProfile(user, request);
        user = userRepository.save(user);
        final User finalUser = user;

        boolean creating = tutorRepository.findByUserId(userId).isEmpty();
        Tutor tutor = tutorRepository.findByUserId(userId).orElseGet(() -> {
            Tutor t = new Tutor();
            t.setUser(finalUser);
            return t;
        });
        if (creating) {
            validateCreateRequestHasCertificates(request);
        }
        tutorProfileMutationService.applyTutorRequest(tutor, request);
        markProfileForReReview(tutor);
        tutor = tutorRepository.save(tutor);
        if (request.getCertificates() != null) {
            tutorCertificateSyncService.replaceTutorCertificates(tutor, request.getCertificates());
        }
        notifyAdminTutorPendingReview(tutor, true);
        return tutorSummaryMapper.toSummary(tutor);
    }

    private void notifyAdminTutorPendingReview(Tutor tutor, boolean updated) {
        if (tutor == null || tutor.getId() == null || tutor.getProfileStatus() != TutorProfileStatus.PENDING) {
            return;
        }
        String title = "Có hồ sơ gia sư cần duyệt";
        String content = updated
            ? "Gia sư " + tutor.getUser().getFullName() + " vừa cập nhật hồ sơ và đang chờ duyệt lại."
            : "Gia sư " + tutor.getUser().getFullName() + " vừa gửi hồ sơ chờ duyệt.";
        notificationService.pushToRole(
            UserRole.ADMIN,
            title,
            content,
            "TUTOR_PENDING_REVIEW",
            "TUTOR",
            tutor.getId()
        );
    }

    private void markProfileForReReview(Tutor tutor) {
        tutor.setProfileStatus(TutorProfileStatus.PENDING);
        tutor.setReviewedBy(null);
        tutor.setReviewedAt(null);
        tutor.setRejectedReason(null);
    }

    private void validateCreateRequestHasCertificates(TutorUpsertRequest request) {
        if (request.getCertificates() == null || request.getCertificates().isEmpty()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Tạo hồ sơ gia sư cần ít nhất 1 bằng cấp");
        }
    }
}
