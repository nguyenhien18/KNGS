package com.conggiasu.service;

import com.conggiasu.dto.request.ChangePasswordRequest;
import com.conggiasu.dto.request.UpdateProfileRequest;
import com.conggiasu.dto.response.FileUploadResponse;
import com.conggiasu.dto.response.UserProfileResponse;
import com.conggiasu.entity.User;
import com.conggiasu.exception.AppException;
import com.conggiasu.mapper.AccountProfileMapper;
import com.conggiasu.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
@Slf4j
public class AccountService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final FileStorageService fileStorageService;
    private final AccountProfileMutationService accountProfileMutationService;
    private final AccountProfileMapper accountProfileMapper;

    @Transactional(readOnly = true)
    public UserProfileResponse getMyProfile(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng"));
        return accountProfileMapper.toResponse(user);
    }

    @Transactional
    public UserProfileResponse updateProfile(Long userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng"));
        accountProfileMutationService.applyProfileUpdate(user, request);
        user = userRepository.save(user);
        return accountProfileMapper.toResponse(user);
    }

    @Transactional
    public FileUploadResponse uploadAvatar(Long userId, MultipartFile file) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng"));
        String url = fileStorageService.storeAvatar(file, user.getAvatar());
        user.setAvatar(url);
        userRepository.save(user);
        return FileUploadResponse.builder().url(url).build();
    }

    @Transactional(readOnly = true)
    public FileUploadResponse uploadIdentityImage(Long userId, MultipartFile file) {
        if (!userRepository.existsById(userId)) {
            throw new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng");
        }
        String url = fileStorageService.storeIdentityImage(file);
        return FileUploadResponse.builder().url(url).build();
    }

    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng"));
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Mật khẩu hiện tại không đúng");
        }
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }
}




