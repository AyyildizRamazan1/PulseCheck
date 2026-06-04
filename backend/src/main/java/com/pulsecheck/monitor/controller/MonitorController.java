package com.pulsecheck.monitor.controller;

import com.pulsecheck.auth.entity.User;
import com.pulsecheck.auth.repository.UserRepository;
import com.pulsecheck.common.exception.ResourceNotFoundException;
import com.pulsecheck.monitor.entity.Monitor;
import com.pulsecheck.monitor.service.MonitorService;
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

import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/monitors")
@RequiredArgsConstructor
@Tag(name = "Monitor", description = "Monitor management APIs")
public class MonitorController {

    private final MonitorService monitorService;
    private final UserRepository userRepository;

    private User resolveUser(UserDetails userDetails) {
        return userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    @Operation(summary = "Create a new monitor")
    @PostMapping
    public ResponseEntity<Monitor> createMonitor(
            @RequestBody Monitor monitor,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = resolveUser(userDetails);
        Monitor saved = monitorService.createMonitor(monitor, user);
        return ResponseEntity.ok(saved);
    }

    @Operation(summary = "Get all monitors for the authenticated user")
    @GetMapping
    public ResponseEntity<Page<Monitor>> getAllMonitors(
            @AuthenticationPrincipal UserDetails userDetails,
            Pageable pageable) {
        User user = resolveUser(userDetails);
        return ResponseEntity.ok(monitorService.getMonitorsByUser(user.getId(), pageable));
    }

    @Operation(summary = "Get monitor by ID")
    @GetMapping("/{id}")
    public ResponseEntity<Monitor> getMonitorById(
            @Parameter(description = "Monitor ID") @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return monitorService.getMonitorById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @Operation(summary = "Update monitor")
    @PutMapping("/{id}")
    public ResponseEntity<Monitor> updateMonitor(
            @Parameter(description = "Monitor ID") @PathVariable UUID id,
            @RequestBody Monitor monitor,
            @AuthenticationPrincipal UserDetails userDetails) {
        Monitor updated = monitorService.updateMonitor(id, monitor);
        return ResponseEntity.ok(updated);
    }

    @Operation(summary = "Delete monitor")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMonitor(
            @Parameter(description = "Monitor ID") @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails) {
        monitorService.deleteMonitor(id);
        return ResponseEntity.noContent().build();
    }
}