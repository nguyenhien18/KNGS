package com.conggiasu.dto.response;

import com.conggiasu.entity.enums.ApprovalStatus;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class TutorCertificateResponse {
    private Long id;
    private Long tutorId;
    private String title;
    private String certificateType;
    private String issuer;
    private LocalDate issuedDate;
    private ApprovalStatus status;
    private Long reviewedBy;
    private LocalDateTime reviewedAt;
    private String rejectedReason;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
