package com.conggiasu.repository;

import com.conggiasu.entity.TutorTeaching;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface TutorTeachingRepository extends JpaRepository<TutorTeaching, Long> {
    void deleteByTutor_Id(Long tutorId);

    boolean existsBySubjectId(Long subjectId);

    boolean existsByGradeId(Long gradeId);

    @Query("""
        select tt.tutor.id as tutorId,
               s.name as subjectName,
               g.name as gradeName
        from TutorTeaching tt
        join tt.subject s
        join tt.grade g
        where tt.tutor.id in :tutorIds
        """)
    List<TutorTeachingSummary> findSummariesByTutorIdIn(@Param("tutorIds") Collection<Long> tutorIds);

    interface TutorTeachingSummary {
        Long getTutorId();
        String getSubjectName();
        String getGradeName();
    }
}


