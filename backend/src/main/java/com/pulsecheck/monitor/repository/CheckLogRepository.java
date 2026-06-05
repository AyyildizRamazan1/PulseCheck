package com.pulsecheck.monitor.repository;

import com.pulsecheck.monitor.entity.CheckLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CheckLogRepository extends JpaRepository<CheckLog, UUID> {

    List<CheckLog> findByMonitorIdOrderByCheckedAtDesc(UUID monitorId);

    @Query("SELECT cl FROM CheckLog cl WHERE cl.monitor.id = :monitorId")
    Page<CheckLog> findByMonitorIdPaged(@Param("monitorId") UUID monitorId, Pageable pageable);
}