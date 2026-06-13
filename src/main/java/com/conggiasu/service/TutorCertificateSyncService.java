package com.conggiasu.service;

import com.conggiasu.dto.request.TutorCertificateUpsertRequest;
import com.conggiasu.entity.Tutor;
import com.conggiasu.entity.TutorCertificate;
import com.conggiasu.entity.enums.ApprovalStatus;
import com.conggiasu.exception.AppException;
import com.conggiasu.repository.TutorCertificateRepository;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TutorCertificateSyncService {
    private final TutorCertificateRepository tutorCertificateRepository;

    public void replaceTutorCertificates(Tutor tutor, List<TutorCertificateUpsertRequest> certificates) {
        if (tutor.getId() == null) {
            return;
        }

        List<TutorCertificate> existing = tutorCertificateRepository.findByTutorId(tutor.getId());
        Map<String, Deque<TutorCertificate>> existingByTitle = new HashMap<>();
        for (TutorCertificate item : existing) {
            String key = normalizeKey(item.getTitle());
            existingByTitle.computeIfAbsent(key, k -> new ArrayDeque<>()).add(item);
        }

        Set<Long> keptIds = new HashSet<>();
        List<TutorCertificate> toSave = new ArrayList<>();

        for (TutorCertificateUpsertRequest request : certificates) {
            String incomingTitle = normalizeRequired(request.getTitle(), "Tiêu đề bằng cấp không được để trống");
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
