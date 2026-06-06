package com.conggiasu.entity;

import com.conggiasu.entity.enums.ApprovalStatus;
import com.conggiasu.entity.enums.CourseStatus;
import com.conggiasu.entity.enums.TeachingMode;
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
    name = "tutor_courses",
    indexes = {
        @Index(name = "idx_tutor_courses_approval_status_created_at", columnList = "approval_status, status, created_at"),
        @Index(name = "idx_tutor_courses_tutor_status_created_at", columnList = "tutor_id, status, created_at"),
        @Index(name = "idx_tutor_courses_lookup", columnList = "subject_id, grade_id, teaching_mode, province, district")
    }
)
public class TutorCourse {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tutor_id", nullable = false)
    private Tutor tutor;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "grade_id", nullable = false)
    private Grade grade;

    @Enumerated(EnumType.STRING)
    @Column(name = "teaching_mode", nullable = false, length = 10)
    private TeachingMode teachingMode = TeachingMode.BOTH;

    @Column(name = "study_time", length = 255)
    private String studyTime;

    @Column(precision = 12, scale = 2)
    private BigDecimal price;

    @Column(name = "max_students")
    private Integer maxStudents;

    @Column(length = 100)
    private String province;

    @Column(length = 100)
    private String district;

    @Column(name = "address_detail", length = 255)
    private String addressDetail;

    @Enumerated(EnumType.STRING)
    @Column(name = "approval_status", nullable = false, length = 10)
    private ApprovalStatus approvalStatus = ApprovalStatus.PENDING;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by")
    private User approvedBy;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "rejected_reason", length = 255)
    private String rejectedReason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CourseStatus status = CourseStatus.OPEN;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
