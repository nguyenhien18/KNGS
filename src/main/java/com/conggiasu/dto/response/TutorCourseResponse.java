package com.conggiasu.dto.response;

import com.conggiasu.entity.enums.ApprovalStatus;
import com.conggiasu.entity.enums.CourseStatus;
import com.conggiasu.entity.enums.TeachingMode;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
public class TutorCourseResponse {
    private Long courseId;
    private Long tutorId;
    private String tutorName;
    private String title;
    private String description;
    private String subject;
    private String grade;
    private TeachingMode teachingMode;
    private String studyTime;
    private BigDecimal price;
    private Integer maxStudents;
    private String province;
    private String district;
    private String addressDetail;
    private ApprovalStatus approvalStatus;
    private CourseStatus status;
    private LocalDateTime createdAt;
}

