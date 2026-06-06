package com.conggiasu.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.conggiasu.dto.request.TutorUpsertRequest;
import com.conggiasu.dto.response.PageResponse;
import com.conggiasu.dto.response.TutorSummaryResponse;
import com.conggiasu.entity.Tutor;
import com.conggiasu.entity.User;
import com.conggiasu.entity.enums.TutorProfileStatus;
import com.conggiasu.entity.enums.UserRole;
import com.conggiasu.entity.enums.UserStatus;
import com.conggiasu.exception.AppException;
import com.conggiasu.mapper.TutorSummaryMapper;
import com.conggiasu.repository.GradeRepository;
import com.conggiasu.repository.ReviewRepository;
import com.conggiasu.repository.SubjectRepository;
import com.conggiasu.repository.TutorRepository;
import com.conggiasu.repository.TutorCertificateRepository;
import com.conggiasu.repository.TutorTeachingRepository;
import com.conggiasu.repository.UserRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;

@ExtendWith(MockitoExtension.class)
class TutorServicePublicVisibilityTest {

    @Mock
    private TutorRepository tutorRepository;
    @Mock
    private TutorCertificateRepository tutorCertificateRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private SubjectRepository subjectRepository;
    @Mock
    private GradeRepository gradeRepository;
    @Mock
    private ReviewRepository reviewRepository;
    @Mock
    private TutorTeachingRepository tutorTeachingRepository;
    @Mock
    private NotificationService notificationService;

    private TutorService tutorService;

    @BeforeEach
    void setUp() {
        TutorSearchSpecificationBuilder specBuilder = new TutorSearchSpecificationBuilder();
        TutorProfileMutationService mutationService = new TutorProfileMutationService(
            userRepository,
            subjectRepository,
            gradeRepository,
            tutorTeachingRepository
        );
        TutorSummaryMapper tutorSummaryMapper = new TutorSummaryMapper(reviewRepository, tutorTeachingRepository);
        TutorPublicQueryService publicQueryService = new TutorPublicQueryService(
            tutorRepository,
            specBuilder,
            tutorSummaryMapper
        );
        TutorCertificateSyncService certificateSyncService = new TutorCertificateSyncService(tutorCertificateRepository);
        TutorProfileService profileService = new TutorProfileService(
            tutorRepository,
            userRepository,
            mutationService,
            certificateSyncService,
            notificationService,
            tutorSummaryMapper
        );
        tutorService = new TutorService(
            publicQueryService,
            profileService
        );
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void getTutorByIdShouldHideTutorWhenProfileNotApproved() {
        Tutor tutor = tutor(TutorProfileStatus.PENDING, UserStatus.ACTIVE);
        when(tutorRepository.findById(10L)).thenReturn(Optional.of(tutor));

        assertThrows(AppException.class, () -> tutorService.getTutorById(10L));
    }

    @Test
    void getTutorByIdShouldHideTutorWhenUserBlocked() {
        Tutor tutor = tutor(TutorProfileStatus.APPROVED, UserStatus.BLOCKED);
        when(tutorRepository.findById(11L)).thenReturn(Optional.of(tutor));

        assertThrows(AppException.class, () -> tutorService.getTutorById(11L));
    }

    @Test
    void getTutorByIdShouldReturnRedactedTutorWhenApprovedAndActive() {
        Tutor tutor = tutor(TutorProfileStatus.APPROVED, UserStatus.ACTIVE);
        when(tutorRepository.findById(12L)).thenReturn(Optional.of(tutor));
        when(reviewRepository.countByTutorId(anyLong())).thenReturn(0L);
        when(reviewRepository.findAverageRatingByTutorId(anyLong())).thenReturn(0D);

        TutorSummaryResponse result = tutorService.getTutorById(12L);
        assertEquals(12L, result.getTutorId());
        assertEquals("Tutor Test", result.getFullName());
        assertNull(result.getEmail());
        assertNull(result.getPhone());
    }

    @Test
    void searchShouldRejectNonApprovedStatusForNonAdmin() {
        AppException ex = assertThrows(AppException.class, () ->
            tutorService.searchTutors(null, null, null, null, TutorProfileStatus.PENDING, 0, 10)
        );

        assertEquals(HttpStatus.FORBIDDEN, ex.getStatus());
        verify(tutorRepository, never()).findAll(org.mockito.ArgumentMatchers.<Specification<Tutor>>any(), org.mockito.ArgumentMatchers.<Pageable>any());
    }

    @Test
    void searchShouldReturnRedactedItemsForPublic() {
        Tutor tutor = tutor(TutorProfileStatus.APPROVED, UserStatus.ACTIVE);
        when(tutorRepository.findAll(org.mockito.ArgumentMatchers.<Specification<Tutor>>any(), org.mockito.ArgumentMatchers.<Pageable>any()))
            .thenReturn(new PageImpl<>(List.of(tutor)));

        PageResponse<TutorSummaryResponse> result = tutorService.searchTutors(
            null,
            null,
            null,
            null,
            null,
            0,
            10
        );

        assertEquals(1, result.getContent().size());
        assertNull(result.getContent().get(0).getEmail());
        assertNull(result.getContent().get(0).getPhone());
    }

    @Test
    void createTutorProfileForUserIdShouldRejectWhenTutorProfileAlreadyExists() {
        when(tutorRepository.findByUserId(20L)).thenReturn(Optional.of(new Tutor()));

        AppException ex = assertThrows(AppException.class,
            () -> tutorService.createTutorProfileForUserId(20L, new TutorUpsertRequest())
        );

        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
    }

    private Tutor tutor(TutorProfileStatus profileStatus, UserStatus userStatus) {
        User user = new User();
        user.setId(1L);
        user.setRole(UserRole.TUTOR);
        user.setEmail("tutor@example.com");
        user.setPhone("0900000000");
        user.setFullName("Tutor Test");
        user.setStatus(userStatus);

        Tutor tutor = new Tutor();
        tutor.setId(12L);
        tutor.setUser(user);
        tutor.setProfileStatus(profileStatus);
        return tutor;
    }
}

