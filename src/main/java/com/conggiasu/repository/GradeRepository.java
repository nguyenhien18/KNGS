package com.conggiasu.repository;

import com.conggiasu.entity.Grade;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GradeRepository extends JpaRepository<Grade, Long> {
    Optional<Grade> findByName(String name);
    Optional<Grade> findByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCase(String name);
}


