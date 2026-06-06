package com.conggiasu.service;

import com.conggiasu.dto.request.TutorClassStatusUpdateRequest;
import com.conggiasu.dto.response.PageResponse;
import com.conggiasu.dto.response.TutorMatchedClassResponse;
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
public class TutorMatchedClassService {
    private final TutorAccessService tutorAccessService;
    private final MatchedClassRepository matchedClassRepository;
    private final MatchedClassStatusWorkflow statusWorkflow;
    private final TutorFeatureMapper mapper;

    @Transactional(readOnly = true)
    public PageResponse<TutorMatchedClassResponse> getMatchedClassesByUser(Long tutorUserId, int page, int size) {
        Long tutorId = tutorAccessService.findTutorIdByUserId(tutorUserId);
        var classes = matchedClassRepository.findByApplicationTutorIdOrderByCreatedAtDesc(
            tutorId,
            PaginationSupport.pageRequest(page, size)
        );
        return PaginationSupport.toPageResponse(
            classes,
            classes.getContent().stream().map(mapper::toMatchedClassResponse).toList()
        );
    }

    @Transactional
    public TutorMatchedClassResponse updateMatchedClassStatusByUser(
        Long tutorUserId,
        Long classId,
        TutorClassStatusUpdateRequest request
    ) {
        Long tutorId = tutorAccessService.findTutorIdByUserId(tutorUserId);
        MatchedClass matchedClass = matchedClassRepository.findByIdAndApplicationTutorId(classId, tutorId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy lớp"));

        statusWorkflow.apply(
            matchedClass,
            request.getStatus(),
            tutorUserId,
            UserRole.TUTOR,
            request.getStatusRequestReason()
        );
        return mapper.toMatchedClassResponse(matchedClassRepository.save(matchedClass));
    }
}
