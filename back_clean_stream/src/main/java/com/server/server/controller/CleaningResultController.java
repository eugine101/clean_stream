package com.server.server.controller;

import com.server.server.model.CleaningResult;
import com.server.server.service.CleaningResultService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/cleaning-results")
@RequiredArgsConstructor
public class CleaningResultController {

    private final CleaningResultService service;

    private String getTenantId(Authentication auth) {
        if (auth == null) {
            log.warn("Authentication is null");
            return null;
        }
        
        Object principal = auth.getPrincipal();
        log.debug("Principal: {}, Type: {}", principal, principal != null ? principal.getClass().getName() : "null");
        
        if (principal != null && principal instanceof String) {
            String principalStr = (String) principal;
            if (principalStr.contains("|")) {
                String[] parts = principalStr.split("\\|");
                if (parts.length >= 2) {
                    return parts[1];
                }
            }
        }
        
        // Alternative: try to get from auth details
        if (auth.getDetails() instanceof Map) {
            Map<String, Object> details = (Map<String, Object>) auth.getDetails();
            return (String) details.get("tenantId");
        }
        
        return null;
    }

    @GetMapping
    public ResponseEntity<?> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) UUID datasetId,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            Authentication auth) {

        String tenantId = getTenantId(auth);
        if (tenantId == null) {
            log.warn("Missing tenant ID in authentication");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Missing tenant ID", "status", "UNAUTHORIZED"));
        }

        log.info("Fetching cleaning results for tenant: {}, page: {}, size: {}", tenantId, page, size);
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        Page<CleaningResult> results =
                service.getCleaningResults(tenantId, datasetId, status, startDate, endDate, pageable);

        return ResponseEntity.ok(Map.of(
                "page", page,
                "size", size,
                "total", results.getTotalElements(),
                "totalPages", results.getTotalPages(),
                "content", results.getContent(),
                "status", "SUCCESS"
        ));
    }

    @GetMapping("/stats")
    public ResponseEntity<?> stats(Authentication auth) {
        String tenantId = getTenantId(auth);
        if (tenantId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Missing tenant ID", "status", "UNAUTHORIZED"));
        }
        
        log.info("Fetching statistics for tenant: {}", tenantId);
        return ResponseEntity.ok(service.getTenantStatistics(tenantId));
    }

    @GetMapping("/dataset/{datasetId}/stats")
    public ResponseEntity<?> datasetStats(@PathVariable UUID datasetId, Authentication auth) {
        String tenantId = getTenantId(auth);
        if (tenantId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Missing tenant ID", "status", "UNAUTHORIZED"));
        }
        
        log.info("Fetching dataset statistics for tenant: {}, dataset: {}", tenantId, datasetId);
        return ResponseEntity.ok(service.getDatasetStatistics(tenantId, datasetId));
    }
}