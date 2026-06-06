package com.conggiasu.entity;

import com.conggiasu.entity.enums.TeachingMode;
import com.conggiasu.entity.enums.TutorProfileStatus;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Getter
@Setter
@Entity
@Table(
    name = "tutors",
    indexes = {
        @Index(name = "idx_tutors_profile_status_created_at", columnList = "profile_status, created_at")
    }
)
public class Tutor {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 255)
    private String experience;

    @Column(length = 255)
    private String qualification;

    @Enumerated(EnumType.STRING)
    @Column(name = "teaching_mode", nullable = false, length = 10)
    private TeachingMode teachingMode = TeachingMode.BOTH;

    @Column(length = 100)
    private String province;

    @Column(length = 100)
    private String district;

    @Column(name = "hourly_rate", precision = 12, scale = 2)
    private BigDecimal hourlyRate;

    @Enumerated(EnumType.STRING)
    @Column(name = "profile_status", nullable = false, length = 10)
    private TutorProfileStatus profileStatus = TutorProfileStatus.PENDING;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private User reviewedBy;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "rejected_reason", length = 255)
    private String rejectedReason;

    @OneToMany(mappedBy = "tutor", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<TutorTeaching> tutorTeachings = new HashSet<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
