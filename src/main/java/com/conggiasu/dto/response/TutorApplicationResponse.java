package com.conggiasu.dto.response;

import com.conggiasu.entity.enums.ApplicationStatus;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
public class TutorApplicationResponse {
    private Long applicationId;
    private Long postId;
    private Long matchedClassId;
    private String postTitle;
    private String subject;
    private String grade;
    private String province;
    private String district;
    private String learnerName;
    private String learnerEmail;
    private String learnerPhone;
    private String tutorName;
    private String tutorEmail;
    private String tutorPhone;
    private String message;
    private BigDecimal expectedFee;
    private ApplicationStatus status;
    private LocalDateTime createdAt;
}

