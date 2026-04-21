package com.conggiasu.dto.request;

import com.conggiasu.entity.enums.CourseStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TutorCourseStatusUpdateRequest {
    @NotNull
    private CourseStatus status;
}
