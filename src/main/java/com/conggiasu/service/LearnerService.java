package com.conggiasu.service;

import com.conggiasu.dto.request.ClassStatusUpdateRequest;
import com.conggiasu.dto.request.EnrollmentCreateRequest;
import com.conggiasu.dto.request.LearnerApplicationDecisionRequest;
import com.conggiasu.dto.request.PostUpsertRequest;
import com.conggiasu.dto.request.ReviewCreateRequest;
import com.conggiasu.dto.response.CourseEnrollmentResponse;
import com.conggiasu.dto.response.LearnerClassResponse;
import com.conggiasu.dto.response.LearnerPostResponse;
import com.conggiasu.dto.response.TutorApplicationResponse;
import com.conggiasu.dto.response.TutorCourseResponse;
import com.conggiasu.entity.Application;
import com.conggiasu.entity.CourseEnrollment;
import com.conggiasu.entity.enums.ApplicationStatus;
import com.conggiasu.entity.enums.ApprovalStatus;
import com.conggiasu.entity.enums.CourseStatus;
import com.conggiasu.entity.enums.EnrollmentStatus;
import com.conggiasu.entity.enums.MatchedClassStatus;
import com.conggiasu.entity.enums.PostStatus;
import com.conggiasu.entity.enums.TeachingMode;
import com.conggiasu.entity.enums.UserRole;
import com.conggiasu.entity.Grade;
import com.conggiasu.entity.MatchedClass;
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
public class LearnerService {
    private final UserRepository userRepository;
    private final SubjectRepository subjectRepository;
    private final GradeRepository gradeRepository;
    private final PostRepository postRepository;
    private final ApplicationRepository applicationRepository;
    private final MatchedClassRepository matchedClassRepository;
    private final TutorCourseRepository tutorCourseRepository;
    private final CourseEnrollmentRepository courseEnrollmentRepository;
    private final ReviewRepository reviewRepository;
    private final NotificationService notificationService;

    @Transactional
    public LearnerPostResponse createPost(PostUpsertRequest request) {
        User learner = validateLearner(request.getLearnerUserId());
        Subject subject = subjectRepository.findById(request.getSubjectId())
            .orElseThrow(() -> new AppException(HttpStatus.BAD_REQUEST, "subjectId khong hop le"));
        Grade grade = gradeRepository.findById(request.getGradeId())
            .orElseThrow(() -> new AppException(HttpStatus.BAD_REQUEST, "gradeId khong hop le"));

        Post post = new Post();
        post.setLearnerUser(learner);
        applyPost(post, request, subject, grade);
        post.setApprovalStatus(ApprovalStatus.PENDING);
        post.setStatus(PostStatus.OPEN);
        post = postRepository.save(post);
        notificationService.pushToRole(
            UserRole.ADMIN,
            "Co bai dang hoc vien can duyet",
            "Bai dang \"" + post.getTitle() + "\" vua duoc tao va dang cho duyet.",
            "POST_PENDING_REVIEW",
            "POST",
            post.getId()
        );
        return toLearnerPost(post);
    }

    @Transactional
    public LearnerPostResponse updatePost(Long postId, PostUpsertRequest request) {
        Post post = postRepository.findByIdAndLearnerUserId(postId, request.getLearnerUserId())
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Khong tim thay bai dang"));
        if (post.getStatus() != PostStatus.OPEN) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Chi duoc sua bai dang dang mo");
        }
        Subject subject = subjectRepository.findById(request.getSubjectId())
            .orElseThrow(() -> new AppException(HttpStatus.BAD_REQUEST, "subjectId khong hop le"));
        Grade grade = gradeRepository.findById(request.getGradeId())
            .orElseThrow(() -> new AppException(HttpStatus.BAD_REQUEST, "gradeId khong hop le"));

