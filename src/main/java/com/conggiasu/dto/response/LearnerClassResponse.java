package com.conggiasu.dto.response;

import com.conggiasu.entity.enums.MatchedClassStatus;
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
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalDateTime assignedAt;
}

