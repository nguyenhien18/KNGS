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
import com.conggiasu.dto.response.TutorApplicationResponse;
import com.conggiasu.dto.response.TutorCourseResponse;
import com.conggiasu.entity.enums.ApprovalStatus;
import com.conggiasu.entity.enums.TeachingMode;
import com.conggiasu.service.CurrentUserService;
import com.conggiasu.service.LearnerService;
import jakarta.validation.Valid;
import java.util.List;
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
            .message("Success")
            .result(learnerService.createPost(request))
            .build();
    }

    @PutMapping("/posts/{postId}")
    public ApiResponse<LearnerPostResponse> updatePost(@PathVariable Long postId, @Valid @RequestBody PostUpsertRequest request) {
        request.setLearnerUserId(currentUserService.userId());
        return ApiResponse.<LearnerPostResponse>builder()
            .code(200)
            .message("Success")
            .result(learnerService.updatePost(postId, request))
            .build();
    }

    @PatchMapping("/posts/{postId}/cancel")
    public ApiResponse<LearnerPostResponse> cancelPost(@PathVariable Long postId) {
        return ApiResponse.<LearnerPostResponse>builder()
            .code(200)
            .message("Success")
            .result(learnerService.cancelPost(currentUserService.userId(), postId))
            .build();
    }

    @GetMapping("/posts")
    public ApiResponse<List<LearnerPostResponse>> getPosts(@RequestParam(required = false) ApprovalStatus approvalStatus) {
        return ApiResponse.<List<LearnerPostResponse>>builder()
            .code(200)
            .message("Success")
            .result(learnerService.getPosts(currentUserService.userId(), approvalStatus))
            .build();
    }

    @GetMapping("/posts/{postId}/applications")
    public ApiResponse<List<TutorApplicationResponse>> getPostApplications(@PathVariable Long postId) {
        return ApiResponse.<List<TutorApplicationResponse>>builder()
            .code(200)
            .message("Success")
            .result(learnerService.getPostApplications(currentUserService.userId(), postId))
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
            .message("Success")
            .result(learnerService.decideApplication(applicationId, request))
            .build();
    }

    @GetMapping("/classes")
    public ApiResponse<List<LearnerClassResponse>> getClasses() {
        return ApiResponse.<List<LearnerClassResponse>>builder()
            .code(200)
            .message("Success")
            .result(learnerService.getClasses(currentUserService.userId()))
            .build();
    }

    @PatchMapping("/classes/{classId}/status")
    public ApiResponse<LearnerClassResponse> updateClassStatus(@PathVariable Long classId, @Valid @RequestBody ClassStatusUpdateRequest request) {
        request.setLearnerUserId(currentUserService.userId());
        return ApiResponse.<LearnerClassResponse>builder()
            .code(200)
            .message("Success")
            .result(learnerService.updateClassStatus(classId, request))
            .build();
    }

    @GetMapping("/courses/available")
    public ApiResponse<List<TutorCourseResponse>> getAvailableCourses(
            @RequestParam(required = false) Long subjectId,
            @RequestParam(required = false) Long gradeId,
            @RequestParam(required = false) TeachingMode teachingMode,
            @RequestParam(required = false) String province,
            @RequestParam(required = false) String district
    ) {
        return ApiResponse.<List<TutorCourseResponse>>builder()
            .code(200)
            .message("Success")
            .result(learnerService.availableCourses(subjectId, gradeId, teachingMode, province, district))
            .build();
    }

    @PostMapping("/courses/{courseId}/enroll")
    public ApiResponse<CourseEnrollmentResponse> enrollCourse(@PathVariable Long courseId, @Valid @RequestBody EnrollmentCreateRequest request) {
        request.setLearnerUserId(currentUserService.userId());
        return ApiResponse.<CourseEnrollmentResponse>builder()
            .code(200)
            .message("Success")
            .result(learnerService.enrollCourse(courseId, request))
            .build();
    }

    @PatchMapping("/enrollments/{enrollmentId}/cancel")
    public ApiResponse<CourseEnrollmentResponse> cancelEnrollment(@PathVariable Long enrollmentId) {
        return ApiResponse.<CourseEnrollmentResponse>builder()
            .code(200)
            .message("Success")
            .result(learnerService.cancelEnrollment(enrollmentId, currentUserService.userId()))
            .build();
    }

    @GetMapping("/enrollments")
    public ApiResponse<List<CourseEnrollmentResponse>> getMyEnrollments() {
        return ApiResponse.<List<CourseEnrollmentResponse>>builder()
            .code(200)
            .message("Success")
            .result(learnerService.myEnrollments(currentUserService.userId()))
            .build();
    }

    @PostMapping("/reviews")
    public ApiResponse<Void> createReview(@Valid @RequestBody ReviewCreateRequest request) {
        request.setLearnerUserId(currentUserService.userId());
        learnerService.createReview(request);
        return ApiResponse.<Void>builder()
            .code(200)
            .message("Success")
            .build();
    }
}
