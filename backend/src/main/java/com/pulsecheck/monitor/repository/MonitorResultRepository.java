package com.pulsecheck.monitor.repository;

import com.pulsecheck.monitor.entity.Monitor;
import com.pulsecheck.monitor.entity.MonitorResult;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface MonitorResultRepository extends JpaRepository<MonitorResult, UUID> {
    
    Page<MonitorResult> findByMonitorId(UUID monitorId, Pageable pageable);
    
    List<MonitorResult> findByMonitorIdOrderByCheckedAtDesc(UUID monitorId, Pageable pageable);
    
    @Query("SELECT mr FROM MonitorResult mr WHERE mr.monitor.id = :monitorId AND mr.checkedAt >= :since ORDER BY mr.checkedAt DESC")
    List<MonitorResult> findByMonitorIdSince(@Param("monitorId") UUID monitorId, @Param("since") LocalDateTime since);
    
    @Query("SELECT mr FROM MonitorResult mr WHERE mr.monitor.id = :monitorId ORDER BY mr.checkedAt DESC")
    List<MonitorResult> findLatestByMonitorId(@Param("monitorId") UUID monitorId, Pageable pageable);
    
    @Query("SELECT COUNT(mr) FROM MonitorResult mr WHERE mr.monitor.id = :monitorId AND mr.status = :status AND mr.checkedAt >= :since")
    Long countByMonitorIdAndStatusSince(@Param("monitorId") UUID monitorId, @Param("status") MonitorResult.MonitorStatus status, @Param("since") LocalDateTime since);
}
