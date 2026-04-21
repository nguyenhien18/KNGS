package com.conggiasu.dto.request;

import com.conggiasu.entity.enums.Gender;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class UpdateProfileRequest {
    @Size(max = 100)
    private String fullName;
    @Size(max = 20)
    private String phone;
    private LocalDate birthDate;
    private Gender gender;
    @Size(max = 255)
    private String avatar;
    @Size(max = 255)
    private String address;
}

