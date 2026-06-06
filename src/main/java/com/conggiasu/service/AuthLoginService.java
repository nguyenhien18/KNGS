package com.conggiasu.service;

import com.conggiasu.config.AppUserPrincipal;
import com.conggiasu.config.JwtService;
import com.conggiasu.dto.request.LoginRequest;
import com.conggiasu.dto.response.LoginResponse;
import com.conggiasu.entity.Tutor;
import com.conggiasu.entity.User;
import com.conggiasu.entity.enums.UserRole;
import com.conggiasu.exception.AppException;
import com.conggiasu.repository.TutorRepository;
import com.conggiasu.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AccountStatusException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationServiceException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthLoginService {
    private final UserRepository userRepository;
    private final TutorRepository tutorRepository;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final AuthValueNormalizer authValueNormalizer;
    private final AuthResponseFactory authResponseFactory;

    @Transactional(readOnly = true)
    public LoginResponse authenticate(LoginRequest request) {
        String email = authValueNormalizer.normalizeRequired(request.getEmail(), "Email không được trống");
        try {
            authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, request.getPassword())
            );
        } catch (AccountStatusException ex) {
            throw new AppException(HttpStatus.UNAUTHORIZED, ex.getMessage());
        } catch (AuthenticationServiceException ex) {
            throw new AppException(HttpStatus.UNAUTHORIZED, ex.getMessage());
        } catch (AuthenticationException ex) {
            throw new AppException(HttpStatus.UNAUTHORIZED, "Sai email hoặc mật khẩu");
        }
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new AppException(HttpStatus.UNAUTHORIZED, "Sai email hoặc mật khẩu"));

        Long tutorId = null;
        if (user.getRole() == UserRole.TUTOR) {
            Tutor tutor = tutorRepository.findByUserId(user.getId()).orElse(null);
            tutorId = tutor != null ? tutor.getId() : null;
        }
        String token = jwtService.generateToken(new AppUserPrincipal(user));
        return authResponseFactory.buildLoginResponse(user, token, tutorId);
    }
}
