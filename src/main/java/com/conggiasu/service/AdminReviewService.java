package com.conggiasu.service;

import com.conggiasu.dto.request.AdminReviewRequest;
import com.conggiasu.dto.response.LearnerPostResponse;
import com.conggiasu.dto.response.PageResponse;
import com.conggiasu.dto.response.TutorCourseResponse;
import com.conggiasu.dto.response.TutorSummaryResponse;
import com.conggiasu.entity.Post;
import com.conggiasu.entity.Tutor;
import com.conggiasu.entity.TutorCourse;
import com.conggiasu.entity.User;
import com.conggiasu.entity.enums.ApprovalStatus;
import com.conggiasu.entity.enums.TutorProfileStatus;
import com.conggiasu.exception.AppException;
import com.conggiasu.mapper.AdminResponseMapper;
import com.conggiasu.mapper.TutorSummaryMapper;
import com.conggiasu.repository.PostRepository;
import com.conggiasu.repository.TutorCourseRepository;
import com.conggiasu.repository.TutorRepository;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminReviewService {
    private final AdminAccessService adminAccessService;
    private final TutorRepository tutorRepository;
    private final PostRepository postRepository;
    private final TutorCourseRepository tutorCourseRepository;
    private final NotificationService notificationService;
    private final IdentityVerificationService identityVerificationService;
    private final TutorSummaryMapper tutorSummaryMapper;
    private final AdminResponseMapper adminResponseMapper;

    @Transactional(readOnly = true)
    public PageResponse<TutorSummaryResponse> getPendingTutors(Long adminUserId, int page, int size) {
        adminAccessService.validateAdmin(adminUserId);
        var tutorPage = tutorRepository.findByProfileStatusOrderByCreatedAtDesc(
            TutorProfileStatus.PENDING,
            PaginationSupport.pageRequest(page, size)
        );
        return PaginationSupport.toPageResponse(
            tutorPage,
            tutorSummaryMapper.toSummaries(tutorPage.getContent())
        );
    }

    @Transactional(readOnly = true)
    public TutorSummaryResponse getTutorDetail(Long adminUserId, Long tutorId) {
        adminAccessService.validateAdmin(adminUserId);
        Tutor tutor = tutorRepository.findById(tutorId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy gia sư"));
        return tutorSummaryMapper.toSummary(tutor);
    }

    @Transactional
    public TutorSummaryResponse reviewTutor(Long tutorId, AdminReviewRequest request) {
        User admin = adminAccessService.validateAdmin(request.getAdminUserId());
        boolean approved = Boolean.TRUE.equals(request.getApproved());
        String rejectedReason = normalizeReviewReason(approved, request.getRejectedReason());
        Tutor tutor = tutorRepository.findById(tutorId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy gia sư"));
        if (tutor.getProfileStatus() != TutorProfileStatus.PENDING) {
            throw new AppException(HttpStatus.CONFLICT, "Hồ sơ gia sư đã được xử lý trước đó");
        }
        if (approved && !identityVerificationService.isIdentityApproved(tutor.getUser().getId())) {
            throw new AppException(HttpStatus.CONFLICT, "Gia sư chưa được xác minh danh tính, không thể phê duyệt hồ sơ");
        }
        tutor.setProfileStatus(approved ? TutorProfileStatus.APPROVED : TutorProfileStatus.REJECTED);
        tutor.setReviewedBy(admin);
        tutor.setReviewedAt(LocalDateTime.now());
        tutor.setRejectedReason(rejectedReason);
        tutor = tutorRepository.save(tutor);
        notificationService.push(
            tutor.getUser().getId(),
            approved ? "Hồ sơ gia sư đã được duyệt" : "Hồ sơ gia sư bị từ chối",
            approved ? "Hồ sơ gia sư của bạn đã được phê duyệt." : "Hồ sơ gia sư bị từ chối: " + rejectedReason,
            "TUTOR_PROFILE_REVIEW",
            "TUTOR",
            tutor.getId()
        );
        return tutorSummaryMapper.toSummary(tutor);
    }

    @Transactional(readOnly = true)
    public PageResponse<LearnerPostResponse> getPendingPosts(Long adminUserId, int page, int size) {
        adminAccessService.validateAdmin(adminUserId);
        var postPage = postRepository.findByApprovalStatusOrderByCreatedAtDesc(
            ApprovalStatus.PENDING,
            PaginationSupport.pageRequest(page, size)
        );
        return PaginationSupport.toPageResponse(
            postPage,
            postPage.getContent().stream().map(adminResponseMapper::toPostSummary).toList()
        );
    }

    @Transactional
    public LearnerPostResponse reviewPost(Long postId, AdminReviewRequest request) {
        User admin = adminAccessService.validateAdmin(request.getAdminUserId());
        boolean approved = Boolean.TRUE.equals(request.getApproved());
        String rejectedReason = normalizeReviewReason(approved, request.getRejectedReason());
        Post post = postRepository.findById(postId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy bài đăng"));
        if (post.getApprovalStatus() != ApprovalStatus.PENDING) {
            throw new AppException(HttpStatus.CONFLICT, "Bài đăng đã được xử lý trước đó");
        }
        post.setApprovalStatus(approved ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED);
        post.setApprovedBy(admin);
        post.setApprovedAt(LocalDateTime.now());
        post.setRejectedReason(rejectedReason);
        post = postRepository.save(post);
        notificationService.push(
            post.getLearnerUser().getId(),
            approved ? "Bài đăng đã được duyệt" : "Bài đăng bị từ chối",
            approved ? "Bài đăng của bạn đã được duyệt." : "Bài đăng bị từ chối: " + rejectedReason,
            "POST_REVIEW",
            "POST",
            post.getId()
        );
        return adminResponseMapper.toPostSummary(post);
    }

    @Transactional(readOnly = true)
    public PageResponse<TutorCourseResponse> getPendingCourses(Long adminUserId, int page, int size) {
        adminAccessService.validateAdmin(adminUserId);
        var coursePage = tutorCourseRepository.findByApprovalStatusOrderByCreatedAtDesc(
            ApprovalStatus.PENDING,
            PaginationSupport.pageRequest(page, size)
        );
        return PaginationSupport.toPageResponse(
            coursePage,
            coursePage.getContent().stream().map(adminResponseMapper::toCourseSummary).toList()
        );
    }

    @Transactional
    public TutorCourseResponse reviewCourse(Long courseId, AdminReviewRequest request) {
        User admin = adminAccessService.validateAdmin(request.getAdminUserId());
        boolean approved = Boolean.TRUE.equals(request.getApproved());
        String rejectedReason = normalizeReviewReason(approved, request.getRejectedReason());
        TutorCourse course = tutorCourseRepository.findById(courseId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy khóa học"));
        if (course.getApprovalStatus() != ApprovalStatus.PENDING) {
            throw new AppException(HttpStatus.CONFLICT, "Lớp/Khóa học đã được xử lý trước đó");
        }
        course.setApprovalStatus(approved ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED);
        course.setApprovedBy(admin);
        course.setApprovedAt(LocalDateTime.now());
        course.setRejectedReason(rejectedReason);
        course = tutorCourseRepository.save(course);
        notificationService.push(
            course.getTutor().getUser().getId(),
            approved ? "Lớp/Khóa học đã được duyệt" : "Lớp/Khóa học bị từ chối",
            approved ? "Lớp/Khóa học của bạn đã được duyệt." : "Lớp/Khóa học bị từ chối: " + rejectedReason,
            "COURSE_REVIEW",
            "COURSE",
            course.getId()
        );
        return adminResponseMapper.toCourseSummary(course);
    }

    private String normalizeReviewReason(boolean approved, String rejectedReason) {
        if (approved) {
            return null;
        }
        if (rejectedReason == null || rejectedReason.isBlank()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Vui lòng nhập lý do từ chối");
        }
        return rejectedReason.trim();
    }
}
