package com.conggiasu.service;

import com.conggiasu.entity.Tutor;
import com.conggiasu.entity.TutorTeaching;
import com.conggiasu.entity.enums.TeachingMode;
import com.conggiasu.entity.enums.TutorProfileStatus;
import com.conggiasu.entity.enums.UserStatus;
import jakarta.persistence.criteria.Join;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

@Component
public class TutorSearchSpecificationBuilder {

    public Specification<Tutor> build(
        String keyword,
        Long subjectId,
        Long gradeId,
        TeachingMode teachingMode,
        TutorProfileStatus profileStatus
    ) {
        Specification<Tutor> spec = (root, query, cb) -> cb.conjunction();
        if (keyword != null && !keyword.isBlank()) {
            String kw = "%" + keyword.trim().toLowerCase() + "%";
            spec = spec.and((root, query, cb) -> cb.like(cb.lower(root.get("user").get("fullName")), kw));
        }
        if (subjectId != null) {
            spec = spec.and((root, query, cb) -> {
                Join<Tutor, TutorTeaching> tutorTeachings = root.join("tutorTeachings");
                return cb.equal(tutorTeachings.get("subject").get("id"), subjectId);
            });
        }
        if (gradeId != null) {
            spec = spec.and((root, query, cb) -> {
                Join<Tutor, TutorTeaching> tutorTeachings = root.join("tutorTeachings");
                return cb.equal(tutorTeachings.get("grade").get("id"), gradeId);
            });
        }
        if (teachingMode != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("teachingMode"), teachingMode));
        }

        TutorProfileStatus appliedStatus = profileStatus == null ? TutorProfileStatus.APPROVED : profileStatus;
        spec = spec.and((root, query, cb) -> cb.equal(root.get("profileStatus"), appliedStatus));
        spec = spec.and((root, query, cb) -> cb.equal(root.get("user").get("status"), UserStatus.ACTIVE));

        return spec.and((root, query, cb) -> {
            query.distinct(true);
            return cb.conjunction();
        });
    }
}
