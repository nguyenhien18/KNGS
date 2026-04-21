package com.conggiasu.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminLookupUpsertRequest {
    @NotBlank(message = "Ten khong duoc de trong")
    @Size(max = 100, message = "Ten toi da 100 ky tu")
    private String name;
}

