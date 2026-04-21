package com.conggiasu.service;

import com.conggiasu.dto.request.UpdateProfileRequest;
import com.conggiasu.entity.User;
import com.conggiasu.exception.AppException;
import com.conggiasu.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AccountProfileMutationService {
    private final UserRepository userRepository;

    public void applyProfileUpdate(User user, UpdateProfileRequest request) {
        if (request.getFullName() != null) {
            String fullName = normalizeBlank(request.getFullName());
            if (fullName == null) {
                throw new AppException(HttpStatus.BAD_REQUEST, "Ho ten khong duoc de trong");
            }
            user.setFullName(fullName);
        }

        if (request.getPhone() != null) {
            String phone = normalizeBlank(request.getPhone());
            if (phone != null && userRepository.existsByPhoneAndIdNot(phone, user.getId())) {
                throw new AppException(HttpStatus.CONFLICT, "So dien thoai da ton tai");
            }
            user.setPhone(phone);
        }
        if (request.getBirthDate() != null) {
            user.setBirthDate(request.getBirthDate());
        }
        if (request.getGender() != null) {
            user.setGender(request.getGender());
        }
        if (request.getAvatar() != null) {
            user.setAvatar(normalizeBlank(request.getAvatar()));
        }
        if (request.getAddress() != null) {
            user.setAddress(normalizeBlank(request.getAddress()));
        }
    }

    private String normalizeBlank(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
