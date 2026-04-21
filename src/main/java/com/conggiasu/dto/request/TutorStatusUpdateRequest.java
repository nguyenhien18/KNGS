package com.conggiasu.dto.request;

import com.conggiasu.entity.enums.TutorProfileStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TutorStatusUpdateRequest {
    @NotNull
    private TutorProfileStatus profileStatus;
    private String rejectedReason;
    private Long reviewedByUserId;
}

