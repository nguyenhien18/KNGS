package com.conggiasu.service;

import com.conggiasu.entity.Tutor;
import com.conggiasu.entity.TutorTeaching;
import com.conggiasu.entity.enums.TeachingMode;
import com.conggiasu.entity.enums.TutorProfileStatus;
import com.conggiasu.entity.enums.UserStatus;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

@Component
public class TutorSearchSpecificationBuilder {

    public Specification<Tutor> build(
        String keyword,
        Long subjectId,
        Long gradeId,
        TeachingMode teachingMode,
        String province,
        String district,
        TutorProfileStatus profileStatus
    ) {
        Specification<Tutor> spec = (root, query, cb) -> cb.conjunction();
        if (keyword != null && !keyword.isBlank()) {
            String kw = "%" + keyword.trim().toLowerCase() + "%";
            spec = spec.and((root, query, cb) -> cb.like(cb.lower(root.get("user").get("fullName")), kw));
        }
        if (subjectId != null || gradeId != null) {
            spec = spec.and((root, query, cb) -> {
                query.distinct(true);
                Join<Tutor, TutorTeaching> tutorTeachings = root.join("tutorTeachings");
                List<Predicate> predicates = new ArrayList<>();
                if (subjectId != null) {
                    predicates.add(cb.equal(tutorTeachings.get("subject").get("id"), subjectId));
                }
                if (gradeId != null) {
                    predicates.add(cb.equal(tutorTeachings.get("grade").get("id"), gradeId));
                }
                return cb.and(predicates.toArray(Predicate[]::new));
            });
        }
        if (teachingMode != null) {
            spec = spec.and((root, query, cb) -> {
                if (teachingMode == TeachingMode.ONLINE || teachingMode == TeachingMode.OFFLINE) {
                    return cb.or(
                        cb.equal(root.get("teachingMode"), teachingMode),
                        cb.equal(root.get("teachingMode"), TeachingMode.BOTH)
                    );
                }
                return cb.equal(root.get("teachingMode"), teachingMode);
            });
        }
        if (province != null && !province.isBlank()) {
            String pv = "%" + province.trim().toLowerCase() + "%";
            spec = spec.and((root, query, cb) -> cb.like(cb.lower(root.get("province")), pv));
        }
        if (district != null && !district.isBlank()) {
            String dt = "%" + district.trim().toLowerCase() + "%";
            spec = spec.and((root, query, cb) -> cb.like(cb.lower(root.get("district")), dt));
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
