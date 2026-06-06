package com.conggiasu.entity;

import com.conggiasu.entity.enums.ApplicationStatus;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Getter
@Setter
@Entity
@Table(
    name = "applications",
    uniqueConstraints = @UniqueConstraint(name = "uq_application_post_tutor", columnNames = {"post_id", "tutor_id"}),
    indexes = {
        @Index(name = "idx_applications_tutor_status_created_at", columnList = "tutor_id, status, created_at"),
        @Index(name = "idx_applications_post_status_created_at", columnList = "post_id, status, created_at")
    }
)
public class Application {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tutor_id", nullable = false)
    private Tutor tutor;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Column(name = "expected_fee", precision = 12, scale = 2)
    private BigDecimal expectedFee;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private ApplicationStatus status = ApplicationStatus.PENDING;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
