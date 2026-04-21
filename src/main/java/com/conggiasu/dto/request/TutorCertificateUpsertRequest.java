package com.conggiasu.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TutorCertificateUpsertRequest {
    @NotBlank
    @Size(max = 255)
    private String title;
    @Size(max = 50)
    private String certificateType;
    @Size(max = 255)
    private String issuer;
    private LocalDate issuedDate;
    @Size(max = 500)
    private String certificateImageUrl;
}
