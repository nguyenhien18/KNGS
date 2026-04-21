package com.conggiasu.service;

import com.conggiasu.dto.request.TutorUpsertRequest;
import com.conggiasu.entity.Grade;
import com.conggiasu.entity.Subject;
import com.conggiasu.entity.Tutor;
import com.conggiasu.entity.TutorTeaching;
import com.conggiasu.entity.User;
import com.conggiasu.exception.AppException;
import com.conggiasu.repository.GradeRepository;
import com.conggiasu.repository.SubjectRepository;
import com.conggiasu.repository.TutorTeachingRepository;
import com.conggiasu.repository.UserRepository;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class TutorProfileMutationService {
    private final UserRepository userRepository;
    private final SubjectRepository subjectRepository;
    private final GradeRepository gradeRepository;
    private final TutorTeachingRepository tutorTeachingRepository;

    public void validateUserConflicts(User user, TutorUpsertRequest request) {
        String phone = normalizeBlank(request.getPhone());
        if (phone != null && userRepository.existsByPhoneAndIdNot(phone, user.getId())) {
            throw new AppException(HttpStatus.CONFLICT, "So dien thoai da ton tai");
        }
    }

    public void applyUserProfile(User user, TutorUpsertRequest request) {
        user.setFullName(normalizeBlank(request.getFullName()));
        user.setPhone(normalizeBlank(request.getPhone()));
        user.setBirthDate(request.getBirthDate());
        user.setGender(request.getGender());
        user.setAvatar(normalizeBlank(request.getAvatar()));
        user.setAddress(normalizeBlank(request.getAddress()));
    }

    public void applyTutorRequest(Tutor tutor, TutorUpsertRequest request) {
        tutor.setDescription(normalizeBlank(request.getDescription()));
        tutor.setExperience(normalizeBlank(request.getExperience()));
        tutor.setQualification(normalizeBlank(request.getQualification()));
        tutor.setTeachingMode(request.getTeachingMode());
        tutor.setProvince(normalizeBlank(request.getProvince()));
        tutor.setDistrict(normalizeBlank(request.getDistrict()));
        tutor.setHourlyRate(request.getHourlyRate());

        Set<Long> distinctSubjectIds = new HashSet<>(request.getSubjectIds());
        List<Subject> subjects = subjectRepository.findAllById(distinctSubjectIds);
        if (subjects.size() != distinctSubjectIds.size()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Danh sach subjectIds khong hop le");
        }

        Set<Long> distinctGradeIds = new HashSet<>(request.getGradeIds());
        List<Grade> grades = gradeRepository.findAllById(distinctGradeIds);
        if (grades.size() != distinctGradeIds.size()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Danh sach gradeIds khong hop le");
        }

        if (tutor.getId() != null) {
            tutorTeachingRepository.deleteByTutor_Id(tutor.getId());
            tutorTeachingRepository.flush();
        }
        tutor.getTutorTeachings().clear();
        for (Subject subject : subjects) {
            for (Grade grade : grades) {
                TutorTeaching teaching = new TutorTeaching();
                teaching.setTutor(tutor);
                teaching.setSubject(subject);
                teaching.setGrade(grade);
                tutor.getTutorTeachings().add(teaching);
            }
        }
    }

    public String normalizeBlank(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
