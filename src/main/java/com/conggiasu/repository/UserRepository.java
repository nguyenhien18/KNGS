package com.conggiasu.repository;

import com.conggiasu.entity.enums.UserRole;
import com.conggiasu.entity.enums.UserStatus;
import com.conggiasu.entity.User;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    boolean existsByEmail(String email);

    boolean existsByEmailAndIdNot(String email, Long id);

    boolean existsByPhone(String phone);

    boolean existsByPhoneAndIdNot(String phone, Long id);

    Optional<User> findByEmail(String email);

    List<User> findAllByOrderByCreatedAtDesc();

    Page<User> findAllByOrderByCreatedAtDesc(Pageable pageable);

    List<User> findByRoleOrderByCreatedAtDesc(UserRole role);

    Page<User> findByRoleOrderByCreatedAtDesc(UserRole role, Pageable pageable);

    List<User> findByStatusOrderByCreatedAtDesc(UserStatus status);

    Page<User> findByStatusOrderByCreatedAtDesc(UserStatus status, Pageable pageable);

    List<User> findByRoleAndStatusOrderByCreatedAtDesc(UserRole role, UserStatus status);

    Page<User> findByRoleAndStatusOrderByCreatedAtDesc(UserRole role, UserStatus status, Pageable pageable);

    long countByRole(UserRole role);
}


