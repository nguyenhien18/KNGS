package com.conggiasu.service;

import com.conggiasu.dto.request.TutorCourseRequest;
import com.conggiasu.dto.response.AvailablePostResponse;
import com.conggiasu.dto.response.CourseEnrollmentResponse;
import com.conggiasu.dto.response.TutorApplicationResponse;
import com.conggiasu.dto.response.TutorCourseResponse;
import com.conggiasu.dto.response.TutorMatchedClassResponse;
import com.conggiasu.dto.response.TutorReviewResponse;
import com.conggiasu.entity.Application;
import com.conggiasu.entity.CourseEnrollment;
import com.conggiasu.entity.Grade;
import com.conggiasu.entity.MatchedClass;
import com.conggiasu.entity.Post;
import com.conggiasu.entity.Review;
import com.conggiasu.entity.Subject;
import com.conggiasu.entity.TutorCourse;
import com.conggiasu.entity.User;
import com.conggiasu.entity.enums.ApplicationStatus;
import com.conggiasu.entity.enums.MatchedClassStatus;
import com.conggiasu.repository.MatchedClassRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class TutorFeatureMapper {
    private final MatchedClassRepository matchedClassRepository;

    public AvailablePostResponse toAvailablePost(Post post) {
        return AvailablePostResponse.builder()
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
            .createdAt(post.getCreatedAt())
            .build();
    }

    public TutorApplicationResponse toApplicationResponse(Application app) {
        User learner = app.getPost().getLearnerUser();
        User tutorUser = app.getTutor() != null ? app.getTutor().getUser() : null;
        MatchedClass matchedClass = matchedClassRepository.findByApplicationId(app.getId()).orElse(null);
        if (matchedClass == null
            && app.getStatus() == ApplicationStatus.ACCEPTED
            && app.getTutor() != null
            && app.getPost() != null) {
            matchedClass = matchedClassRepository.findByPostIdAndApplicationTutorId(
                app.getPost().getId(),
                app.getTutor().getId()
            ).orElse(null);
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

    public void applyCourseRequest(TutorCourse course, TutorCourseRequest request, Subject subject, Grade grade) {
        course.setTitle(request.getTitle());
        course.setDescription(request.getDescription());
        course.setSubject(subject);
        course.setGrade(grade);
        course.setTeachingMode(request.getTeachingMode());
        course.setStudyTime(request.getStudyTime());
        course.setPrice(request.getPrice());
        course.setMaxStudents(request.getMaxStudents());
        course.setProvince(request.getProvince());
        course.setDistrict(request.getDistrict());
        course.setAddressDetail(request.getAddressDetail());
    }

    public TutorCourseResponse toCourseResponse(TutorCourse course) {
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

    public CourseEnrollmentResponse toEnrollmentResponse(CourseEnrollment enrollment) {
        User learner = enrollment.getLearnerUser();
        User tutorUser = enrollment.getCourse().getTutor().getUser();
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
            .status(enrollment.getStatus())
            .createdAt(enrollment.getCreatedAt())
            .build();
    }

    public TutorMatchedClassResponse toMatchedClassResponse(MatchedClass matchedClass) {
        User learner = matchedClass.getPost().getLearnerUser();
        User tutorUser = matchedClass.getApplication().getTutor().getUser();
        return TutorMatchedClassResponse.builder()
            .classId(matchedClass.getId())
            .postId(matchedClass.getPost().getId())
            .postTitle(matchedClass.getPost().getTitle())
            .learnerUserId(learner.getId())
            .learnerName(learner.getFullName())
            .learnerEmail(learner.getEmail())
            .learnerPhone(learner.getPhone())
            .status(matchedClass.getStatus())
            .statusRequestedByUserId(matchedClass.getStatusRequestedByUserId())
            .statusRequestedByRole(matchedClass.getStatusRequestedByRole())
            .statusRequestedAt(matchedClass.getStatusRequestedAt())
            .statusRequestReason(matchedClass.getStatusRequestReason())
            .waitingForMyConfirmation(isWaitingForMyConfirmation(matchedClass, tutorUser.getId()))
            .startDate(matchedClass.getStartDate())
            .endDate(matchedClass.getEndDate())
            .assignedAt(matchedClass.getAssignedAt())
            .build();
    }

    public TutorReviewResponse toTutorReviewResponse(Review review) {
        return TutorReviewResponse.builder()
            .reviewId(review.getId())
            .matchedClassId(review.getMatchedClass() != null ? review.getMatchedClass().getId() : null)
            .courseEnrollmentId(review.getCourseEnrollment() != null ? review.getCourseEnrollment().getId() : null)
            .courseId(review.getCourseEnrollment() != null && review.getCourseEnrollment().getCourse() != null
                ? review.getCourseEnrollment().getCourse().getId()
                : null)
            .postId(review.getMatchedClass() != null && review.getMatchedClass().getPost() != null
                ? review.getMatchedClass().getPost().getId()
                : null)
            .postTitle(review.getMatchedClass() != null && review.getMatchedClass().getPost() != null
                ? review.getMatchedClass().getPost().getTitle()
                : null)
            .courseTitle(review.getCourseEnrollment() != null && review.getCourseEnrollment().getCourse() != null
                ? review.getCourseEnrollment().getCourse().getTitle()
                : null)
            .learnerName(review.getLearnerUser().getFullName())
            .rating(review.getRating())
            .comment(review.getComment())
            .createdAt(review.getCreatedAt())
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
