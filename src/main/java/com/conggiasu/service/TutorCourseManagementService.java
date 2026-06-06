package com.conggiasu.service;

import com.conggiasu.dto.request.TutorCourseRequest;
import com.conggiasu.dto.request.TutorCourseStatusUpdateRequest;
import com.conggiasu.dto.response.PageResponse;
import com.conggiasu.dto.response.TutorCourseResponse;
import com.conggiasu.entity.Grade;
import com.conggiasu.entity.Subject;
import com.conggiasu.entity.Tutor;
import com.conggiasu.entity.TutorCourse;
import com.conggiasu.entity.enums.ApprovalStatus;
import com.conggiasu.entity.enums.CourseStatus;
import com.conggiasu.entity.enums.EnrollmentStatus;
import com.conggiasu.entity.enums.UserRole;
import com.conggiasu.exception.AppException;
import com.conggiasu.repository.CourseEnrollmentRepository;
import com.conggiasu.repository.GradeRepository;
import com.conggiasu.repository.SubjectRepository;
import com.conggiasu.repository.TutorCourseRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TutorCourseManagementService {
    private final TutorAccessService tutorAccessService;
    private final TutorCourseRepository tutorCourseRepository;
    private final CourseEnrollmentRepository courseEnrollmentRepository;
    private final SubjectRepository subjectRepository;
    private final GradeRepository gradeRepository;
    private final NotificationService notificationService;
    private final TutorFeatureMapper mapper;
    private final TutorCourseEnrollmentService tutorCourseEnrollmentService;

    @Value("${app.limits.tutor-courses-per-day:4}")
    private int tutorCoursesPerDayLimit;

    @Transactional
    public TutorCourseResponse createCourse(TutorCourseRequest request) {
        Tutor tutor = tutorAccessService.findTutor(request.getTutorId());
        tutorAccessService.ensureTutorCanManageCourses(tutor);
        ensureTutorDailyCourseLimit(tutor.getId());
        Subject subject = subjectRepository.findById(request.getSubjectId())
            .orElseThrow(() -> new AppException(HttpStatus.BAD_REQUEST, "subjectId không hợp lệ"));
        Grade grade = gradeRepository.findById(request.getGradeId())
            .orElseThrow(() -> new AppException(HttpStatus.BAD_REQUEST, "gradeId không hợp lệ"));

        TutorCourse course = new TutorCourse();
        course.setTutor(tutor);
        mapper.applyCourseRequest(course, request, subject, grade);
        course.setApprovalStatus(ApprovalStatus.PENDING);
        course.setStatus(CourseStatus.OPEN);
        course = tutorCourseRepository.save(course);
        notificationService.pushToRole(
            UserRole.ADMIN,
            "Có lớp/khóa học cần duyệt",
            "Lớp \"" + course.getTitle() + "\" của gia sư " + course.getTutor().getUser().getFullName() + " đang chờ duyệt.",
            "COURSE_PENDING_REVIEW",
            "COURSE",
            course.getId()
        );
        return mapper.toCourseResponse(course);
    }

    @Transactional
    public TutorCourseResponse createCourseByUser(Long tutorUserId, TutorCourseRequest request) {
        request.setTutorId(tutorAccessService.findTutorIdByUserId(tutorUserId));
        return createCourse(request);
    }

    @Transactional
    public TutorCourseResponse updateCourse(Long courseId, TutorCourseRequest request) {
        TutorCourse course = tutorCourseRepository.findByIdAndTutorId(courseId, request.getTutorId())
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy lớp của gia sư"));
        tutorAccessService.ensureTutorCanManageCourses(course.getTutor());
        if (course.getStatus() == CourseStatus.IN_PROGRESS
            || course.getStatus() == CourseStatus.COMPLETED
            || course.getStatus() == CourseStatus.CANCELLED) {
            throw new AppException(HttpStatus.CONFLICT, "Không thể sửa lớp đang học/đã kết thúc");
        }
        Subject subject = subjectRepository.findById(request.getSubjectId())
            .orElseThrow(() -> new AppException(HttpStatus.BAD_REQUEST, "subjectId không hợp lệ"));
        Grade grade = gradeRepository.findById(request.getGradeId())
            .orElseThrow(() -> new AppException(HttpStatus.BAD_REQUEST, "gradeId không hợp lệ"));

        mapper.applyCourseRequest(course, request, subject, grade);
        course.setApprovalStatus(ApprovalStatus.PENDING);
        course.setApprovedBy(null);
        course.setApprovedAt(null);
        course.setRejectedReason(null);
        course = tutorCourseRepository.save(course);
        notificationService.pushToRole(
            UserRole.ADMIN,
            "Có lớp/khóa học cần duyệt",
            "Lớp \"" + course.getTitle() + "\" vừa được cập nhật và đang chờ duyệt lại.",
            "COURSE_PENDING_REVIEW",
            "COURSE",
            course.getId()
        );
        return mapper.toCourseResponse(course);
    }

    @Transactional
    public TutorCourseResponse updateCourseByUser(Long tutorUserId, Long courseId, TutorCourseRequest request) {
        request.setTutorId(tutorAccessService.findTutorIdByUserId(tutorUserId));
        return updateCourse(courseId, request);
    }

    @Transactional
    public TutorCourseResponse updateCourseStatusByUser(
        Long tutorUserId, Long courseId, TutorCourseStatusUpdateRequest request
    ) {
        Long tutorId = tutorAccessService.findTutorIdByUserId(tutorUserId);
        TutorCourse course = tutorCourseRepository.findByIdAndTutorId(courseId, tutorId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy lớp của gia sư"));

        if (course.getApprovalStatus() != ApprovalStatus.APPROVED && request.getStatus() != CourseStatus.CANCELLED) {
            throw new AppException(HttpStatus.CONFLICT, "Chỉ được cập nhật trạng thái dạy học sau khi lớp đã được duyệt");
        }
        if (request.getStatus() == CourseStatus.IN_PROGRESS || request.getStatus() == CourseStatus.COMPLETED) {
            boolean hasAcceptedLearner = courseEnrollmentRepository.existsByCourseIdAndStatusIn(
                course.getId(),
                List.of(EnrollmentStatus.ACCEPTED, EnrollmentStatus.COMPLETED)
            );
            if (!hasAcceptedLearner) {
                throw new AppException(HttpStatus.CONFLICT, "Chưa có học viên được chấp nhận. Không thể chuyển trạng thái lớp học.");
            }
        }

        validateCourseTransition(course.getStatus(), request.getStatus());
        course.setStatus(request.getStatus());
        course = tutorCourseRepository.save(course);
        tutorCourseEnrollmentService.syncEnrollmentsByCourseStatus(course);
        return mapper.toCourseResponse(course);
    }

    @Transactional(readOnly = true)
    public PageResponse<TutorCourseResponse> getTutorCourses(Long tutorId, CourseStatus status, int page, int size) {
        tutorAccessService.findTutor(tutorId);
        var courses = status == null
            ? tutorCourseRepository.findByTutorIdOrderByCreatedAtDesc(tutorId, PaginationSupport.pageRequest(page, size))
            : tutorCourseRepository.findByTutorIdAndStatusOrderByCreatedAtDesc(tutorId, status, PaginationSupport.pageRequest(page, size));
        return PaginationSupport.toPageResponse(
            courses,
            courses.getContent().stream().map(mapper::toCourseResponse).toList()
        );
    }

    @Transactional(readOnly = true)
    public PageResponse<TutorCourseResponse> getTutorCoursesByUser(Long tutorUserId, CourseStatus status, int page, int size) {
        return getTutorCourses(tutorAccessService.findTutorIdByUserId(tutorUserId), status, page, size);
    }

    private void validateCourseTransition(CourseStatus current, CourseStatus target) {
        if (current == target) {
            return;
        }
        if (current == CourseStatus.OPEN
            && (target == CourseStatus.CLOSED || target == CourseStatus.IN_PROGRESS || target == CourseStatus.CANCELLED)) {
            return;
        }
        if (current == CourseStatus.CLOSED
            && (target == CourseStatus.OPEN || target == CourseStatus.IN_PROGRESS || target == CourseStatus.CANCELLED)) {
            return;
        }
        if (current == CourseStatus.IN_PROGRESS
            && (target == CourseStatus.COMPLETED || target == CourseStatus.CANCELLED)) {
            return;
        }
        throw new AppException(HttpStatus.CONFLICT, "Không thể chuyển trạng thái lớp từ " + current + " sang " + target);
    }

    private void ensureTutorDailyCourseLimit(Long tutorId) {
        if (tutorCoursesPerDayLimit <= 0) {
            return;
        }
        LocalDateTime startOfDay = LocalDate.now(ZoneId.of("Asia/Bangkok")).atStartOfDay();
        LocalDateTime startOfNextDay = startOfDay.plusDays(1);
        long createdToday = tutorCourseRepository.countByTutorIdAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(
            tutorId,
            startOfDay,
            startOfNextDay
        );
        if (createdToday >= tutorCoursesPerDayLimit) {
            throw new AppException(
                HttpStatus.TOO_MANY_REQUESTS,
                "Mỗi ngày gia sư chỉ được tạo tối đa " + tutorCoursesPerDayLimit + " lớp/khóa học."
            );
        }
    }
}
