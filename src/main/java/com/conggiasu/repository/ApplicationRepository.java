package com.conggiasu.repository;

import com.conggiasu.entity.Application;
import com.conggiasu.entity.enums.ApplicationStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, Long> {
    boolean existsByPostIdAndTutorId(Long postId, Long tutorId);

    Optional<Application> findByPostIdAndTutorId(Long postId, Long tutorId);

    List<Application> findByTutorIdOrderByCreatedAtDesc(Long tutorId);

    Page<Application> findByTutorIdOrderByCreatedAtDesc(Long tutorId, Pageable pageable);

    List<Application> findByTutorIdAndStatusOrderByCreatedAtDesc(Long tutorId, ApplicationStatus status);

    Page<Application> findByTutorIdAndStatusOrderByCreatedAtDesc(Long tutorId, ApplicationStatus status, Pageable pageable);

    Optional<Application> findByIdAndTutorId(Long id, Long tutorId);

    List<Application> findByPostIdOrderByCreatedAtDesc(Long postId);

    Page<Application> findByPostIdOrderByCreatedAtDesc(Long postId, Pageable pageable);

    List<Application> findByPostIdAndStatus(Long postId, ApplicationStatus status);
}


