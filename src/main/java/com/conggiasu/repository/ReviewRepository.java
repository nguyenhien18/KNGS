package com.conggiasu.repository;

import com.conggiasu.entity.Review;
import java.util.Collection;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    boolean existsByMatchedClassId(Long classId);

    boolean existsByCourseEnrollmentId(Long courseEnrollmentId);

    List<Review> findByTutorIdOrderByCreatedAtDesc(Long tutorId);

    Page<Review> findByTutorIdOrderByCreatedAtDesc(Long tutorId, Pageable pageable);

    long countByTutorId(Long tutorId);

    @Query("select coalesce(avg(r.rating), 0) from Review r where r.tutor.id = :tutorId")
    Double findAverageRatingByTutorId(@Param("tutorId") Long tutorId);

    @Query("""
        select r.tutor.id as tutorId,
               count(r.id) as reviewCount,
               coalesce(avg(r.rating), 0) as averageRating
        from Review r
        where r.tutor.id in :tutorIds
        group by r.tutor.id
        """)
    List<TutorReviewStats> findStatsByTutorIds(@Param("tutorIds") Collection<Long> tutorIds);

    interface TutorReviewStats {
        Long getTutorId();
        Long getReviewCount();
        Double getAverageRating();
    }
}


