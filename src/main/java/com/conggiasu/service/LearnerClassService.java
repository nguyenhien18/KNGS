package com.conggiasu.service;

import com.conggiasu.dto.request.ClassStatusUpdateRequest;
import com.conggiasu.dto.response.LearnerClassResponse;
import com.conggiasu.dto.response.PageResponse;
import com.conggiasu.entity.MatchedClass;
import com.conggiasu.entity.enums.UserRole;
import com.conggiasu.exception.AppException;
import com.conggiasu.repository.MatchedClassRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class LearnerClassService {
    private final LearnerAccessService learnerAccessService;
    private final MatchedClassRepository matchedClassRepository;
    private final MatchedClassStatusWorkflow statusWorkflow;
    private final LearnerResponseMapper mapper;

    @Transactional(readOnly = true)
    public PageResponse<LearnerClassResponse> getClasses(Long learnerUserId, int page, int size) {
        learnerAccessService.validateLearner(learnerUserId);
        var classes = matchedClassRepository.findByPostLearnerUserIdOrderByCreatedAtDesc(
            learnerUserId,
            PaginationSupport.pageRequest(page, size)
        );
        return PaginationSupport.toPageResponse(
            classes,
            classes.getContent().stream().map(mapper::toLearnerClass).toList()
        );
    }

    @Transactional
    public LearnerClassResponse updateClassStatus(Long classId, ClassStatusUpdateRequest request) {
        MatchedClass matchedClass = matchedClassRepository.findByIdAndPostLearnerUserId(classId, request.getLearnerUserId())
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy lớp"));
        statusWorkflow.apply(
            matchedClass,
            request.getStatus(),
            request.getLearnerUserId(),
            UserRole.LEARNER,
            request.getStatusRequestReason()
        );
        return mapper.toLearnerClass(matchedClassRepository.save(matchedClass));
    }
}
