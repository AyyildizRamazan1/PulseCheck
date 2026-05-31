package com.pulsecheck.auth.controller;

import com.pulsecheck.auth.dto.LoginRequest;
import com.pulsecheck.auth.dto.LoginResponse;
import com.pulsecheck.auth.dto.RegisterRequest;
import com.pulsecheck.auth.service.AuthenticationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationService authenticationService;

    @PostMapping("/register")
    public ResponseEntity<Void> register(@Valid @RequestBody RegisterRequest registerRequest) {
        log.info("Register attempt for user: {}", registerRequest.getEmail());
        authenticationService.register(registerRequest);
        log.info("User {} registered successfully", registerRequest.getEmail());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest loginRequest) {
        log.info("Login attempt for user: {}", loginRequest.getUsername());
        LoginResponse response = authenticationService.authenticate(loginRequest);
        log.info("User {} authenticated successfully", loginRequest.getUsername());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh")
    public ResponseEntity<LoginResponse> refresh(@RequestParam String refreshToken) {
        log.info("Token refresh request");
        LoginResponse response = authenticationService.refreshToken(refreshToken);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestParam String refreshToken) {
        log.info("Logout request");
        authenticationService.logout(refreshToken);
        return ResponseEntity.ok().build();
    }
}
