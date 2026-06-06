package com.conggiasu.service;

import com.conggiasu.dto.response.PageResponse;
import com.conggiasu.dto.response.TutorReviewResponse;
import com.conggiasu.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TutorReviewQueryService {
    private final TutorAccessService tutorAccessService;
    private final ReviewRepository reviewRepository;
    private final TutorFeatureMapper mapper;

    @Transactional(readOnly = true)
    public PageResponse<TutorReviewResponse> getReviewsByUser(Long tutorUserId, int page, int size) {
        Long tutorId = tutorAccessService.findTutorIdByUserId(tutorUserId);
        var reviews = reviewRepository.findByTutorIdOrderByCreatedAtDesc(
            tutorId,
            PaginationSupport.pageRequest(page, size)
        );
        return PaginationSupport.toPageResponse(
            reviews,
            reviews.getContent().stream().map(mapper::toTutorReviewResponse).toList()
        );
    }

    @Transactional(readOnly = true)
    public PageResponse<TutorReviewResponse> getReviewsByTutorId(Long tutorId, int page, int size) {
        tutorAccessService.findTutor(tutorId);
        var reviews = reviewRepository.findByTutorIdOrderByCreatedAtDesc(
            tutorId,
            PaginationSupport.pageRequest(page, size)
        );
        return PaginationSupport.toPageResponse(
            reviews,
            reviews.getContent().stream().map(mapper::toTutorReviewResponse).toList()
        );
    }
}
