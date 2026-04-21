package com.conggiasu.mapper;

import com.conggiasu.dto.response.AdminUserResponse;
import com.conggiasu.dto.response.LearnerPostResponse;
import com.conggiasu.dto.response.TutorCourseResponse;
import com.conggiasu.entity.Post;
import com.conggiasu.entity.TutorCourse;
import com.conggiasu.entity.User;
import org.springframework.stereotype.Component;

@Component
public class AdminResponseMapper {

    public LearnerPostResponse toPostSummary(Post p) {
        return LearnerPostResponse.builder()
            .postId(p.getId())
            .title(p.getTitle())
            .description(p.getDescription())
            .subject(p.getSubject().getName())
            .grade(p.getGrade().getName())
            .teachingMode(p.getTeachingMode())
            .studyTime(p.getStudyTime())
            .budget(p.getBudget())
            .province(p.getProvince())
            .district(p.getDistrict())
            .addressDetail(p.getAddressDetail())
            .approvalStatus(p.getApprovalStatus())
            .status(p.getStatus())
            .rejectedReason(p.getRejectedReason())
            .createdAt(p.getCreatedAt())
            .build();
    }

    public TutorCourseResponse toCourseSummary(TutorCourse c) {
        return TutorCourseResponse.builder()
            .courseId(c.getId())
            .tutorId(c.getTutor().getId())
            .tutorName(c.getTutor().getUser().getFullName())
            .title(c.getTitle())
            .description(c.getDescription())
            .subject(c.getSubject().getName())
            .grade(c.getGrade().getName())
            .teachingMode(c.getTeachingMode())
            .studyTime(c.getStudyTime())
            .price(c.getPrice())
            .maxStudents(c.getMaxStudents())
            .province(c.getProvince())
            .district(c.getDistrict())
            .addressDetail(c.getAddressDetail())
            .approvalStatus(c.getApprovalStatus())
            .status(c.getStatus())
            .createdAt(c.getCreatedAt())
            .build();
    }

    public AdminUserResponse toAdminUser(User user) {
        return AdminUserResponse.builder()
            .id(user.getId())
            .role(user.getRole())
            .email(user.getEmail())
            .fullName(user.getFullName())
            .phone(user.getPhone())
            .status(user.getStatus())
            .createdAt(user.getCreatedAt())
            .updatedAt(user.getUpdatedAt())
            .build();
    }
}
