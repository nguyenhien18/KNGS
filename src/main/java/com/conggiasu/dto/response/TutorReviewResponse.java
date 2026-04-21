package com.conggiasu.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class TutorReviewResponse {
    private Long reviewId;
    private Long matchedClassId;
    private Long courseEnrollmentId;
    private Long courseId;
    private Long postId;
    private String postTitle;
    private String courseTitle;
    private String learnerName;
    private Integer rating;
    private String comment;
    private LocalDateTime createdAt;
}

