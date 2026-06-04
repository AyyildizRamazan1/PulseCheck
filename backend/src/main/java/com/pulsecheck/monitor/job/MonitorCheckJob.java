package com.pulsecheck.monitor.job;

import com.pulsecheck.monitor.entity.CheckLog;
import com.pulsecheck.monitor.entity.Monitor;
import com.pulsecheck.monitor.repository.CheckLogRepository;
import com.pulsecheck.monitor.repository.MonitorRepository;
import lombok.extern.slf4j.Slf4j;
import org.quartz.Job;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.net.SocketTimeoutException;
import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
public class MonitorCheckJob implements Job {

    @Autowired
    private MonitorRepository monitorRepository;

    @Autowired
    private CheckLogRepository checkLogRepository;

    @Override
    public void execute(JobExecutionContext context) throws JobExecutionException {
        String monitorIdStr = context.getJobDetail().getJobDataMap().getString("monitorId");
        UUID monitorId = UUID.fromString(monitorIdStr);

        Monitor monitor = monitorRepository.findById(monitorId).orElse(null);
        if (monitor == null || !Boolean.TRUE.equals(monitor.getEnabled())) {
            log.warn("[MonitorCheckJob] Monitor {} not found or disabled, skipping", monitorIdStr);
            return;
        }

        log.info("[MonitorCheckJob] Pinging '{}' -> {}", monitor.getName(), monitor.getUrl());

        int timeoutMs = (monitor.getTimeoutSeconds() != null ? monitor.getTimeoutSeconds() : 30) * 1000;
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(timeoutMs);
        factory.setReadTimeout(timeoutMs);
        RestTemplate restTemplate = new RestTemplate(factory);

        CheckLog.CheckStatus status;
        Integer statusCode = null;
        String errorMessage = null;
        long start = System.currentTimeMillis();

        try {
            ResponseEntity<String> response = restTemplate.getForEntity(monitor.getUrl(), String.class);
            long responseTime = System.currentTimeMillis() - start;
            statusCode = response.getStatusCode().value();
            int expected = monitor.getExpectedStatusCode() != null ? monitor.getExpectedStatusCode() : 200;

            if (statusCode == expected) {
                status = CheckLog.CheckStatus.UP;
            } else {
                status = CheckLog.CheckStatus.DOWN;
                errorMessage = "Expected " + expected + " but got " + statusCode;
            }

            log.info("[MonitorCheckJob] '{}' -> status={}, httpCode={}, responseTime={}ms",
                    monitor.getName(), status, statusCode, responseTime);

            saveCheckLog(monitor, status, statusCode, (int) responseTime, errorMessage);

        } catch (ResourceAccessException e) {
            long responseTime = System.currentTimeMillis() - start;
            if (e.getCause() instanceof SocketTimeoutException) {
                status = CheckLog.CheckStatus.TIMEOUT;
                errorMessage = "Request timed out after " + monitor.getTimeoutSeconds() + "s";
            } else {
                status = CheckLog.CheckStatus.ERROR;
                errorMessage = e.getMessage();
            }
            log.warn("[MonitorCheckJob] '{}' -> status={}, error={}", monitor.getName(), status, errorMessage);
            saveCheckLog(monitor, status, null, (int) responseTime, errorMessage);

        } catch (Exception e) {
            long responseTime = System.currentTimeMillis() - start;
            errorMessage = e.getMessage();
            log.error("[MonitorCheckJob] '{}' -> UNEXPECTED ERROR: {}", monitor.getName(), errorMessage);
            saveCheckLog(monitor, CheckLog.CheckStatus.ERROR, null, (int) responseTime, errorMessage);
        }
    }

    private void saveCheckLog(Monitor monitor, CheckLog.CheckStatus status,
                              Integer statusCode, int responseTimeMs, String errorMessage) {
        CheckLog log = CheckLog.builder()
                .monitor(monitor)
                .status(status)
                .statusCode(statusCode)
                .responseTimeMilliseconds(responseTimeMs)
                .errorMessage(errorMessage)
                .checkedAt(LocalDateTime.now())
                .build();
        checkLogRepository.save(log);
    }
}