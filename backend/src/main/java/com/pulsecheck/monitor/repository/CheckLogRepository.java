package com.pulsecheck.monitor.repository;

import com.pulsecheck.monitor.entity.CheckLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CheckLogRepository extends JpaRepository<CheckLog, UUID> {
    List<CheckLog> findByMonitorIdOrderByCheckedAtDesc(UUID monitorId);
}