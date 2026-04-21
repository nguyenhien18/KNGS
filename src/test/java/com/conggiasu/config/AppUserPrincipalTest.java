package com.conggiasu.config;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.conggiasu.entity.User;
import com.conggiasu.entity.enums.UserRole;
import com.conggiasu.entity.enums.UserStatus;
import org.junit.jupiter.api.Test;

class AppUserPrincipalTest {

    @Test
    void activeUserShouldBeEnabledAndNonLocked() {
        User user = baseUser(UserStatus.ACTIVE);
        AppUserPrincipal principal = new AppUserPrincipal(user);

        assertTrue(principal.isEnabled());
        assertTrue(principal.isAccountNonLocked());
    }

    @Test
    void inactiveUserShouldBeDisabled() {
        User user = baseUser(UserStatus.INACTIVE);
        AppUserPrincipal principal = new AppUserPrincipal(user);

        assertFalse(principal.isEnabled());
        assertTrue(principal.isAccountNonLocked());
    }

    @Test
    void blockedUserShouldBeLockedAndDisabled() {
        User user = baseUser(UserStatus.BLOCKED);
        AppUserPrincipal principal = new AppUserPrincipal(user);

        assertFalse(principal.isEnabled());
        assertFalse(principal.isAccountNonLocked());
    }

    private User baseUser(UserStatus status) {
        User user = new User();
        user.setId(1L);
        user.setEmail("u@example.com");
        user.setPassword("hash");
        user.setRole(UserRole.LEARNER);
        user.setStatus(status);
        return user;
    }
}
