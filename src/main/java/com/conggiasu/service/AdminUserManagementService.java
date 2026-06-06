package com.conggiasu.service;

import com.conggiasu.dto.request.AdminUserStatusUpdateRequest;
import com.conggiasu.dto.response.AdminStatsResponse;
import com.conggiasu.dto.response.AdminUserResponse;
import com.conggiasu.dto.response.PageResponse;
import com.conggiasu.entity.User;
import com.conggiasu.entity.enums.ApprovalStatus;
import com.conggiasu.entity.enums.TutorProfileStatus;
import com.conggiasu.entity.enums.UserRole;
import com.conggiasu.entity.enums.UserStatus;
import com.conggiasu.exception.AppException;
import com.conggiasu.mapper.AdminResponseMapper;
import com.conggiasu.repository.PostRepository;
import com.conggiasu.repository.TutorCourseRepository;
import com.conggiasu.repository.TutorRepository;
import com.conggiasu.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminUserManagementService {
    private final AdminAccessService adminAccessService;
    private final UserRepository userRepository;
    private final TutorRepository tutorRepository;
    private final PostRepository postRepository;
    private final TutorCourseRepository tutorCourseRepository;
    private final NotificationService notificationService;
    private final AdminResponseMapper adminResponseMapper;

    @Transactional(readOnly = true)
    public PageResponse<AdminUserResponse> getUsers(UserRole role, UserStatus status, int page, int size) {
        Page<User> users;
        var pageable = PaginationSupport.pageRequest(page, size);
        if (role != null && status != null) {
            users = userRepository.findByRoleAndStatusOrderByCreatedAtDesc(role, status, pageable);
        } else if (role != null) {
            users = userRepository.findByRoleOrderByCreatedAtDesc(role, pageable);
        } else if (status != null) {
            users = userRepository.findByStatusOrderByCreatedAtDesc(status, pageable);
        } else {
            users = userRepository.findAllByOrderByCreatedAtDesc(pageable);
        }
        return PaginationSupport.toPageResponse(
            users,
            users.getContent().stream().map(adminResponseMapper::toAdminUser).toList()
        );
    }

    @Transactional
    public AdminUserResponse updateUserStatus(Long userId, AdminUserStatusUpdateRequest request) {
        adminAccessService.validateAdmin(request.getAdminUserId());
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng"));
        user.setStatus(request.getStatus());
        user = userRepository.save(user);
        notificationService.push(
            user.getId(),
            "Tài khoản được cập nhật",
            "Trạng thái tài khoản của bạn đã được cập nhật thành " + user.getStatus(),
            "USER_STATUS",
            "USER",
            user.getId()
        );
        return adminResponseMapper.toAdminUser(user);
    }

    @Transactional(readOnly = true)
    public AdminStatsResponse getStats(Long adminUserId) {
        adminAccessService.validateAdmin(adminUserId);
        return AdminStatsResponse.builder()
            .totalUsers(userRepository.count())
            .totalTutors(userRepository.countByRole(UserRole.TUTOR))
            .pendingTutorProfiles(tutorRepository.countByProfileStatus(TutorProfileStatus.PENDING))
            .pendingPosts(postRepository.countByApprovalStatus(ApprovalStatus.PENDING))
            .pendingCourses(tutorCourseRepository.countByApprovalStatus(ApprovalStatus.PENDING))
            .build();
    }
}
