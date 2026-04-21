package com.conggiasu.service;

import com.conggiasu.dto.request.TutorUpsertRequest;
import com.conggiasu.dto.request.TutorCertificateUpsertRequest;
import com.conggiasu.dto.response.PageResponse;
import com.conggiasu.dto.response.TutorSummaryResponse;
import com.conggiasu.entity.Tutor;
import com.conggiasu.entity.TutorCertificate;
import com.conggiasu.entity.User;
import com.conggiasu.entity.enums.ApprovalStatus;
import com.conggiasu.entity.enums.TeachingMode;
import com.conggiasu.entity.enums.TutorProfileStatus;
import com.conggiasu.entity.enums.UserRole;
import com.conggiasu.entity.enums.UserStatus;
import com.conggiasu.exception.AppException;
import com.conggiasu.mapper.TutorSummaryMapper;
import com.conggiasu.repository.TutorRepository;
import com.conggiasu.repository.TutorCertificateRepository;
import com.conggiasu.repository.UserRepository;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class TutorService {
    private final TutorRepository tutorRepository;
    private final TutorCertificateRepository tutorCertificateRepository;
    private final UserRepository userRepository;
    private final TutorSearchSpecificationBuilder tutorSearchSpecificationBuilder;
    private final TutorProfileMutationService tutorProfileMutationService;
    private final NotificationService notificationService;
    private final TutorSummaryMapper tutorSummaryMapper;

    @Transactional(readOnly = true)
    public PageResponse<TutorSummaryResponse> searchTutors(
        String keyword,
        Long subjectId,
        Long gradeId,
        TeachingMode teachingMode,
        TutorProfileStatus profileStatus,
        int page,
        int size
    ) {
        TutorProfileStatus resolvedProfileStatus = resolveSearchProfileStatus(profileStatus);
        var spec = tutorSearchSpecificationBuilder.build(
            keyword,
            subjectId,
            gradeId,
            teachingMode,
            resolvedProfileStatus
        );

        Page<Tutor> tutorPage = tutorRepository.findAll(
            spec,
            PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"))
        );

        List<TutorSummaryResponse> items = tutorPage.getContent().stream()
            .map(tutorSummaryMapper::toPublicSummary)
            .toList();

        return PageResponse.<TutorSummaryResponse>builder()
            .content(items)
            .page(tutorPage.getNumber())
            .size(tutorPage.getSize())
            .totalElements(tutorPage.getTotalElements())
            .totalPages(tutorPage.getTotalPages())
            .first(tutorPage.isFirst())
            .last(tutorPage.isLast())
            .build();
    }

    @Transactional(readOnly = true)
    public TutorSummaryResponse getTutorById(Long tutorId) {
        Tutor tutor = tutorRepository.findById(tutorId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Khong tim thay gia su"));
        if (tutor.getProfileStatus() != TutorProfileStatus.APPROVED || tutor.getUser().getStatus() != UserStatus.ACTIVE) {
            throw new AppException(HttpStatus.NOT_FOUND, "Khong tim thay gia su");
        }
        return tutorSummaryMapper.toPublicSummary(tutor);
    }

    @Transactional(readOnly = true)
    public TutorSummaryResponse getTutorProfileByUserId(Long userId) {
        Tutor tutor = tutorRepository.findByUserId(userId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Nguoi dung chua co ho so gia su"));
        return tutorSummaryMapper.toSummary(tutor);
    }

    @Transactional
    public TutorSummaryResponse createTutorProfileForUserId(Long userId, TutorUpsertRequest request) {
        if (tutorRepository.findByUserId(userId).isPresent()) {
            throw new AppException(HttpStatus.CONFLICT, "Nguoi dung da co ho so gia su");
        }
        validateCreateRequestHasCertificates(request);
        return upsertTutorProfileByUserId(userId, request);
    }

    @Transactional
    public TutorSummaryResponse updateTutor(Long tutorId, TutorUpsertRequest request) {
        Tutor tutor = tutorRepository.findById(tutorId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Khong tim thay gia su"));
        User user = tutor.getUser();
        tutorProfileMutationService.validateUserConflicts(user, request);

        tutorProfileMutationService.applyUserProfile(user, request);
        userRepository.save(user);

        tutorProfileMutationService.applyTutorRequest(tutor, request);
        markProfileForReReview(tutor);
        tutor = tutorRepository.save(tutor);
        if (request.getCertificates() != null) {
            replaceTutorCertificates(tutor, request.getCertificates());
        }
        notifyAdminTutorPendingReview(tutor, true);
        return tutorSummaryMapper.toSummary(tutor);
    }

    @Transactional
    public TutorSummaryResponse updateTutorByUserIdAndTutorId(Long userId, Long tutorId, TutorUpsertRequest request) {
        Tutor tutor = tutorRepository.findByUserId(userId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Nguoi dung chua co ho so gia su"));
        if (!tutor.getId().equals(tutorId)) {
            throw new AppException(HttpStatus.FORBIDDEN, "Khong du quyen cap nhat ho so nay");
        }
        return updateTutor(tutorId, request);
    }

    @Transactional
    public TutorSummaryResponse upsertTutorProfileByUserId(Long userId, TutorUpsertRequest request) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Khong tim thay user"));

        if (user.getRole() != UserRole.TUTOR) {
            throw new AppException(HttpStatus.FORBIDDEN, "Tai khoan khong phai gia su");
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
            replaceTutorCertificates(tutor, request.getCertificates());
        }
        notifyAdminTutorPendingReview(tutor, true);
        return tutorSummaryMapper.toSummary(tutor);
    }

    private TutorProfileStatus resolveSearchProfileStatus(TutorProfileStatus requestedStatus) {
        if (requestedStatus == null || requestedStatus == TutorProfileStatus.APPROVED) {
            return TutorProfileStatus.APPROVED;
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = authentication != null
            && authentication.isAuthenticated()
            && authentication.getAuthorities().stream().anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));

        if (!isAdmin) {
            throw new AppException(HttpStatus.FORBIDDEN, "Chi admin moi duoc loc theo profileStatus khac APPROVED");
        }

        return requestedStatus;
    }

    private void notifyAdminTutorPendingReview(Tutor tutor, boolean updated) {
        if (tutor == null || tutor.getId() == null || tutor.getProfileStatus() != TutorProfileStatus.PENDING) {
            return;
        }
        String title = "Co ho so gia su can duyet";
        String content = updated
            ? "Gia su " + tutor.getUser().getFullName() + " vua cap nhat ho so va dang cho duyet lai."
            : "Gia su " + tutor.getUser().getFullName() + " vua gui ho so cho duyet.";
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
            throw new AppException(HttpStatus.BAD_REQUEST, "Tao ho so gia su can it nhat 1 bang cap");
        }
    }

    private void replaceTutorCertificates(Tutor tutor, List<TutorCertificateUpsertRequest> certificates) {
        if (tutor.getId() == null) {
            return;
        }

        // Merge theo title để tránh mất metadata cũ khi frontend chỉ gửi title.
        List<TutorCertificate> existing = tutorCertificateRepository.findByTutorId(tutor.getId());
        Map<String, Deque<TutorCertificate>> existingByTitle = new HashMap<>();
        for (TutorCertificate item : existing) {
            String key = normalizeKey(item.getTitle());
            existingByTitle.computeIfAbsent(key, k -> new ArrayDeque<>()).add(item);
        }

        Set<Long> keptIds = new HashSet<>();
        List<TutorCertificate> toSave = new ArrayList<>();

        for (TutorCertificateUpsertRequest request : certificates) {
            String incomingTitle = normalizeRequired(request.getTitle(), "Tieu de bang cap khong duoc de trong");
            String key = normalizeKey(incomingTitle);
            TutorCertificate matched = null;
            Deque<TutorCertificate> bucket = existingByTitle.get(key);
            if (bucket != null && !bucket.isEmpty()) {
                matched = bucket.pollFirst();
            }

            if (matched == null) {
                matched = new TutorCertificate();
                matched.setTutor(tutor);
            } else if (matched.getId() != null) {
                keptIds.add(matched.getId());
            }

            matched.setTitle(incomingTitle);

            // Nếu request không truyền thì giữ dữ liệu cũ.
            String certificateType = normalizeOptional(request.getCertificateType());
            String issuer = normalizeOptional(request.getIssuer());
            String imageUrl = normalizeOptional(request.getCertificateImageUrl());
            matched.setCertificateType(certificateType != null ? certificateType : matched.getCertificateType());
            matched.setIssuer(issuer != null ? issuer : matched.getIssuer());
            matched.setIssuedDate(request.getIssuedDate() != null ? request.getIssuedDate() : matched.getIssuedDate());
            matched.setCertificateImageUrl(imageUrl != null ? imageUrl : matched.getCertificateImageUrl());
            matched.setStatus(ApprovalStatus.PENDING);
            matched.setReviewedBy(null);
            matched.setReviewedAt(null);
            matched.setRejectedReason(null);
            toSave.add(matched);
        }

        if (!toSave.isEmpty()) {
            tutorCertificateRepository.saveAll(toSave);
            for (TutorCertificate saved : toSave) {
                if (saved.getId() != null) {
                    keptIds.add(saved.getId());
                }
            }
        }

        List<TutorCertificate> toDelete = existing.stream()
            .filter(item -> item.getId() != null && !keptIds.contains(item.getId()))
            .toList();
        if (!toDelete.isEmpty()) {
            tutorCertificateRepository.deleteAll(toDelete);
        }
    }

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String normalizeRequired(String value, String message) {
        String normalized = normalizeOptional(value);
        if (normalized == null) {
            throw new AppException(HttpStatus.BAD_REQUEST, message);
        }
        return normalized;
    }

    private String normalizeKey(String value) {
        String normalized = normalizeOptional(value);
        return normalized == null ? "" : normalized.toLowerCase();
    }
}


