package com.conggiasu.service;

import com.conggiasu.dto.request.EnrollmentStatusUpdateRequest;
import com.conggiasu.dto.request.TutorApplyRequest;
import com.conggiasu.dto.request.TutorClassStatusUpdateRequest;
import com.conggiasu.dto.request.TutorCourseRequest;
import com.conggiasu.dto.request.TutorCourseStatusUpdateRequest;
import com.conggiasu.dto.response.AvailablePostResponse;
import com.conggiasu.dto.response.CourseEnrollmentResponse;
import com.conggiasu.dto.response.PageResponse;
import com.conggiasu.dto.response.TutorApplicationResponse;
import com.conggiasu.dto.response.TutorCourseResponse;
import com.conggiasu.dto.response.TutorMatchedClassResponse;
import com.conggiasu.dto.response.TutorReviewResponse;
import com.conggiasu.entity.enums.ApplicationStatus;
import com.conggiasu.entity.enums.CourseStatus;
import com.conggiasu.entity.enums.TeachingMode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TutorFeatureService {
    private final TutorAccessService tutorAccessService;
    private final TutorPostApplicationService tutorPostApplicationService;
    private final TutorCourseManagementService tutorCourseManagementService;
    private final TutorCourseEnrollmentService tutorCourseEnrollmentService;
    private final TutorMatchedClassService tutorMatchedClassService;
    private final TutorReviewQueryService tutorReviewQueryService;

    public Long findTutorIdByUserId(Long userId) {
        return tutorAccessService.findTutorIdByUserId(userId);
    }

    public PageResponse<AvailablePostResponse> getAvailablePosts(
        String keyword,
        Long subjectId,
        Long gradeId,
        TeachingMode teachingMode,
        String province,
        String district,
        int page,
        int size
    ) {
        return tutorPostApplicationService.getAvailablePosts(
            keyword, subjectId, gradeId, teachingMode, province, district, page, size
        );
    }

    public AvailablePostResponse getAvailablePostDetail(Long postId) {
        return tutorPostApplicationService.getAvailablePostDetail(postId);
    }

    public TutorApplicationResponse applyToPost(Long postId, TutorApplyRequest request) {
        return tutorPostApplicationService.applyToPost(postId, request);
    }

    public TutorApplicationResponse applyToPostByUser(Long postId, Long tutorUserId, TutorApplyRequest request) {
        return tutorPostApplicationService.applyToPostByUser(postId, tutorUserId, request);
    }

    public TutorApplicationResponse cancelApplication(Long tutorId, Long applicationId) {
        return tutorPostApplicationService.cancelApplication(tutorId, applicationId);
    }

    public TutorApplicationResponse cancelApplicationByUser(Long tutorUserId, Long applicationId) {
        return tutorPostApplicationService.cancelApplicationByUser(tutorUserId, applicationId);
    }

    public PageResponse<TutorApplicationResponse> getApplications(
        Long tutorId, ApplicationStatus status, int page, int size
    ) {
        return tutorPostApplicationService.getApplications(tutorId, status, page, size);
    }

    public PageResponse<TutorApplicationResponse> getApplicationsByUser(
        Long tutorUserId, ApplicationStatus status, int page, int size
    ) {
        return tutorPostApplicationService.getApplicationsByUser(tutorUserId, status, page, size);
    }

    public TutorCourseResponse createCourse(TutorCourseRequest request) {
        return tutorCourseManagementService.createCourse(request);
    }

    public TutorCourseResponse createCourseByUser(Long tutorUserId, TutorCourseRequest request) {
        return tutorCourseManagementService.createCourseByUser(tutorUserId, request);
    }

    public TutorCourseResponse updateCourse(Long courseId, TutorCourseRequest request) {
        return tutorCourseManagementService.updateCourse(courseId, request);
    }

    public TutorCourseResponse updateCourseByUser(Long tutorUserId, Long courseId, TutorCourseRequest request) {
        return tutorCourseManagementService.updateCourseByUser(tutorUserId, courseId, request);
    }

    public TutorCourseResponse updateCourseStatusByUser(
        Long tutorUserId, Long courseId, TutorCourseStatusUpdateRequest request
    ) {
        return tutorCourseManagementService.updateCourseStatusByUser(tutorUserId, courseId, request);
    }

    public PageResponse<TutorCourseResponse> getTutorCourses(Long tutorId, CourseStatus status, int page, int size) {
        return tutorCourseManagementService.getTutorCourses(tutorId, status, page, size);
    }

    public PageResponse<TutorCourseResponse> getTutorCoursesByUser(
        Long tutorUserId, CourseStatus status, int page, int size
    ) {
        return tutorCourseManagementService.getTutorCoursesByUser(tutorUserId, status, page, size);
    }

    public PageResponse<CourseEnrollmentResponse> getCourseEnrollments(
        Long tutorId, Long courseId, int page, int size
    ) {
        return tutorCourseEnrollmentService.getCourseEnrollments(tutorId, courseId, page, size);
    }

    public PageResponse<CourseEnrollmentResponse> getCourseEnrollmentsByUser(
        Long tutorUserId, Long courseId, int page, int size
    ) {
        return tutorCourseEnrollmentService.getCourseEnrollmentsByUser(tutorUserId, courseId, page, size);
    }

    public CourseEnrollmentResponse updateEnrollmentStatus(Long enrollmentId, EnrollmentStatusUpdateRequest request) {
        return tutorCourseEnrollmentService.updateEnrollmentStatus(enrollmentId, request);
    }

    public CourseEnrollmentResponse updateEnrollmentStatusByUser(
        Long tutorUserId, Long enrollmentId, EnrollmentStatusUpdateRequest request
    ) {
        return tutorCourseEnrollmentService.updateEnrollmentStatusByUser(tutorUserId, enrollmentId, request);
    }

    public PageResponse<TutorMatchedClassResponse> getMatchedClassesByUser(Long tutorUserId, int page, int size) {
        return tutorMatchedClassService.getMatchedClassesByUser(tutorUserId, page, size);
    }

    public TutorMatchedClassResponse updateMatchedClassStatusByUser(
        Long tutorUserId,
        Long classId,
        TutorClassStatusUpdateRequest request
    ) {
        return tutorMatchedClassService.updateMatchedClassStatusByUser(tutorUserId, classId, request);
    }

    public PageResponse<TutorReviewResponse> getReviewsByUser(Long tutorUserId, int page, int size) {
        return tutorReviewQueryService.getReviewsByUser(tutorUserId, page, size);
    }

    public PageResponse<TutorReviewResponse> getReviewsByTutorId(Long tutorId, int page, int size) {
        return tutorReviewQueryService.getReviewsByTutorId(tutorId, page, size);
    }
}
