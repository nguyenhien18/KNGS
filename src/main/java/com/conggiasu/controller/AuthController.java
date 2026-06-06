package com.conggiasu.controller;

import com.conggiasu.dto.request.LoginRequest;
import com.conggiasu.dto.request.RegisterLearnerRequest;
import com.conggiasu.dto.request.RegisterTutorAccountRequest;
import com.conggiasu.dto.response.ApiResponse;
import com.conggiasu.dto.response.LoginResponse;
import com.conggiasu.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {
    private final AuthService authService;

    @PostMapping("/register-tutor")
    public ApiResponse<LoginResponse> createTutorAccount(@Valid @RequestBody RegisterTutorAccountRequest request) {
        return ApiResponse.<LoginResponse>builder()
            .code(200)
            .message("Thành công")
            .result(authService.createTutorAccount(request))
            .build();
    }

    @PostMapping("/register-learner")
    public ApiResponse<LoginResponse> createLearnerAccount(@Valid @RequestBody RegisterLearnerRequest request) {
        return ApiResponse.<LoginResponse>builder()
            .code(200)
            .message("Thành công")
            .result(authService.createLearnerAccount(request))
            .build();
    }

    @PostMapping("/login")
    public ApiResponse<LoginResponse> authenticate(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.<LoginResponse>builder()
            .code(200)
            .message("Thành công")
            .result(authService.authenticate(request))
            .build();
    }
}
