package com.conggiasu.repository;

import com.conggiasu.entity.enums.ApprovalStatus;
import com.conggiasu.entity.enums.CourseStatus;
import com.conggiasu.entity.enums.TeachingMode;
import com.conggiasu.entity.TutorCourse;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface TutorCourseRepository extends JpaRepository<TutorCourse, Long> {
    List<TutorCourse> findByTutorIdOrderByCreatedAtDesc(Long tutorId);

    List<TutorCourse> findByTutorIdAndStatusOrderByCreatedAtDesc(Long tutorId, CourseStatus status);

    Optional<TutorCourse> findByIdAndTutorId(Long id, Long tutorId);

    List<TutorCourse> findByApprovalStatusOrderByCreatedAtDesc(ApprovalStatus approvalStatus);

    List<TutorCourse> findByApprovalStatusAndStatusOrderByCreatedAtDesc(ApprovalStatus approvalStatus, CourseStatus status);

    @Query("""
        select c
        from TutorCourse c
        where c.approvalStatus = :approvalStatus
          and c.status = :status
          and (:subjectId is null or c.subject.id = :subjectId)
          and (:gradeId is null or c.grade.id = :gradeId)
          and (:teachingMode is null or c.teachingMode = :teachingMode)
          and (:province is null or lower(c.province) = :province)
          and (:district is null or lower(c.district) = :district)
        order by c.createdAt desc
        """)
    List<TutorCourse> findAvailableCourses(
        @Param("approvalStatus") ApprovalStatus approvalStatus,
        @Param("status") CourseStatus status,
        @Param("subjectId") Long subjectId,
        @Param("gradeId") Long gradeId,
        @Param("teachingMode") TeachingMode teachingMode,
        @Param("province") String province,
        @Param("district") String district
    );

    List<TutorCourse> findByTutorIdAndApprovalStatusAndStatusOrderByCreatedAtDesc(
        Long tutorId, ApprovalStatus approvalStatus, CourseStatus status
    );

    long countByApprovalStatus(ApprovalStatus approvalStatus);
}


