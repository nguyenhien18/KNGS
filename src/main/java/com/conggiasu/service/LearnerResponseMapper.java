package com.conggiasu.service;

import com.conggiasu.dto.request.PostUpsertRequest;
import com.conggiasu.dto.response.CourseEnrollmentResponse;
import com.conggiasu.dto.response.LearnerClassResponse;
import com.conggiasu.dto.response.LearnerPostResponse;
import com.conggiasu.dto.response.TutorApplicationResponse;
import com.conggiasu.dto.response.TutorCourseResponse;
import com.conggiasu.entity.Application;
import com.conggiasu.entity.CourseEnrollment;
import com.conggiasu.entity.Grade;
import com.conggiasu.entity.MatchedClass;
import com.conggiasu.entity.Post;
import com.conggiasu.entity.Subject;
import com.conggiasu.entity.Tutor;
import com.conggiasu.entity.TutorCourse;
import com.conggiasu.entity.User;
import com.conggiasu.entity.enums.ApplicationStatus;
import com.conggiasu.entity.enums.CourseStatus;
import com.conggiasu.entity.enums.EnrollmentStatus;
import com.conggiasu.entity.enums.MatchedClassStatus;
import com.conggiasu.repository.MatchedClassRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class LearnerResponseMapper {
    private final MatchedClassRepository matchedClassRepository;

    public void applyPost(Post post, PostUpsertRequest request, Subject subject, Grade grade) {
        post.setSubject(subject);
        post.setGrade(grade);
        post.setTitle(request.getTitle());
        post.setDescription(request.getDescription());
        post.setTeachingMode(request.getTeachingMode());
        post.setStudyTime(request.getStudyTime());
        post.setBudget(request.getBudget());
        post.setProvince(request.getProvince());
        post.setDistrict(request.getDistrict());
        post.setAddressDetail(request.getAddressDetail());
    }

    public LearnerPostResponse toLearnerPost(Post post) {
        return LearnerPostResponse.builder()
            .postId(post.getId())
            .title(post.getTitle())
            .description(post.getDescription())
            .subject(post.getSubject().getName())
            .grade(post.getGrade().getName())
            .teachingMode(post.getTeachingMode())
            .studyTime(post.getStudyTime())
            .budget(post.getBudget())
            .province(post.getProvince())
            .district(post.getDistrict())
            .addressDetail(post.getAddressDetail())
            .approvalStatus(post.getApprovalStatus())
            .status(post.getStatus())
            .rejectedReason(post.getRejectedReason())
            .createdAt(post.getCreatedAt())
            .build();
    }

    public TutorApplicationResponse toTutorApplication(Application app) {
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

    public LearnerClassResponse toLearnerClass(MatchedClass matchedClass) {
        Tutor tutor = matchedClass.getApplication().getTutor();
        User tutorUser = tutor.getUser();
        Long learnerUserId = matchedClass.getPost().getLearnerUser().getId();
        boolean showContact = matchedClass.getStatus() != MatchedClassStatus.CANCELLED;
        return LearnerClassResponse.builder()
            .classId(matchedClass.getId())
            .postId(matchedClass.getPost().getId())
            .postTitle(matchedClass.getPost().getTitle())
            .tutorId(tutor.getId())
            .tutorName(tutorUser.getFullName())
            .tutorEmail(showContact ? tutorUser.getEmail() : null)
            .tutorPhone(showContact ? tutorUser.getPhone() : null)
            .status(matchedClass.getStatus())
            .statusRequestedByUserId(matchedClass.getStatusRequestedByUserId())
            .statusRequestedByRole(matchedClass.getStatusRequestedByRole())
            .statusRequestedAt(matchedClass.getStatusRequestedAt())
            .statusRequestReason(matchedClass.getStatusRequestReason())
            .waitingForMyConfirmation(isWaitingForMyConfirmation(matchedClass, learnerUserId))
            .startDate(matchedClass.getStartDate())
            .endDate(matchedClass.getEndDate())
            .assignedAt(matchedClass.getAssignedAt())
            .build();
    }

    public TutorCourseResponse toTutorCourse(TutorCourse course) {
        return TutorCourseResponse.builder()
            .courseId(course.getId())
            .tutorId(course.getTutor().getId())
            .tutorName(course.getTutor().getUser().getFullName())
            .title(course.getTitle())
            .description(course.getDescription())
            .subject(course.getSubject().getName())
            .grade(course.getGrade().getName())
            .teachingMode(course.getTeachingMode())
            .studyTime(course.getStudyTime())
            .price(course.getPrice())
            .maxStudents(course.getMaxStudents())
            .province(course.getProvince())
            .district(course.getDistrict())
            .addressDetail(course.getAddressDetail())
            .approvalStatus(course.getApprovalStatus())
            .status(course.getStatus())
            .createdAt(course.getCreatedAt())
            .build();
    }

    public CourseEnrollmentResponse toEnrollment(CourseEnrollment enrollment) {
        User learner = enrollment.getLearnerUser();
        User tutorUser = enrollment.getCourse().getTutor().getUser();
        EnrollmentStatus displayStatus = enrollment.getStatus();
        if (displayStatus == EnrollmentStatus.ACCEPTED
            && enrollment.getCourse() != null
            && enrollment.getCourse().getStatus() == CourseStatus.COMPLETED) {
            displayStatus = EnrollmentStatus.COMPLETED;
        }
        return CourseEnrollmentResponse.builder()
            .enrollmentId(enrollment.getId())
            .courseId(enrollment.getCourse().getId())
            .courseTitle(enrollment.getCourse().getTitle())
            .tutorId(enrollment.getCourse().getTutor().getId())
            .tutorName(tutorUser.getFullName())
            .tutorEmail(tutorUser.getEmail())
            .tutorPhone(tutorUser.getPhone())
            .learnerUserId(learner.getId())
            .learnerName(learner.getFullName())
            .learnerEmail(learner.getEmail())
            .learnerPhone(learner.getPhone())
            .message(enrollment.getMessage())
            .agreedFee(enrollment.getAgreedFee())
            .courseStatus(enrollment.getCourse().getStatus())
            .status(displayStatus)
            .createdAt(enrollment.getCreatedAt())
            .build();
    }

    private boolean isWaitingForMyConfirmation(MatchedClass matchedClass, Long currentUserId) {
        MatchedClassStatus status = matchedClass.getStatus();
        return (status == MatchedClassStatus.COMPLETION_REQUESTED
            || status == MatchedClassStatus.CANCELLATION_REQUESTED)
            && matchedClass.getStatusRequestedByUserId() != null
            && !matchedClass.getStatusRequestedByUserId().equals(currentUserId);
    }
}
