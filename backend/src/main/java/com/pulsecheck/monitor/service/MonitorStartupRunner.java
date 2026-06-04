package com.pulsecheck.monitor.service;

import com.pulsecheck.monitor.entity.Monitor;
import com.pulsecheck.monitor.repository.MonitorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class MonitorStartupRunner implements ApplicationRunner {

    private final MonitorRepository monitorRepository;
    private final MonitorSchedulerService schedulerService;

    @Override
    public void run(ApplicationArguments args) {
        List<Monitor> enabled = monitorRepository.findByEnabled(true);
        log.info("[Startup] {} enabled monitor(s) found, loading into Quartz...", enabled.size());

        int scheduled = 0;
        for (Monitor monitor : enabled) {
            try {
                schedulerService.scheduleMonitor(monitor);
                scheduled++;
            } catch (Exception e) {
                log.error("[Startup] Failed to schedule monitor '{}': {}", monitor.getName(), e.getMessage());
            }
        }

        log.info("[Startup] Quartz scheduling complete: {}/{} monitors loaded.", scheduled, enabled.size());
    }
}