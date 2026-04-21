package com.conggiasu.mapper;

import com.conggiasu.dto.response.TutorSummaryResponse;
import com.conggiasu.entity.Tutor;
import com.conggiasu.repository.ReviewRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class TutorSummaryMapper {
    private final ReviewRepository reviewRepository;

    public TutorSummaryResponse toSummary(Tutor tutor) {
        return buildSummary(tutor, true);
    }

    public TutorSummaryResponse toPublicSummary(Tutor tutor) {
        return buildSummary(tutor, false);
    }

    private TutorSummaryResponse buildSummary(Tutor tutor, boolean includeContact) {
        List<String> subjects = tutor.getTutorTeachings().stream()
            .map(ts -> ts.getSubject().getName())
            .distinct()
            .sorted()
            .toList();
        List<String> grades = tutor.getTutorTeachings().stream()
            .map(ts -> ts.getGrade().getName())
            .distinct()
            .sorted()
            .toList();

        long reviewCount = reviewRepository.countByTutorId(tutor.getId());
        Double avgRatingValue = reviewRepository.findAverageRatingByTutorId(tutor.getId());
        BigDecimal averageRating = BigDecimal.valueOf(avgRatingValue == null ? 0D : avgRatingValue)
            .setScale(1, RoundingMode.HALF_UP);

        return TutorSummaryResponse.builder()
            .tutorId(tutor.getId())
            .userId(tutor.getUser().getId())
            .fullName(tutor.getUser().getFullName())
            .email(includeContact ? tutor.getUser().getEmail() : null)
            .phone(includeContact ? tutor.getUser().getPhone() : null)
            .avatar(tutor.getUser().getAvatar())
            .description(tutor.getDescription())
            .experience(tutor.getExperience())
            .qualification(tutor.getQualification())
            .province(tutor.getProvince())
            .district(tutor.getDistrict())
            .teachingMode(tutor.getTeachingMode())
            .profileStatus(tutor.getProfileStatus())
            .rejectedReason(tutor.getRejectedReason())
            .hourlyRate(tutor.getHourlyRate())
            .averageRating(averageRating)
            .reviewCount(Math.toIntExact(reviewCount))
            .subjects(subjects)
            .grades(grades)
            .build();
    }
}
