package com.conggiasu.entity;

import com.conggiasu.entity.enums.IdentityVerificationStatus;
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
@Table(name = "identity_verifications")
public class IdentityVerification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private IdentityVerificationStatus status = IdentityVerificationStatus.NOT_SUBMITTED;

    @Column(name = "full_name_on_id", length = 120)
    private String fullNameOnId;

    @Column(name = "id_number", length = 20)
    private String idNumber;

    @Column(name = "date_of_birth_on_id")
    private LocalDate dateOfBirthOnId;

    @Column(name = "issued_date")
    private LocalDate issuedDate;

    @Column(name = "issued_place", length = 255)
    private String issuedPlace;

    @Column(name = "address_on_id", length = 255)
    private String addressOnId;

    @Column(name = "id_front_image_url", length = 500)
    private String idFrontImageUrl;

    @Column(name = "id_back_image_url", length = 500)
    private String idBackImageUrl;

    @Column(name = "selfie_image_url", length = 500)
    private String selfieImageUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private User reviewedBy;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "rejected_reason", length = 500)
    private String rejectedReason;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
