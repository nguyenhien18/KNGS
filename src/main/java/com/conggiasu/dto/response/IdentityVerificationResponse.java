package com.conggiasu.dto.response;

import com.conggiasu.entity.enums.IdentityVerificationStatus;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class IdentityVerificationResponse {
    private Long id;
    private Long userId;
    private String userFullName;
    private IdentityVerificationStatus status;
    private String fullNameOnId;
    private String idNumber;
    private LocalDate dateOfBirthOnId;
    private LocalDate issuedDate;
    private String issuedPlace;
    private String addressOnId;
    private String idFrontImageUrl;
    private String idBackImageUrl;
    private String selfieImageUrl;
    private Long reviewedBy;
    private LocalDateTime reviewedAt;
    private String rejectedReason;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
