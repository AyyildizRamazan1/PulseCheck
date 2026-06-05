package com.pulsecheck.monitor.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.pulsecheck.auth.entity.User;
import com.pulsecheck.common.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.hibernate.validator.constraints.URL;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Duration;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "monitors")
public class Monitor extends BaseEntity {

    @NotBlank(message = "Monitor name is required")
    @Size(max = 100, message = "Monitor name must not exceed 100 characters")
    @Column(nullable = false, length = 100)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @NotBlank(message = "URL is required")
    @URL(message = "Invalid URL format")
    @Column(nullable = false, length = 500)
    private String url;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    @Builder.Default
    private MonitorType type = MonitorType.HTTP;

    @JdbcTypeCode(SqlTypes.JSON)
    private Map<String, String> headers;

    @Column(columnDefinition = "TEXT")
    private String body;

    @Column(name = "expected_status_code")
    @Builder.Default
    private Integer expectedStatusCode = 200;

    @Column(name = "timeout_seconds")
    @Builder.Default
    private Integer timeoutSeconds = 30;

    @Column(name = "check_interval_seconds")
    @Builder.Default
    private Integer checkIntervalSeconds = 60;

    @Column(nullable = false)
    @Builder.Default
    private Boolean enabled = true;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    public enum MonitorType {
        HTTP, HTTPS, DNS, SSL, TCP, PING
    }

    public Duration getTimeoutDuration() {
        return Duration.ofSeconds(timeoutSeconds != null ? timeoutSeconds : 30);
    }

    public Duration getCheckIntervalDuration() {
        return Duration.ofSeconds(checkIntervalSeconds != null ? checkIntervalSeconds : 60);
    }
}
