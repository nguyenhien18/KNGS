package com.conggiasu.config;

import com.conggiasu.entity.enums.Gender;
import com.conggiasu.entity.enums.UserRole;
import com.conggiasu.entity.enums.UserStatus;
import com.conggiasu.entity.User;
import com.conggiasu.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class StartupDataSeeder implements CommandLineRunner {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        seedUsers();
    }

    private void seedUsers() {
        upsertUser("admin@gmail.com", "1234567890", "Administrator", UserRole.ADMIN, "0900000000");
    }

    private void upsertUser(String email, String password, String fullName, UserRole role, String phone) {
        var existing = userRepository.findByEmail(email);
        if (existing.isPresent()) {
            User current = existing.get();
            if (current.getPassword() == null || !current.getPassword().startsWith("$2")) {
                current.setPassword(passwordEncoder.encode(password));
                userRepository.save(current);
            }
            return;
        }
        User user = new User();
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setFullName(fullName);
        user.setRole(role);
        user.setPhone(phone);
        user.setGender(Gender.OTHER);
        user.setStatus(UserStatus.ACTIVE);
        userRepository.save(user);
    }
}
