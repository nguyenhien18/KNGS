package com.conggiasu.controller;

import com.conggiasu.dto.response.ApiResponse;
import com.conggiasu.entity.Grade;
import com.conggiasu.entity.Subject;
import com.conggiasu.repository.GradeRepository;
import com.conggiasu.repository.SubjectRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/lookups")
@RequiredArgsConstructor
@Slf4j
public class LookupController {
    private final SubjectRepository subjectRepository;
    private final GradeRepository gradeRepository;

    @GetMapping("/subjects")
    public ApiResponse<List<Subject>> getSubjects() {
        return ApiResponse.<List<Subject>>builder()
            .code(200)
            .message("Thành công")
            .result(subjectRepository.findAll())
            .build();
    }

    @GetMapping("/grades")
    public ApiResponse<List<Grade>> getGrades() {
        return ApiResponse.<List<Grade>>builder()
            .code(200)
            .message("Thành công")
            .result(gradeRepository.findAll())
            .build();
    }
}
