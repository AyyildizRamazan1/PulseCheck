package com.pulsecheck.monitor.dto;

import com.pulsecheck.monitor.entity.CheckLog;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class CheckLogResponse {

    private UUID id;
    private UUID monitorId;
    private CheckLog.CheckStatus status;
    private Integer responseTimeMilliseconds;
    private Integer statusCode;
    private String errorMessage;
    private LocalDateTime checkedAt;
    private LocalDateTime createdAt;

    public static CheckLogResponse from(CheckLog log) {
        return CheckLogResponse.builder()
                .id(log.getId())
                .monitorId(log.getMonitor().getId())
                .status(log.getStatus())
                .responseTimeMilliseconds(log.getResponseTimeMilliseconds())
                .statusCode(log.getStatusCode())
                .errorMessage(log.getErrorMessage())
                .checkedAt(log.getCheckedAt())
                .createdAt(log.getCreatedAt())
                .build();
    }
}