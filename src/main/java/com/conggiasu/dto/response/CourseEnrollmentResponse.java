package com.conggiasu.dto.response;

import com.conggiasu.entity.enums.CourseStatus;
import com.conggiasu.entity.enums.EnrollmentStatus;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
public class CourseEnrollmentResponse {
    private Long enrollmentId;
    private Long courseId;
    private String courseTitle;
    private Long tutorId;
    private String tutorName;
    private String tutorEmail;
    private String tutorPhone;
    private Long learnerUserId;
    private String learnerName;
    private String learnerEmail;
    private String learnerPhone;
    private String message;
    private BigDecimal agreedFee;
    private CourseStatus courseStatus;
    private EnrollmentStatus status;
    private LocalDateTime createdAt;
}
