package com.conggiasu.service;

import com.conggiasu.config.AppUserPrincipal;
import com.conggiasu.config.JwtService;
import com.conggiasu.dto.request.RegisterLearnerRequest;
import com.conggiasu.dto.request.RegisterTutorAccountRequest;
import com.conggiasu.dto.response.LoginResponse;
import com.conggiasu.entity.User;
import com.conggiasu.entity.enums.UserRole;
import com.conggiasu.exception.AppException;
import com.conggiasu.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthRegistrationService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthValueNormalizer authValueNormalizer;
    private final AuthResponseFactory authResponseFactory;

    @Transactional
    public LoginResponse createTutorAccount(RegisterTutorAccountRequest request) {
        String email = authValueNormalizer.normalizeRequired(request.getEmail(), "Email khong duoc trong");
        String password = authValueNormalizer.normalizeRequired(request.getPassword(), "Password khong duoc trong");
        String fullName = authValueNormalizer.normalizeRequired(request.getFullName(), "Ho ten khong duoc trong");
        String phone = authValueNormalizer.normalizeBlank(request.getPhone());

        validateUniqueCredentials(email, phone);

        User user = new User();
        user.setRole(UserRole.TUTOR);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setFullName(fullName);
        user.setPhone(phone);
        user.setGender(request.getGender());
        user.setAddress(authValueNormalizer.normalizeBlank(request.getAddress()));
        user = userRepository.save(user);

        String token = jwtService.generateToken(new AppUserPrincipal(user));
        return authResponseFactory.buildLoginResponse(user, token, null);
    }

    @Transactional
    public LoginResponse createLearnerAccount(RegisterLearnerRequest request) {
        String email = authValueNormalizer.normalizeRequired(request.getEmail(), "Email khong duoc trong");
        String password = authValueNormalizer.normalizeRequired(request.getPassword(), "Password khong duoc trong");
        String fullName = authValueNormalizer.normalizeRequired(request.getFullName(), "Ho ten khong duoc trong");
        String phone = authValueNormalizer.normalizeBlank(request.getPhone());

        validateUniqueCredentials(email, phone);

        User user = new User();
        user.setRole(UserRole.LEARNER);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setFullName(fullName);
        user.setPhone(phone);
        user.setBirthDate(request.getBirthDate());
        user.setGender(request.getGender());
        user.setAddress(authValueNormalizer.normalizeBlank(request.getAddress()));
        user = userRepository.save(user);

        String token = jwtService.generateToken(new AppUserPrincipal(user));
        return authResponseFactory.buildLoginResponse(user, token, null);
    }

    private void validateUniqueCredentials(String email, String phone) {
        if (userRepository.existsByEmail(email)) {
            throw new AppException(HttpStatus.CONFLICT, "Email da ton tai");
        }
        if (phone != null && userRepository.existsByPhone(phone)) {
            throw new AppException(HttpStatus.CONFLICT, "So dien thoai da ton tai");
        }
    }
}
