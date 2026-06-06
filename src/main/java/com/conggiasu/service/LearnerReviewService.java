package com.conggiasu.service;

import com.conggiasu.dto.request.ReviewCreateRequest;
import com.conggiasu.entity.CourseEnrollment;
import com.conggiasu.entity.MatchedClass;
import com.conggiasu.entity.Review;
import com.conggiasu.entity.User;
import com.conggiasu.entity.enums.CourseStatus;
import com.conggiasu.entity.enums.EnrollmentStatus;
import com.conggiasu.entity.enums.MatchedClassStatus;
import com.conggiasu.exception.AppException;
import com.conggiasu.repository.CourseEnrollmentRepository;
import com.conggiasu.repository.MatchedClassRepository;
import com.conggiasu.repository.ReviewRepository;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class LearnerReviewService {
    private final LearnerAccessService learnerAccessService;
    private final MatchedClassRepository matchedClassRepository;
    private final CourseEnrollmentRepository courseEnrollmentRepository;
    private final ReviewRepository reviewRepository;
    private final NotificationService notificationService;

    @Transactional
    public void createReview(ReviewCreateRequest request) {
        User learner = learnerAccessService.validateLearner(request.getLearnerUserId());
        if ((request.getClassId() == null && request.getCourseEnrollmentId() == null)
            || (request.getClassId() != null && request.getCourseEnrollmentId() != null)) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Chỉ được đánh giá một loại đối tượng");
        }

        Review review = new Review();
        review.setLearnerUser(learner);
        review.setRating(request.getRating());
        review.setComment(request.getComment());

        if (request.getClassId() != null) {
            attachMatchedClassReview(review, learner, request.getClassId());
        } else {
            attachCourseEnrollmentReview(review, learner, request.getCourseEnrollmentId());
        }
        reviewRepository.save(review);
        notificationService.push(
            review.getTutor().getUser().getId(),
            "Bạn vừa nhận đánh giá mới",
            "Học viên vừa gửi đánh giá " + review.getRating() + " sao cho ban.",
            "REVIEW_NEW",
            "REVIEW",
            review.getId()
        );
    }

    private void attachMatchedClassReview(Review review, User learner, Long classId) {
        MatchedClass matchedClass = matchedClassRepository.findByIdAndPostLearnerUserId(classId, learner.getId())
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy lớp"));
        if (matchedClass.getStatus() != MatchedClassStatus.COMPLETED) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Chỉ được đánh giá sau khi hoàn thành");
        }
        if (reviewRepository.existsByMatchedClassId(matchedClass.getId())) {
            throw new AppException(HttpStatus.CONFLICT, "Lớp này đã có đánh giá");
        }
        review.setMatchedClass(matchedClass);
        review.setTutor(matchedClass.getApplication().getTutor());
    }

    private void attachCourseEnrollmentReview(Review review, User learner, Long enrollmentId) {
        CourseEnrollment enrollment = courseEnrollmentRepository.findByIdAndLearnerUserId(enrollmentId, learner.getId())
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy quá trình học"));
        if (enrollment.getStatus() != EnrollmentStatus.COMPLETED) {
            boolean completedByCourse = enrollment.getStatus() == EnrollmentStatus.ACCEPTED
                && enrollment.getCourse() != null
                && enrollment.getCourse().getStatus() == CourseStatus.COMPLETED;
            if (completedByCourse) {
                enrollment.setStatus(EnrollmentStatus.COMPLETED);
                if (enrollment.getCompletedAt() == null) {
                    enrollment.setCompletedAt(LocalDateTime.now());
                }
                enrollment = courseEnrollmentRepository.save(enrollment);
            } else {
                throw new AppException(HttpStatus.BAD_REQUEST, "Chỉ được đánh giá sau khi hoàn thành");
            }
        }
        if (reviewRepository.existsByCourseEnrollmentId(enrollment.getId())) {
            throw new AppException(HttpStatus.CONFLICT, "Quá trình học này đã có đánh giá");
        }
        review.setCourseEnrollment(enrollment);
        review.setTutor(enrollment.getCourse().getTutor());
    }
}
