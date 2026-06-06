package com.conggiasu.controller;

import com.conggiasu.dto.response.ApiResponse;
import com.conggiasu.dto.response.NotificationResponse;
import com.conggiasu.dto.response.PageResponse;
import com.conggiasu.service.CurrentUserService;
import com.conggiasu.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Slf4j
public class NotificationController {
    private final NotificationService notificationService;
    private final CurrentUserService currentUserService;

    @GetMapping
    public ApiResponse<PageResponse<NotificationResponse>> getMyNotifications(
        @RequestParam(required = false) Boolean unreadOnly,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size
    ) {
        return ApiResponse.<PageResponse<NotificationResponse>>builder()
            .code(200)
            .message("Thành công")
            .result(notificationService.myNotifications(currentUserService.userId(), unreadOnly, page, size))
            .build();
    }

    @PatchMapping("/{id}/read")
    public ApiResponse<NotificationResponse> markRead(@PathVariable Long id) {
        return ApiResponse.<NotificationResponse>builder()
            .code(200)
            .message("Thành công")
            .result(notificationService.markRead(currentUserService.userId(), id))
            .build();
    }

    @PatchMapping("/read-all")
    public ApiResponse<Void> markAllAsRead() {
        notificationService.markAllRead(currentUserService.userId());
        return ApiResponse.<Void>builder()
            .code(200)
            .message("Thành công")
            .build();
    }
}
