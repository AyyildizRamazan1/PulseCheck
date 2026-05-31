package com.pulsecheck.auth.service;

import com.pulsecheck.auth.dto.AuthResponse;
import com.pulsecheck.auth.dto.RegisterRequest;
import com.pulsecheck.auth.entity.Role;
import com.pulsecheck.auth.entity.User;
import com.pulsecheck.auth.mapper.UserMapper;
import com.pulsecheck.auth.repository.RoleRepository;
import com.pulsecheck.auth.repository.UserRepository;
import com.pulsecheck.common.exception.ResourceAlreadyExistsException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final PasswordService passwordService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // Check if user already exists
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new ResourceAlreadyExistsException("Username already exists");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ResourceAlreadyExistsException("Email already exists");
        }

        // Create new user
        Set<Role> roles = Collections.singleton(roleRepository.findByName("ROLE_USER")
                .orElseThrow(() -> new RuntimeException("Default role not found")));

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .password(passwordService.hashPassword(request.getPassword()))
                .roles(roles)
                .build();

        User savedUser = userRepository.save(user);

        // Convert to DTO and generate JWT tokens
        return AuthResponse.builder()
                .accessToken("dummy-token") // Will be replaced with actual JWT
                .refreshToken("dummy-refresh") // Will be replaced with actual refresh token  
                .tokenType("Bearer")
                .expiresIn(3600)
                .username(savedUser.getUsername())
                .build();
    }
}
