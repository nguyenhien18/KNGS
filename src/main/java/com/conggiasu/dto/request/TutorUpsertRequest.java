package com.conggiasu.dto.request;

import com.conggiasu.entity.enums.Gender;
import com.conggiasu.entity.enums.TeachingMode;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
public class TutorUpsertRequest {
    @NotBlank
    private String fullName;

    private String phone;
    private LocalDate birthDate;
    private Gender gender = Gender.OTHER;
    private String avatar;
    private String address;

    private String description;
    private String experience;
    private String qualification;

    @NotNull
    private TeachingMode teachingMode;

    private String province;
    private String district;
    private BigDecimal hourlyRate;

    @NotEmpty
    private List<Long> subjectIds;

    @NotEmpty
    private List<Long> gradeIds;

    @Valid
    private List<TutorCertificateUpsertRequest> certificates;
}
