package com.pulsecheck.auth.service;

import com.pulsecheck.auth.dto.LoginRequest;
import com.pulsecheck.auth.dto.LoginResponse;
import com.pulsecheck.auth.dto.RegisterRequest;
import com.pulsecheck.auth.entity.User;
import com.pulsecheck.auth.repository.UserRepository;
import com.pulsecheck.auth.service.PasswordService;
import com.pulsecheck.common.exception.ResourceNotFoundException;
import com.pulsecheck.common.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthenticationService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;
    private final PasswordService passwordService;

    @Transactional
    public void register(RegisterRequest registerRequest) {
        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        if (userRepository.existsByUsername(registerRequest.getEmail())) {
            throw new RuntimeException("Username already exists");
        }

        User user = User.builder()
            .username(registerRequest.getEmail())
            .email(registerRequest.getEmail())
            .password(passwordService.hashPassword(registerRequest.getPassword()))
            .enabled(true)
            .build();

        userRepository.save(user);
        log.info("User registered successfully: {}", registerRequest.getEmail());
    }

    @Transactional
    public LoginResponse authenticate(LoginRequest loginRequest) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                    loginRequest.getUsername(),
                    loginRequest.getPassword()
                )
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);

            String jwt = tokenProvider.generateToken(authentication);
            String refreshToken = tokenProvider.generateRefreshToken(loginRequest.getUsername());

            User user = userRepository.findByUsername(loginRequest.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

            return LoginResponse.builder()
                .accessToken(jwt)
                .refreshToken(refreshToken)
                .expiresIn(86400) // 24 hours
                .issuedAt(LocalDateTime.now())
                .username(user.getUsername())
                .build();

        } catch (AuthenticationException e) {
            log.error("Authentication failed for user: {}", loginRequest.getUsername());
            throw new RuntimeException("Invalid username or password");
        }
    }

    @Transactional
    public LoginResponse refreshToken(String refreshToken) {
        if (!tokenProvider.validateToken(refreshToken)) {
            throw new RuntimeException("Invalid refresh token");
        }

        String username = tokenProvider.getUsernameFromToken(refreshToken);
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String newAccessToken = tokenProvider.generateToken(username);
        String newRefreshToken = tokenProvider.generateRefreshToken(username);

        return LoginResponse.builder()
            .accessToken(newAccessToken)
            .refreshToken(newRefreshToken)
            .expiresIn(86400) // 24 hours
            .issuedAt(LocalDateTime.now())
            .username(user.getUsername())
            .build();
    }

    @Transactional
    public void logout(String refreshToken) {
        // In a real implementation, you would invalidate the refresh token
        // by removing it from the database or adding it to a blacklist
        log.info("User logged out successfully");
    }
}
