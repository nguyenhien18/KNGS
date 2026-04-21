package com.conggiasu.dto.response;

import com.conggiasu.entity.enums.MatchedClassStatus;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class TutorMatchedClassResponse {
    private Long classId;
    private Long postId;
    private String postTitle;
    private Long learnerUserId;
    private String learnerName;
    private String learnerEmail;
    private String learnerPhone;
    private MatchedClassStatus status;
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalDateTime assignedAt;
}
