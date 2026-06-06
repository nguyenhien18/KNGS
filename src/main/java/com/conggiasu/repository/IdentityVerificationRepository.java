package com.conggiasu.repository;

import com.conggiasu.entity.IdentityVerification;
import com.conggiasu.entity.enums.IdentityVerificationStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IdentityVerificationRepository extends JpaRepository<IdentityVerification, Long> {
    Optional<IdentityVerification> findByUserId(Long userId);

    List<IdentityVerification> findByStatusOrderByCreatedAtDesc(IdentityVerificationStatus status);

    Page<IdentityVerification> findByStatusOrderByCreatedAtDesc(IdentityVerificationStatus status, Pageable pageable);

}
