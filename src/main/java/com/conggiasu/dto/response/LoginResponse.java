package com.conggiasu.dto.response;

import com.conggiasu.entity.enums.UserRole;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class LoginResponse {
    private String accessToken;
    private Long userId;
    private UserRole role;
    private String fullName;
    private String email;
    private Long tutorId;
}

