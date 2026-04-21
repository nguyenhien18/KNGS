package com.conggiasu.service;

import com.conggiasu.dto.request.EnrollmentStatusUpdateRequest;
import com.conggiasu.dto.request.TutorApplyRequest;
import com.conggiasu.dto.request.TutorClassStatusUpdateRequest;
import com.conggiasu.dto.request.TutorCourseRequest;
import com.conggiasu.dto.request.TutorCourseStatusUpdateRequest;
import com.conggiasu.dto.response.AvailablePostResponse;
import com.conggiasu.dto.response.CourseEnrollmentResponse;
import com.conggiasu.dto.response.PageResponse;
import com.conggiasu.dto.response.TutorApplicationResponse;
import com.conggiasu.dto.response.TutorCourseResponse;
import com.conggiasu.dto.response.TutorMatchedClassResponse;
import com.conggiasu.dto.response.TutorReviewResponse;
import com.conggiasu.entity.Application;
import com.conggiasu.entity.CourseEnrollment;
import com.conggiasu.entity.MatchedClass;
import com.conggiasu.entity.enums.ApplicationStatus;
import com.conggiasu.entity.enums.ApprovalStatus;
import com.conggiasu.entity.enums.CourseStatus;
import com.conggiasu.entity.enums.EnrollmentStatus;
import com.conggiasu.entity.enums.MatchedClassStatus;
import com.conggiasu.entity.enums.PostStatus;
import com.conggiasu.entity.enums.TeachingMode;
import com.conggiasu.entity.enums.TutorProfileStatus;
import com.conggiasu.entity.enums.UserRole;
import com.conggiasu.entity.enums.UserStatus;
import com.conggiasu.entity.Grade;
import com.conggiasu.entity.Post;
import com.conggiasu.entity.Review;
import com.conggiasu.entity.Subject;
import com.conggiasu.entity.Tutor;
import com.conggiasu.entity.TutorCourse;
import com.conggiasu.entity.User;
import com.conggiasu.exception.AppException;
import com.conggiasu.repository.ApplicationRepository;
import com.conggiasu.repository.CourseEnrollmentRepository;
import com.conggiasu.repository.GradeRepository;
import com.conggiasu.repository.MatchedClassRepository;
import com.conggiasu.repository.PostRepository;
import com.conggiasu.repository.ReviewRepository;
import com.conggiasu.repository.SubjectRepository;
import com.conggiasu.repository.TutorCourseRepository;
import com.conggiasu.repository.TutorRepository;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class TutorFeatureService {
    private final TutorRepository tutorRepository;
    private final PostRepository postRepository;
    private final ApplicationRepository applicationRepository;
    private final TutorCourseRepository tutorCourseRepository;
    private final CourseEnrollmentRepository courseEnrollmentRepository;
    private final MatchedClassRepository matchedClassRepository;
    private final ReviewRepository reviewRepository;
    private final SubjectRepository subjectRepository;
    private final GradeRepository gradeRepository;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public Long findTutorIdByUserId(Long userId) {
        return tutorRepository.findByUserId(userId)
            .orElseThrow(() -> new AppException(HttpStatus.BAD_REQUEST, "Tai khoan chua co ho so gia su"))
            .getId();
    }

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
            spec = spec.and((root, query, cb) -> cb.equal(root.get("teachingMode"), teachingMode));
        }
        if (province != null && !province.isBlank()) {
            spec = spec.and((root, query, cb) -> cb.equal(cb.lower(root.get("province")), province.trim().toLowerCase()));
        }
        if (district != null && !district.isBlank()) {
            spec = spec.and((root, query, cb) -> cb.equal(cb.lower(root.get("district")), district.trim().toLowerCase()));
        }

        var postPage = postRepository.findAll(spec, org.springframework.data.domain.PageRequest.of(page, size));
        List<AvailablePostResponse> items = postPage.getContent().stream().map(this::toAvailablePost).toList();
        return PageResponse.<AvailablePostResponse>builder()
            .content(items)
            .page(postPage.getNumber())
            .size(postPage.getSize())
            .totalElements(postPage.getTotalElements())
            .totalPages(postPage.getTotalPages())
            .first(postPage.isFirst())
            .last(postPage.isLast())
            .build();
    }

    @Transactional(readOnly = true)
    public AvailablePostResponse getAvailablePostDetail(Long postId) {
        Post post = postRepository.findById(postId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Khong tim thay bai dang"));
        if (post.getApprovalStatus() != ApprovalStatus.APPROVED || post.getStatus() != PostStatus.OPEN) {
            throw new AppException(HttpStatus.NOT_FOUND, "Bai dang khong kha dung");
        }
        return toAvailablePost(post);
    }

    @Transactional
    public TutorApplicationResponse applyToPost(Long postId, TutorApplyRequest request) {
        Tutor tutor = findTutor(request.getTutorId());
        if (tutor.getProfileStatus() != TutorProfileStatus.APPROVED) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Ho so gia su chua duoc duyet");
        }

        Post post = postRepository.findById(postId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Khong tim thay bai dang"));
        if (post.getApprovalStatus() != ApprovalStatus.APPROVED || post.getStatus() != PostStatus.OPEN) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Bai dang khong con nhan ung tuyen");
        }
        if (applicationRepository.existsByPostIdAndTutorId(postId, tutor.getId())) {
            throw new AppException(HttpStatus.CONFLICT, "Ban da ung tuyen bai dang nay");
        }

        Application app = new Application();
        app.setPost(post);
        app.setTutor(tutor);
        app.setMessage(request.getMessage());
        app.setExpectedFee(request.getExpectedFee());
        app.setStatus(ApplicationStatus.PENDING);
        app = applicationRepository.save(app);
        notificationService.push(
            post.getLearnerUser().getId(),
            "Co gia su moi ung tuyen",
            "Bai dang \"" + post.getTitle() + "\" vua co gia su ung tuyen.",
            "APPLICATION_NEW",
            "APPLICATION",
            app.getId()
        );
        return toApplicationResponse(app);
    }

    @Transactional
    public TutorApplicationResponse applyToPostByUser(Long postId, Long tutorUserId, TutorApplyRequest request) {
        Long tutorId = findTutorIdByUserId(tutorUserId);
        request.setTutorId(tutorId);
        return applyToPost(postId, request);
    }

    @Transactional
    public TutorApplicationResponse cancelApplication(Long tutorId, Long applicationId) {
        Application app = applicationRepository.findByIdAndTutorId(applicationId, tutorId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Khong tim thay don ung tuyen"));
        if (app.getStatus() != ApplicationStatus.PENDING) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Chi duoc huy don dang cho");
        }
        app.setStatus(ApplicationStatus.CANCELLED);
        app = applicationRepository.save(app);
        return toApplicationResponse(app);
    }

    @Transactional
    public TutorApplicationResponse cancelApplicationByUser(Long tutorUserId, Long applicationId) {
        Long tutorId = findTutorIdByUserId(tutorUserId);
        return cancelApplication(tutorId, applicationId);
    }

    @Transactional(readOnly = true)
    public List<TutorApplicationResponse> getApplications(Long tutorId, ApplicationStatus status) {
        findTutor(tutorId);
        List<Application> apps = status == null
            ? applicationRepository.findByTutorIdOrderByCreatedAtDesc(tutorId)
            : applicationRepository.findByTutorIdAndStatusOrderByCreatedAtDesc(tutorId, status);
        return apps.stream().map(this::toApplicationResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<TutorApplicationResponse> getApplicationsByUser(Long tutorUserId, ApplicationStatus status) {
        Long tutorId = findTutorIdByUserId(tutorUserId);
        return getApplications(tutorId, status);
    }

    @Transactional
    public TutorCourseResponse createCourse(TutorCourseRequest request) {
        Tutor tutor = findTutor(request.getTutorId());
        ensureTutorCanManageCourses(tutor);
        Subject subject = subjectRepository.findById(request.getSubjectId())
            .orElseThrow(() -> new AppException(HttpStatus.BAD_REQUEST, "subjectId khong hop le"));
        Grade grade = gradeRepository.findById(request.getGradeId())
            .orElseThrow(() -> new AppException(HttpStatus.BAD_REQUEST, "gradeId khong hop le"));

        TutorCourse c = new TutorCourse();
        c.setTutor(tutor);
        applyCourseRequest(c, request, subject, grade);
        c.setApprovalStatus(ApprovalStatus.PENDING);
        c.setStatus(CourseStatus.OPEN);
        c = tutorCourseRepository.save(c);
        notificationService.pushToRole(
            UserRole.ADMIN,
            "Co lop/khoa hoc can duyet",
            "Lop \"" + c.getTitle() + "\" cua gia su " + c.getTutor().getUser().getFullName() + " dang cho duyet.",
            "COURSE_PENDING_REVIEW",
            "COURSE",
            c.getId()
        );
        return toCourseResponse(c);
    }

    @Transactional
    public TutorCourseResponse createCourseByUser(Long tutorUserId, TutorCourseRequest request) {
        request.setTutorId(findTutorIdByUserId(tutorUserId));
        return createCourse(request);
    }

    @Transactional
    public TutorCourseResponse updateCourse(Long courseId, TutorCourseRequest request) {
        TutorCourse c = tutorCourseRepository.findByIdAndTutorId(courseId, request.getTutorId())
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Khong tim thay lop cua gia su"));
        ensureTutorCanManageCourses(c.getTutor());
        if (c.getStatus() == CourseStatus.IN_PROGRESS || c.getStatus() == CourseStatus.COMPLETED || c.getStatus() == CourseStatus.CANCELLED) {
            throw new AppException(HttpStatus.CONFLICT, "Khong the sua lop dang hoc/da ket thuc");
        }
        Subject subject = subjectRepository.findById(request.getSubjectId())
            .orElseThrow(() -> new AppException(HttpStatus.BAD_REQUEST, "subjectId khong hop le"));
        Grade grade = gradeRepository.findById(request.getGradeId())
            .orElseThrow(() -> new AppException(HttpStatus.BAD_REQUEST, "gradeId khong hop le"));
        applyCourseRequest(c, request, subject, grade);
        c.setApprovalStatus(ApprovalStatus.PENDING);
        c.setApprovedBy(null);
        c.setApprovedAt(null);
        c.setRejectedReason(null);
        c = tutorCourseRepository.save(c);
        notificationService.pushToRole(
            UserRole.ADMIN,
            "Co lop/khoa hoc can duyet",
            "Lop \"" + c.getTitle() + "\" vua duoc cap nhat va dang cho duyet lai.",
            "COURSE_PENDING_REVIEW",
            "COURSE",
            c.getId()
        );
        return toCourseResponse(c);
    }

    @Transactional
    public TutorCourseResponse updateCourseByUser(Long tutorUserId, Long courseId, TutorCourseRequest request) {
        request.setTutorId(findTutorIdByUserId(tutorUserId));
        return updateCourse(courseId, request);
    }

    @Transactional
    public TutorCourseResponse updateCourseStatusByUser(Long tutorUserId, Long courseId, TutorCourseStatusUpdateRequest request) {
        Long tutorId = findTutorIdByUserId(tutorUserId);
        TutorCourse course = tutorCourseRepository.findByIdAndTutorId(courseId, tutorId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Khong tim thay lop cua gia su"));

        if (course.getApprovalStatus() != ApprovalStatus.APPROVED && request.getStatus() != CourseStatus.CANCELLED) {
            throw new AppException(HttpStatus.CONFLICT, "Chi duoc cap nhat trang thai day hoc sau khi lop da duoc duyet");
        }
        if (request.getStatus() == CourseStatus.IN_PROGRESS || request.getStatus() == CourseStatus.COMPLETED) {
            boolean hasAcceptedLearner = courseEnrollmentRepository.findByCourseIdOrderByCreatedAtDesc(course.getId()).stream()
                .anyMatch(enrollment -> enrollment.getStatus() == EnrollmentStatus.ACCEPTED
                    || enrollment.getStatus() == EnrollmentStatus.COMPLETED);
            if (!hasAcceptedLearner) {
                throw new AppException(HttpStatus.CONFLICT, "Chua co hoc vien duoc chap nhan. Khong the chuyen trang thai lop hoc.");
            }
        }

        validateCourseTransition(course.getStatus(), request.getStatus());
        course.setStatus(request.getStatus());
        course = tutorCourseRepository.save(course);
        syncEnrollmentsByCourseStatus(course);
        return toCourseResponse(course);
    }

    @Transactional(readOnly = true)
    public List<TutorCourseResponse> getTutorCourses(Long tutorId, CourseStatus status) {
        findTutor(tutorId);
        List<TutorCourse> courses = status == null
            ? tutorCourseRepository.findByTutorIdOrderByCreatedAtDesc(tutorId)
            : tutorCourseRepository.findByTutorIdAndStatusOrderByCreatedAtDesc(tutorId, status);
        return courses.stream().map(this::toCourseResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<TutorCourseResponse> getTutorCoursesByUser(Long tutorUserId, CourseStatus status) {
        Long tutorId = findTutorIdByUserId(tutorUserId);
        return getTutorCourses(tutorId, status);
    }

    @Transactional(readOnly = true)
    public List<CourseEnrollmentResponse> getCourseEnrollments(Long tutorId, Long courseId) {
        TutorCourse course = tutorCourseRepository.findByIdAndTutorId(courseId, tutorId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Khong tim thay lop cua gia su"));
        return courseEnrollmentRepository.findByCourseIdOrderByCreatedAtDesc(course.getId()).stream()
            .map(this::toEnrollmentResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<CourseEnrollmentResponse> getCourseEnrollmentsByUser(Long tutorUserId, Long courseId) {
        Long tutorId = findTutorIdByUserId(tutorUserId);
        return getCourseEnrollments(tutorId, courseId);
    }

    @Transactional
    public List<TutorMatchedClassResponse> getMatchedClassesByUser(Long tutorUserId) {
        Long tutorId = findTutorIdByUserId(tutorUserId);
        return matchedClassRepository.findByApplicationTutorIdOrderByCreatedAtDesc(tutorId).stream()
            .map(this::toMatchedClassResponse)
            .toList();
    }

    @Transactional
    public TutorMatchedClassResponse updateMatchedClassStatusByUser(
        Long tutorUserId,
        Long classId,
        TutorClassStatusUpdateRequest request
    ) {
        Long tutorId = findTutorIdByUserId(tutorUserId);
        MatchedClass mc = matchedClassRepository.findByIdAndApplicationTutorId(classId, tutorId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Khong tim thay lop"));

        validateMatchedClassTransition(mc.getStatus(), request.getStatus());
        mc.setStatus(request.getStatus());
        if (request.getStatus() == MatchedClassStatus.IN_PROGRESS && mc.getAssignedAt() == null) {
            mc.setAssignedAt(LocalDateTime.now());
        }
        if (request.getStatus() == MatchedClassStatus.COMPLETED) {
            mc.setCompletedAt(LocalDateTime.now());
        }
        if (request.getStatus() == MatchedClassStatus.CANCELLED) {
            mc.setCancelledAt(LocalDateTime.now());
        }

        syncPostStatus(mc.getPost(), request.getStatus());
        mc = matchedClassRepository.save(mc);
        return toMatchedClassResponse(mc);
    }

    @Transactional
    public CourseEnrollmentResponse updateEnrollmentStatus(Long enrollmentId, EnrollmentStatusUpdateRequest request) {
        if (request.getStatus() != EnrollmentStatus.ACCEPTED
            && request.getStatus() != EnrollmentStatus.REJECTED
            && request.getStatus() != EnrollmentStatus.CANCELLED
            && request.getStatus() != EnrollmentStatus.COMPLETED) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Trang thai khong hop le cho gia su xu ly");
        }
        CourseEnrollment e = courseEnrollmentRepository.findByIdAndCourseTutorId(enrollmentId, request.getTutorId())
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Khong tim thay dang ky"));
        validateEnrollmentTransition(e.getStatus(), request.getStatus());
        if (request.getStatus() == EnrollmentStatus.ACCEPTED && e.getStatus() != EnrollmentStatus.ACCEPTED) {
            Integer maxStudents = e.getCourse().getMaxStudents();
            if (maxStudents != null && maxStudents > 0) {
                long acceptedCount = courseEnrollmentRepository.countByCourseIdAndStatus(
                    e.getCourse().getId(),
                    EnrollmentStatus.ACCEPTED
                );
                if (acceptedCount >= maxStudents) {
                    throw new AppException(HttpStatus.CONFLICT, "Lop da du so hoc vien duoc nhan");
                }
            }
        }
        e.setStatus(request.getStatus());
        if (request.getStatus() == EnrollmentStatus.ACCEPTED) {
            e.setJoinedAt(LocalDateTime.now());
        } else if (request.getStatus() == EnrollmentStatus.COMPLETED) {
            e.setCompletedAt(LocalDateTime.now());
        } else if (request.getStatus() == EnrollmentStatus.CANCELLED) {
            e.setCancelledAt(LocalDateTime.now());
        }
        e = courseEnrollmentRepository.save(e);
        syncCourseOpenCloseByCapacity(e.getCourse());
        notificationService.push(
            e.getLearnerUser().getId(),
            "Dang ky lop da duoc cap nhat",
            "Trang thai dang ky cua ban da duoc cap nhat thanh " + e.getStatus(),
            "ENROLLMENT_STATUS",
            "ENROLLMENT",
            e.getId()
        );
        return toEnrollmentResponse(e);
    }

    @Transactional
    public CourseEnrollmentResponse updateEnrollmentStatusByUser(Long tutorUserId, Long enrollmentId, EnrollmentStatusUpdateRequest request) {
        request.setTutorId(findTutorIdByUserId(tutorUserId));
        return updateEnrollmentStatus(enrollmentId, request);
    }

    @Transactional(readOnly = true)
    public List<TutorReviewResponse> getReviewsByUser(Long tutorUserId) {
        Long tutorId = findTutorIdByUserId(tutorUserId);
        return reviewRepository.findByTutorIdOrderByCreatedAtDesc(tutorId).stream()
            .map(this::toTutorReviewResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<TutorReviewResponse> getReviewsByTutorId(Long tutorId) {
        findTutor(tutorId);
        return reviewRepository.findByTutorIdOrderByCreatedAtDesc(tutorId).stream()
            .map(this::toTutorReviewResponse)
            .toList();
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
        throw new AppException(HttpStatus.CONFLICT, "Khong the chuyen trang thai dang ky tu " + current + " sang " + target);
    }

    private void validateMatchedClassTransition(MatchedClassStatus current, MatchedClassStatus target) {
        if (current == target) {
            return;
        }
        if (current == MatchedClassStatus.ASSIGNED
            && (target == MatchedClassStatus.IN_PROGRESS || target == MatchedClassStatus.CANCELLED)) {
            return;
        }
        if (current == MatchedClassStatus.IN_PROGRESS
            && (target == MatchedClassStatus.COMPLETED || target == MatchedClassStatus.CANCELLED)) {
            return;
        }
        throw new AppException(HttpStatus.CONFLICT, "Khong the chuyen trang thai lop tu " + current + " sang " + target);
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
        throw new AppException(HttpStatus.CONFLICT, "Khong the chuyen trang thai lop tu " + current + " sang " + target);
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

    private void syncEnrollmentsByCourseStatus(TutorCourse course) {
        if (course == null || course.getId() == null) {
            return;
        }
        if (course.getStatus() == CourseStatus.COMPLETED) {
            List<CourseEnrollment> enrollments = courseEnrollmentRepository.findByCourseIdOrderByCreatedAtDesc(course.getId());
            for (CourseEnrollment enrollment : enrollments) {
                if (enrollment.getStatus() == EnrollmentStatus.ACCEPTED) {
                    enrollment.setStatus(EnrollmentStatus.COMPLETED);
                    if (enrollment.getCompletedAt() == null) {
                        enrollment.setCompletedAt(LocalDateTime.now());
                    }
                    courseEnrollmentRepository.save(enrollment);
                }
            }
        }
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

    private Tutor findTutor(Long tutorId) {
        return tutorRepository.findById(tutorId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Khong tim thay gia su"));
    }

    private void ensureTutorCanManageCourses(Tutor tutor) {
        if (tutor == null || tutor.getUser() == null) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Thong tin gia su khong hop le");
        }
        if (tutor.getUser().getStatus() != UserStatus.ACTIVE) {
            throw new AppException(HttpStatus.FORBIDDEN, "Tai khoan gia su da bi khoa/khong hoat dong");
        }
        if (tutor.getProfileStatus() != TutorProfileStatus.APPROVED) {
            throw new AppException(HttpStatus.FORBIDDEN, "Chi gia su da duoc duyet moi co the mo/sua lop");
        }
    }

    private AvailablePostResponse toAvailablePost(Post p) {
        return AvailablePostResponse.builder()
            .postId(p.getId())
            .title(p.getTitle())
            .description(p.getDescription())
            .subject(p.getSubject().getName())
            .grade(p.getGrade().getName())
            .teachingMode(p.getTeachingMode())
            .studyTime(p.getStudyTime())
            .budget(p.getBudget())
            .province(p.getProvince())
            .district(p.getDistrict())
            .addressDetail(p.getAddressDetail())
            .createdAt(p.getCreatedAt())
            .build();
    }

    private TutorApplicationResponse toApplicationResponse(Application app) {
        User learner = app.getPost().getLearnerUser();
        User tutorUser = app.getTutor() != null ? app.getTutor().getUser() : null;
        MatchedClass matchedClass = matchedClassRepository.findByApplicationId(app.getId()).orElse(null);
        if (matchedClass == null
            && app.getStatus() == ApplicationStatus.ACCEPTED
            && app.getTutor() != null
            && app.getPost() != null) {
            matchedClass = matchedClassRepository.findByPostId(app.getPost().getId())
                .filter(mc -> mc.getApplication() != null
                    && mc.getApplication().getTutor() != null
                    && app.getTutor().getId().equals(mc.getApplication().getTutor().getId()))
                .orElse(null);
        }
        if (matchedClass == null
            && app.getStatus() == ApplicationStatus.ACCEPTED
            && app.getTutor() != null
            && app.getPost() != null) {
            matchedClass = matchedClassRepository.findByApplicationTutorIdOrderByCreatedAtDesc(app.getTutor().getId()).stream()
                .filter(mc -> mc.getPost() != null && app.getPost().getId().equals(mc.getPost().getId()))
                .findFirst()
                .orElse(null);
        }
        Long matchedClassId = matchedClass != null ? matchedClass.getId() : null;
        boolean hasActiveMatchedClass = matchedClass != null && matchedClass.getStatus() != MatchedClassStatus.CANCELLED;
        boolean canViewContact = app.getStatus() == ApplicationStatus.ACCEPTED || hasActiveMatchedClass;
        return TutorApplicationResponse.builder()
            .applicationId(app.getId())
            .postId(app.getPost().getId())
            .matchedClassId(matchedClassId)
            .postTitle(app.getPost().getTitle())
            .subject(app.getPost().getSubject().getName())
            .grade(app.getPost().getGrade().getName())
            .province(app.getPost().getProvince())
            .district(app.getPost().getDistrict())
            .learnerName(learner.getFullName())
            .learnerEmail(canViewContact ? learner.getEmail() : null)
            .learnerPhone(canViewContact ? learner.getPhone() : null)
            .tutorName(tutorUser != null ? tutorUser.getFullName() : null)
            .tutorEmail(canViewContact && tutorUser != null ? tutorUser.getEmail() : null)
            .tutorPhone(canViewContact && tutorUser != null ? tutorUser.getPhone() : null)
            .message(app.getMessage())
            .expectedFee(app.getExpectedFee())
            .status(app.getStatus())
            .createdAt(app.getCreatedAt())
            .build();
    }

    private void applyCourseRequest(TutorCourse c, TutorCourseRequest request, Subject subject, Grade grade) {
        c.setTitle(request.getTitle());
        c.setDescription(request.getDescription());
        c.setSubject(subject);
        c.setGrade(grade);
        c.setTeachingMode(request.getTeachingMode());
        c.setStudyTime(request.getStudyTime());
        c.setPrice(request.getPrice());
        c.setMaxStudents(request.getMaxStudents());
        c.setProvince(request.getProvince());
        c.setDistrict(request.getDistrict());
        c.setAddressDetail(request.getAddressDetail());
    }

    private TutorCourseResponse toCourseResponse(TutorCourse c) {
        return TutorCourseResponse.builder()
            .courseId(c.getId())
            .tutorId(c.getTutor().getId())
            .tutorName(c.getTutor().getUser().getFullName())
            .title(c.getTitle())
            .description(c.getDescription())
            .subject(c.getSubject().getName())
            .grade(c.getGrade().getName())
            .teachingMode(c.getTeachingMode())
            .studyTime(c.getStudyTime())
            .price(c.getPrice())
            .maxStudents(c.getMaxStudents())
            .province(c.getProvince())
            .district(c.getDistrict())
            .addressDetail(c.getAddressDetail())
            .approvalStatus(c.getApprovalStatus())
            .status(c.getStatus())
            .createdAt(c.getCreatedAt())
            .build();
    }

    private CourseEnrollmentResponse toEnrollmentResponse(CourseEnrollment e) {
        User learner = e.getLearnerUser();
        User tutorUser = e.getCourse().getTutor().getUser();
        return CourseEnrollmentResponse.builder()
            .enrollmentId(e.getId())
            .courseId(e.getCourse().getId())
            .courseTitle(e.getCourse().getTitle())
            .tutorId(e.getCourse().getTutor().getId())
            .tutorName(tutorUser.getFullName())
            .tutorEmail(tutorUser.getEmail())
            .tutorPhone(tutorUser.getPhone())
            .learnerUserId(learner.getId())
            .learnerName(learner.getFullName())
            .learnerEmail(learner.getEmail())
            .learnerPhone(learner.getPhone())
            .message(e.getMessage())
            .agreedFee(e.getAgreedFee())
            .courseStatus(e.getCourse().getStatus())
            .status(e.getStatus())
            .createdAt(e.getCreatedAt())
            .build();
    }

    private TutorMatchedClassResponse toMatchedClassResponse(MatchedClass mc) {
        User learner = mc.getPost().getLearnerUser();
        return TutorMatchedClassResponse.builder()
            .classId(mc.getId())
            .postId(mc.getPost().getId())
            .postTitle(mc.getPost().getTitle())
            .learnerUserId(learner.getId())
            .learnerName(learner.getFullName())
            .learnerEmail(learner.getEmail())
            .learnerPhone(learner.getPhone())
            .status(mc.getStatus())
            .startDate(mc.getStartDate())
            .endDate(mc.getEndDate())
            .assignedAt(mc.getAssignedAt())
            .build();
    }

    private TutorReviewResponse toTutorReviewResponse(Review r) {
        return TutorReviewResponse.builder()
            .reviewId(r.getId())
            .matchedClassId(r.getMatchedClass() != null ? r.getMatchedClass().getId() : null)
            .courseEnrollmentId(r.getCourseEnrollment() != null ? r.getCourseEnrollment().getId() : null)
            .courseId(r.getCourseEnrollment() != null && r.getCourseEnrollment().getCourse() != null
                ? r.getCourseEnrollment().getCourse().getId()
                : null)
            .postId(r.getMatchedClass() != null && r.getMatchedClass().getPost() != null
                ? r.getMatchedClass().getPost().getId()
                : null)
            .postTitle(r.getMatchedClass() != null && r.getMatchedClass().getPost() != null
                ? r.getMatchedClass().getPost().getTitle()
                : null)
            .courseTitle(r.getCourseEnrollment() != null && r.getCourseEnrollment().getCourse() != null
                ? r.getCourseEnrollment().getCourse().getTitle()
                : null)
            .learnerName(r.getLearnerUser().getFullName())
            .rating(r.getRating())
            .comment(r.getComment())
            .createdAt(r.getCreatedAt())
            .build();
    }

}
