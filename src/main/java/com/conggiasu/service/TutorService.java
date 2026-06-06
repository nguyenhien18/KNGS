package com.conggiasu.service;

import com.conggiasu.dto.request.TutorUpsertRequest;
import com.conggiasu.dto.response.PageResponse;
import com.conggiasu.dto.response.TutorSummaryResponse;
import com.conggiasu.entity.enums.TeachingMode;
import com.conggiasu.entity.enums.TutorProfileStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TutorService {
    private final TutorPublicQueryService tutorPublicQueryService;
    private final TutorProfileService tutorProfileService;

    public PageResponse<TutorSummaryResponse> searchTutors(
        String keyword,
        Long subjectId,
        Long gradeId,
        TeachingMode teachingMode,
        TutorProfileStatus profileStatus,
        int page,
        int size
    ) {
        return searchTutors(keyword, subjectId, gradeId, teachingMode, null, null, profileStatus, page, size);
    }

    public PageResponse<TutorSummaryResponse> searchTutors(
        String keyword,
        Long subjectId,
        Long gradeId,
        TeachingMode teachingMode,
        String province,
        String district,
        TutorProfileStatus profileStatus,
        int page,
        int size
    ) {
        return tutorPublicQueryService.searchTutors(
            keyword,
            subjectId,
            gradeId,
            teachingMode,
            province,
            district,
            profileStatus,
            page,
            size
        );
    }

    public TutorSummaryResponse getTutorById(Long tutorId) {
        return tutorPublicQueryService.getTutorById(tutorId);
    }

    public TutorSummaryResponse getTutorProfileByUserId(Long userId) {
        return tutorProfileService.getTutorProfileByUserId(userId);
    }

    public TutorSummaryResponse createTutorProfileForUserId(Long userId, TutorUpsertRequest request) {
        return tutorProfileService.createTutorProfileForUserId(userId, request);
    }

    public TutorSummaryResponse updateTutor(Long tutorId, TutorUpsertRequest request) {
        return tutorProfileService.updateTutor(tutorId, request);
    }

    public TutorSummaryResponse updateTutorByUserIdAndTutorId(Long userId, Long tutorId, TutorUpsertRequest request) {
        return tutorProfileService.updateTutorByUserIdAndTutorId(userId, tutorId, request);
    }

    public TutorSummaryResponse upsertTutorProfileByUserId(Long userId, TutorUpsertRequest request) {
        return tutorProfileService.upsertTutorProfileByUserId(userId, request);
    }
}
