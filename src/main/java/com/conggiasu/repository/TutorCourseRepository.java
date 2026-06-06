package com.conggiasu.repository;

import com.conggiasu.entity.enums.ApprovalStatus;
import com.conggiasu.entity.enums.CourseStatus;
import com.conggiasu.entity.enums.TeachingMode;
import com.conggiasu.entity.TutorCourse;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface TutorCourseRepository extends JpaRepository<TutorCourse, Long> {
    List<TutorCourse> findByTutorIdOrderByCreatedAtDesc(Long tutorId);

    Page<TutorCourse> findByTutorIdOrderByCreatedAtDesc(Long tutorId, Pageable pageable);

    List<TutorCourse> findByTutorIdAndStatusOrderByCreatedAtDesc(Long tutorId, CourseStatus status);

    Page<TutorCourse> findByTutorIdAndStatusOrderByCreatedAtDesc(Long tutorId, CourseStatus status, Pageable pageable);

    Optional<TutorCourse> findByIdAndTutorId(Long id, Long tutorId);

    List<TutorCourse> findByApprovalStatusOrderByCreatedAtDesc(ApprovalStatus approvalStatus);

    Page<TutorCourse> findByApprovalStatusOrderByCreatedAtDesc(ApprovalStatus approvalStatus, Pageable pageable);

    List<TutorCourse> findByApprovalStatusAndStatusOrderByCreatedAtDesc(ApprovalStatus approvalStatus, CourseStatus status);

    Page<TutorCourse> findByApprovalStatusAndStatusOrderByCreatedAtDesc(
        ApprovalStatus approvalStatus, CourseStatus status, Pageable pageable
    );

    @Query(value = """
        select c
        from TutorCourse c
        where c.approvalStatus = :approvalStatus
          and c.status = :status
          and (:subjectId is null or c.subject.id = :subjectId)
          and (:gradeId is null or c.grade.id = :gradeId)
          and (:teachingMode is null or c.teachingMode = :teachingMode or (:includeBoth = true and c.teachingMode = :bothMode))
          and (:province is null or lower(c.province) like concat('%', :province, '%'))
          and (:district is null or lower(c.district) like concat('%', :district, '%'))
        order by c.createdAt desc
        """,
        countQuery = """
        select count(c)
        from TutorCourse c
        where c.approvalStatus = :approvalStatus
          and c.status = :status
          and (:subjectId is null or c.subject.id = :subjectId)
          and (:gradeId is null or c.grade.id = :gradeId)
          and (:teachingMode is null or c.teachingMode = :teachingMode or (:includeBoth = true and c.teachingMode = :bothMode))
          and (:province is null or lower(c.province) like concat('%', :province, '%'))
          and (:district is null or lower(c.district) like concat('%', :district, '%'))
        """
    )
    Page<TutorCourse> findAvailableCourses(
        @Param("approvalStatus") ApprovalStatus approvalStatus,
        @Param("status") CourseStatus status,
        @Param("subjectId") Long subjectId,
        @Param("gradeId") Long gradeId,
        @Param("teachingMode") TeachingMode teachingMode,
        @Param("includeBoth") boolean includeBoth,
        @Param("bothMode") TeachingMode bothMode,
        @Param("province") String province,
        @Param("district") String district,
        Pageable pageable
    );

    List<TutorCourse> findByTutorIdAndApprovalStatusAndStatusOrderByCreatedAtDesc(
        Long tutorId, ApprovalStatus approvalStatus, CourseStatus status
    );

    Page<TutorCourse> findByTutorIdAndApprovalStatusAndStatusOrderByCreatedAtDesc(
        Long tutorId, ApprovalStatus approvalStatus, CourseStatus status, Pageable pageable
    );

    boolean existsBySubjectId(Long subjectId);

    boolean existsByGradeId(Long gradeId);

    long countByTutorIdAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(
        Long tutorId, LocalDateTime start, LocalDateTime end
    );

    long countByApprovalStatus(ApprovalStatus approvalStatus);
}


