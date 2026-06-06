package com.conggiasu.config;

import com.conggiasu.entity.User;
import com.conggiasu.entity.enums.UserStatus;
import com.conggiasu.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {
    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) {
        User user = userRepository.findByEmail(username)
            .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy tài khoản"));
        if (user.getStatus() == UserStatus.BLOCKED) {
            throw new LockedException("Tài khoản đã bị khóa");
        }
        if (user.getStatus() == UserStatus.INACTIVE) {
            throw new DisabledException("Tài khoản chưa kích hoạt");
        }
        return new AppUserPrincipal(user);
    }
}

