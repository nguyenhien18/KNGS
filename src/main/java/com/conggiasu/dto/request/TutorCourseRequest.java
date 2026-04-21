package com.conggiasu.dto.request;

import com.conggiasu.entity.enums.TeachingMode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
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
    private BigDecimal price;
    @Positive(message = "maxStudents phai lon hon 0")
    private Integer maxStudents;
    private String province;
    private String district;
    private String addressDetail;
}

