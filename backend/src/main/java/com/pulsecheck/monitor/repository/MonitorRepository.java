package com.pulsecheck.monitor.repository;

import com.pulsecheck.monitor.entity.Monitor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MonitorRepository extends JpaRepository<Monitor, UUID> {
    
    Page<Monitor> findByUserId(UUID userId, Pageable pageable);
    
    List<Monitor> findByUserIdAndEnabled(UUID userId, Boolean enabled);
    
    List<Monitor> findByEnabled(Boolean enabled);
    
    @Query("SELECT m FROM Monitor m JOIN FETCH m.user WHERE m.id = :id")
    Optional<Monitor> findByIdWithUser(@Param("id") UUID id);
    
    @Query("SELECT m FROM Monitor m LEFT JOIN FETCH m.user WHERE m.user.id = :userId")
    List<Monitor> findByUserIdWithUser(@Param("userId") UUID userId);
}
