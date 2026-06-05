package com.pulsecheck.monitor.service;

import com.pulsecheck.auth.entity.User;
import com.pulsecheck.common.exception.ResourceNotFoundException;
import com.pulsecheck.monitor.entity.Monitor;
import com.pulsecheck.monitor.repository.MonitorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class MonitorService {

    private final MonitorRepository monitorRepository;
    private final MonitorSchedulerService schedulerService;

    @Transactional
    public Monitor createMonitor(Monitor monitor, User user) {
        monitor.setUser(user);
        Monitor saved = monitorRepository.save(monitor);
        if (Boolean.TRUE.equals(saved.getEnabled())) {
            schedulerService.scheduleMonitor(saved);
        }
        return saved;
    }

    public Page<Monitor> getMonitorsByUser(UUID userId, Pageable pageable) {
        return monitorRepository.findByUserId(userId, pageable);
    }

    public Optional<Monitor> getMonitorById(UUID id) {
        return monitorRepository.findByIdWithUser(id);
    }

    @Transactional
    public Monitor updateMonitor(UUID id, Monitor updated) {
        Monitor existing = monitorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Monitor not found: " + id));
        existing.setName(updated.getName());
        existing.setUrl(updated.getUrl());
        existing.setType(updated.getType() != null ? updated.getType() : existing.getType());
        existing.setDescription(updated.getDescription());
        existing.setHeaders(updated.getHeaders());
        existing.setBody(updated.getBody());
        existing.setExpectedStatusCode(updated.getExpectedStatusCode() != null ? updated.getExpectedStatusCode() : existing.getExpectedStatusCode());
        existing.setTimeoutSeconds(updated.getTimeoutSeconds() != null ? updated.getTimeoutSeconds() : existing.getTimeoutSeconds());
        existing.setCheckIntervalSeconds(updated.getCheckIntervalSeconds() != null ? updated.getCheckIntervalSeconds() : existing.getCheckIntervalSeconds());
        existing.setEnabled(updated.getEnabled() != null ? updated.getEnabled() : existing.getEnabled());
        Monitor saved = monitorRepository.save(existing);
        if (Boolean.TRUE.equals(saved.getEnabled())) {
            schedulerService.scheduleMonitor(saved);
        } else {
            schedulerService.unscheduleMonitor(id);
        }
        return saved;
    }

    @Transactional
    public void deleteMonitor(UUID id) {
        if (!monitorRepository.existsById(id)) {
            throw new ResourceNotFoundException("Monitor not found: " + id);
        }
        schedulerService.unscheduleMonitor(id);
        monitorRepository.deleteById(id);
    }
}