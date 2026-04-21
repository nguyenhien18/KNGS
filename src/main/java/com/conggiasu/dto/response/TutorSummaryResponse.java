package com.conggiasu.dto.response;

import com.conggiasu.entity.enums.TeachingMode;
import com.conggiasu.entity.enums.TutorProfileStatus;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Builder
public class TutorSummaryResponse {
    private Long tutorId;
    private Long userId;
    private String fullName;
    private String email;
    private String phone;
    private String avatar;
    private String description;
    private String experience;
    private String qualification;
    private String province;
    private String district;
    private TeachingMode teachingMode;
    private TutorProfileStatus profileStatus;
    private String rejectedReason;
    private BigDecimal hourlyRate;
    private BigDecimal averageRating;
    private Integer reviewCount;
    private List<String> subjects;
    private List<String> grades;
}

