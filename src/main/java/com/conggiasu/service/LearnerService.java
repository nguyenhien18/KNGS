package com.conggiasu.service;

import com.conggiasu.dto.request.ClassStatusUpdateRequest;
import com.conggiasu.dto.request.EnrollmentCreateRequest;
import com.conggiasu.dto.request.LearnerApplicationDecisionRequest;
import com.conggiasu.dto.request.PostUpsertRequest;
import com.conggiasu.dto.request.ReviewCreateRequest;
import com.conggiasu.dto.response.CourseEnrollmentResponse;
import com.conggiasu.dto.response.LearnerClassResponse;
import com.conggiasu.dto.response.LearnerPostResponse;
import com.conggiasu.dto.response.PageResponse;
import com.conggiasu.dto.response.TutorApplicationResponse;
import com.conggiasu.dto.response.TutorCourseResponse;
import com.conggiasu.entity.enums.ApprovalStatus;
import com.conggiasu.entity.enums.TeachingMode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class LearnerService {
    private final LearnerPostService learnerPostService;
    private final LearnerApplicationDecisionService learnerApplicationDecisionService;
    private final LearnerClassService learnerClassService;
    private final LearnerCourseBrowseService learnerCourseBrowseService;
    private final LearnerEnrollmentService learnerEnrollmentService;
    private final LearnerReviewService learnerReviewService;

    public LearnerPostResponse createPost(PostUpsertRequest request) {
        return learnerPostService.createPost(request);
    }

    public LearnerPostResponse updatePost(Long postId, PostUpsertRequest request) {
        return learnerPostService.updatePost(postId, request);
    }

    public LearnerPostResponse cancelPost(Long learnerUserId, Long postId) {
        return learnerPostService.cancelPost(learnerUserId, postId);
    }

    public PageResponse<LearnerPostResponse> getPosts(
        Long learnerUserId, ApprovalStatus approvalStatus, int page, int size
    ) {
        return learnerPostService.getPosts(learnerUserId, approvalStatus, page, size);
    }

    public PageResponse<TutorApplicationResponse> getPostApplications(
        Long learnerUserId, Long postId, int page, int size
    ) {
        return learnerApplicationDecisionService.getPostApplications(learnerUserId, postId, page, size);
    }

    public TutorApplicationResponse decideApplication(
        Long applicationId, LearnerApplicationDecisionRequest request
    ) {
        return learnerApplicationDecisionService.decideApplication(applicationId, request);
    }

    public PageResponse<LearnerClassResponse> getClasses(Long learnerUserId, int page, int size) {
        return learnerClassService.getClasses(learnerUserId, page, size);
    }

    public LearnerClassResponse updateClassStatus(Long classId, ClassStatusUpdateRequest request) {
        return learnerClassService.updateClassStatus(classId, request);
    }

    public PageResponse<TutorCourseResponse> availableCourses(
        Long subjectId,
        Long gradeId,
        TeachingMode teachingMode,
        String province,
        String district,
        int page,
        int size
    ) {
        return learnerCourseBrowseService.availableCourses(
            subjectId, gradeId, teachingMode, province, district, page, size
        );
    }

    public TutorCourseResponse availableCourseDetail(Long courseId) {
        return learnerCourseBrowseService.availableCourseDetail(courseId);
    }

    public PageResponse<TutorCourseResponse> availableCoursesByTutorId(Long tutorId, int page, int size) {
        return learnerCourseBrowseService.availableCoursesByTutorId(tutorId, page, size);
    }

    public CourseEnrollmentResponse enrollCourse(Long courseId, EnrollmentCreateRequest request) {
        return learnerEnrollmentService.enrollCourse(courseId, request);
    }

    public CourseEnrollmentResponse cancelEnrollment(Long enrollmentId, Long learnerUserId) {
        return learnerEnrollmentService.cancelEnrollment(enrollmentId, learnerUserId);
    }

    public PageResponse<CourseEnrollmentResponse> myEnrollments(Long learnerUserId, int page, int size) {
        return learnerEnrollmentService.myEnrollments(learnerUserId, page, size);
    }

    public void createReview(ReviewCreateRequest request) {
        learnerReviewService.createReview(request);
    }
}
