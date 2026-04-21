package com.conggiasu.repository;

import com.conggiasu.entity.enums.TutorProfileStatus;
import com.conggiasu.entity.Tutor;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface TutorRepository extends JpaRepository<Tutor, Long>, JpaSpecificationExecutor<Tutor> {
    Optional<Tutor> findByUserId(Long userId);

    List<Tutor> findByProfileStatusOrderByCreatedAtDesc(TutorProfileStatus profileStatus);

    long countByProfileStatus(TutorProfileStatus profileStatus);
}


