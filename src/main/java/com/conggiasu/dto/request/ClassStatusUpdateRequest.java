package com.conggiasu.dto.request;

import com.conggiasu.entity.enums.MatchedClassStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ClassStatusUpdateRequest {
    private Long learnerUserId;
    @NotNull
    private MatchedClassStatus status;
}

