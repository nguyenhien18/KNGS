package com.conggiasu.dto.response;

import com.conggiasu.entity.enums.Gender;
import com.conggiasu.entity.enums.UserRole;
import com.conggiasu.entity.enums.UserStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;

@Getter
@Builder
public class UserProfileResponse {
    private Long id;
    private UserRole role;
    private String email;
    private String fullName;
    private String phone;
    private LocalDate birthDate;
    private Gender gender;
    private String avatar;
    private String address;
    private UserStatus status;
}

