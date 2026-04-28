package com.server.server.repository;

import com.server.server.model.CleaningResult;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.UUID;

@Repository
public interface CleaningResultRepository extends JpaRepository<CleaningResult, Integer> {

    Page<CleaningResult> findByTenantId(String tenantId, Pageable pageable);

    Page<CleaningResult> findByTenantIdAndDatasetId(String tenantId, UUID datasetId, Pageable pageable);

    Page<CleaningResult> findByTenantIdAndStatus(String tenantId, String status, Pageable pageable);

    long countByTenantId(String tenantId);

    long countByTenantIdAndStatus(String tenantId, String status);

    long countByTenantIdAndDatasetId(String tenantId, UUID datasetId);

@Query("""
    SELECT c FROM CleaningResult c
    WHERE c.tenantId = :tenantId

    AND (:datasetId IS NULL OR c.datasetId = :datasetId)
    AND (:status IS NULL OR c.status = :status)

    AND c.createdAt >= COALESCE(:startDate, c.createdAt)
    AND c.createdAt <= COALESCE(:endDate, c.createdAt)

    ORDER BY c.createdAt DESC
""")
Page<CleaningResult> findByFilters(
        @Param("tenantId") String tenantId,
        @Param("datasetId") UUID datasetId,
        @Param("status") String status,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate,
        Pageable pageable
);
}