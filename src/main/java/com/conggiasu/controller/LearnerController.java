package com.conggiasu.controller;

import com.conggiasu.dto.request.ClassStatusUpdateRequest;
import com.conggiasu.dto.request.EnrollmentCreateRequest;
import com.conggiasu.dto.request.LearnerApplicationDecisionRequest;
import com.conggiasu.dto.request.PostUpsertRequest;
import com.conggiasu.dto.request.ReviewCreateRequest;
import com.conggiasu.dto.response.ApiResponse;
import com.conggiasu.dto.response.CourseEnrollmentResponse;
import com.conggiasu.dto.response.LearnerClassResponse;
import com.conggiasu.dto.response.LearnerPostResponse;
import com.conggiasu.dto.response.PageResponse;
import com.conggiasu.dto.response.TutorApplicationResponse;
import com.conggiasu.dto.response.TutorCourseResponse;
import com.conggiasu.entity.enums.ApprovalStatus;
import com.conggiasu.entity.enums.TeachingMode;
import com.conggiasu.service.CurrentUserService;
import com.conggiasu.service.LearnerService;
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

@RestController
@RequestMapping("/api/learner")
@RequiredArgsConstructor
@Slf4j
public class LearnerController {
    private final LearnerService learnerService;
    private final CurrentUserService currentUserService;

    @PostMapping("/posts")
    public ApiResponse<LearnerPostResponse> createPost(@Valid @RequestBody PostUpsertRequest request) {
        request.setLearnerUserId(currentUserService.userId());
        return ApiResponse.<LearnerPostResponse>builder()
            .code(200)
            .message("Thành công")
            .result(learnerService.createPost(request))
            .build();
    }

    @PutMapping("/posts/{postId}")
    public ApiResponse<LearnerPostResponse> updatePost(@PathVariable Long postId, @Valid @RequestBody PostUpsertRequest request) {
        request.setLearnerUserId(currentUserService.userId());
        return ApiResponse.<LearnerPostResponse>builder()
            .code(200)
            .message("Thành công")
            .result(learnerService.updatePost(postId, request))
            .build();
    }

    @PatchMapping("/posts/{postId}/cancel")
    public ApiResponse<LearnerPostResponse> cancelPost(@PathVariable Long postId) {
        return ApiResponse.<LearnerPostResponse>builder()
            .code(200)
            .message("Thành công")
            .result(learnerService.cancelPost(currentUserService.userId(), postId))
            .build();
    }

    @GetMapping("/posts")
    public ApiResponse<PageResponse<LearnerPostResponse>> getPosts(
        @RequestParam(required = false) ApprovalStatus approvalStatus,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return ApiResponse.<PageResponse<LearnerPostResponse>>builder()
            .code(200)
            .message("Thành công")
            .result(learnerService.getPosts(currentUserService.userId(), approvalStatus, page, size))
            .build();
    }

    @GetMapping("/posts/{postId}/applications")
    public ApiResponse<PageResponse<TutorApplicationResponse>> getPostApplications(
        @PathVariable Long postId,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return ApiResponse.<PageResponse<TutorApplicationResponse>>builder()
            .code(200)
            .message("Thành công")
            .result(learnerService.getPostApplications(currentUserService.userId(), postId, page, size))
            .build();
    }

    @PatchMapping("/applications/{applicationId}/decision")
    public ApiResponse<TutorApplicationResponse> decideApplication(
            @PathVariable Long applicationId,
            @Valid @RequestBody LearnerApplicationDecisionRequest request
    ) {
        request.setLearnerUserId(currentUserService.userId());
        return ApiResponse.<TutorApplicationResponse>builder()
            .code(200)
            .message("Thành công")
            .result(learnerService.decideApplication(applicationId, request))
            .build();
    }

    @GetMapping("/classes")
    public ApiResponse<PageResponse<LearnerClassResponse>> getClasses(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return ApiResponse.<PageResponse<LearnerClassResponse>>builder()
            .code(200)
            .message("Thành công")
            .result(learnerService.getClasses(currentUserService.userId(), page, size))
            .build();
    }

    @PatchMapping("/classes/{classId}/status")
    public ApiResponse<LearnerClassResponse> updateClassStatus(@PathVariable Long classId, @Valid @RequestBody ClassStatusUpdateRequest request) {
        request.setLearnerUserId(currentUserService.userId());
        return ApiResponse.<LearnerClassResponse>builder()
            .code(200)
            .message("Thành công")
            .result(learnerService.updateClassStatus(classId, request))
            .build();
    }

    @GetMapping("/courses/available")
    public ApiResponse<PageResponse<TutorCourseResponse>> getAvailableCourses(
            @RequestParam(required = false) Long subjectId,
            @RequestParam(required = false) Long gradeId,
            @RequestParam(required = false) TeachingMode teachingMode,
            @RequestParam(required = false) String province,
            @RequestParam(required = false) String district,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ApiResponse.<PageResponse<TutorCourseResponse>>builder()
            .code(200)
            .message("Thành công")
            .result(learnerService.availableCourses(subjectId, gradeId, teachingMode, province, district, page, size))
            .build();
    }

    @PostMapping("/courses/{courseId}/enroll")
    public ApiResponse<CourseEnrollmentResponse> enrollCourse(@PathVariable Long courseId, @Valid @RequestBody EnrollmentCreateRequest request) {
        request.setLearnerUserId(currentUserService.userId());
        return ApiResponse.<CourseEnrollmentResponse>builder()
            .code(200)
            .message("Thành công")
            .result(learnerService.enrollCourse(courseId, request))
            .build();
    }

    @PatchMapping("/enrollments/{enrollmentId}/cancel")
    public ApiResponse<CourseEnrollmentResponse> cancelEnrollment(@PathVariable Long enrollmentId) {
        return ApiResponse.<CourseEnrollmentResponse>builder()
            .code(200)
            .message("Thành công")
            .result(learnerService.cancelEnrollment(enrollmentId, currentUserService.userId()))
            .build();
    }

    @GetMapping("/enrollments")
    public ApiResponse<PageResponse<CourseEnrollmentResponse>> getMyEnrollments(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return ApiResponse.<PageResponse<CourseEnrollmentResponse>>builder()
            .code(200)
            .message("Thành công")
            .result(learnerService.myEnrollments(currentUserService.userId(), page, size))
            .build();
    }

    @PostMapping("/reviews")
    public ApiResponse<Void> createReview(@Valid @RequestBody ReviewCreateRequest request) {
        request.setLearnerUserId(currentUserService.userId());
        learnerService.createReview(request);
        return ApiResponse.<Void>builder()
            .code(200)
            .message("Thành công")
            .build();
    }
}
