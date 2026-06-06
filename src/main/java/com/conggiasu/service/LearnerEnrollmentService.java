package com.conggiasu.service;

import com.conggiasu.dto.request.EnrollmentCreateRequest;
import com.conggiasu.dto.response.CourseEnrollmentResponse;
import com.conggiasu.dto.response.PageResponse;
import com.conggiasu.entity.CourseEnrollment;
import com.conggiasu.entity.TutorCourse;
import com.conggiasu.entity.User;
import com.conggiasu.entity.enums.ApprovalStatus;
import com.conggiasu.entity.enums.CourseStatus;
import com.conggiasu.entity.enums.EnrollmentStatus;
import com.conggiasu.exception.AppException;
import com.conggiasu.repository.CourseEnrollmentRepository;
import com.conggiasu.repository.TutorCourseRepository;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class LearnerEnrollmentService {
    private final LearnerAccessService learnerAccessService;
    private final TutorCourseRepository tutorCourseRepository;
    private final CourseEnrollmentRepository courseEnrollmentRepository;
    private final NotificationService notificationService;
    private final LearnerResponseMapper mapper;

    @Transactional
    public CourseEnrollmentResponse enrollCourse(Long courseId, EnrollmentCreateRequest request) {
        User learner = learnerAccessService.validateLearner(request.getLearnerUserId());
        TutorCourse course = tutorCourseRepository.findById(courseId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy khóa học"));
        if (course.getApprovalStatus() != ApprovalStatus.APPROVED || course.getStatus() != CourseStatus.OPEN) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Khóa học không còn mở đăng ký");
        }
        CourseEnrollment existing = courseEnrollmentRepository.findByCourseIdAndLearnerUserId(courseId, learner.getId()).orElse(null);
        if (existing != null) {
            if (existing.getStatus() != EnrollmentStatus.CANCELLED && existing.getStatus() != EnrollmentStatus.REJECTED) {
                throw new AppException(HttpStatus.CONFLICT, "Bạn đã đăng ký khóa học này");
            }
            existing.setMessage(request.getMessage());
            existing.setAgreedFee(request.getAgreedFee());
            existing.setStatus(EnrollmentStatus.PENDING);
            existing.setJoinedAt(null);
            existing.setCompletedAt(null);
            existing.setCancelledAt(null);
            existing = courseEnrollmentRepository.save(existing);
            notificationService.push(
                course.getTutor().getUser().getId(),
                "Có học viên đăng ký lớp",
                "Lớp \"" + course.getTitle() + "\" vừa có học viên đăng ký lại.",
                "ENROLLMENT_NEW",
                "ENROLLMENT",
                existing.getId()
            );
            return mapper.toEnrollment(existing);
        }
        CourseEnrollment enrollment = new CourseEnrollment();
        enrollment.setCourse(course);
        enrollment.setLearnerUser(learner);
        enrollment.setMessage(request.getMessage());
        enrollment.setAgreedFee(request.getAgreedFee());
        enrollment.setStatus(EnrollmentStatus.PENDING);
        enrollment = courseEnrollmentRepository.save(enrollment);
        notificationService.push(
            course.getTutor().getUser().getId(),
            "Có học viên đăng ký lớp",
            "Lớp \"" + course.getTitle() + "\" vừa có học viên đăng ký.",
            "ENROLLMENT_NEW",
            "ENROLLMENT",
            enrollment.getId()
        );
        return mapper.toEnrollment(enrollment);
    }

    @Transactional
    public CourseEnrollmentResponse cancelEnrollment(Long enrollmentId, Long learnerUserId) {
        CourseEnrollment enrollment = courseEnrollmentRepository.findByIdAndLearnerUserId(enrollmentId, learnerUserId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy đăng ký"));
        if (enrollment.getStatus() != EnrollmentStatus.PENDING) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Chỉ hủy được đăng ký đang chờ");
        }
        enrollment.setStatus(EnrollmentStatus.CANCELLED);
        enrollment.setCancelledAt(LocalDateTime.now());
        enrollment = courseEnrollmentRepository.save(enrollment);
        notificationService.push(
            enrollment.getCourse().getTutor().getUser().getId(),
            "Học viên hủy đăng ký",
            "Một học viên vừa hủy đăng ký lớp \"" + enrollment.getCourse().getTitle() + "\".",
            "ENROLLMENT_CANCELLED",
            "ENROLLMENT",
            enrollment.getId()
        );
        return mapper.toEnrollment(enrollment);
    }

    @Transactional(readOnly = true)
    public PageResponse<CourseEnrollmentResponse> myEnrollments(Long learnerUserId, int page, int size) {
        learnerAccessService.validateLearner(learnerUserId);
        var enrollments = courseEnrollmentRepository.findByLearnerUserIdOrderByCreatedAtDesc(
            learnerUserId,
            PaginationSupport.pageRequest(page, size)
        );
        return PaginationSupport.toPageResponse(
            enrollments,
            enrollments.getContent().stream().map(mapper::toEnrollment).toList()
        );
    }
}
