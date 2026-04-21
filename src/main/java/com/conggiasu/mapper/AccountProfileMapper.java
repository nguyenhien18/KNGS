package com.conggiasu.mapper;

import com.conggiasu.dto.response.UserProfileResponse;
import com.conggiasu.entity.User;
import org.springframework.stereotype.Component;

@Component
public class AccountProfileMapper {

    public UserProfileResponse toResponse(User user) {
        return UserProfileResponse.builder()
            .id(user.getId())
            .role(user.getRole())
            .email(user.getEmail())
            .fullName(user.getFullName())
            .phone(user.getPhone())
            .birthDate(user.getBirthDate())
            .gender(user.getGender())
            .avatar(user.getAvatar())
            .address(user.getAddress())
            .status(user.getStatus())
            .build();
    }
}
