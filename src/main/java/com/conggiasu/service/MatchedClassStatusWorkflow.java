package com.conggiasu.service;

import com.conggiasu.entity.MatchedClass;
import com.conggiasu.entity.Post;
import com.conggiasu.entity.enums.ApplicationStatus;
import com.conggiasu.entity.enums.MatchedClassStatus;
import com.conggiasu.entity.enums.PostStatus;
import com.conggiasu.entity.enums.UserRole;
import com.conggiasu.exception.AppException;
import com.conggiasu.repository.ApplicationRepository;
import com.conggiasu.repository.PostRepository;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MatchedClassStatusWorkflow {
    private static final int MAX_REASON_LENGTH = 1000;

    private final ApplicationRepository applicationRepository;
    private final PostRepository postRepository;
    private final NotificationService notificationService;

    public void apply(
        MatchedClass matchedClass,
        MatchedClassStatus target,
        Long actorUserId,
        UserRole actorRole,
        String reason
    ) {
        if (target == null) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Trạng thái lớp không hợp lệ");
        }

        validateActor(matchedClass, actorUserId, actorRole);
        MatchedClassStatus current = matchedClass.getStatus();
        if (current == target) {
            return;
        }

        if (target == MatchedClassStatus.IN_PROGRESS) {
            startClass(matchedClass, current);
            return;
        }
        if (target == MatchedClassStatus.COMPLETED || target == MatchedClassStatus.COMPLETION_REQUESTED) {
            handleCompletion(matchedClass, current, target, actorUserId, actorRole, reason);
            return;
        }
        if (target == MatchedClassStatus.CANCELLED || target == MatchedClassStatus.CANCELLATION_REQUESTED) {
            handleCancellation(matchedClass, current, target, actorUserId, actorRole, reason);
            return;
        }

        throw invalidTransition(current, target);
    }

    private void startClass(MatchedClass matchedClass, MatchedClassStatus current) {
        if (current != MatchedClassStatus.ASSIGNED) {
            throw invalidTransition(current, MatchedClassStatus.IN_PROGRESS);
        }
        matchedClass.setStatus(MatchedClassStatus.IN_PROGRESS);
        if (matchedClass.getAssignedAt() == null) {
            matchedClass.setAssignedAt(LocalDateTime.now());
        }
        clearRequestFields(matchedClass);
        syncPostStatus(matchedClass.getPost(), MatchedClassStatus.IN_PROGRESS);
    }

    private void handleCompletion(
        MatchedClass matchedClass,
        MatchedClassStatus current,
        MatchedClassStatus target,
        Long actorUserId,
        UserRole actorRole,
        String reason
    ) {
        if (current == MatchedClassStatus.IN_PROGRESS) {
            requestStatusChange(
                matchedClass,
                MatchedClassStatus.COMPLETION_REQUESTED,
                actorUserId,
                actorRole,
                reason,
                "hoàn thành"
            );
            return;
        }
        if (current == MatchedClassStatus.COMPLETION_REQUESTED
            && target == MatchedClassStatus.COMPLETED) {
            confirmStatusChange(matchedClass, actorUserId, MatchedClassStatus.COMPLETED, "hoàn thành");
            return;
        }
        throw invalidTransition(current, target);
    }

    private void handleCancellation(
        MatchedClass matchedClass,
        MatchedClassStatus current,
        MatchedClassStatus target,
        Long actorUserId,
        UserRole actorRole,
        String reason
    ) {
        if (current == MatchedClassStatus.ASSIGNED || current == MatchedClassStatus.IN_PROGRESS) {
            requestStatusChange(
                matchedClass,
                MatchedClassStatus.CANCELLATION_REQUESTED,
                actorUserId,
                actorRole,
                reason,
                "hủy"
            );
            return;
        }
        if (current == MatchedClassStatus.CANCELLATION_REQUESTED
            && target == MatchedClassStatus.CANCELLED) {
            confirmStatusChange(matchedClass, actorUserId, MatchedClassStatus.CANCELLED, "hủy");
            return;
        }
        throw invalidTransition(current, target);
    }

    private void requestStatusChange(
        MatchedClass matchedClass,
        MatchedClassStatus requestedStatus,
        Long actorUserId,
        UserRole actorRole,
        String reason,
        String actionLabel
    ) {
        matchedClass.setStatus(requestedStatus);
        matchedClass.setStatusRequestedByUserId(actorUserId);
        matchedClass.setStatusRequestedByRole(actorRole);
        matchedClass.setStatusRequestedAt(LocalDateTime.now());
        matchedClass.setStatusRequestReason(normalizeReason(reason));

        Long receiverUserId = otherUserId(matchedClass, actorUserId, actorRole);
        notificationService.push(
            receiverUserId,
            "Cần xác nhận trạng thái lớp",
            roleLabel(actorRole) + " đã yêu cầu " + actionLabel + " lớp \"" + classTitle(matchedClass)
                + "\". Vui lòng xác nhận.",
            "MATCHED_CLASS_STATUS_REQUEST",
            "MATCHED_CLASS",
            matchedClass.getId()
        );
    }

    private void confirmStatusChange(
        MatchedClass matchedClass,
        Long actorUserId,
        MatchedClassStatus finalStatus,
        String actionLabel
    ) {
        Long requesterUserId = matchedClass.getStatusRequestedByUserId();
        if (requesterUserId == null) {
            throw new AppException(HttpStatus.CONFLICT, "Chưa có yêu cầu cần xác nhận");
        }
        if (requesterUserId.equals(actorUserId)) {
            throw new AppException(HttpStatus.CONFLICT, "Bên còn lại cần xác nhận yêu cầu này");
        }

        matchedClass.setStatus(finalStatus);
        if (finalStatus == MatchedClassStatus.COMPLETED) {
            matchedClass.setCompletedAt(LocalDateTime.now());
        } else if (finalStatus == MatchedClassStatus.CANCELLED) {
            matchedClass.setCancelledAt(LocalDateTime.now());
            if (matchedClass.getApplication() != null) {
                matchedClass.getApplication().setStatus(ApplicationStatus.CANCELLED);
                applicationRepository.save(matchedClass.getApplication());
            }
        }
        clearRequestFields(matchedClass);
        syncPostStatus(matchedClass.getPost(), finalStatus);
        notificationService.push(
            requesterUserId,
            "Trạng thái lớp đã được xác nhận",
            "Yêu cầu " + actionLabel + " lớp \"" + classTitle(matchedClass) + "\" đã được xác nhận.",
            "MATCHED_CLASS_STATUS_CONFIRMED",
            "MATCHED_CLASS",
            matchedClass.getId()
        );
    }

    private void validateActor(MatchedClass matchedClass, Long actorUserId, UserRole actorRole) {
        otherUserId(matchedClass, actorUserId, actorRole);
    }

    private Long otherUserId(MatchedClass matchedClass, Long actorUserId, UserRole actorRole) {
        Long learnerUserId = learnerUserId(matchedClass);
        Long tutorUserId = tutorUserId(matchedClass);
        if (actorRole == UserRole.LEARNER && learnerUserId.equals(actorUserId)) {
            return tutorUserId;
        }
        if (actorRole == UserRole.TUTOR && tutorUserId.equals(actorUserId)) {
            return learnerUserId;
        }
        throw new AppException(HttpStatus.FORBIDDEN, "Bạn không thuộc lớp này");
    }

    private Long learnerUserId(MatchedClass matchedClass) {
        return matchedClass.getPost().getLearnerUser().getId();
    }

    private Long tutorUserId(MatchedClass matchedClass) {
        return matchedClass.getApplication().getTutor().getUser().getId();
    }

    private void clearRequestFields(MatchedClass matchedClass) {
        matchedClass.setStatusRequestedByUserId(null);
        matchedClass.setStatusRequestedByRole(null);
        matchedClass.setStatusRequestedAt(null);
        matchedClass.setStatusRequestReason(null);
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

    private String normalizeReason(String reason) {
        if (reason == null) {
            return null;
        }
        String trimmed = reason.trim();
        if (trimmed.isEmpty()) {
            return null;
        }
        if (trimmed.length() > MAX_REASON_LENGTH) {
            return trimmed.substring(0, MAX_REASON_LENGTH);
        }
        return trimmed;
    }

    private String roleLabel(UserRole role) {
        if (role == UserRole.TUTOR) {
            return "Gia sư";
        }
        if (role == UserRole.LEARNER) {
            return "Học viên";
        }
        return "Người dùng";
    }

    private String classTitle(MatchedClass matchedClass) {
        if (matchedClass.getPost() == null || matchedClass.getPost().getTitle() == null) {
            return "lớp học";
        }
        return matchedClass.getPost().getTitle();
    }

    private AppException invalidTransition(MatchedClassStatus current, MatchedClassStatus target) {
        return new AppException(HttpStatus.CONFLICT, "Không thể chuyển trạng thái lớp từ " + current + " sang " + target);
    }
}
