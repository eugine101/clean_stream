package com.server.server.service;

import com.server.server.model.CleaningResult;
import com.server.server.repository.CleaningResultRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class CleaningResultService {

    private final CleaningResultRepository repository;

    public Page<CleaningResult> getCleaningResults(
            String tenantId,
            UUID datasetId,
            String status,
            LocalDateTime startDate,
            LocalDateTime endDate,
            Pageable pageable) {

        return repository.findByFilters(
                tenantId, datasetId, status, startDate, endDate, pageable);
    }

    public Page<CleaningResult> getDatasetResults(String tenantId, UUID datasetId, Pageable pageable) {
        return repository.findByTenantIdAndDatasetId(tenantId, datasetId, pageable);
    }

    public Page<CleaningResult> getResultsByStatus(String tenantId, String status, Pageable pageable) {
        return repository.findByTenantIdAndStatus(tenantId, status, pageable);
    }

    public Map<String, Object> getTenantStatistics(String tenantId) {

        long total = repository.countByTenantId(tenantId);
        long processed = repository.countByTenantIdAndStatus(tenantId, "processed");
        long failed = repository.countByTenantIdAndStatus(tenantId, "failed");
        long pending = repository.countByTenantIdAndStatus(tenantId, "pending");

        return Map.of(
                "tenantId", tenantId,
                "total", total,
                "processed", processed,
                "failed", failed,
                "pending", pending,
                "successRate", total == 0 ? 0 : (processed * 100.0 / total)
        );
    }

    public Map<String, Object> getDatasetStatistics(String tenantId, UUID datasetId) {

        long total = repository.countByTenantIdAndDatasetId(tenantId, datasetId);

        long processed = repository.findByTenantIdAndDatasetId(tenantId, datasetId, Pageable.unpaged())
                .getContent()
                .stream()
                .filter(r -> "processed".equals(r.getStatus()))
                .count();

        return Map.of(
                "tenantId", tenantId,
                "datasetId", datasetId,
                "total", total,
                "processed", processed,
                "pending", total - processed
        );
    }

    public CleaningResult save(CleaningResult result) {
        return repository.save(result);
    }
}