package com.conggiasu.repository;

import com.conggiasu.entity.enums.TutorProfileStatus;
import com.conggiasu.entity.Tutor;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Repository;

@Repository
public interface TutorRepository extends JpaRepository<Tutor, Long>, JpaSpecificationExecutor<Tutor> {
    @Override
    @EntityGraph(attributePaths = "user")
    Page<Tutor> findAll(Specification<Tutor> spec, Pageable pageable);

    Optional<Tutor> findByUserId(Long userId);

    List<Tutor> findByProfileStatusOrderByCreatedAtDesc(TutorProfileStatus profileStatus);

    @EntityGraph(attributePaths = "user")
    Page<Tutor> findByProfileStatusOrderByCreatedAtDesc(TutorProfileStatus profileStatus, Pageable pageable);

    long countByProfileStatus(TutorProfileStatus profileStatus);
}


