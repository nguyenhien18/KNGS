package com.conggiasu.service;

import com.conggiasu.dto.request.AdminReviewRequest;
import com.conggiasu.dto.request.AdminUserStatusUpdateRequest;
import com.conggiasu.dto.response.AdminStatsResponse;
import com.conggiasu.dto.response.AdminUserResponse;
import com.conggiasu.dto.response.LearnerPostResponse;
import com.conggiasu.dto.response.TutorCourseResponse;
import com.conggiasu.dto.response.TutorSummaryResponse;
import com.conggiasu.entity.enums.ApprovalStatus;
import com.conggiasu.entity.enums.TutorProfileStatus;
import com.conggiasu.entity.enums.UserRole;
import com.conggiasu.entity.enums.UserStatus;
import com.conggiasu.entity.Grade;
import com.conggiasu.entity.Post;
import com.conggiasu.entity.Subject;
import com.conggiasu.entity.Tutor;
import com.conggiasu.entity.TutorCourse;
import com.conggiasu.entity.User;
import com.conggiasu.mapper.AdminResponseMapper;
import com.conggiasu.mapper.TutorSummaryMapper;
import com.conggiasu.exception.AppException;
import com.conggiasu.repository.PostRepository;
import com.conggiasu.repository.TutorCourseRepository;
import com.conggiasu.repository.TutorRepository;
import com.conggiasu.repository.UserRepository;
import com.conggiasu.repository.GradeRepository;
import com.conggiasu.repository.SubjectRepository;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminService {
    private final UserRepository userRepository;
    private final TutorRepository tutorRepository;
    private final PostRepository postRepository;
    private final TutorCourseRepository tutorCourseRepository;
    private final SubjectRepository subjectRepository;
    private final GradeRepository gradeRepository;
    private final NotificationService notificationService;
    private final IdentityVerificationService identityVerificationService;
    private final TutorSummaryMapper tutorSummaryMapper;
    private final AdminResponseMapper adminResponseMapper;

    @Transactional(readOnly = true)
    public List<AdminUserResponse> getUsers(UserRole role, UserStatus status) {
        List<User> users;
        if (role != null && status != null) {
            users = userRepository.findByRoleAndStatusOrderByCreatedAtDesc(role, status);
        } else if (role != null) {
            users = userRepository.findByRoleOrderByCreatedAtDesc(role);
        } else if (status != null) {
            users = userRepository.findByStatusOrderByCreatedAtDesc(status);
        } else {
            users = userRepository.findAllByOrderByCreatedAtDesc();
        }
        return users.stream().map(adminResponseMapper::toAdminUser).toList();
    }

    @Transactional
    public AdminUserResponse updateUserStatus(Long userId, AdminUserStatusUpdateRequest request) {
        validateAdmin(request.getAdminUserId());
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Khong tim thay user"));
        user.setStatus(request.getStatus());
        user = userRepository.save(user);
        notificationService.push(
            user.getId(),
            "Tai khoan duoc cap nhat",
            "Trang thai tai khoan cua ban da duoc cap nhat thanh " + user.getStatus(),
            "USER_STATUS",
            "USER",
            user.getId()
        );
        return adminResponseMapper.toAdminUser(user);
    }

    @Transactional(readOnly = true)
    public List<TutorSummaryResponse> getPendingTutors(Long adminUserId) {
        validateAdmin(adminUserId);
        return tutorRepository.findByProfileStatusOrderByCreatedAtDesc(TutorProfileStatus.PENDING).stream()
            .map(tutorSummaryMapper::toSummary)
            .toList();
    }

    @Transactional(readOnly = true)
    public TutorSummaryResponse getTutorDetail(Long adminUserId, Long tutorId) {
        validateAdmin(adminUserId);
        Tutor tutor = tutorRepository.findById(tutorId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Khong tim thay gia su"));
        return tutorSummaryMapper.toSummary(tutor);
    }

    @Transactional
    public TutorSummaryResponse reviewTutor(Long tutorId, AdminReviewRequest request) {
        User admin = validateAdmin(request.getAdminUserId());
        boolean approved = Boolean.TRUE.equals(request.getApproved());
        String rejectedReason = normalizeReviewReason(approved, request.getRejectedReason());
        Tutor tutor = tutorRepository.findById(tutorId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Khong tim thay gia su"));
        if (tutor.getProfileStatus() != TutorProfileStatus.PENDING) {
            throw new AppException(HttpStatus.CONFLICT, "Ho so gia su da duoc xu ly truoc do");
        }
        if (approved && !identityVerificationService.isIdentityApproved(tutor.getUser().getId())) {
            throw new AppException(HttpStatus.CONFLICT, "Gia su chua duoc xac minh danh tinh, khong the phe duyet ho so");
        }
        tutor.setProfileStatus(approved ? TutorProfileStatus.APPROVED : TutorProfileStatus.REJECTED);
        tutor.setReviewedBy(admin);
        tutor.setReviewedAt(LocalDateTime.now());
        tutor.setRejectedReason(rejectedReason);
        tutor = tutorRepository.save(tutor);
        notificationService.push(
            tutor.getUser().getId(),
            approved ? "Ho so gia su da duoc duyet" : "Ho so gia su bi tu choi",
            approved ? "Ho so gia su cua ban da duoc phe duyet." : "Ho so gia su bi tu choi: " + rejectedReason,
            "TUTOR_PROFILE_REVIEW",
            "TUTOR",
            tutor.getId()
        );
        return tutorSummaryMapper.toSummary(tutor);
    }

    @Transactional(readOnly = true)
    public List<LearnerPostResponse> getPendingPosts(Long adminUserId) {
        validateAdmin(adminUserId);
        return postRepository.findByApprovalStatusOrderByCreatedAtDesc(ApprovalStatus.PENDING).stream()
            .map(adminResponseMapper::toPostSummary)
            .toList();
    }

    @Transactional
    public LearnerPostResponse reviewPost(Long postId, AdminReviewRequest request) {
        User admin = validateAdmin(request.getAdminUserId());
        boolean approved = Boolean.TRUE.equals(request.getApproved());
        String rejectedReason = normalizeReviewReason(approved, request.getRejectedReason());
        Post post = postRepository.findById(postId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Khong tim thay bai dang"));
        if (post.getApprovalStatus() != ApprovalStatus.PENDING) {
            throw new AppException(HttpStatus.CONFLICT, "Bai dang da duoc xu ly truoc do");
        }
        post.setApprovalStatus(approved ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED);
        post.setApprovedBy(admin);
        post.setApprovedAt(LocalDateTime.now());
        post.setRejectedReason(rejectedReason);
        post = postRepository.save(post);
        notificationService.push(
            post.getLearnerUser().getId(),
            approved ? "Bai dang da duoc duyet" : "Bai dang bi tu choi",
            approved ? "Bai dang cua ban da duoc duyet." : "Bai dang bi tu choi: " + rejectedReason,
            "POST_REVIEW",
            "POST",
            post.getId()
        );
        return adminResponseMapper.toPostSummary(post);
    }

    @Transactional(readOnly = true)
    public List<TutorCourseResponse> getPendingCourses(Long adminUserId) {
        validateAdmin(adminUserId);
        return tutorCourseRepository.findByApprovalStatusOrderByCreatedAtDesc(ApprovalStatus.PENDING).stream()
            .map(adminResponseMapper::toCourseSummary)
            .toList();
    }

    @Transactional
    public TutorCourseResponse reviewCourse(Long courseId, AdminReviewRequest request) {
        User admin = validateAdmin(request.getAdminUserId());
        boolean approved = Boolean.TRUE.equals(request.getApproved());
        String rejectedReason = normalizeReviewReason(approved, request.getRejectedReason());
        TutorCourse c = tutorCourseRepository.findById(courseId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Khong tim thay khoa hoc"));
        if (c.getApprovalStatus() != ApprovalStatus.PENDING) {
            throw new AppException(HttpStatus.CONFLICT, "Lop/Khoa hoc da duoc xu ly truoc do");
        }
        c.setApprovalStatus(approved ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED);
        c.setApprovedBy(admin);
        c.setApprovedAt(LocalDateTime.now());
        c.setRejectedReason(rejectedReason);
        c = tutorCourseRepository.save(c);
        notificationService.push(
            c.getTutor().getUser().getId(),
            approved ? "Lop/Khoa hoc da duoc duyet" : "Lop/Khoa hoc bi tu choi",
            approved ? "Lop/Khoa hoc cua ban da duoc duyet." : "Lop/Khoa hoc bi tu choi: " + rejectedReason,
            "COURSE_REVIEW",
            "COURSE",
            c.getId()
        );
        return adminResponseMapper.toCourseSummary(c);
    }

    @Transactional(readOnly = true)
    public AdminStatsResponse getStats(Long adminUserId) {
        validateAdmin(adminUserId);
        return AdminStatsResponse.builder()
            .totalUsers(userRepository.count())
            .totalTutors(userRepository.countByRole(UserRole.TUTOR))
            .pendingTutorProfiles(tutorRepository.countByProfileStatus(TutorProfileStatus.PENDING))
            .pendingPosts(postRepository.countByApprovalStatus(ApprovalStatus.PENDING))
            .pendingCourses(tutorCourseRepository.countByApprovalStatus(ApprovalStatus.PENDING))
            .build();
    }

    @Transactional(readOnly = true)
    public List<Subject> getSubjects(Long adminUserId) {
        validateAdmin(adminUserId);
        return subjectRepository.findAll().stream()
            .sorted(Comparator.comparing(Subject::getName, String.CASE_INSENSITIVE_ORDER))
            .toList();
    }

    @Transactional(readOnly = true)
    public List<Grade> getGrades(Long adminUserId) {
        validateAdmin(adminUserId);
        return gradeRepository.findAll().stream()
            .sorted(Comparator.comparing(Grade::getName, String.CASE_INSENSITIVE_ORDER))
            .toList();
    }

    @Transactional
    public Subject createSubject(Long adminUserId, String name) {
        validateAdmin(adminUserId);
        String normalized = normalizeLookupName(name);
        if (subjectRepository.existsByNameIgnoreCase(normalized)) {
            throw new AppException(HttpStatus.CONFLICT, "Mon hoc da ton tai");
        }
        Subject subject = new Subject();
        subject.setName(normalized);
        return subjectRepository.save(subject);
    }

    @Transactional
    public Subject updateSubject(Long adminUserId, Long subjectId, String name) {
        validateAdmin(adminUserId);
        Subject subject = subjectRepository.findById(subjectId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Khong tim thay mon hoc"));
        String normalized = normalizeLookupName(name);
        subjectRepository.findByNameIgnoreCase(normalized)
            .filter(existing -> !existing.getId().equals(subjectId))
            .ifPresent(existing -> {
                throw new AppException(HttpStatus.CONFLICT, "Mon hoc da ton tai");
            });
        subject.setName(normalized);
        return subjectRepository.save(subject);
    }

    @Transactional
    public void deleteSubject(Long adminUserId, Long subjectId) {
        validateAdmin(adminUserId);
        if (!subjectRepository.existsById(subjectId)) {
            throw new AppException(HttpStatus.NOT_FOUND, "Khong tim thay mon hoc");
        }
        subjectRepository.deleteById(subjectId);
    }

    @Transactional
    public Grade createGrade(Long adminUserId, String name) {
        validateAdmin(adminUserId);
        String normalized = normalizeLookupName(name);
        if (gradeRepository.existsByNameIgnoreCase(normalized)) {
            throw new AppException(HttpStatus.CONFLICT, "Khoi lop da ton tai");
        }
        Grade grade = new Grade();
        grade.setName(normalized);
        return gradeRepository.save(grade);
    }

    @Transactional
    public Grade updateGrade(Long adminUserId, Long gradeId, String name) {
        validateAdmin(adminUserId);
        Grade grade = gradeRepository.findById(gradeId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Khong tim thay khoi lop"));
        String normalized = normalizeLookupName(name);
        gradeRepository.findByNameIgnoreCase(normalized)
            .filter(existing -> !existing.getId().equals(gradeId))
            .ifPresent(existing -> {
                throw new AppException(HttpStatus.CONFLICT, "Khoi lop da ton tai");
            });
        grade.setName(normalized);
        return gradeRepository.save(grade);
    }

    @Transactional
    public void deleteGrade(Long adminUserId, Long gradeId) {
        validateAdmin(adminUserId);
        if (!gradeRepository.existsById(gradeId)) {
            throw new AppException(HttpStatus.NOT_FOUND, "Khong tim thay khoi lop");
        }
        gradeRepository.deleteById(gradeId);
    }

    private User validateAdmin(Long adminUserId) {
        User admin = userRepository.findById(adminUserId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Khong tim thay admin"));
        if (admin.getRole() != UserRole.ADMIN) {
            throw new AppException(HttpStatus.FORBIDDEN, "User khong phai admin");
        }
        return admin;
    }

    private String normalizeReviewReason(boolean approved, String rejectedReason) {
        if (approved) {
            return null;
        }
        if (rejectedReason == null || rejectedReason.isBlank()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Vui long nhap ly do tu choi");
        }
        return rejectedReason.trim();
    }

    private String normalizeLookupName(String name) {
        if (name == null || name.isBlank()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Ten khong duoc de trong");
        }
        return name.trim();
    }

}


