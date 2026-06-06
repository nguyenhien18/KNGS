package com.conggiasu.repository;

import com.conggiasu.entity.CourseEnrollment;
import com.conggiasu.entity.enums.EnrollmentStatus;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CourseEnrollmentRepository extends JpaRepository<CourseEnrollment, Long> {
    List<CourseEnrollment> findByCourseIdOrderByCreatedAtDesc(Long courseId);

    Page<CourseEnrollment> findByCourseIdOrderByCreatedAtDesc(Long courseId, Pageable pageable);

    Optional<CourseEnrollment> findByIdAndCourseTutorId(Long id, Long tutorId);

    Optional<CourseEnrollment> findByIdAndLearnerUserId(Long id, Long learnerUserId);

    Optional<CourseEnrollment> findByCourseIdAndLearnerUserId(Long courseId, Long learnerUserId);

    boolean existsByCourseIdAndLearnerUserId(Long courseId, Long learnerUserId);
    boolean existsByCourseIdAndStatusIn(Long courseId, Collection<EnrollmentStatus> statuses);
    List<CourseEnrollment> findByCourseIdAndStatus(Long courseId, EnrollmentStatus status);
    long countByCourseIdAndStatus(Long courseId, EnrollmentStatus status);

    List<CourseEnrollment> findByLearnerUserIdOrderByCreatedAtDesc(Long learnerUserId);

    Page<CourseEnrollment> findByLearnerUserIdOrderByCreatedAtDesc(Long learnerUserId, Pageable pageable);
}


