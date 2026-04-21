package com.conggiasu.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminReviewRequest {
    private Long adminUserId;
    @NotNull
    private Boolean approved;
    @Size(max = 255)
    private String rejectedReason;
}

