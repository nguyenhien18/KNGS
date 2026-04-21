package com.conggiasu.dto.request;

import com.conggiasu.entity.enums.EnrollmentStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class EnrollmentStatusUpdateRequest {
    @NotNull
    private EnrollmentStatus status;
    private Long tutorId;
}

