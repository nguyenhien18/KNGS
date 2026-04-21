package com.conggiasu.dto.request;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class TutorApplyRequest {
    private Long tutorId;
    private String message;
    private BigDecimal expectedFee;
}

