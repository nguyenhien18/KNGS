package com.conggiasu.dto.response;

import com.conggiasu.entity.enums.TeachingMode;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
public class AvailablePostResponse {
    private Long postId;
    private String title;
    private String description;
    private String subject;
    private String grade;
    private TeachingMode teachingMode;
    private String studyTime;
    private BigDecimal budget;
    private String province;
    private String district;
    private String addressDetail;
    private LocalDateTime createdAt;
}

