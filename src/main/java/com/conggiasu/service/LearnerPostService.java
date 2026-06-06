package com.conggiasu.service;

import com.conggiasu.dto.request.PostUpsertRequest;
import com.conggiasu.dto.response.LearnerPostResponse;
import com.conggiasu.dto.response.PageResponse;
import com.conggiasu.entity.Grade;
import com.conggiasu.entity.Post;
import com.conggiasu.entity.Subject;
import com.conggiasu.entity.User;
import com.conggiasu.entity.enums.ApprovalStatus;
import com.conggiasu.entity.enums.PostStatus;
import com.conggiasu.entity.enums.UserRole;
import com.conggiasu.exception.AppException;
import com.conggiasu.repository.GradeRepository;
import com.conggiasu.repository.PostRepository;
import com.conggiasu.repository.SubjectRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class LearnerPostService {
    private final LearnerAccessService learnerAccessService;
    private final SubjectRepository subjectRepository;
    private final GradeRepository gradeRepository;
    private final PostRepository postRepository;
    private final NotificationService notificationService;
    private final LearnerResponseMapper mapper;

    @Value("${app.limits.learner-posts-per-day:4}")
    private int learnerPostsPerDayLimit;

    @Transactional
    public LearnerPostResponse createPost(PostUpsertRequest request) {
        User learner = learnerAccessService.validateLearner(request.getLearnerUserId());
        learnerAccessService.ensureLearnerIdentityApproved(learner.getId());
        ensureLearnerDailyPostLimit(learner.getId());
        Subject subject = subjectRepository.findById(request.getSubjectId())
            .orElseThrow(() -> new AppException(HttpStatus.BAD_REQUEST, "subjectId không hợp lệ"));
        Grade grade = gradeRepository.findById(request.getGradeId())
            .orElseThrow(() -> new AppException(HttpStatus.BAD_REQUEST, "gradeId không hợp lệ"));

        Post post = new Post();
        post.setLearnerUser(learner);
        mapper.applyPost(post, request, subject, grade);
        post.setApprovalStatus(ApprovalStatus.PENDING);
        post.setStatus(PostStatus.OPEN);
        post = postRepository.save(post);
        notificationService.pushToRole(
            UserRole.ADMIN,
            "Có bài đăng học viên cần duyệt",
            "Bài đăng \"" + post.getTitle() + "\" vừa được tạo và đang chờ duyệt.",
            "POST_PENDING_REVIEW",
            "POST",
            post.getId()
        );
        return mapper.toLearnerPost(post);
    }

    @Transactional
    public LearnerPostResponse updatePost(Long postId, PostUpsertRequest request) {
        Post post = postRepository.findByIdAndLearnerUserId(postId, request.getLearnerUserId())
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy bài đăng"));
        if (post.getStatus() != PostStatus.OPEN) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Chỉ được sửa bài đăng đang mở");
        }
        Subject subject = subjectRepository.findById(request.getSubjectId())
            .orElseThrow(() -> new AppException(HttpStatus.BAD_REQUEST, "subjectId không hợp lệ"));
        Grade grade = gradeRepository.findById(request.getGradeId())
            .orElseThrow(() -> new AppException(HttpStatus.BAD_REQUEST, "gradeId không hợp lệ"));

        mapper.applyPost(post, request, subject, grade);
        post.setApprovalStatus(ApprovalStatus.PENDING);
        post = postRepository.save(post);
        notificationService.pushToRole(
            UserRole.ADMIN,
            "Có bài đăng học viên cần duyệt",
            "Bài đăng \"" + post.getTitle() + "\" vừa được cập nhật và đang chờ duyệt lại.",
            "POST_PENDING_REVIEW",
            "POST",
            post.getId()
        );
        return mapper.toLearnerPost(post);
    }

    @Transactional
    public LearnerPostResponse cancelPost(Long learnerUserId, Long postId) {
        Post post = postRepository.findByIdAndLearnerUserId(postId, learnerUserId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy bài đăng"));
        if (post.getStatus() == PostStatus.COMPLETED
            || post.getStatus() == PostStatus.CLOSED
            || post.getStatus() == PostStatus.ASSIGNED
            || post.getStatus() == PostStatus.IN_PROGRESS) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Không thể hủy bài đăng đã được nhận/đang diễn ra/đã hoàn thành");
        }
        post.setStatus(PostStatus.CANCELLED);
        return mapper.toLearnerPost(postRepository.save(post));
    }

    @Transactional(readOnly = true)
    public PageResponse<LearnerPostResponse> getPosts(
        Long learnerUserId, ApprovalStatus approvalStatus, int page, int size
    ) {
        learnerAccessService.validateLearner(learnerUserId);
        var posts = approvalStatus == null
            ? postRepository.findByLearnerUserIdOrderByCreatedAtDesc(learnerUserId, PaginationSupport.pageRequest(page, size))
            : postRepository.findByLearnerUserIdAndApprovalStatusOrderByCreatedAtDesc(
                learnerUserId, approvalStatus, PaginationSupport.pageRequest(page, size)
            );
        return PaginationSupport.toPageResponse(
            posts,
            posts.getContent().stream().map(mapper::toLearnerPost).toList()
        );
    }

    private void ensureLearnerDailyPostLimit(Long learnerUserId) {
        if (learnerPostsPerDayLimit <= 0) {
            return;
        }
        LocalDateTime startOfDay = LocalDate.now(ZoneId.of("Asia/Bangkok")).atStartOfDay();
        LocalDateTime startOfNextDay = startOfDay.plusDays(1);
        long createdToday = postRepository.countByLearnerUserIdAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(
            learnerUserId,
            startOfDay,
            startOfNextDay
        );
        if (createdToday >= learnerPostsPerDayLimit) {
            throw new AppException(
                HttpStatus.TOO_MANY_REQUESTS,
                "Mỗi ngày học viên chỉ được tạo tối đa " + learnerPostsPerDayLimit + " bài đăng."
            );
        }
    }
}
