package com.conggiasu.repository;

import com.conggiasu.entity.MatchedClass;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MatchedClassRepository extends JpaRepository<MatchedClass, Long> {
    Optional<MatchedClass> findByApplicationId(Long applicationId);
    Optional<MatchedClass> findByPostId(Long postId);
    boolean existsByPostId(Long postId);

    List<MatchedClass> findByPostLearnerUserIdOrderByCreatedAtDesc(Long learnerUserId);
    List<MatchedClass> findByApplicationTutorIdOrderByCreatedAtDesc(Long tutorId);

    Optional<MatchedClass> findByIdAndPostLearnerUserId(Long id, Long learnerUserId);
    Optional<MatchedClass> findByIdAndApplicationTutorId(Long id, Long tutorId);
}


