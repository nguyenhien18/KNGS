package com.conggiasu.service;

import com.conggiasu.dto.request.LearnerApplicationDecisionRequest;
import com.conggiasu.dto.response.PageResponse;
import com.conggiasu.dto.response.TutorApplicationResponse;
import com.conggiasu.entity.Application;
import com.conggiasu.entity.MatchedClass;
import com.conggiasu.entity.Post;
import com.conggiasu.entity.enums.ApplicationStatus;
import com.conggiasu.entity.enums.ApprovalStatus;
import com.conggiasu.entity.enums.MatchedClassStatus;
import com.conggiasu.entity.enums.PostStatus;
import com.conggiasu.exception.AppException;
import com.conggiasu.repository.ApplicationRepository;
import com.conggiasu.repository.MatchedClassRepository;
import com.conggiasu.repository.PostRepository;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class LearnerApplicationDecisionService {
    private final ApplicationRepository applicationRepository;
    private final MatchedClassRepository matchedClassRepository;
    private final PostRepository postRepository;
    private final NotificationService notificationService;
    private final LearnerResponseMapper mapper;

    @Transactional(readOnly = true)
    public PageResponse<TutorApplicationResponse> getPostApplications(
        Long learnerUserId, Long postId, int page, int size
    ) {
        Post post = postRepository.findByIdAndLearnerUserId(postId, learnerUserId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy bài đăng"));
        var applications = applicationRepository.findByPostIdOrderByCreatedAtDesc(
            post.getId(),
            PaginationSupport.pageRequest(page, size)
        );
        return PaginationSupport.toPageResponse(
            applications,
            applications.getContent().stream().map(mapper::toTutorApplication).toList()
        );
    }

    @Transactional
    public TutorApplicationResponse decideApplication(Long applicationId, LearnerApplicationDecisionRequest request) {
        Application application = applicationRepository.findById(applicationId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn ứng tuyển"));
        Post post = application.getPost();
        if (!post.getLearnerUser().getId().equals(request.getLearnerUserId())) {
            throw new AppException(HttpStatus.FORBIDDEN, "Bạn không có quyền xử lý đơn này");
        }
        if (application.getStatus() != ApplicationStatus.PENDING) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Đơn đã được xử lý");
        }
        if (post.getApprovalStatus() != ApprovalStatus.APPROVED || post.getStatus() != PostStatus.OPEN) {
            throw new AppException(HttpStatus.CONFLICT, "Bài đăng không ở trạng thái cho phép xử lý đơn");
        }

        if (Boolean.TRUE.equals(request.getAccepted())) {
            acceptApplication(application, post, request);
        } else {
            rejectApplication(application, post);
        }
        return mapper.toTutorApplication(application);
    }

    private void acceptApplication(Application application, Post post, LearnerApplicationDecisionRequest request) {
        validateClassDateRange(request);
        MatchedClass existingClass = matchedClassRepository.findByPostId(post.getId()).orElse(null);
        if (existingClass != null && existingClass.getStatus() != MatchedClassStatus.CANCELLED) {
            throw new AppException(HttpStatus.CONFLICT, "Bài đăng này đã được ghép lớp");
        }
        application.setStatus(ApplicationStatus.ACCEPTED);
        applicationRepository.save(application);

        List<Application> pendingOthers = applicationRepository.findByPostIdAndStatus(post.getId(), ApplicationStatus.PENDING);
        for (Application other : pendingOthers) {
            if (!other.getId().equals(application.getId())) {
                other.setStatus(ApplicationStatus.REJECTED);
            }
        }
        applicationRepository.saveAll(pendingOthers);

        MatchedClass matchedClass = existingClass != null
            ? existingClass
            : matchedClassRepository.findByApplicationId(application.getId()).orElseGet(MatchedClass::new);
        if (matchedClass.getApplication() != null && !matchedClass.getApplication().getId().equals(application.getId())) {
            Application previous = matchedClass.getApplication();
            if (previous.getStatus() == ApplicationStatus.ACCEPTED) {
                previous.setStatus(ApplicationStatus.CANCELLED);
                applicationRepository.save(previous);
            }
        }
        matchedClass.setPost(post);
        matchedClass.setApplication(application);
        matchedClass.setStartDate(request.getStartDate());
        matchedClass.setEndDate(request.getEndDate());
        matchedClass.setStatus(MatchedClassStatus.ASSIGNED);
        matchedClass.setAssignedAt(LocalDateTime.now());
        matchedClass.setCompletedAt(null);
        matchedClass.setCancelledAt(null);
        matchedClass.setStatusRequestedByUserId(null);
        matchedClass.setStatusRequestedByRole(null);
        matchedClass.setStatusRequestedAt(null);
        matchedClass.setStatusRequestReason(null);
        matchedClassRepository.save(matchedClass);
        syncPostStatus(post, MatchedClassStatus.ASSIGNED);
        notificationService.push(
            application.getTutor().getUser().getId(),
            "Đơn ứng tuyển được chấp nhận",
            "Đơn ứng tuyển của bạn cho bài đăng \"" + post.getTitle() + "\" đã được chấp nhận.",
            "APPLICATION_DECISION",
            "APPLICATION",
            application.getId()
        );
    }

    private void rejectApplication(Application application, Post post) {
        application.setStatus(ApplicationStatus.REJECTED);
        applicationRepository.save(application);
        notificationService.push(
            application.getTutor().getUser().getId(),
            "Đơn ứng tuyển bị từ chối",
            "Đơn ứng tuyển của bạn cho bài đăng \"" + post.getTitle() + "\" đã bị từ chối.",
            "APPLICATION_DECISION",
            "APPLICATION",
            application.getId()
        );
    }

    private void validateClassDateRange(LearnerApplicationDecisionRequest request) {
        if (request.getStartDate() != null
            && request.getEndDate() != null
            && request.getEndDate().isBefore(request.getStartDate())) {
            throw new AppException(HttpStatus.BAD_REQUEST, "endDate không được nhỏ hơn startDate");
        }
    }

    private void syncPostStatus(Post post, MatchedClassStatus classStatus) {
        if (post == null) {
            return;
        }
        if (classStatus == MatchedClassStatus.ASSIGNED) {
            post.setStatus(PostStatus.ASSIGNED);
        } else if (classStatus == MatchedClassStatus.IN_PROGRESS) {
            post.setStatus(PostStatus.IN_PROGRESS);
        } else if (classStatus == MatchedClassStatus.COMPLETED) {
            post.setStatus(PostStatus.COMPLETED);
        } else if (classStatus == MatchedClassStatus.CANCELLED) {
            post.setStatus(PostStatus.OPEN);
        }
        postRepository.save(post);
    }
}
