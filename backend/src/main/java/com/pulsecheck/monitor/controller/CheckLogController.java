package com.pulsecheck.monitor.controller;

import com.pulsecheck.auth.entity.User;
import com.pulsecheck.auth.repository.UserRepository;
import com.pulsecheck.common.exception.ResourceNotFoundException;
import com.pulsecheck.monitor.dto.CheckLogResponse;
import com.pulsecheck.monitor.service.CheckLogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/monitors")
@RequiredArgsConstructor
@Tag(name = "Check Logs", description = "Monitor ping log APIs")
public class CheckLogController {

    private final CheckLogService checkLogService;
    private final UserRepository userRepository;

    @Operation(summary = "Get check logs for a monitor",
               description = "Returns paginated ping logs for the given monitor. Only accessible by the monitor's owner.")
    @GetMapping("/{monitorId}/logs")
    public ResponseEntity<Page<CheckLogResponse>> getLogs(
            @Parameter(description = "Monitor ID") @PathVariable UUID monitorId,
            @AuthenticationPrincipal UserDetails userDetails,
            @PageableDefault(size = 50, sort = "checkedAt", direction = Sort.Direction.DESC) Pageable pageable) {

        User user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Page<CheckLogResponse> logs = checkLogService.getLogsForMonitor(monitorId, user.getId(), pageable);
        return ResponseEntity.ok(logs);
    }
}