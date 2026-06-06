package com.conggiasu.dto.request;

import com.conggiasu.entity.enums.TeachingMode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class PostUpsertRequest {
    private Long learnerUserId;
    @NotNull
    private Long subjectId;
    @NotNull
    private Long gradeId;
    @NotBlank
    private String title;
    private String description;
    @NotNull
    private TeachingMode teachingMode;
    private String studyTime;
    @PositiveOrZero
    private BigDecimal budget;
    private String province;
    private String district;
    private String addressDetail;
}

