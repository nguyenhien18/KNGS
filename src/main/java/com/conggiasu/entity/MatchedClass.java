package com.conggiasu.entity;

import com.conggiasu.entity.enums.MatchedClassStatus;
import com.conggiasu.entity.enums.UserRole;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Getter
@Setter
@Entity
@Table(name = "matched_classes")
public class MatchedClass {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "post_id", nullable = false, unique = true)
    private Post post;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "application_id", nullable = false, unique = true)
    private Application application;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private MatchedClassStatus status = MatchedClassStatus.ASSIGNED;

    @Column(name = "status_requested_by_user_id")
    private Long statusRequestedByUserId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status_requested_by_role", length = 20)
    private UserRole statusRequestedByRole;

    @Column(name = "status_requested_at")
    private LocalDateTime statusRequestedAt;

    @Column(name = "status_request_reason", columnDefinition = "TEXT")
    private String statusRequestReason;

    @Column(name = "assigned_at")
    private LocalDateTime assignedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
