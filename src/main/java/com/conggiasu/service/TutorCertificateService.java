package com.conggiasu.service;

import com.conggiasu.dto.request.TutorCertificateUpsertRequest;
import com.conggiasu.dto.response.AdminTutorCertificateResponse;
import com.conggiasu.dto.response.TutorCertificateResponse;
import com.conggiasu.entity.Tutor;
import com.conggiasu.entity.TutorCertificate;
import com.conggiasu.entity.User;
import com.conggiasu.entity.enums.ApprovalStatus;
import com.conggiasu.entity.enums.UserRole;
import com.conggiasu.exception.AppException;
import com.conggiasu.repository.TutorCertificateRepository;
import com.conggiasu.repository.TutorRepository;
import com.conggiasu.repository.UserRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class TutorCertificateService {
    private static final java.util.Set<String> CERTIFICATE_IMAGE_DIRS = java.util.Set.of("identity", "certificates");
    private final TutorRepository tutorRepository;
    private final TutorCertificateRepository tutorCertificateRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;

    @Transactional(readOnly = true)
    public List<TutorCertificateResponse> getMyCertificates(Long tutorUserId) {
        Long tutorId = findTutorIdByUserId(tutorUserId);
        return tutorCertificateRepository.findByTutorId(tutorId).stream()
            .map(this::toResponse)
            .toList();
    }

    @Transactional
    public TutorCertificateResponse createMyCertificate(Long tutorUserId, TutorCertificateUpsertRequest request) {
        Tutor tutor = findTutorByUserId(tutorUserId);
        TutorCertificate certificate = new TutorCertificate();
        certificate.setTutor(tutor);
        applyRequest(certificate, request);
        certificate = tutorCertificateRepository.save(certificate);
        return toResponse(certificate);
    }

    @Transactional
    public TutorCertificateResponse updateMyCertificate(Long tutorUserId, Long certificateId, TutorCertificateUpsertRequest request) {
        Long tutorId = findTutorIdByUserId(tutorUserId);
        TutorCertificate certificate = tutorCertificateRepository.findByIdAndTutorId(certificateId, tutorId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Khong tim thay bang cap"));
        applyRequest(certificate, request);
        certificate = tutorCertificateRepository.save(certificate);
        return toResponse(certificate);
    }

    @Transactional
    public void deleteMyCertificate(Long tutorUserId, Long certificateId) {
        Long tutorId = findTutorIdByUserId(tutorUserId);
        TutorCertificate certificate = tutorCertificateRepository.findByIdAndTutorId(certificateId, tutorId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Khong tim thay bang cap"));
        tutorCertificateRepository.delete(certificate);
    }

    @Transactional(readOnly = true)
    public List<AdminTutorCertificateResponse> getTutorCertificatesForAdmin(Long adminUserId, Long tutorId) {
        validateAdmin(adminUserId);
        findTutorById(tutorId);
        return tutorCertificateRepository.findByTutorId(tutorId).stream()
            .map(this::toAdminResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public FileStorageService.StoredImage loadCertificateImageForAdmin(Long adminUserId, Long certificateId) {
        validateAdmin(adminUserId);
        TutorCertificate certificate = tutorCertificateRepository.findById(certificateId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Khong tim thay bang cap"));
        String imagePath = trimToNull(certificate.getCertificateImageUrl());
        if (imagePath == null) {
            throw new AppException(HttpStatus.NOT_FOUND, "Bang cap khong co anh");
        }
        return fileStorageService.loadImageByManagedUrl(imagePath, CERTIFICATE_IMAGE_DIRS);
    }

    private void applyRequest(TutorCertificate certificate, TutorCertificateUpsertRequest request) {
        certificate.setTitle(trimOrThrow(request.getTitle(), "Tieu de bang cap khong duoc de trong"));
        certificate.setCertificateType(trimToNull(request.getCertificateType()));
        certificate.setIssuer(trimToNull(request.getIssuer()));
        certificate.setIssuedDate(request.getIssuedDate());
        certificate.setCertificateImageUrl(trimToNull(request.getCertificateImageUrl()));
        certificate.setStatus(ApprovalStatus.PENDING);
        certificate.setReviewedBy(null);
        certificate.setReviewedAt(null);
        certificate.setRejectedReason(null);
    }

    private Tutor findTutorByUserId(Long userId) {
        return tutorRepository.findByUserId(userId)
            .orElseThrow(() -> new AppException(HttpStatus.BAD_REQUEST, "Tai khoan chua co ho so gia su"));
    }

    private Tutor findTutorById(Long tutorId) {
        return tutorRepository.findById(tutorId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Khong tim thay ho so gia su"));
    }

    private Long findTutorIdByUserId(Long userId) {
        return findTutorByUserId(userId).getId();
    }

    private User validateAdmin(Long adminUserId) {
        User admin = userRepository.findById(adminUserId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Khong tim thay admin"));
        if (admin.getRole() != UserRole.ADMIN) {
            throw new AppException(HttpStatus.FORBIDDEN, "User khong phai admin");
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

    private String trimOrThrow(String value, String message) {
        String trimmed = trimToNull(value);
        if (trimmed == null) {
            throw new AppException(HttpStatus.BAD_REQUEST, message);
        }
        return trimmed;
    }

    private TutorCertificateResponse toResponse(TutorCertificate certificate) {
        return TutorCertificateResponse.builder()
            .id(certificate.getId())
            .tutorId(certificate.getTutor().getId())
            .title(certificate.getTitle())
            .certificateType(certificate.getCertificateType())
            .issuer(certificate.getIssuer())
            .issuedDate(certificate.getIssuedDate())
            .status(certificate.getStatus())
            .reviewedBy(certificate.getReviewedBy() != null ? certificate.getReviewedBy().getId() : null)
            .reviewedAt(certificate.getReviewedAt())
            .rejectedReason(certificate.getRejectedReason())
            .createdAt(certificate.getCreatedAt())
            .updatedAt(certificate.getUpdatedAt())
            .build();
    }

    private AdminTutorCertificateResponse toAdminResponse(TutorCertificate certificate) {
        return AdminTutorCertificateResponse.builder()
            .id(certificate.getId())
            .tutorId(certificate.getTutor().getId())
            .tutorName(certificate.getTutor().getUser() != null ? certificate.getTutor().getUser().getFullName() : null)
            .title(certificate.getTitle())
            .certificateType(certificate.getCertificateType())
            .issuer(certificate.getIssuer())
            .issuedDate(certificate.getIssuedDate())
            .certificateImageUrl(certificate.getCertificateImageUrl())
            .status(certificate.getStatus())
            .reviewedBy(certificate.getReviewedBy() != null ? certificate.getReviewedBy().getId() : null)
            .reviewedAt(certificate.getReviewedAt())
            .rejectedReason(certificate.getRejectedReason())
            .createdAt(certificate.getCreatedAt())
            .updatedAt(certificate.getUpdatedAt())
            .build();
    }
}
