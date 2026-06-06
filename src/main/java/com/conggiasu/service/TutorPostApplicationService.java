package com.conggiasu.service;

import com.conggiasu.dto.request.TutorApplyRequest;
import com.conggiasu.dto.response.AvailablePostResponse;
import com.conggiasu.dto.response.PageResponse;
import com.conggiasu.dto.response.TutorApplicationResponse;
import com.conggiasu.entity.Application;
import com.conggiasu.entity.Post;
import com.conggiasu.entity.Tutor;
import com.conggiasu.entity.enums.ApplicationStatus;
import com.conggiasu.entity.enums.ApprovalStatus;
import com.conggiasu.entity.enums.PostStatus;
import com.conggiasu.entity.enums.TeachingMode;
import com.conggiasu.entity.enums.TutorProfileStatus;
import com.conggiasu.exception.AppException;
import com.conggiasu.repository.ApplicationRepository;
import com.conggiasu.repository.PostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TutorPostApplicationService {
    private final TutorAccessService tutorAccessService;
    private final PostRepository postRepository;
    private final ApplicationRepository applicationRepository;
    private final NotificationService notificationService;
    private final TutorFeatureMapper mapper;

    @Transactional(readOnly = true)
    public PageResponse<AvailablePostResponse> getAvailablePosts(
        String keyword,
        Long subjectId,
        Long gradeId,
        TeachingMode teachingMode,
        String province,
        String district,
        int page,
        int size
    ) {
        Specification<Post> spec = Specification.where((root, query, cb) ->
            cb.and(
                cb.equal(root.get("approvalStatus"), ApprovalStatus.APPROVED),
                cb.equal(root.get("status"), PostStatus.OPEN)
            )
        );
        if (keyword != null && !keyword.isBlank()) {
            String kw = "%" + keyword.trim().toLowerCase() + "%";
            spec = spec.and((root, query, cb) -> cb.or(
                cb.like(cb.lower(root.get("title")), kw),
                cb.like(cb.lower(root.get("description")), kw)
            ));
        }
        if (subjectId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("subject").get("id"), subjectId));
        }
        if (gradeId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("grade").get("id"), gradeId));
        }
        if (teachingMode != null) {
            spec = spec.and((root, query, cb) -> {
                if (teachingMode == TeachingMode.ONLINE || teachingMode == TeachingMode.OFFLINE) {
                    return cb.or(
                        cb.equal(root.get("teachingMode"), teachingMode),
                        cb.equal(root.get("teachingMode"), TeachingMode.BOTH)
                    );
                }
                return cb.equal(root.get("teachingMode"), teachingMode);
            });
        }
        if (province != null && !province.isBlank()) {
            String pv = "%" + province.trim().toLowerCase() + "%";
            spec = spec.and((root, query, cb) -> cb.like(cb.lower(root.get("province")), pv));
        }
        if (district != null && !district.isBlank()) {
            String dt = "%" + district.trim().toLowerCase() + "%";
            spec = spec.and((root, query, cb) -> cb.like(cb.lower(root.get("district")), dt));
        }

        var postPage = postRepository.findAll(
            spec,
            PaginationSupport.pageRequest(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))
        );
        return PaginationSupport.toPageResponse(
            postPage,
            postPage.getContent().stream().map(mapper::toAvailablePost).toList()
        );
    }

    @Transactional(readOnly = true)
    public AvailablePostResponse getAvailablePostDetail(Long postId) {
        Post post = postRepository.findById(postId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy bài đăng"));
        if (post.getApprovalStatus() != ApprovalStatus.APPROVED || post.getStatus() != PostStatus.OPEN) {
            throw new AppException(HttpStatus.NOT_FOUND, "Bài đăng không khả dụng");
        }
        return mapper.toAvailablePost(post);
    }

    @Transactional
    public TutorApplicationResponse applyToPost(Long postId, TutorApplyRequest request) {
        Tutor tutor = tutorAccessService.findTutor(request.getTutorId());
        if (tutor.getProfileStatus() != TutorProfileStatus.APPROVED) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Hồ sơ gia sư chưa được duyệt");
        }

        Post post = postRepository.findById(postId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy bài đăng"));
        if (post.getApprovalStatus() != ApprovalStatus.APPROVED || post.getStatus() != PostStatus.OPEN) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Bài đăng không còn nhận ứng tuyển");
        }

        Application existing = applicationRepository.findByPostIdAndTutorId(postId, tutor.getId()).orElse(null);
        if (existing != null) {
            if (existing.getStatus() != ApplicationStatus.CANCELLED && existing.getStatus() != ApplicationStatus.REJECTED) {
                throw new AppException(HttpStatus.CONFLICT, "Bạn đã ứng tuyển bài đăng này");
            }
            existing.setMessage(request.getMessage());
            existing.setExpectedFee(request.getExpectedFee());
            existing.setStatus(ApplicationStatus.PENDING);
            existing = applicationRepository.save(existing);
            notifyApplication(post, existing.getId(), "Bài đăng \"" + post.getTitle() + "\" vừa có gia sư ứng tuyển lại.");
            return mapper.toApplicationResponse(existing);
        }

        Application app = new Application();
        app.setPost(post);
        app.setTutor(tutor);
        app.setMessage(request.getMessage());
        app.setExpectedFee(request.getExpectedFee());
        app.setStatus(ApplicationStatus.PENDING);
        app = applicationRepository.save(app);
        notifyApplication(post, app.getId(), "Bài đăng \"" + post.getTitle() + "\" vừa có gia sư ứng tuyển.");
        return mapper.toApplicationResponse(app);
    }

    @Transactional
    public TutorApplicationResponse applyToPostByUser(Long postId, Long tutorUserId, TutorApplyRequest request) {
        request.setTutorId(tutorAccessService.findTutorIdByUserId(tutorUserId));
        return applyToPost(postId, request);
    }

    @Transactional
    public TutorApplicationResponse cancelApplication(Long tutorId, Long applicationId) {
        Application app = applicationRepository.findByIdAndTutorId(applicationId, tutorId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn ứng tuyển"));
        if (app.getStatus() != ApplicationStatus.PENDING) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Chỉ được hủy đơn đang chờ");
        }
        app.setStatus(ApplicationStatus.CANCELLED);
        return mapper.toApplicationResponse(applicationRepository.save(app));
    }

    @Transactional
    public TutorApplicationResponse cancelApplicationByUser(Long tutorUserId, Long applicationId) {
        return cancelApplication(tutorAccessService.findTutorIdByUserId(tutorUserId), applicationId);
    }

    @Transactional(readOnly = true)
    public PageResponse<TutorApplicationResponse> getApplications(Long tutorId, ApplicationStatus status, int page, int size) {
        tutorAccessService.findTutor(tutorId);
        var apps = status == null
            ? applicationRepository.findByTutorIdOrderByCreatedAtDesc(tutorId, PaginationSupport.pageRequest(page, size))
            : applicationRepository.findByTutorIdAndStatusOrderByCreatedAtDesc(tutorId, status, PaginationSupport.pageRequest(page, size));
        return PaginationSupport.toPageResponse(
            apps,
            apps.getContent().stream().map(mapper::toApplicationResponse).toList()
        );
    }

    @Transactional(readOnly = true)
    public PageResponse<TutorApplicationResponse> getApplicationsByUser(
        Long tutorUserId, ApplicationStatus status, int page, int size
    ) {
        return getApplications(tutorAccessService.findTutorIdByUserId(tutorUserId), status, page, size);
    }

    private void notifyApplication(Post post, Long applicationId, String content) {
        notificationService.push(
            post.getLearnerUser().getId(),
            "Có gia sư mới ứng tuyển",
            content,
            "APPLICATION_NEW",
            "APPLICATION",
            applicationId
        );
    }
}
