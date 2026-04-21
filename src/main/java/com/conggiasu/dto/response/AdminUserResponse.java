package com.conggiasu.dto.response;

import com.conggiasu.entity.enums.UserRole;
import com.conggiasu.entity.enums.UserStatus;
import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AdminUserResponse {
    private Long id;
    private UserRole role;
    private String email;
    private String fullName;
    private String phone;
    private UserStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
