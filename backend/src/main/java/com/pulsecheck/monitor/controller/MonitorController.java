package com.pulsecheck.monitor.controller;

import com.pulsecheck.auth.entity.User;
import com.pulsecheck.auth.repository.UserRepository;
import com.pulsecheck.common.exception.ResourceNotFoundException;
import com.pulsecheck.monitor.entity.Monitor;
import com.pulsecheck.monitor.repository.MonitorRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/monitors")
@RequiredArgsConstructor
@Tag(name = "Monitor", description = "Monitor management APIs")
public class MonitorController {

    private final MonitorRepository monitorRepository;
    private final UserRepository userRepository;

    @Operation(summary = "Create a new monitor", description = "Creates a new monitoring configuration")
    @PostMapping
    public ResponseEntity<Monitor> createMonitor(
            @RequestBody Monitor monitor,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        monitor.setUser(user);
        Monitor savedMonitor = monitorRepository.save(monitor);
        return ResponseEntity.ok(savedMonitor);
    }

    @Operation(summary = "Get all monitors", description = "Retrieves all monitors for the authenticated user")
    @GetMapping
    public ResponseEntity<Page<Monitor>> getAllMonitors(
            @AuthenticationPrincipal UserDetails userDetails,
            Pageable pageable) {
        User user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Page<Monitor> monitors = monitorRepository.findByUserId(user.getId(), pageable);
        return ResponseEntity.ok(monitors);
    }

    @Operation(summary = "Get monitor by ID", description = "Retrieves a specific monitor by its ID")
    @GetMapping("/{id}")
    public ResponseEntity<Monitor> getMonitorById(
            @Parameter(description = "Monitor ID") @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails) {
        log.info("Fetching monitor {} for user: {}", id, userDetails.getUsername());
        return monitorRepository.findByIdWithUser(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @Operation(summary = "Update monitor", description = "Updates an existing monitor")
    @PutMapping("/{id}")
    public ResponseEntity<Monitor> updateMonitor(
            @Parameter(description = "Monitor ID") @PathVariable UUID id,
            @RequestBody Monitor monitor,
            @AuthenticationPrincipal UserDetails userDetails) {
        log.info("Updating monitor {} for user: {}", id, userDetails.getUsername());
        return monitorRepository.findById(id)
                .map(existingMonitor -> {
                    monitor.setId(id);
                    return ResponseEntity.ok(monitorRepository.save(monitor));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @Operation(summary = "Delete monitor", description = "Deletes a monitor by its ID")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMonitor(
            @Parameter(description = "Monitor ID") @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails) {
        log.info("Deleting monitor {} for user: {}", id, userDetails.getUsername());
        if (monitorRepository.existsById(id)) {
            monitorRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    @Operation(summary = "Get enabled monitors", description = "Retrieves all enabled monitors")
    @GetMapping("/enabled")
    public ResponseEntity<List<Monitor>> getEnabledMonitors(
            @AuthenticationPrincipal UserDetails userDetails) {
        log.info("Fetching enabled monitors for user: {}", userDetails.getUsername());
        List<Monitor> monitors = monitorRepository.findByEnabled(true);
        return ResponseEntity.ok(monitors);
    }
}
