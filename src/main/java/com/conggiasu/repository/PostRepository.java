package com.conggiasu.repository;

import com.conggiasu.entity.enums.ApprovalStatus;
import com.conggiasu.entity.enums.PostStatus;
import com.conggiasu.entity.Post;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface PostRepository extends JpaRepository<Post, Long>, JpaSpecificationExecutor<Post> {
    boolean existsByIdAndApprovalStatusAndStatus(Long id, ApprovalStatus approvalStatus, PostStatus status);

    List<Post> findByLearnerUserIdOrderByCreatedAtDesc(Long learnerUserId);

    List<Post> findByLearnerUserIdAndApprovalStatusOrderByCreatedAtDesc(Long learnerUserId, ApprovalStatus approvalStatus);

    Optional<Post> findByIdAndLearnerUserId(Long id, Long learnerUserId);

    List<Post> findByApprovalStatusOrderByCreatedAtDesc(ApprovalStatus approvalStatus);

    long countByApprovalStatus(ApprovalStatus approvalStatus);
}