        applyPost(post, request, subject, grade);
        post.setApprovalStatus(ApprovalStatus.PENDING);
        post = postRepository.save(post);
        notificationService.pushToRole(
            UserRole.ADMIN,
            "Co bai dang hoc vien can duyet",
            "Bai dang \"" + post.getTitle() + "\" vua duoc cap nhat va dang cho duyet lai.",
            "POST_PENDING_REVIEW",
            "POST",
            post.getId()
        );
        return toLearnerPost(post);
    }

    @Transactional
    public LearnerPostResponse cancelPost(Long learnerUserId, Long postId) {
        Post post = postRepository.findByIdAndLearnerUserId(postId, learnerUserId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Khong tim thay bai dang"));
        if (post.getStatus() == PostStatus.COMPLETED
            || post.getStatus() == PostStatus.CLOSED
            || post.getStatus() == PostStatus.ASSIGNED
            || post.getStatus() == PostStatus.IN_PROGRESS) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Khong the huy bai dang da duoc nhan/dang dien ra/da hoan thanh");
        }
        post.setStatus(PostStatus.CANCELLED);
        post = postRepository.save(post);
        return toLearnerPost(post);
    }

    @Transactional(readOnly = true)
    public List<LearnerPostResponse> getPosts(Long learnerUserId, ApprovalStatus approvalStatus) {
        validateLearner(learnerUserId);
        List<Post> posts = approvalStatus == null
            ? postRepository.findByLearnerUserIdOrderByCreatedAtDesc(learnerUserId)
            : postRepository.findByLearnerUserIdAndApprovalStatusOrderByCreatedAtDesc(learnerUserId, approvalStatus);
        return posts.stream().map(this::toLearnerPost).toList();
    }

    @Transactional(readOnly = true)
    public List<TutorApplicationResponse> getPostApplications(Long learnerUserId, Long postId) {
        Post post = postRepository.findByIdAndLearnerUserId(postId, learnerUserId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Khong tim thay bai dang"));
        return applicationRepository.findByPostIdOrderByCreatedAtDesc(post.getId()).stream()
            .map(this::toTutorApplication)
            .toList();
    }

    @Transactional
    public TutorApplicationResponse decideApplication(Long applicationId, LearnerApplicationDecisionRequest request) {
        Application application = applicationRepository.findById(applicationId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Khong tim thay don ung tuyen"));
        Post post = application.getPost();
        if (!post.getLearnerUser().getId().equals(request.getLearnerUserId())) {
            throw new AppException(HttpStatus.FORBIDDEN, "Ban khong co quyen xu ly don nay");
        }
        if (application.getStatus() != ApplicationStatus.PENDING) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Don da duoc xu ly");
        }
        if (post.getApprovalStatus() != ApprovalStatus.APPROVED || post.getStatus() != PostStatus.OPEN) {
            throw new AppException(HttpStatus.CONFLICT, "Bai dang khong o trang thai cho phep xu ly don");
        }

        if (Boolean.TRUE.equals(request.getAccepted())) {
            validateClassDateRange(request);
            if (matchedClassRepository.existsByPostId(post.getId())) {
                throw new AppException(HttpStatus.CONFLICT, "Bai dang nay da duoc ghep lop");
            }
            application.setStatus(ApplicationStatus.ACCEPTED);
            applicationRepository.save(application);

            List<Application> pendingOthers = applicationRepository.findByPostIdAndStatus(
                post.getId(), ApplicationStatus.PENDING
            );
            for (Application other : pendingOthers) {
                if (!other.getId().equals(application.getId())) {
                    other.setStatus(ApplicationStatus.REJECTED);
                    applicationRepository.save(other);
                }
            }

            if (matchedClassRepository.findByApplicationId(application.getId()).isEmpty()) {
                MatchedClass mc = new MatchedClass();
                mc.setPost(post);
                mc.setApplication(application);
                mc.setStartDate(request.getStartDate());
                mc.setEndDate(request.getEndDate());
                mc.setStatus(MatchedClassStatus.ASSIGNED);
                mc.setAssignedAt(LocalDateTime.now());
                matchedClassRepository.save(mc);
            }
            syncPostStatus(post, MatchedClassStatus.ASSIGNED);
            notificationService.push(
                application.getTutor().getUser().getId(),
                "Don ung tuyen duoc chap nhan",
                "Don ung tuyen cua ban cho bai dang \"" + post.getTitle() + "\" da duoc chap nhan.",
                "APPLICATION_DECISION",
                "APPLICATION",
                application.getId()
            );
        } else {
            application.setStatus(ApplicationStatus.REJECTED);
            applicationRepository.save(application);
            notificationService.push(
                application.getTutor().getUser().getId(),
                "Don ung tuyen bi tu choi",
                "Don ung tuyen cua ban cho bai dang \"" + post.getTitle() + "\" da bi tu choi.",
                "APPLICATION_DECISION",
                "APPLICATION",
                application.getId()
            );
        }
        return toTutorApplication(application);
    }

    private void validateClassDateRange(LearnerApplicationDecisionRequest request) {
        if (request.getStartDate() != null
            && request.getEndDate() != null
            && request.getEndDate().isBefore(request.getStartDate())) {
            throw new AppException(HttpStatus.BAD_REQUEST, "endDate khong duoc nho hon startDate");
        }
    }

    @Transactional(readOnly = true)
    public List<LearnerClassResponse> getClasses(Long learnerUserId) {
        validateLearner(learnerUserId);
        return matchedClassRepository.findByPostLearnerUserIdOrderByCreatedAtDesc(learnerUserId).stream()
            .map(this::toLearnerClass)
            .toList();
    }

    @Transactional
    public LearnerClassResponse updateClassStatus(Long classId, ClassStatusUpdateRequest request) {
        MatchedClass mc = matchedClassRepository.findByIdAndPostLearnerUserId(classId, request.getLearnerUserId())
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Khong tim thay lop"));
        validateClassStatusTransition(mc.getStatus(), request.getStatus());
        mc.setStatus(request.getStatus());
        if (request.getStatus() == MatchedClassStatus.COMPLETED) mc.setCompletedAt(LocalDateTime.now());
        if (request.getStatus() == MatchedClassStatus.CANCELLED) mc.setCancelledAt(LocalDateTime.now());
        if (request.getStatus() == MatchedClassStatus.IN_PROGRESS && mc.getAssignedAt() == null) mc.setAssignedAt(LocalDateTime.now());
        syncPostStatus(mc.getPost(), request.getStatus());
        mc = matchedClassRepository.save(mc);
        return toLearnerClass(mc);
    }

    @Transactional(readOnly = true)
    public List<TutorCourseResponse> availableCourses(
        Long subjectId, Long gradeId, TeachingMode teachingMode, String province, String district
    ) {
        List<TutorCourse> courses = tutorCourseRepository.findAvailableCourses(
            ApprovalStatus.APPROVED,
            CourseStatus.OPEN,
            subjectId,
            gradeId,
            teachingMode,
            normalizeFilter(province),
            normalizeFilter(district)
        );
        return courses.stream().map(this::toTutorCourse).toList();
    }

    @Transactional(readOnly = true)
    public TutorCourseResponse availableCourseDetail(Long courseId) {
        TutorCourse course = tutorCourseRepository.findById(courseId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Khong tim thay khoa hoc"));
        if (course.getApprovalStatus() != ApprovalStatus.APPROVED || course.getStatus() != CourseStatus.OPEN) {
            throw new AppException(HttpStatus.NOT_FOUND, "Khoa hoc khong kha dung");
        }
        return toTutorCourse(course);
    }

    @Transactional(readOnly = true)
    public List<TutorCourseResponse> availableCoursesByTutorId(Long tutorId) {
        List<TutorCourse> courses = tutorCourseRepository.findByTutorIdAndApprovalStatusAndStatusOrderByCreatedAtDesc(
            tutorId, ApprovalStatus.APPROVED, CourseStatus.OPEN
        );
        return courses.stream().map(this::toTutorCourse).toList();
    }

    @Transactional
    public CourseEnrollmentResponse enrollCourse(Long courseId, EnrollmentCreateRequest request) {
        User learner = validateLearner(request.getLearnerUserId());
        TutorCourse course = tutorCourseRepository.findById(courseId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Khong tim thay khoa hoc"));
        if (course.getApprovalStatus() != ApprovalStatus.APPROVED || course.getStatus() != CourseStatus.OPEN) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Khoa hoc khong con mo dang ky");
        }
        if (courseEnrollmentRepository.existsByCourseIdAndLearnerUserId(courseId, learner.getId())) {
            throw new AppException(HttpStatus.CONFLICT, "Ban da dang ky khoa hoc nay");
        }
        CourseEnrollment e = new CourseEnrollment();
        e.setCourse(course);
        e.setLearnerUser(learner);
        e.setMessage(request.getMessage());
        e.setAgreedFee(request.getAgreedFee());
        e.setStatus(EnrollmentStatus.PENDING);
        e = courseEnrollmentRepository.save(e);
        notificationService.push(
            course.getTutor().getUser().getId(),
            "Co hoc vien dang ky lop",
            "Lop \"" + course.getTitle() + "\" vua co hoc vien dang ky.",
            "ENROLLMENT_NEW",
            "ENROLLMENT",
            e.getId()
        );
        return toEnrollment(e);
    }

    @Transactional
    public CourseEnrollmentResponse cancelEnrollment(Long enrollmentId, Long learnerUserId) {
        CourseEnrollment e = courseEnrollmentRepository.findByIdAndLearnerUserId(enrollmentId, learnerUserId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Khong tim thay dang ky"));
        if (e.getStatus() != EnrollmentStatus.PENDING) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Chi huy duoc dang ky dang cho");
        }
        e.setStatus(EnrollmentStatus.CANCELLED);
        e.setCancelledAt(LocalDateTime.now());
        e = courseEnrollmentRepository.save(e);
        notificationService.push(
            e.getCourse().getTutor().getUser().getId(),
            "Hoc vien huy dang ky",
            "Mot hoc vien vua huy dang ky lop \"" + e.getCourse().getTitle() + "\".",
            "ENROLLMENT_CANCELLED",
            "ENROLLMENT",
            e.getId()
        );
        return toEnrollment(e);
    }

    @Transactional(readOnly = true)
    public List<CourseEnrollmentResponse> myEnrollments(Long learnerUserId) {
        validateLearner(learnerUserId);
        return courseEnrollmentRepository.findByLearnerUserIdOrderByCreatedAtDesc(learnerUserId).stream()
            .map(this::toEnrollment)
            .toList();
    }

    @Transactional
    public void createReview(ReviewCreateRequest request) {
        User learner = validateLearner(request.getLearnerUserId());
        if ((request.getClassId() == null && request.getCourseEnrollmentId() == null)
            || (request.getClassId() != null && request.getCourseEnrollmentId() != null)) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Chi duoc review mot loai doi tuong");
        }

        Review r = new Review();
        r.setLearnerUser(learner);
        r.setRating(request.getRating());
        r.setComment(request.getComment());

        if (request.getClassId() != null) {
            MatchedClass mc = matchedClassRepository.findByIdAndPostLearnerUserId(request.getClassId(), learner.getId())
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Khong tim thay lop"));
            if (mc.getStatus() != MatchedClassStatus.COMPLETED) {
                throw new AppException(HttpStatus.BAD_REQUEST, "Chi duoc danh gia sau khi hoan thanh");
            }
            if (reviewRepository.existsByMatchedClassId(mc.getId())) {
                throw new AppException(HttpStatus.CONFLICT, "Lop nay da co danh gia");
            }
            r.setMatchedClass(mc);
            r.setTutor(mc.getApplication().getTutor());
        } else {
            CourseEnrollment e = courseEnrollmentRepository.findByIdAndLearnerUserId(request.getCourseEnrollmentId(), learner.getId())
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Khong tim thay qua trinh hoc"));
            if (e.getStatus() != EnrollmentStatus.COMPLETED) {
                boolean completedByCourse = e.getStatus() == EnrollmentStatus.ACCEPTED
                    && e.getCourse() != null
                    && e.getCourse().getStatus() == CourseStatus.COMPLETED;
                if (completedByCourse) {
                    e.setStatus(EnrollmentStatus.COMPLETED);
                    if (e.getCompletedAt() == null) {
                        e.setCompletedAt(LocalDateTime.now());
                    }
                    e = courseEnrollmentRepository.save(e);
                } else {
                    throw new AppException(HttpStatus.BAD_REQUEST, "Chi duoc danh gia sau khi hoan thanh");
                }
            }
            if (reviewRepository.existsByCourseEnrollmentId(e.getId())) {
                throw new AppException(HttpStatus.CONFLICT, "Qua trinh hoc nay da co danh gia");
            }
            r.setCourseEnrollment(e);
            r.setTutor(e.getCourse().getTutor());
        }
        reviewRepository.save(r);
        notificationService.push(
            r.getTutor().getUser().getId(),
            "Ban vua nhan danh gia moi",
            "Hoc vien vua gui danh gia " + r.getRating() + " sao cho ban.",
            "REVIEW_NEW",
            "REVIEW",
            r.getId()
        );
    }

    private void validateClassStatusTransition(MatchedClassStatus current, MatchedClassStatus target) {
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

    private User validateLearner(Long learnerUserId) {
        User user = userRepository.findById(learnerUserId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Khong tim thay user"));
        if (user.getRole() != UserRole.LEARNER) {
            throw new AppException(HttpStatus.BAD_REQUEST, "User khong phai hoc vien");
        }
        return user;
    }

    private void applyPost(Post post, PostUpsertRequest req, Subject s, Grade g) {
        post.setSubject(s);
        post.setGrade(g);
        post.setTitle(req.getTitle());
        post.setDescription(req.getDescription());
        post.setTeachingMode(req.getTeachingMode());
        post.setStudyTime(req.getStudyTime());
        post.setBudget(req.getBudget());
        post.setProvince(req.getProvince());
        post.setDistrict(req.getDistrict());
        post.setAddressDetail(req.getAddressDetail());
    }

    private LearnerPostResponse toLearnerPost(Post p) {
        return LearnerPostResponse.builder()
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
            .approvalStatus(p.getApprovalStatus())
            .status(p.getStatus())
            .rejectedReason(p.getRejectedReason())
            .createdAt(p.getCreatedAt())
            .build();
    }

    private TutorApplicationResponse toTutorApplication(Application app) {
        User learner = app.getPost().getLearnerUser();
        User tutorUser = app.getTutor() != null ? app.getTutor().getUser() : null;
        MatchedClass matchedClass = matchedClassRepository.findByApplicationId(app.getId()).orElse(null);
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

    private String normalizeFilter(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim().toLowerCase();
    }

    private LearnerClassResponse toLearnerClass(MatchedClass mc) {
        Tutor tutor = mc.getApplication().getTutor();
        User tutorUser = tutor.getUser();
        boolean showContact = mc.getStatus() != MatchedClassStatus.CANCELLED;
        return LearnerClassResponse.builder()
            .classId(mc.getId())
            .postId(mc.getPost().getId())
            .postTitle(mc.getPost().getTitle())
            .tutorId(tutor.getId())
            .tutorName(tutorUser.getFullName())
            .tutorEmail(showContact ? tutorUser.getEmail() : null)
            .tutorPhone(showContact ? tutorUser.getPhone() : null)
            .status(mc.getStatus())
            .startDate(mc.getStartDate())
            .endDate(mc.getEndDate())
            .assignedAt(mc.getAssignedAt())
            .build();
    }

    private TutorCourseResponse toTutorCourse(TutorCourse c) {
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

    private CourseEnrollmentResponse toEnrollment(CourseEnrollment e) {
        User learner = e.getLearnerUser();
        User tutorUser = e.getCourse().getTutor().getUser();
        EnrollmentStatus displayStatus = e.getStatus();
        if (displayStatus == EnrollmentStatus.ACCEPTED
            && e.getCourse() != null
            && e.getCourse().getStatus() == CourseStatus.COMPLETED) {
            displayStatus = EnrollmentStatus.COMPLETED;
        }
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
            .status(displayStatus)
            .createdAt(e.getCreatedAt())
            .build();
    }
}
