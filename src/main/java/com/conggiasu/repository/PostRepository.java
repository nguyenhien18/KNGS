package com.conggiasu.repository;

import com.conggiasu.entity.enums.ApprovalStatus;
import com.conggiasu.entity.enums.PostStatus;
import com.conggiasu.entity.Post;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface PostRepository extends JpaRepository<Post, Long>, JpaSpecificationExecutor<Post> {
    boolean existsByIdAndApprovalStatusAndStatus(Long id, ApprovalStatus approvalStatus, PostStatus status);

    List<Post> findByLearnerUserIdOrderByCreatedAtDesc(Long learnerUserId);

    Page<Post> findByLearnerUserIdOrderByCreatedAtDesc(Long learnerUserId, Pageable pageable);

    List<Post> findByLearnerUserIdAndApprovalStatusOrderByCreatedAtDesc(Long learnerUserId, ApprovalStatus approvalStatus);

    Page<Post> findByLearnerUserIdAndApprovalStatusOrderByCreatedAtDesc(
        Long learnerUserId, ApprovalStatus approvalStatus, Pageable pageable
    );

    Optional<Post> findByIdAndLearnerUserId(Long id, Long learnerUserId);

    List<Post> findByApprovalStatusOrderByCreatedAtDesc(ApprovalStatus approvalStatus);

    Page<Post> findByApprovalStatusOrderByCreatedAtDesc(ApprovalStatus approvalStatus, Pageable pageable);

    boolean existsBySubjectId(Long subjectId);

    boolean existsByGradeId(Long gradeId);

    long countByLearnerUserIdAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(
        Long learnerUserId, LocalDateTime start, LocalDateTime end
    );

    long countByApprovalStatus(ApprovalStatus approvalStatus);
}


