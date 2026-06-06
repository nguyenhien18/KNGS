package com.conggiasu.config;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

import com.conggiasu.entity.User;
import com.conggiasu.entity.enums.UserRole;
import com.conggiasu.entity.enums.UserStatus;
import com.conggiasu.repository.UserRepository;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;

@ExtendWith(MockitoExtension.class)
class CustomUserDetailsServiceTest {

    @Mock
    private UserRepository userRepository;

    private CustomUserDetailsService service;

    @BeforeEach
    void setUp() {
        service = new CustomUserDetailsService(userRepository);
    }

    @Test
    void shouldThrowLockedExceptionForBlockedUser() {
        User user = user("blocked@example.com", UserStatus.BLOCKED);
        when(userRepository.findByEmail("blocked@example.com")).thenReturn(Optional.of(user));

        LockedException ex = assertThrows(
            LockedException.class,
            () -> service.loadUserByUsername("blocked@example.com")
        );
        assertTrue(ex.getMessage().contains("khóa"));
    }

    @Test
    void shouldThrowDisabledExceptionForInactiveUser() {
        User user = user("inactive@example.com", UserStatus.INACTIVE);
        when(userRepository.findByEmail("inactive@example.com")).thenReturn(Optional.of(user));

        assertThrows(DisabledException.class, () -> service.loadUserByUsername("inactive@example.com"));
    }

    @Test
    void shouldLoadUserForActiveStatus() {
        User user = user("active@example.com", UserStatus.ACTIVE);
        when(userRepository.findByEmail("active@example.com")).thenReturn(Optional.of(user));

        Object details = service.loadUserByUsername("active@example.com");
        assertTrue(details instanceof AppUserPrincipal);
    }

    private User user(String email, UserStatus status) {
        User user = new User();
        user.setId(1L);
        user.setEmail(email);
        user.setPassword("hash");
        user.setRole(UserRole.LEARNER);
        user.setStatus(status);
        return user;
    }
}
