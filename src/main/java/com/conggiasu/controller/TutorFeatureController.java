package com.conggiasu.controller;

import com.conggiasu.dto.request.EnrollmentStatusUpdateRequest;
import com.conggiasu.dto.request.TutorApplyRequest;
import com.conggiasu.dto.request.TutorClassStatusUpdateRequest;
import com.conggiasu.dto.request.TutorCourseRequest;
import com.conggiasu.dto.request.TutorCourseStatusUpdateRequest;
import com.conggiasu.dto.response.ApiResponse;
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
import com.conggiasu.service.CurrentUserService;
import com.conggiasu.service.TutorFeatureService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/tutor")
@RequiredArgsConstructor
@Slf4j
public class TutorFeatureController {
    private final TutorFeatureService tutorFeatureService;
    private final CurrentUserService currentUserService;

    @GetMapping("/posts/available")
    public ApiResponse<PageResponse<AvailablePostResponse>> getAvailablePosts(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long subjectId,
            @RequestParam(required = false) Long gradeId,
            @RequestParam(required = false) TeachingMode teachingMode,
            @RequestParam(required = false) String province,
            @RequestParam(required = false) String district,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ApiResponse.<PageResponse<AvailablePostResponse>>builder()
            .code(200)
            .message("Success")
            .result(tutorFeatureService.getAvailablePosts(keyword, subjectId, gradeId, teachingMode, province, district, page, size))
            .build();
    }

    @PostMapping("/posts/{postId}/apply")
    public ApiResponse<TutorApplicationResponse> applyToPost(@PathVariable Long postId, @RequestBody TutorApplyRequest request) {
        return ApiResponse.<TutorApplicationResponse>builder()
            .code(200)
            .message("Success")
            .result(tutorFeatureService.applyToPostByUser(postId, currentUserService.userId(), request))
            .build();
    }

    @PatchMapping("/applications/{applicationId}/cancel")
    public ApiResponse<TutorApplicationResponse> cancelApplication(@PathVariable Long applicationId) {
        return ApiResponse.<TutorApplicationResponse>builder()
            .code(200)
            .message("Success")
            .result(tutorFeatureService.cancelApplicationByUser(currentUserService.userId(), applicationId))
            .build();
    }

    @GetMapping("/applications")
    public ApiResponse<List<TutorApplicationResponse>> getApplications(@RequestParam(required = false) ApplicationStatus status) {
        return ApiResponse.<List<TutorApplicationResponse>>builder()
            .code(200)
            .message("Success")
            .result(tutorFeatureService.getApplicationsByUser(currentUserService.userId(), status))
            .build();
    }

    @GetMapping("/matched-classes")
    public ApiResponse<List<TutorMatchedClassResponse>> getMatchedClasses() {
        return ApiResponse.<List<TutorMatchedClassResponse>>builder()
            .code(200)
            .message("Success")
            .result(tutorFeatureService.getMatchedClassesByUser(currentUserService.userId()))
            .build();
    }

    @PatchMapping("/matched-classes/{classId}/status")
    public ApiResponse<TutorMatchedClassResponse> updateMatchedClassStatus(
            @PathVariable Long classId,
            @Valid @RequestBody TutorClassStatusUpdateRequest request
    ) {
        return ApiResponse.<TutorMatchedClassResponse>builder()
            .code(200)
            .message("Success")
            .result(tutorFeatureService.updateMatchedClassStatusByUser(currentUserService.userId(), classId, request))
            .build();
    }

    @PostMapping("/courses")
    public ApiResponse<TutorCourseResponse> createCourse(@Valid @RequestBody TutorCourseRequest request) {
        return ApiResponse.<TutorCourseResponse>builder()
            .code(200)
            .message("Success")
            .result(tutorFeatureService.createCourseByUser(currentUserService.userId(), request))
            .build();
    }

    @PutMapping("/courses/{courseId}")
    public ApiResponse<TutorCourseResponse> updateCourse(@PathVariable Long courseId, @Valid @RequestBody TutorCourseRequest request) {
        return ApiResponse.<TutorCourseResponse>builder()
            .code(200)
            .message("Success")
            .result(tutorFeatureService.updateCourseByUser(currentUserService.userId(), courseId, request))
            .build();
    }

    @PatchMapping("/courses/{courseId}/status")
    public ApiResponse<TutorCourseResponse> updateCourseStatus(
            @PathVariable Long courseId,
            @Valid @RequestBody TutorCourseStatusUpdateRequest request
    ) {
        return ApiResponse.<TutorCourseResponse>builder()
            .code(200)
            .message("Success")
            .result(tutorFeatureService.updateCourseStatusByUser(currentUserService.userId(), courseId, request))
            .build();
    }

    @GetMapping("/courses")
    public ApiResponse<List<TutorCourseResponse>> getCourses(@RequestParam(required = false) CourseStatus status) {
        return ApiResponse.<List<TutorCourseResponse>>builder()
            .code(200)
            .message("Success")
            .result(tutorFeatureService.getTutorCoursesByUser(currentUserService.userId(), status))
            .build();
    }

    @GetMapping("/courses/{courseId}/enrollments")
    public ApiResponse<List<CourseEnrollmentResponse>> getEnrollments(@PathVariable Long courseId) {
        return ApiResponse.<List<CourseEnrollmentResponse>>builder()
            .code(200)
            .message("Success")
            .result(tutorFeatureService.getCourseEnrollmentsByUser(currentUserService.userId(), courseId))
            .build();
    }

    @PatchMapping("/enrollments/{enrollmentId}/status")
    public ApiResponse<CourseEnrollmentResponse> updateEnrollmentStatus(
            @PathVariable Long enrollmentId,
            @Valid @RequestBody EnrollmentStatusUpdateRequest request
    ) {
        return ApiResponse.<CourseEnrollmentResponse>builder()
            .code(200)
            .message("Success")
            .result(tutorFeatureService.updateEnrollmentStatusByUser(currentUserService.userId(), enrollmentId, request))
            .build();
    }

    @GetMapping("/reviews")
    public ApiResponse<List<TutorReviewResponse>> getReviews() {
        return ApiResponse.<List<TutorReviewResponse>>builder()
            .code(200)
            .message("Success")
            .result(tutorFeatureService.getReviewsByUser(currentUserService.userId()))
            .build();
    }
}
