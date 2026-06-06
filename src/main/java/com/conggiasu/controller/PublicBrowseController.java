package com.conggiasu.controller;

import com.conggiasu.dto.response.ApiResponse;
import com.conggiasu.dto.response.AvailablePostResponse;
import com.conggiasu.dto.response.PageResponse;
import com.conggiasu.dto.response.TutorCourseResponse;
import com.conggiasu.dto.response.TutorReviewResponse;
import com.conggiasu.entity.enums.TeachingMode;
import com.conggiasu.service.LearnerService;
import com.conggiasu.service.TutorFeatureService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
@Slf4j
public class PublicBrowseController {
    private final TutorFeatureService tutorFeatureService;
    private final LearnerService learnerService;

    @GetMapping("/posts")
    public ApiResponse<PageResponse<AvailablePostResponse>> getAvailablePosts(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long subjectId,
            @RequestParam(required = false) Long gradeId,
            @RequestParam(required = false) TeachingMode teachingMode,
            @RequestParam(required = false) String province,
            @RequestParam(required = false) String district,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ApiResponse.<PageResponse<AvailablePostResponse>>builder()
            .code(200)
            .message("Thành công")
            .result(tutorFeatureService.getAvailablePosts(keyword, subjectId, gradeId, teachingMode, province, district, page, size))
            .build();
    }

    @GetMapping("/posts/{postId}")
    public ApiResponse<AvailablePostResponse> getAvailablePostDetail(@PathVariable Long postId) {
        return ApiResponse.<AvailablePostResponse>builder()
            .code(200)
            .message("Thành công")
            .result(tutorFeatureService.getAvailablePostDetail(postId))
            .build();
    }

    @GetMapping("/courses")
    public ApiResponse<PageResponse<TutorCourseResponse>> getAvailableCourses(
            @RequestParam(required = false) Long subjectId,
            @RequestParam(required = false) Long gradeId,
            @RequestParam(required = false) TeachingMode teachingMode,
            @RequestParam(required = false) String province,
            @RequestParam(required = false) String district,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ApiResponse.<PageResponse<TutorCourseResponse>>builder()
            .code(200)
            .message("Thành công")
            .result(learnerService.availableCourses(subjectId, gradeId, teachingMode, province, district, page, size))
            .build();
    }

    @GetMapping("/courses/{courseId}")
    public ApiResponse<TutorCourseResponse> getAvailableCourseDetail(@PathVariable Long courseId) {
        return ApiResponse.<TutorCourseResponse>builder()
            .code(200)
            .message("Thành công")
            .result(learnerService.availableCourseDetail(courseId))
            .build();
    }

    @GetMapping("/tutors/{tutorId}/courses")
    public ApiResponse<PageResponse<TutorCourseResponse>> getAvailableCoursesByTutor(
        @PathVariable Long tutorId,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size
    ) {
        return ApiResponse.<PageResponse<TutorCourseResponse>>builder()
            .code(200)
            .message("Thành công")
            .result(learnerService.availableCoursesByTutorId(tutorId, page, size))
            .build();
    }

    @GetMapping("/tutors/{tutorId}/reviews")
    public ApiResponse<PageResponse<TutorReviewResponse>> getTutorReviews(
        @PathVariable Long tutorId,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size
    ) {
        return ApiResponse.<PageResponse<TutorReviewResponse>>builder()
            .code(200)
            .message("Thành công")
            .result(tutorFeatureService.getReviewsByTutorId(tutorId, page, size))
            .build();
    }
}
