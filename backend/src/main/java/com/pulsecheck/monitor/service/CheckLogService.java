package com.pulsecheck.monitor.service;

import com.pulsecheck.common.exception.ResourceNotFoundException;
import com.pulsecheck.monitor.dto.CheckLogResponse;
import com.pulsecheck.monitor.entity.Monitor;
import com.pulsecheck.monitor.repository.CheckLogRepository;
import com.pulsecheck.monitor.repository.MonitorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class CheckLogService {

    private final CheckLogRepository checkLogRepository;
    private final MonitorRepository monitorRepository;

    @Transactional(readOnly = true)
    public Page<CheckLogResponse> getLogsForMonitor(UUID monitorId, UUID requestingUserId, Pageable pageable) {
        Monitor monitor = monitorRepository.findByIdWithUser(monitorId)
                .orElseThrow(() -> new ResourceNotFoundException("Monitor not found: " + monitorId));

        if (!monitor.getUser().getId().equals(requestingUserId)) {
            log.warn("User {} attempted to access logs of monitor {} owned by {}",
                    requestingUserId, monitorId, monitor.getUser().getId());
            throw new ResourceNotFoundException("Monitor not found: " + monitorId);
        }

        Pageable sorted = PageRequest.of(
                pageable.getPageNumber(),
                pageable.getPageSize(),
                Sort.by(Sort.Direction.DESC, "checkedAt")
        );
        return checkLogRepository.findByMonitorIdPaged(monitorId, sorted)
                .map(CheckLogResponse::from);
    }
}