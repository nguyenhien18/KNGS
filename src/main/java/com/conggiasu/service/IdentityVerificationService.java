package com.conggiasu.service;

import com.conggiasu.dto.request.AdminReviewRequest;
import com.conggiasu.dto.request.IdentityVerificationUpsertRequest;
import com.conggiasu.dto.response.IdentityVerificationResponse;
import com.conggiasu.dto.response.PageResponse;
import com.conggiasu.entity.IdentityVerification;
import com.conggiasu.entity.User;
import com.conggiasu.entity.enums.IdentityVerificationStatus;
import com.conggiasu.entity.enums.UserRole;
import com.conggiasu.exception.AppException;
import com.conggiasu.repository.IdentityVerificationRepository;
import com.conggiasu.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class IdentityVerificationService {
    private final IdentityVerificationRepository identityVerificationRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public IdentityVerificationResponse getMyVerification(Long userId) {
        IdentityVerification iv = identityVerificationRepository.findByUserId(userId).orElseGet(() -> {
            IdentityVerification empty = new IdentityVerification();
            User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng"));
            empty.setUser(user);
            empty.setStatus(IdentityVerificationStatus.NOT_SUBMITTED);
            return empty;
        });
        return toResponse(iv);
    }

    @Transactional
    public IdentityVerificationResponse upsertMyVerification(Long userId, IdentityVerificationUpsertRequest request) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng"));
        IdentityVerification iv = identityVerificationRepository.findByUserId(userId).orElseGet(() -> {
            IdentityVerification created = new IdentityVerification();
            created.setUser(user);
            created.setStatus(IdentityVerificationStatus.NOT_SUBMITTED);
            return created;
        });

        iv.setFullNameOnId(trimToNull(request.getFullNameOnId()));
        iv.setIdNumber(trimToNull(request.getIdNumber()));
        iv.setDateOfBirthOnId(request.getDateOfBirthOnId());
        iv.setIssuedDate(request.getIssuedDate());
        iv.setIssuedPlace(trimToNull(request.getIssuedPlace()));
        iv.setAddressOnId(trimToNull(request.getAddressOnId()));
        iv.setIdFrontImageUrl(trimToNull(request.getIdFrontImageUrl()));
        iv.setIdBackImageUrl(trimToNull(request.getIdBackImageUrl()));
        iv.setSelfieImageUrl(trimToNull(request.getSelfieImageUrl()));

        boolean submit = request.getSubmit() == null || Boolean.TRUE.equals(request.getSubmit());
        if (submit) {
            validateReadyToSubmit(iv);
            iv.setStatus(IdentityVerificationStatus.PENDING);
            iv.setReviewedBy(null);
            iv.setReviewedAt(null);
            iv.setRejectedReason(null);
        } else if (iv.getStatus() == null) {
            iv.setStatus(IdentityVerificationStatus.NOT_SUBMITTED);
        }

        iv = identityVerificationRepository.save(iv);
        if (submit) {
            notificationService.pushToRole(
                UserRole.ADMIN,
                "Có yêu cầu xác minh danh tính",
                "Người dùng " + user.getFullName() + " vừa gửi yêu cầu xác minh danh tính.",
                "IDENTITY_VERIFICATION_PENDING",
                "IDENTITY_VERIFICATION",
                iv.getId()
            );
        }
        return toResponse(iv);
    }

    @Transactional(readOnly = true)
    public PageResponse<IdentityVerificationResponse> getPendingVerifications(Long adminUserId, int page, int size) {
        validateAdmin(adminUserId);
        var verificationPage = identityVerificationRepository.findByStatusOrderByCreatedAtDesc(
            IdentityVerificationStatus.PENDING,
            PaginationSupport.pageRequest(page, size)
        );
        return PaginationSupport.toPageResponse(
            verificationPage,
            verificationPage.getContent().stream().map(this::toResponse).toList()
        );
    }

    @Transactional(readOnly = true)
    public IdentityVerificationResponse getVerificationByUserIdForAdmin(Long adminUserId, Long userId) {
        validateAdmin(adminUserId);
        IdentityVerification iv = identityVerificationRepository.findByUserId(userId).orElseGet(() -> {
            IdentityVerification empty = new IdentityVerification();
            User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng"));
            empty.setUser(user);
            empty.setStatus(IdentityVerificationStatus.NOT_SUBMITTED);
            return empty;
        });
        return toResponse(iv);
    }

    @Transactional
    public IdentityVerificationResponse reviewVerification(Long adminUserId, Long verificationId, AdminReviewRequest request) {
        User admin = validateAdmin(adminUserId);
        IdentityVerification iv = identityVerificationRepository.findById(verificationId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy hồ sơ xác minh"));
        if (iv.getStatus() != IdentityVerificationStatus.PENDING) {
            throw new AppException(HttpStatus.CONFLICT, "Hồ sơ xác minh đã được xử lý trước đó");
        }

        boolean approved = Boolean.TRUE.equals(request.getApproved());
        if (!approved && (request.getRejectedReason() == null || request.getRejectedReason().isBlank())) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Vui lòng nhập lý do từ chối");
        }
        iv.setStatus(approved ? IdentityVerificationStatus.APPROVED : IdentityVerificationStatus.REJECTED);
        iv.setReviewedBy(admin);
        iv.setReviewedAt(LocalDateTime.now());
        iv.setRejectedReason(approved ? null : request.getRejectedReason().trim());
        iv = identityVerificationRepository.save(iv);

        notificationService.push(
            iv.getUser().getId(),
            approved ? "Xác minh danh tính đã được duyệt" : "Xác minh danh tính bị từ chối",
            approved
                ? "Hồ sơ xác minh danh tính của bạn đã được phê duyệt."
                : "Hồ sơ xác minh danh tính bị từ chối: " + iv.getRejectedReason(),
            "IDENTITY_VERIFICATION_REVIEW",
            "IDENTITY_VERIFICATION",
            iv.getId()
        );
        return toResponse(iv);
    }

    @Transactional(readOnly = true)
    public boolean isIdentityApproved(Long userId) {
        return identityVerificationRepository.findByUserId(userId)
            .map(iv -> iv.getStatus() == IdentityVerificationStatus.APPROVED)
            .orElse(false);
    }

    private void validateReadyToSubmit(IdentityVerification iv) {
        if (iv.getFullNameOnId() == null
            || iv.getIdNumber() == null
            || iv.getIdFrontImageUrl() == null
            || iv.getIdBackImageUrl() == null
            || iv.getSelfieImageUrl() == null) {
            throw new AppException(
                HttpStatus.BAD_REQUEST,
                "Cần nhập đủ thông tin xác minh (họ tên, số giấy tờ, ảnh mặt trước/sau, selfie)"
            );
        }
    }

    private User validateAdmin(Long adminUserId) {
        User admin = userRepository.findById(adminUserId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy quản trị viên"));
        if (admin.getRole() != UserRole.ADMIN) {
            throw new AppException(HttpStatus.FORBIDDEN, "Người dùng không phải quản trị viên");
        }
        return admin;
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private IdentityVerificationResponse toResponse(IdentityVerification iv) {
        return IdentityVerificationResponse.builder()
            .id(iv.getId())
            .userId(iv.getUser() != null ? iv.getUser().getId() : null)
            .userFullName(iv.getUser() != null ? iv.getUser().getFullName() : null)
            .status(iv.getStatus() == null ? IdentityVerificationStatus.NOT_SUBMITTED : iv.getStatus())
            .fullNameOnId(iv.getFullNameOnId())
            .idNumber(iv.getIdNumber())
            .dateOfBirthOnId(iv.getDateOfBirthOnId())
            .issuedDate(iv.getIssuedDate())
            .issuedPlace(iv.getIssuedPlace())
            .addressOnId(iv.getAddressOnId())
            .idFrontImageUrl(iv.getIdFrontImageUrl())
            .idBackImageUrl(iv.getIdBackImageUrl())
            .selfieImageUrl(iv.getSelfieImageUrl())
            .reviewedBy(iv.getReviewedBy() != null ? iv.getReviewedBy().getId() : null)
            .reviewedAt(iv.getReviewedAt())
            .rejectedReason(iv.getRejectedReason())
            .createdAt(iv.getCreatedAt())
            .updatedAt(iv.getUpdatedAt())
            .build();
    }
}
