package com.conggiasu.controller;

import com.conggiasu.dto.response.ApiResponse;
import com.conggiasu.dto.response.NotificationResponse;
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

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Slf4j
public class NotificationController {
    private final NotificationService notificationService;
    private final CurrentUserService currentUserService;

    @GetMapping
    public ApiResponse<List<NotificationResponse>> getMyNotifications(@RequestParam(required = false) Boolean unreadOnly) {
        return ApiResponse.<List<NotificationResponse>>builder()
            .code(200)
            .message("Success")
            .result(notificationService.myNotifications(currentUserService.userId(), unreadOnly))
            .build();
    }

    @PatchMapping("/{id}/read")
    public ApiResponse<NotificationResponse> markRead(@PathVariable Long id) {
        return ApiResponse.<NotificationResponse>builder()
            .code(200)
            .message("Success")
            .result(notificationService.markRead(currentUserService.userId(), id))
            .build();
    }

    @PatchMapping("/read-all")
    public ApiResponse<Void> markAllAsRead() {
        notificationService.markAllRead(currentUserService.userId());
        return ApiResponse.<Void>builder()
            .code(200)
            .message("Success")
            .build();
    }
}
