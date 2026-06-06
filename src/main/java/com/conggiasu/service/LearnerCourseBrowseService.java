package com.conggiasu.service;

import com.conggiasu.dto.response.PageResponse;
import com.conggiasu.dto.response.TutorCourseResponse;
import com.conggiasu.entity.TutorCourse;
import com.conggiasu.entity.enums.ApprovalStatus;
import com.conggiasu.entity.enums.CourseStatus;
import com.conggiasu.entity.enums.TeachingMode;
import com.conggiasu.exception.AppException;
import com.conggiasu.repository.TutorCourseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class LearnerCourseBrowseService {
    private final TutorCourseRepository tutorCourseRepository;
    private final LearnerResponseMapper mapper;

    @Transactional(readOnly = true)
    public PageResponse<TutorCourseResponse> availableCourses(
        Long subjectId,
        Long gradeId,
        TeachingMode teachingMode,
        String province,
        String district,
        int page,
        int size
    ) {
        Page<TutorCourse> courses = tutorCourseRepository.findAvailableCourses(
            ApprovalStatus.APPROVED,
            CourseStatus.OPEN,
            subjectId,
            gradeId,
            teachingMode,
            teachingMode == TeachingMode.ONLINE || teachingMode == TeachingMode.OFFLINE,
            TeachingMode.BOTH,
            normalizeFilter(province),
            normalizeFilter(district),
            PaginationSupport.pageRequest(page, size)
        );
        return PaginationSupport.toPageResponse(
            courses,
            courses.getContent().stream().map(mapper::toTutorCourse).toList()
        );
    }

    @Transactional(readOnly = true)
    public TutorCourseResponse availableCourseDetail(Long courseId) {
        TutorCourse course = tutorCourseRepository.findById(courseId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy khóa học"));
        if (course.getApprovalStatus() != ApprovalStatus.APPROVED || course.getStatus() != CourseStatus.OPEN) {
            throw new AppException(HttpStatus.NOT_FOUND, "Khóa học không khả dụng");
        }
        return mapper.toTutorCourse(course);
    }

    @Transactional(readOnly = true)
    public PageResponse<TutorCourseResponse> availableCoursesByTutorId(Long tutorId, int page, int size) {
        var courses = tutorCourseRepository.findByTutorIdAndApprovalStatusAndStatusOrderByCreatedAtDesc(
            tutorId,
            ApprovalStatus.APPROVED,
            CourseStatus.OPEN,
            PaginationSupport.pageRequest(page, size)
        );
        return PaginationSupport.toPageResponse(
            courses,
            courses.getContent().stream().map(mapper::toTutorCourse).toList()
        );
    }

    private String normalizeFilter(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim().toLowerCase();
    }
}
