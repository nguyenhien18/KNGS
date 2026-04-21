package com.conggiasu.dto.request;

import com.conggiasu.entity.enums.Gender;
import com.conggiasu.entity.enums.TeachingMode;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class RegisterTutorRequest {
    @Email
    @NotBlank
    private String email;

    @NotBlank
    private String password;

    @NotBlank
    private String fullName;

    private String phone;
    private Gender gender = Gender.OTHER;
    private String address;
    private String description;
    private String experience;
    private String qualification;

    @NotNull
    private TeachingMode teachingMode;
    private String province;
    private String district;

    @NotEmpty
    private List<Long> subjectIds;

    @NotEmpty
    private List<Long> gradeIds;
}

