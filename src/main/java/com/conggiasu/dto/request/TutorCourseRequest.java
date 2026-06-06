package com.conggiasu.dto.request;

import com.conggiasu.entity.enums.TeachingMode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class TutorCourseRequest {
    private Long tutorId;
    @NotBlank
    private String title;
    private String description;
    @NotNull
    private Long subjectId;
    @NotNull
    private Long gradeId;
    @NotNull
    private TeachingMode teachingMode;
    private String studyTime;
    @PositiveOrZero
    private BigDecimal price;
    @Positive(message = "maxStudents phải lớn hơn 0")
    private Integer maxStudents;
    private String province;
    private String district;
    private String addressDetail;
}

