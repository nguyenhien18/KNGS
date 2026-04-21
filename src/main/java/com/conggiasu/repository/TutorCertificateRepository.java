package com.conggiasu.repository;

import com.conggiasu.entity.TutorCertificate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TutorCertificateRepository extends JpaRepository<TutorCertificate, Long> {
    List<TutorCertificate> findByTutorId(Long tutorId);

    Optional<TutorCertificate> findByIdAndTutorId(Long id, Long tutorId);

    void deleteByTutorId(Long tutorId);
}
