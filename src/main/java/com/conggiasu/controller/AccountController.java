package com.conggiasu.controller;

import com.conggiasu.dto.request.ChangePasswordRequest;
import com.conggiasu.dto.request.IdentityVerificationUpsertRequest;
import com.conggiasu.dto.request.UpdateProfileRequest;
import com.conggiasu.dto.response.ApiResponse;
import com.conggiasu.dto.response.FileUploadResponse;
import com.conggiasu.dto.response.IdentityVerificationResponse;
import com.conggiasu.dto.response.UserProfileResponse;
import com.conggiasu.service.AccountService;
import com.conggiasu.service.CurrentUserService;
import com.conggiasu.service.IdentityVerificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/account")
@RequiredArgsConstructor
@Slf4j
public class AccountController {
    private final AccountService accountService;
    private final CurrentUserService currentUserService;
    private final IdentityVerificationService identityVerificationService;

    @GetMapping("/me")
    public ApiResponse<UserProfileResponse> getMyProfile() {
        return ApiResponse.<UserProfileResponse>builder()
            .code(200)
            .message("Success")
            .result(accountService.getMyProfile(currentUserService.userId()))
            .build();
    }

    @PatchMapping("/me")
    public ApiResponse<UserProfileResponse> updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        return ApiResponse.<UserProfileResponse>builder()
            .code(200)
            .message("Success")
            .result(accountService.updateProfile(currentUserService.userId(), request))
            .build();
    }

    @PostMapping(value = "/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<FileUploadResponse> uploadAvatar(@RequestPart("file") MultipartFile file) {
        return ApiResponse.<FileUploadResponse>builder()
            .code(200)
            .message("Success")
            .result(accountService.uploadAvatar(currentUserService.userId(), file))
            .build();
    }

    @PostMapping(value = "/identity-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<FileUploadResponse> uploadIdentityImage(@RequestPart("file") MultipartFile file) {
        return ApiResponse.<FileUploadResponse>builder()
            .code(200)
            .message("Success")
            .result(accountService.uploadIdentityImage(currentUserService.userId(), file))
            .build();
    }

    @PostMapping("/change-password")
    public ApiResponse<Void> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        accountService.changePassword(currentUserService.userId(), request);
        return ApiResponse.<Void>builder()
            .code(200)
            .message("Success")
            .build();
    }

    @GetMapping("/identity-verification")
    public ApiResponse<IdentityVerificationResponse> getMyIdentityVerification() {
        return ApiResponse.<IdentityVerificationResponse>builder()
            .code(200)
            .message("Success")
            .result(identityVerificationService.getMyVerification(currentUserService.userId()))
            .build();
    }

    @PutMapping("/identity-verification")
    public ApiResponse<IdentityVerificationResponse> upsertMyIdentityVerification(
        @Valid @RequestBody IdentityVerificationUpsertRequest request
    ) {
        return ApiResponse.<IdentityVerificationResponse>builder()
            .code(200)
            .message("Success")
            .result(identityVerificationService.upsertMyVerification(currentUserService.userId(), request))
            .build();
    }
}
