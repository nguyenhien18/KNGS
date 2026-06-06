package com.conggiasu.dto.request;

import jakarta.validation.constraints.PositiveOrZero;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class TutorApplyRequest {
    private Long tutorId;
    private String message;
    @PositiveOrZero
    private BigDecimal expectedFee;
}

