package com.conggiasu.dto.request;

import com.conggiasu.entity.enums.UserStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminUserStatusUpdateRequest {
    @NotNull
    private UserStatus status;
    private Long adminUserId;
}

