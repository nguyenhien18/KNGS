package com.conggiasu.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.Check;
import org.hibernate.annotations.CreationTimestamp;

@Getter
@Setter
@Entity
@Table(
    name = "reviews",
    indexes = {
        @Index(name = "idx_reviews_tutor_created_at", columnList = "tutor_id, created_at")
    }
)
@Check(constraints = "((class_id is not null and course_enrollment_id is null) or (class_id is null and course_enrollment_id is not null))")
public class Review {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "learner_user_id", nullable = false)
    private User learnerUser;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tutor_id", nullable = false)
    private Tutor tutor;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id", unique = true)
    private MatchedClass matchedClass;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_enrollment_id", unique = true)
    private CourseEnrollment courseEnrollment;

    @Column(nullable = false)
    private Integer rating;

    @Column(columnDefinition = "TEXT")
    private String comment;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
