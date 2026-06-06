package com.conggiasu.service;

import com.conggiasu.dto.response.PageResponse;
import com.conggiasu.dto.response.TutorSummaryResponse;
import com.conggiasu.entity.Tutor;
import com.conggiasu.entity.enums.TeachingMode;
import com.conggiasu.entity.enums.TutorProfileStatus;
import com.conggiasu.entity.enums.UserStatus;
import com.conggiasu.exception.AppException;
import com.conggiasu.mapper.TutorSummaryMapper;
import com.conggiasu.repository.TutorRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TutorPublicQueryService {
    private final TutorRepository tutorRepository;
    private final TutorSearchSpecificationBuilder tutorSearchSpecificationBuilder;
    private final TutorSummaryMapper tutorSummaryMapper;

    @Transactional(readOnly = true)
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
        TutorProfileStatus resolvedProfileStatus = resolveSearchProfileStatus(profileStatus);
        var spec = tutorSearchSpecificationBuilder.build(
            keyword,
            subjectId,
            gradeId,
            teachingMode,
            province,
            district,
            resolvedProfileStatus
        );

        var tutorPage = tutorRepository.findAll(
            spec,
            PaginationSupport.pageRequest(page, size, Sort.by(Sort.Direction.DESC, "id"))
        );
        List<TutorSummaryResponse> items = tutorSummaryMapper.toPublicSummaries(tutorPage.getContent());
        return PaginationSupport.toPageResponse(tutorPage, items);
    }

    @Transactional(readOnly = true)
    public TutorSummaryResponse getTutorById(Long tutorId) {
        Tutor tutor = tutorRepository.findById(tutorId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy gia sư"));
        if (tutor.getProfileStatus() != TutorProfileStatus.APPROVED || tutor.getUser().getStatus() != UserStatus.ACTIVE) {
            throw new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy gia sư");
        }
        return tutorSummaryMapper.toPublicSummary(tutor);
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
            throw new AppException(HttpStatus.FORBIDDEN, "Chỉ admin mới được lọc theo profileStatus khác APPROVED");
        }

        return requestedStatus;
    }
}
