package com.conggiasu.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AdminStatsResponse {
    private long totalUsers;
    private long totalTutors;
    private long pendingTutorProfiles;
    private long pendingPosts;
    private long pendingCourses;
}

