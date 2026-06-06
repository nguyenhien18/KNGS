package com.conggiasu.service;

import com.conggiasu.dto.request.EnrollmentStatusUpdateRequest;
import com.conggiasu.dto.response.CourseEnrollmentResponse;
import com.conggiasu.dto.response.PageResponse;
import com.conggiasu.entity.CourseEnrollment;
import com.conggiasu.entity.TutorCourse;
import com.conggiasu.entity.enums.CourseStatus;
import com.conggiasu.entity.enums.EnrollmentStatus;
import com.conggiasu.exception.AppException;
import com.conggiasu.repository.CourseEnrollmentRepository;
import com.conggiasu.repository.TutorCourseRepository;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TutorCourseEnrollmentService {
    private final TutorAccessService tutorAccessService;
    private final TutorCourseRepository tutorCourseRepository;
    private final CourseEnrollmentRepository courseEnrollmentRepository;
    private final NotificationService notificationService;
    private final TutorFeatureMapper mapper;

    @Transactional(readOnly = true)
    public PageResponse<CourseEnrollmentResponse> getCourseEnrollments(Long tutorId, Long courseId, int page, int size) {
        TutorCourse course = tutorCourseRepository.findByIdAndTutorId(courseId, tutorId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy lớp của gia sư"));
        var enrollments = courseEnrollmentRepository.findByCourseIdOrderByCreatedAtDesc(
            course.getId(),
            PaginationSupport.pageRequest(page, size)
        );
        return PaginationSupport.toPageResponse(
            enrollments,
            enrollments.getContent().stream().map(mapper::toEnrollmentResponse).toList()
        );
    }

    @Transactional(readOnly = true)
    public PageResponse<CourseEnrollmentResponse> getCourseEnrollmentsByUser(
        Long tutorUserId, Long courseId, int page, int size
    ) {
        return getCourseEnrollments(tutorAccessService.findTutorIdByUserId(tutorUserId), courseId, page, size);
    }

    @Transactional
    public CourseEnrollmentResponse updateEnrollmentStatus(Long enrollmentId, EnrollmentStatusUpdateRequest request) {
        if (request.getStatus() != EnrollmentStatus.ACCEPTED
            && request.getStatus() != EnrollmentStatus.REJECTED
            && request.getStatus() != EnrollmentStatus.CANCELLED
            && request.getStatus() != EnrollmentStatus.COMPLETED) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Trạng thái không hợp lệ cho gia sư xử lý");
        }
        CourseEnrollment enrollment = courseEnrollmentRepository.findByIdAndCourseTutorId(enrollmentId, request.getTutorId())
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy đăng ký"));
        validateEnrollmentTransition(enrollment.getStatus(), request.getStatus());
        if (request.getStatus() == EnrollmentStatus.ACCEPTED && enrollment.getStatus() != EnrollmentStatus.ACCEPTED) {
            Integer maxStudents = enrollment.getCourse().getMaxStudents();
            if (maxStudents != null && maxStudents > 0) {
                long acceptedCount = courseEnrollmentRepository.countByCourseIdAndStatus(
                    enrollment.getCourse().getId(),
                    EnrollmentStatus.ACCEPTED
                );
                if (acceptedCount >= maxStudents) {
                    throw new AppException(HttpStatus.CONFLICT, "Lớp đã đủ số học viên được nhận");
                }
            }
        }
        enrollment.setStatus(request.getStatus());
        if (request.getStatus() == EnrollmentStatus.ACCEPTED) {
            enrollment.setJoinedAt(LocalDateTime.now());
        } else if (request.getStatus() == EnrollmentStatus.COMPLETED) {
            enrollment.setCompletedAt(LocalDateTime.now());
        } else if (request.getStatus() == EnrollmentStatus.CANCELLED) {
            enrollment.setCancelledAt(LocalDateTime.now());
        }
        enrollment = courseEnrollmentRepository.save(enrollment);
        syncCourseOpenCloseByCapacity(enrollment.getCourse());
        notificationService.push(
            enrollment.getLearnerUser().getId(),
            "Đăng ký lớp đã được cập nhật",
            "Trạng thái đăng ký của bạn đã được cập nhật thành " + enrollment.getStatus(),
            "ENROLLMENT_STATUS",
            "ENROLLMENT",
            enrollment.getId()
        );
        return mapper.toEnrollmentResponse(enrollment);
    }

    @Transactional
    public CourseEnrollmentResponse updateEnrollmentStatusByUser(
        Long tutorUserId, Long enrollmentId, EnrollmentStatusUpdateRequest request
    ) {
        request.setTutorId(tutorAccessService.findTutorIdByUserId(tutorUserId));
        return updateEnrollmentStatus(enrollmentId, request);
    }

    @Transactional
    public void syncEnrollmentsByCourseStatus(TutorCourse course) {
        if (course == null || course.getId() == null || course.getStatus() != CourseStatus.COMPLETED) {
            return;
        }
        List<CourseEnrollment> enrollments = courseEnrollmentRepository.findByCourseIdAndStatus(
            course.getId(),
            EnrollmentStatus.ACCEPTED
        );
        for (CourseEnrollment enrollment : enrollments) {
            enrollment.setStatus(EnrollmentStatus.COMPLETED);
            if (enrollment.getCompletedAt() == null) {
                enrollment.setCompletedAt(LocalDateTime.now());
            }
        }
        courseEnrollmentRepository.saveAll(enrollments);
    }

    private void validateEnrollmentTransition(EnrollmentStatus current, EnrollmentStatus target) {
        if (current == target) {
            return;
        }
        if (current == EnrollmentStatus.PENDING
            && (target == EnrollmentStatus.ACCEPTED || target == EnrollmentStatus.REJECTED || target == EnrollmentStatus.CANCELLED)) {
            return;
        }
        if (current == EnrollmentStatus.ACCEPTED
            && (target == EnrollmentStatus.COMPLETED || target == EnrollmentStatus.CANCELLED)) {
            return;
        }
        throw new AppException(HttpStatus.CONFLICT, "Không thể chuyển trạng thái đăng ký từ " + current + " sang " + target);
    }

    private void syncCourseOpenCloseByCapacity(TutorCourse course) {
        if (course == null || course.getId() == null) {
            return;
        }
        if (course.getStatus() == CourseStatus.IN_PROGRESS
            || course.getStatus() == CourseStatus.COMPLETED
            || course.getStatus() == CourseStatus.CANCELLED) {
            return;
        }
        Integer maxStudents = course.getMaxStudents();
        if (maxStudents == null || maxStudents <= 0) {
            return;
        }
        long acceptedCount = courseEnrollmentRepository.countByCourseIdAndStatus(course.getId(), EnrollmentStatus.ACCEPTED);
        course.setStatus(acceptedCount >= maxStudents ? CourseStatus.CLOSED : CourseStatus.OPEN);
        tutorCourseRepository.save(course);
    }
}
