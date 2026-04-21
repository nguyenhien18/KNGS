package com.conggiasu.repository;

import com.conggiasu.entity.CourseEnrollment;
import com.conggiasu.entity.enums.EnrollmentStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CourseEnrollmentRepository extends JpaRepository<CourseEnrollment, Long> {
    List<CourseEnrollment> findByCourseIdOrderByCreatedAtDesc(Long courseId);

    Optional<CourseEnrollment> findByIdAndCourseTutorId(Long id, Long tutorId);

    Optional<CourseEnrollment> findByIdAndLearnerUserId(Long id, Long learnerUserId);

    boolean existsByCourseIdAndLearnerUserId(Long courseId, Long learnerUserId);
    long countByCourseIdAndStatus(Long courseId, EnrollmentStatus status);

    List<CourseEnrollment> findByLearnerUserIdOrderByCreatedAtDesc(Long learnerUserId);
}


