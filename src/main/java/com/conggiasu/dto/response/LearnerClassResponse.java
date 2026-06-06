package com.conggiasu.dto.response;

import com.conggiasu.entity.enums.MatchedClassStatus;
import com.conggiasu.entity.enums.UserRole;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
public class LearnerClassResponse {
    private Long classId;
    private Long postId;
    private String postTitle;
    private Long tutorId;
    private String tutorName;
    private String tutorEmail;
    private String tutorPhone;
    private MatchedClassStatus status;
    private Long statusRequestedByUserId;
    private UserRole statusRequestedByRole;
    private LocalDateTime statusRequestedAt;
    private String statusRequestReason;
    private boolean waitingForMyConfirmation;
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalDateTime assignedAt;
}

