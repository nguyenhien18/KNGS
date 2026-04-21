package com.conggiasu.repository;

import com.conggiasu.entity.TutorTeaching;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TutorTeachingRepository extends JpaRepository<TutorTeaching, Long> {
    void deleteByTutor_Id(Long tutorId);
}


