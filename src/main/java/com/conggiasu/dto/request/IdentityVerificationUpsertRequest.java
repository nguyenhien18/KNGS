package com.conggiasu.dto.request;

import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class IdentityVerificationUpsertRequest {
    @Size(max = 120)
    private String fullNameOnId;
    @Size(max = 20)
    private String idNumber;
    private LocalDate dateOfBirthOnId;
    private LocalDate issuedDate;
    @Size(max = 255)
    private String issuedPlace;
    @Size(max = 255)
    private String addressOnId;
    @Size(max = 500)
    private String idFrontImageUrl;
    @Size(max = 500)
    private String idBackImageUrl;
    @Size(max = 500)
    private String selfieImageUrl;
    private Boolean submit;
}
