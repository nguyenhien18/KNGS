package com.conggiasu.mapper;

import com.conggiasu.dto.response.TutorSummaryResponse;
import com.conggiasu.entity.Tutor;
import com.conggiasu.repository.ReviewRepository;
import com.conggiasu.repository.TutorTeachingRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeSet;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class TutorSummaryMapper {
    private final ReviewRepository reviewRepository;
    private final TutorTeachingRepository tutorTeachingRepository;

    public TutorSummaryResponse toSummary(Tutor tutor) {
        return buildSummary(tutor, true, null);
    }

    public TutorSummaryResponse toPublicSummary(Tutor tutor) {
        return buildSummary(tutor, false, null);
    }

    public List<TutorSummaryResponse> toPublicSummaries(List<Tutor> tutors) {
        BatchContext context = buildBatchContext(tutors);
        return tutors.stream()
            .map(tutor -> buildSummary(tutor, false, context))
            .toList();
    }

    public List<TutorSummaryResponse> toSummaries(List<Tutor> tutors) {
        BatchContext context = buildBatchContext(tutors);
        return tutors.stream()
            .map(tutor -> buildSummary(tutor, true, context))
            .toList();
    }

    private TutorSummaryResponse buildSummary(Tutor tutor, boolean includeContact, BatchContext context) {
        List<String> subjects = context == null
            ? subjectsFromEntity(tutor)
            : context.subjectsByTutorId().getOrDefault(tutor.getId(), List.of());
        List<String> grades = context == null
            ? gradesFromEntity(tutor)
            : context.gradesByTutorId().getOrDefault(tutor.getId(), List.of());
        RatingStats ratingStats = context == null
            ? ratingStatsFromRepository(tutor.getId())
            : context.ratingStatsByTutorId().getOrDefault(tutor.getId(), RatingStats.empty());

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
            .averageRating(ratingStats.averageRating())
            .reviewCount(ratingStats.reviewCount())
            .subjects(subjects)
            .grades(grades)
            .build();
    }

    private List<String> subjectsFromEntity(Tutor tutor) {
        return tutor.getTutorTeachings().stream()
            .map(ts -> ts.getSubject().getName())
            .distinct()
            .sorted()
            .toList();
    }

    private List<String> gradesFromEntity(Tutor tutor) {
        return tutor.getTutorTeachings().stream()
            .map(ts -> ts.getGrade().getName())
            .distinct()
            .sorted()
            .toList();
    }

    private RatingStats ratingStatsFromRepository(Long tutorId) {
        long reviewCount = reviewRepository.countByTutorId(tutorId);
        Double avgRatingValue = reviewRepository.findAverageRatingByTutorId(tutorId);
        return new RatingStats(roundRating(avgRatingValue), Math.toIntExact(reviewCount));
    }

    private BatchContext buildBatchContext(List<Tutor> tutors) {
        if (tutors == null || tutors.isEmpty()) {
            return new BatchContext(Map.of(), Map.of(), Map.of());
        }

        List<Long> tutorIds = tutors.stream().map(Tutor::getId).toList();
        Map<Long, List<String>> subjectsByTutorId = new HashMap<>();
        Map<Long, List<String>> gradesByTutorId = new HashMap<>();
        Map<Long, TreeSet<String>> subjectSets = new HashMap<>();
        Map<Long, TreeSet<String>> gradeSets = new HashMap<>();

        List<TutorTeachingRepository.TutorTeachingSummary> teachingRows = tutorTeachingRepository.findSummariesByTutorIdIn(tutorIds);
        if (teachingRows != null) {
            for (TutorTeachingRepository.TutorTeachingSummary row : teachingRows) {
                subjectSets.computeIfAbsent(row.getTutorId(), id -> new TreeSet<>()).add(row.getSubjectName());
                gradeSets.computeIfAbsent(row.getTutorId(), id -> new TreeSet<>()).add(row.getGradeName());
            }
        }
        subjectSets.forEach((tutorId, values) -> subjectsByTutorId.put(tutorId, List.copyOf(values)));
        gradeSets.forEach((tutorId, values) -> gradesByTutorId.put(tutorId, List.copyOf(values)));

        Map<Long, RatingStats> ratingStatsByTutorId = new HashMap<>();
        List<ReviewRepository.TutorReviewStats> ratingRows = reviewRepository.findStatsByTutorIds(tutorIds);
        if (ratingRows != null) {
            for (ReviewRepository.TutorReviewStats row : ratingRows) {
                int reviewCount = row.getReviewCount() == null ? 0 : Math.toIntExact(row.getReviewCount());
                ratingStatsByTutorId.put(row.getTutorId(), new RatingStats(roundRating(row.getAverageRating()), reviewCount));
            }
        }

        return new BatchContext(subjectsByTutorId, gradesByTutorId, ratingStatsByTutorId);
    }

    private BigDecimal roundRating(Double avgRatingValue) {
        BigDecimal averageRating = BigDecimal.valueOf(avgRatingValue == null ? 0D : avgRatingValue)
            .setScale(1, RoundingMode.HALF_UP);
        return averageRating;
    }

    private record BatchContext(
        Map<Long, List<String>> subjectsByTutorId,
        Map<Long, List<String>> gradesByTutorId,
        Map<Long, RatingStats> ratingStatsByTutorId
    ) {
    }

    private record RatingStats(BigDecimal averageRating, int reviewCount) {
        static RatingStats empty() {
            return new RatingStats(BigDecimal.ZERO.setScale(1), 0);
        }
    }
}
