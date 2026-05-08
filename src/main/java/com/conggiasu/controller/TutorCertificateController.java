package com.conggiasu.controller;

import com.conggiasu.dto.request.TutorCertificateUpsertRequest;
import com.conggiasu.dto.response.ApiResponse;
import com.conggiasu.dto.response.FileUploadResponse;
import com.conggiasu.dto.response.TutorCertificateResponse;
import com.conggiasu.service.CurrentUserService;
import com.conggiasu.service.TutorCertificateService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.MediaType;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/tutor/certificates")
@RequiredArgsConstructor
@Slf4j
public class TutorCertificateController {
    private final TutorCertificateService tutorCertificateService;
    private final CurrentUserService currentUserService;

    @GetMapping
    public ApiResponse<List<TutorCertificateResponse>> getMyCertificates() {
        return ApiResponse.<List<TutorCertificateResponse>>builder()
            .code(200)
            .message("Success")
            .result(tutorCertificateService.getMyCertificates(currentUserService.userId()))
            .build();
    }

    @PostMapping
    public ApiResponse<TutorCertificateResponse> createMyCertificate(@Valid @RequestBody TutorCertificateUpsertRequest request) {
        return ApiResponse.<TutorCertificateResponse>builder()
            .code(200)
            .message("Success")
            .result(tutorCertificateService.createMyCertificate(currentUserService.userId(), request))
            .build();
    }

    @PostMapping(value = "/upload-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<FileUploadResponse> uploadCertificateImage(@RequestPart("file") MultipartFile file) {
        return ApiResponse.<FileUploadResponse>builder()
            .code(200)
            .message("Success")
            .result(tutorCertificateService.uploadMyCertificateImage(currentUserService.userId(), file))
            .build();
    }

    @PutMapping("/{certificateId}")
    public ApiResponse<TutorCertificateResponse> updateMyCertificate(
        @PathVariable Long certificateId,
        @Valid @RequestBody TutorCertificateUpsertRequest request
    ) {
        return ApiResponse.<TutorCertificateResponse>builder()
            .code(200)
            .message("Success")
            .result(tutorCertificateService.updateMyCertificate(currentUserService.userId(), certificateId, request))
            .build();
    }

    @DeleteMapping("/{certificateId}")
    public ApiResponse<Void> deleteMyCertificate(@PathVariable Long certificateId) {
        tutorCertificateService.deleteMyCertificate(currentUserService.userId(), certificateId);
        return ApiResponse.<Void>builder()
            .code(200)
            .message("Success")
            .build();
    }
}
