package com.conggiasu.controller;

import com.conggiasu.dto.request.AdminReviewRequest;
import com.conggiasu.dto.request.AdminLookupUpsertRequest;
import com.conggiasu.dto.request.AdminUserStatusUpdateRequest;
import com.conggiasu.dto.response.AdminStatsResponse;
import com.conggiasu.dto.response.AdminTutorCertificateResponse;
import com.conggiasu.dto.response.AdminUserResponse;
import com.conggiasu.dto.response.ApiResponse;
import com.conggiasu.dto.response.IdentityVerificationResponse;
import com.conggiasu.dto.response.LearnerPostResponse;
import com.conggiasu.dto.response.TutorCourseResponse;
import com.conggiasu.dto.response.TutorSummaryResponse;
import com.conggiasu.entity.Grade;
import com.conggiasu.entity.Subject;
import com.conggiasu.entity.enums.UserRole;
import com.conggiasu.entity.enums.UserStatus;
import com.conggiasu.service.AdminService;
import com.conggiasu.service.CurrentUserService;
import com.conggiasu.service.FileStorageService;
import com.conggiasu.service.IdentityVerificationService;
import com.conggiasu.service.TutorCertificateService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {
    private final AdminService adminService;
    private final CurrentUserService currentUserService;
    private final IdentityVerificationService identityVerificationService;
    private final TutorCertificateService tutorCertificateService;

    @GetMapping("/users")
    public ApiResponse<List<AdminUserResponse>> getUsers(@RequestParam(required = false) UserRole role, @RequestParam(required = false) UserStatus status) {
        return ApiResponse.<List<AdminUserResponse>>builder()
            .code(200)
            .message("Success")
            .result(adminService.getUsers(role, status))
            .build();
    }

    @PatchMapping("/users/{userId}/status")
    public ApiResponse<AdminUserResponse> updateUserStatus(@PathVariable Long userId, @Valid @RequestBody AdminUserStatusUpdateRequest request) {
        request.setAdminUserId(currentUserService.userId());
        return ApiResponse.<AdminUserResponse>builder()
            .code(200)
            .message("Success")
            .result(adminService.updateUserStatus(userId, request))
            .build();
    }

    @GetMapping("/tutors/pending")
    public ApiResponse<List<TutorSummaryResponse>> getPendingTutors() {
        return ApiResponse.<List<TutorSummaryResponse>>builder()
            .code(200)
            .message("Success")
            .result(adminService.getPendingTutors(currentUserService.userId()))
            .build();
    }

    @GetMapping("/tutors/{tutorId}/detail")
    public ApiResponse<TutorSummaryResponse> getTutorDetail(@PathVariable Long tutorId) {
        return ApiResponse.<TutorSummaryResponse>builder()
            .code(200)
            .message("Success")
            .result(adminService.getTutorDetail(currentUserService.userId(), tutorId))
            .build();
    }

    @PatchMapping("/tutors/{tutorId}/review")
    public ApiResponse<TutorSummaryResponse> reviewTutor(@PathVariable Long tutorId, @Valid @RequestBody AdminReviewRequest request) {
        request.setAdminUserId(currentUserService.userId());
        return ApiResponse.<TutorSummaryResponse>builder()
            .code(200)
            .message("Success")
            .result(adminService.reviewTutor(tutorId, request))
            .build();
    }

    @GetMapping("/tutors/{tutorId}/certificates")
    public ApiResponse<List<AdminTutorCertificateResponse>> getTutorCertificates(@PathVariable Long tutorId) {
        return ApiResponse.<List<AdminTutorCertificateResponse>>builder()
            .code(200)
            .message("Success")
            .result(tutorCertificateService.getTutorCertificatesForAdmin(currentUserService.userId(), tutorId))
            .build();
    }

    @GetMapping("/certificates/{certificateId}/image")
    public ResponseEntity<Resource> viewCertificateImage(@PathVariable Long certificateId) {
        FileStorageService.StoredImage image = tutorCertificateService.loadCertificateImageForAdmin(currentUserService.userId(), certificateId);
        MediaType mediaType = MediaTypeFactory.getMediaType(image.filename()).orElse(MediaType.APPLICATION_OCTET_STREAM);
        return ResponseEntity.status(HttpStatus.OK)
            .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + image.filename() + "\"")
            .cacheControl(CacheControl.noStore())
            .contentType(mediaType)
            .body(image.resource());
    }

    @GetMapping("/identity-verifications/pending")
    public ApiResponse<List<IdentityVerificationResponse>> getPendingIdentityVerifications() {
        return ApiResponse.<List<IdentityVerificationResponse>>builder()
            .code(200)
            .message("Success")
            .result(identityVerificationService.getPendingVerifications(currentUserService.userId()))
            .build();
    }

    @GetMapping("/identity-verifications/{verificationId}/images/{type}")
    public ResponseEntity<Resource> viewIdentityImageForAdmin(@PathVariable Long verificationId, @PathVariable String type) {
        FileStorageService.StoredImage image = identityVerificationService.loadIdentityImageForAdmin(
            currentUserService.userId(),
            verificationId,
            type
        );
        MediaType mediaType = MediaTypeFactory.getMediaType(image.filename()).orElse(MediaType.APPLICATION_OCTET_STREAM);
        return ResponseEntity.status(HttpStatus.OK)
            .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + image.filename() + "\"")
            .cacheControl(CacheControl.noStore())
            .contentType(mediaType)
            .body(image.resource());
    }

    @GetMapping("/tutors/{tutorId}/identity-verification")
    public ApiResponse<IdentityVerificationResponse> getTutorIdentityVerification(@PathVariable Long tutorId) {
        TutorSummaryResponse tutor = adminService.getTutorDetail(currentUserService.userId(), tutorId);
        return ApiResponse.<IdentityVerificationResponse>builder()
            .code(200)
            .message("Success")
            .result(identityVerificationService.getVerificationByUserIdForAdmin(currentUserService.userId(), tutor.getUserId()))
            .build();
    }

    @PatchMapping("/identity-verifications/{verificationId}/review")
    public ApiResponse<IdentityVerificationResponse> reviewIdentityVerification(
        @PathVariable Long verificationId,
        @Valid @RequestBody AdminReviewRequest request
    ) {
        return ApiResponse.<IdentityVerificationResponse>builder()
            .code(200)
            .message("Success")
            .result(identityVerificationService.reviewVerification(currentUserService.userId(), verificationId, request))
            .build();
    }

    @GetMapping("/posts/pending")
    public ApiResponse<List<LearnerPostResponse>> getPendingPosts() {
        return ApiResponse.<List<LearnerPostResponse>>builder()
            .code(200)
            .message("Success")
            .result(adminService.getPendingPosts(currentUserService.userId()))
            .build();
    }

    @PatchMapping("/posts/{postId}/review")
    public ApiResponse<LearnerPostResponse> reviewPost(@PathVariable Long postId, @Valid @RequestBody AdminReviewRequest request) {
        request.setAdminUserId(currentUserService.userId());
        return ApiResponse.<LearnerPostResponse>builder()
            .code(200)
            .message("Success")
            .result(adminService.reviewPost(postId, request))
            .build();
    }

    @GetMapping("/courses/pending")
    public ApiResponse<List<TutorCourseResponse>> getPendingCourses() {
        return ApiResponse.<List<TutorCourseResponse>>builder()
            .code(200)
            .message("Success")
            .result(adminService.getPendingCourses(currentUserService.userId()))
            .build();
    }

    @PatchMapping("/courses/{courseId}/review")
    public ApiResponse<TutorCourseResponse> reviewCourse(@PathVariable Long courseId, @Valid @RequestBody AdminReviewRequest request) {
        request.setAdminUserId(currentUserService.userId());
        return ApiResponse.<TutorCourseResponse>builder()
            .code(200)
            .message("Success")
            .result(adminService.reviewCourse(courseId, request))
            .build();
    }

    @GetMapping("/stats")
    public ApiResponse<AdminStatsResponse> getStats() {
        return ApiResponse.<AdminStatsResponse>builder()
            .code(200)
            .message("Success")
            .result(adminService.getStats(currentUserService.userId()))
            .build();
    }

    @GetMapping("/lookups/subjects")
    public ApiResponse<List<Subject>> getSubjects() {
        return ApiResponse.<List<Subject>>builder()
            .code(200)
            .message("Success")
            .result(adminService.getSubjects(currentUserService.userId()))
            .build();
    }

    @PostMapping("/lookups/subjects")
    public ApiResponse<Subject> createSubject(@Valid @RequestBody AdminLookupUpsertRequest request) {
        return ApiResponse.<Subject>builder()
            .code(200)
            .message("Success")
            .result(adminService.createSubject(currentUserService.userId(), request.getName()))
            .build();
    }

    @PutMapping("/lookups/subjects/{subjectId}")
    public ApiResponse<Subject> updateSubject(@PathVariable Long subjectId, @Valid @RequestBody AdminLookupUpsertRequest request) {
        return ApiResponse.<Subject>builder()
            .code(200)
            .message("Success")
            .result(adminService.updateSubject(currentUserService.userId(), subjectId, request.getName()))
            .build();
    }

    @DeleteMapping("/lookups/subjects/{subjectId}")
    public ApiResponse<Void> deleteSubject(@PathVariable Long subjectId) {
        adminService.deleteSubject(currentUserService.userId(), subjectId);
        return ApiResponse.<Void>builder()
            .code(200)
            .message("Success")
            .build();
    }

    @GetMapping("/lookups/grades")
    public ApiResponse<List<Grade>> getGrades() {
        return ApiResponse.<List<Grade>>builder()
            .code(200)
            .message("Success")
            .result(adminService.getGrades(currentUserService.userId()))
            .build();
    }

    @PostMapping("/lookups/grades")
    public ApiResponse<Grade> createGrade(@Valid @RequestBody AdminLookupUpsertRequest request) {
        return ApiResponse.<Grade>builder()
            .code(200)
            .message("Success")
            .result(adminService.createGrade(currentUserService.userId(), request.getName()))
            .build();
    }

    @PutMapping("/lookups/grades/{gradeId}")
    public ApiResponse<Grade> updateGrade(@PathVariable Long gradeId, @Valid @RequestBody AdminLookupUpsertRequest request) {
        return ApiResponse.<Grade>builder()
            .code(200)
            .message("Success")
            .result(adminService.updateGrade(currentUserService.userId(), gradeId, request.getName()))
            .build();
    }

    @DeleteMapping("/lookups/grades/{gradeId}")
    public ApiResponse<Void> deleteGrade(@PathVariable Long gradeId) {
        adminService.deleteGrade(currentUserService.userId(), gradeId);
        return ApiResponse.<Void>builder()
            .code(200)
            .message("Success")
            .build();
    }
}
