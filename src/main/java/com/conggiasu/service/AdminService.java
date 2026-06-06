package com.conggiasu.service;

import com.conggiasu.dto.request.AdminReviewRequest;
import com.conggiasu.dto.request.AdminUserStatusUpdateRequest;
import com.conggiasu.dto.response.AdminStatsResponse;
import com.conggiasu.dto.response.AdminUserResponse;
import com.conggiasu.dto.response.LearnerPostResponse;
import com.conggiasu.dto.response.PageResponse;
import com.conggiasu.dto.response.TutorCourseResponse;
import com.conggiasu.dto.response.TutorSummaryResponse;
import com.conggiasu.entity.Grade;
import com.conggiasu.entity.Subject;
import com.conggiasu.entity.enums.UserRole;
import com.conggiasu.entity.enums.UserStatus;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AdminService {
    private final AdminUserManagementService adminUserManagementService;
    private final AdminReviewService adminReviewService;
    private final AdminLookupService adminLookupService;

    public PageResponse<AdminUserResponse> getUsers(UserRole role, UserStatus status, int page, int size) {
        return adminUserManagementService.getUsers(role, status, page, size);
    }

    public AdminUserResponse updateUserStatus(Long userId, AdminUserStatusUpdateRequest request) {
        return adminUserManagementService.updateUserStatus(userId, request);
    }

    public PageResponse<TutorSummaryResponse> getPendingTutors(Long adminUserId, int page, int size) {
        return adminReviewService.getPendingTutors(adminUserId, page, size);
    }

    public TutorSummaryResponse getTutorDetail(Long adminUserId, Long tutorId) {
        return adminReviewService.getTutorDetail(adminUserId, tutorId);
    }

    public TutorSummaryResponse reviewTutor(Long tutorId, AdminReviewRequest request) {
        return adminReviewService.reviewTutor(tutorId, request);
    }

    public PageResponse<LearnerPostResponse> getPendingPosts(Long adminUserId, int page, int size) {
        return adminReviewService.getPendingPosts(adminUserId, page, size);
    }

    public LearnerPostResponse reviewPost(Long postId, AdminReviewRequest request) {
        return adminReviewService.reviewPost(postId, request);
    }

    public PageResponse<TutorCourseResponse> getPendingCourses(Long adminUserId, int page, int size) {
        return adminReviewService.getPendingCourses(adminUserId, page, size);
    }

    public TutorCourseResponse reviewCourse(Long courseId, AdminReviewRequest request) {
        return adminReviewService.reviewCourse(courseId, request);
    }

    public AdminStatsResponse getStats(Long adminUserId) {
        return adminUserManagementService.getStats(adminUserId);
    }

    public List<Subject> getSubjects(Long adminUserId) {
        return adminLookupService.getSubjects(adminUserId);
    }

    public List<Grade> getGrades(Long adminUserId) {
        return adminLookupService.getGrades(adminUserId);
    }

    public Subject createSubject(Long adminUserId, String name) {
        return adminLookupService.createSubject(adminUserId, name);
    }

    public Subject updateSubject(Long adminUserId, Long subjectId, String name) {
        return adminLookupService.updateSubject(adminUserId, subjectId, name);
    }

    public void deleteSubject(Long adminUserId, Long subjectId) {
        adminLookupService.deleteSubject(adminUserId, subjectId);
    }

    public Grade createGrade(Long adminUserId, String name) {
        return adminLookupService.createGrade(adminUserId, name);
    }

    public Grade updateGrade(Long adminUserId, Long gradeId, String name) {
        return adminLookupService.updateGrade(adminUserId, gradeId, name);
    }

    public void deleteGrade(Long adminUserId, Long gradeId) {
        adminLookupService.deleteGrade(adminUserId, gradeId);
    }
}
