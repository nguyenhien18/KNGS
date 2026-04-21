package com.conggiasu.service;

import com.conggiasu.dto.response.NotificationResponse;
import com.conggiasu.entity.Notification;
import com.conggiasu.entity.User;
import com.conggiasu.entity.enums.UserRole;
import com.conggiasu.exception.AppException;
import com.conggiasu.repository.NotificationRepository;
import com.conggiasu.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Transactional
    public void push(Long userId, String title, String content, String type, String referenceType, Long referenceId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Khong tim thay user de gui thong bao"));
        Notification n = new Notification();
        n.setUser(user);
        n.setTitle(title);
        n.setContent(content);
        n.setType(type);
        n.setReferenceType(referenceType);
        n.setReferenceId(referenceId);
        n.setIsRead(false);
        notificationRepository.save(n);
    }

    @Transactional
    public void pushToRole(UserRole role, String title, String content, String type, String referenceType, Long referenceId) {
        List<User> users = userRepository.findByRoleOrderByCreatedAtDesc(role);
        if (users.isEmpty()) {
            return;
        }
        for (User user : users) {
            Notification n = new Notification();
            n.setUser(user);
            n.setTitle(title);
            n.setContent(content);
            n.setType(type);
            n.setReferenceType(referenceType);
            n.setReferenceId(referenceId);
            n.setIsRead(false);
            notificationRepository.save(n);
        }
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> myNotifications(Long userId, Boolean unreadOnly) {
        List<Notification> list = Boolean.TRUE.equals(unreadOnly)
            ? notificationRepository.findByUserIdAndIsReadOrderByCreatedAtDesc(userId, false)
            : notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return list.stream().map(this::toResponse).toList();
    }

    @Transactional
    public NotificationResponse markRead(Long userId, Long notificationId) {
        Notification n = notificationRepository.findByIdAndUserId(notificationId, userId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Khong tim thay thong bao"));
        n.setIsRead(true);
        n.setReadAt(LocalDateTime.now());
        return toResponse(notificationRepository.save(n));
    }

    @Transactional
    public void markAllRead(Long userId) {
        notificationRepository.markAllReadByUserId(userId, LocalDateTime.now());
    }

    private NotificationResponse toResponse(Notification n) {
        return NotificationResponse.builder()
            .id(n.getId())
            .title(n.getTitle())
            .content(n.getContent())
            .type(n.getType())
            .referenceType(n.getReferenceType())
            .referenceId(n.getReferenceId())
            .isRead(n.getIsRead())
            .readAt(n.getReadAt())
            .createdAt(n.getCreatedAt())
            .build();
    }
}


