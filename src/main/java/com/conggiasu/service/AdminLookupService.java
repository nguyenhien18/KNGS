package com.conggiasu.service;

import com.conggiasu.entity.Grade;
import com.conggiasu.entity.Subject;
import com.conggiasu.exception.AppException;
import com.conggiasu.repository.GradeRepository;
import com.conggiasu.repository.PostRepository;
import com.conggiasu.repository.SubjectRepository;
import com.conggiasu.repository.TutorCourseRepository;
import com.conggiasu.repository.TutorTeachingRepository;
import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminLookupService {
    private final AdminAccessService adminAccessService;
    private final SubjectRepository subjectRepository;
    private final GradeRepository gradeRepository;
    private final PostRepository postRepository;
    private final TutorCourseRepository tutorCourseRepository;
    private final TutorTeachingRepository tutorTeachingRepository;

    @Transactional(readOnly = true)
    public List<Subject> getSubjects(Long adminUserId) {
        adminAccessService.validateAdmin(adminUserId);
        return subjectRepository.findAll().stream()
            .sorted(Comparator.comparing(Subject::getName, String.CASE_INSENSITIVE_ORDER))
            .toList();
    }

    @Transactional(readOnly = true)
    public List<Grade> getGrades(Long adminUserId) {
        adminAccessService.validateAdmin(adminUserId);
        return gradeRepository.findAll().stream()
            .sorted(Comparator.comparing(Grade::getName, String.CASE_INSENSITIVE_ORDER))
            .toList();
    }

    @Transactional
    public Subject createSubject(Long adminUserId, String name) {
        adminAccessService.validateAdmin(adminUserId);
        String normalized = normalizeLookupName(name);
        if (subjectRepository.existsByNameIgnoreCase(normalized)) {
            throw new AppException(HttpStatus.CONFLICT, "Môn học đã tồn tại");
        }
        Subject subject = new Subject();
        subject.setName(normalized);
        return subjectRepository.save(subject);
    }

    @Transactional
    public Subject updateSubject(Long adminUserId, Long subjectId, String name) {
        adminAccessService.validateAdmin(adminUserId);
        Subject subject = subjectRepository.findById(subjectId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy môn học"));
        String normalized = normalizeLookupName(name);
        subjectRepository.findByNameIgnoreCase(normalized)
            .filter(existing -> !existing.getId().equals(subjectId))
            .ifPresent(existing -> {
                throw new AppException(HttpStatus.CONFLICT, "Môn học đã tồn tại");
            });
        subject.setName(normalized);
        return subjectRepository.save(subject);
    }

    @Transactional
    public void deleteSubject(Long adminUserId, Long subjectId) {
        adminAccessService.validateAdmin(adminUserId);
        if (!subjectRepository.existsById(subjectId)) {
            throw new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy môn học");
        }
        if (isSubjectInUse(subjectId)) {
            throw new AppException(HttpStatus.CONFLICT, "Không thể xóa môn học đang được sử dụng");
        }
        subjectRepository.deleteById(subjectId);
    }

    @Transactional
    public Grade createGrade(Long adminUserId, String name) {
        adminAccessService.validateAdmin(adminUserId);
        String normalized = normalizeLookupName(name);
        if (gradeRepository.existsByNameIgnoreCase(normalized)) {
            throw new AppException(HttpStatus.CONFLICT, "Khối lớp đã tồn tại");
        }
        Grade grade = new Grade();
        grade.setName(normalized);
        return gradeRepository.save(grade);
    }

    @Transactional
    public Grade updateGrade(Long adminUserId, Long gradeId, String name) {
        adminAccessService.validateAdmin(adminUserId);
        Grade grade = gradeRepository.findById(gradeId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy khối lớp"));
        String normalized = normalizeLookupName(name);
        gradeRepository.findByNameIgnoreCase(normalized)
            .filter(existing -> !existing.getId().equals(gradeId))
            .ifPresent(existing -> {
                throw new AppException(HttpStatus.CONFLICT, "Khối lớp đã tồn tại");
            });
        grade.setName(normalized);
        return gradeRepository.save(grade);
    }

    @Transactional
    public void deleteGrade(Long adminUserId, Long gradeId) {
        adminAccessService.validateAdmin(adminUserId);
        if (!gradeRepository.existsById(gradeId)) {
            throw new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy khối lớp");
        }
        if (isGradeInUse(gradeId)) {
            throw new AppException(HttpStatus.CONFLICT, "Không thể xóa khối lớp đang được sử dụng");
        }
        gradeRepository.deleteById(gradeId);
    }

    private boolean isSubjectInUse(Long subjectId) {
        return postRepository.existsBySubjectId(subjectId)
            || tutorCourseRepository.existsBySubjectId(subjectId)
            || tutorTeachingRepository.existsBySubjectId(subjectId);
    }

    private boolean isGradeInUse(Long gradeId) {
        return postRepository.existsByGradeId(gradeId)
            || tutorCourseRepository.existsByGradeId(gradeId)
            || tutorTeachingRepository.existsByGradeId(gradeId);
    }

    private String normalizeLookupName(String name) {
        if (name == null || name.isBlank()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Tên không được để trống");
        }
        return name.trim();
    }
}
