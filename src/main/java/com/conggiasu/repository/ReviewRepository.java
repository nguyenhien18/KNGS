package com.conggiasu.repository;

import com.conggiasu.entity.Review;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    boolean existsByMatchedClassId(Long classId);

    boolean existsByCourseEnrollmentId(Long courseEnrollmentId);

    List<Review> findByTutorIdOrderByCreatedAtDesc(Long tutorId);

    long countByTutorId(Long tutorId);

    @Query("select coalesce(avg(r.rating), 0) from Review r where r.tutor.id = :tutorId")
    Double findAverageRatingByTutorId(@Param("tutorId") Long tutorId);
}


