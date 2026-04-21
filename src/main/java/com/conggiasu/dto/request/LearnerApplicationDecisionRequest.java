package com.conggiasu.dto.request;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LearnerApplicationDecisionRequest {
    private Long learnerUserId;
    @NotNull
    private Boolean accepted;
    private LocalDate startDate;
    private LocalDate endDate;
}

