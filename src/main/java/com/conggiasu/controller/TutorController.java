package com.conggiasu.controller;

import com.conggiasu.dto.request.AdminReviewRequest;
import com.conggiasu.dto.request.TutorStatusUpdateRequest;
import com.conggiasu.dto.request.TutorUpsertRequest;
import com.conggiasu.dto.response.ApiResponse;
import com.conggiasu.dto.response.PageResponse;
import com.conggiasu.dto.response.TutorSummaryResponse;
import com.conggiasu.entity.enums.TeachingMode;
import com.conggiasu.entity.enums.TutorProfileStatus;
import com.conggiasu.exception.AppException;
import com.conggiasu.service.AdminService;
import com.conggiasu.service.CurrentUserService;
import com.conggiasu.service.TutorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
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
@RequestMapping("/api/tutors")
@RequiredArgsConstructor
@Slf4j
public class TutorController {
    private final TutorService tutorService;
    private final AdminService adminService;
    private final CurrentUserService currentUserService;

    @GetMapping
    public ApiResponse<PageResponse<TutorSummaryResponse>> getTutors(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long subjectId,
            @RequestParam(required = false) Long gradeId,
            @RequestParam(required = false) TeachingMode teachingMode,
            @RequestParam(required = false) TutorProfileStatus profileStatus,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ApiResponse.<PageResponse<TutorSummaryResponse>>builder()
            .code(200)
            .message("Success")
            .result(tutorService.searchTutors(
                keyword, subjectId, gradeId, teachingMode, profileStatus, page, size
            ))
            .build();
    }

    @GetMapping("/{id}")
    public ApiResponse<TutorSummaryResponse> getTutorById(@PathVariable Long id) {
        return ApiResponse.<TutorSummaryResponse>builder()
            .code(200)
            .message("Success")
            .result(tutorService.getTutorById(id))
            .build();
    }

    @GetMapping("/me")
    public ApiResponse<TutorSummaryResponse> getMyTutorProfile() {
        return ApiResponse.<TutorSummaryResponse>builder()
            .code(200)
            .message("Success")
            .result(tutorService.getTutorProfileByUserId(currentUserService.userId()))
            .build();
    }

    @PostMapping
    @PreAuthorize("hasRole('TUTOR')")
    public ApiResponse<TutorSummaryResponse> createTutorProfile(@Valid @RequestBody TutorUpsertRequest request) {
        return ApiResponse.<TutorSummaryResponse>builder()
            .code(200)
            .message("Success")
            .result(tutorService.createTutorProfileForUserId(currentUserService.userId(), request))
            .build();
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('TUTOR')")
    public ApiResponse<TutorSummaryResponse> updateTutorProfile(@PathVariable Long id, @Valid @RequestBody TutorUpsertRequest request) {
        return ApiResponse.<TutorSummaryResponse>builder()
            .code(200)
            .message("Success")
            .result(tutorService.updateTutorByUserIdAndTutorId(currentUserService.userId(), id, request))
            .build();
    }

    @PutMapping("/me")
    @PreAuthorize("hasRole('TUTOR')")
    public ApiResponse<TutorSummaryResponse> upsertMyTutorProfile(@Valid @RequestBody TutorUpsertRequest request) {
        return ApiResponse.<TutorSummaryResponse>builder()
            .code(200)
            .message("Success")
            .result(tutorService.upsertTutorProfileByUserId(currentUserService.userId(), request))
            .build();
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<TutorSummaryResponse> updateTutorProfileStatus(@PathVariable Long id, @Valid @RequestBody TutorStatusUpdateRequest request) {
        Boolean approved;
        if (request.getProfileStatus() == TutorProfileStatus.APPROVED) {
            approved = Boolean.TRUE;
        } else if (request.getProfileStatus() == TutorProfileStatus.REJECTED) {
            approved = Boolean.FALSE;
        } else {
            throw new AppException(HttpStatus.BAD_REQUEST, "Chi ho tro cap nhat trang thai APPROVED hoac REJECTED");
        }
        AdminReviewRequest reviewRequest = new AdminReviewRequest();
        reviewRequest.setAdminUserId(currentUserService.userId());
        reviewRequest.setApproved(approved);
        reviewRequest.setRejectedReason(request.getRejectedReason());

        return ApiResponse.<TutorSummaryResponse>builder()
            .code(200)
            .message("Success")
            .result(adminService.reviewTutor(id, reviewRequest))
            .build();
    }
}
