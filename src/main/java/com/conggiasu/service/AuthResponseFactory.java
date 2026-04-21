package com.conggiasu.service;

import com.conggiasu.dto.response.LoginResponse;
import com.conggiasu.entity.User;
import org.springframework.stereotype.Component;

@Component
public class AuthResponseFactory {

    public LoginResponse buildLoginResponse(User user, String token, Long tutorId) {
        return LoginResponse.builder()
            .accessToken(token)
            .userId(user.getId())
            .role(user.getRole())
            .fullName(user.getFullName())
            .email(user.getEmail())
            .tutorId(tutorId)
            .build();
    }
}
