package com.conggiasu.service;

import com.conggiasu.dto.request.LoginRequest;
import com.conggiasu.dto.request.RegisterLearnerRequest;
import com.conggiasu.dto.request.RegisterTutorAccountRequest;
import com.conggiasu.dto.response.LoginResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {
    private final AuthRegistrationService authRegistrationService;
    private final AuthLoginService authLoginService;

    @Transactional
    public LoginResponse createTutorAccount(RegisterTutorAccountRequest request) {
        return authRegistrationService.createTutorAccount(request);
    }

    @Transactional
    public LoginResponse createLearnerAccount(RegisterLearnerRequest request) {
        return authRegistrationService.createLearnerAccount(request);
    }

    @Transactional(readOnly = true)
    public LoginResponse authenticate(LoginRequest request) {
        return authLoginService.authenticate(request);
    }
}
