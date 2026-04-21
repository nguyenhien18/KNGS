package com.conggiasu.dto.request;

import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class EnrollmentCreateRequest {
    private Long learnerUserId;
    @Size(max = 1000)
    private String message;
    @PositiveOrZero
    private BigDecimal agreedFee;
}

