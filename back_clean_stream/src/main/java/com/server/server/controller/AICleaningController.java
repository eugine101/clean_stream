package com.server.server.controller;

import com.server.server.service.FastAPIService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Controller for AI-powered data cleaning operations.
 * Integrates with FastAPI AI Engine.
 */
@Slf4j
@RestController
@RequestMapping("/api/ai-cleaning")
public class AICleaningController {

    private final FastAPIService fastAPIService;

    public AICleaningController(FastAPIService fastAPIService) {
        this.fastAPIService = fastAPIService;
    }

    /**
     * Process a single data row through AI cleaning engine.
     *
     * Request body:
     * {
     *   "tenantId": "tenant-123",
     *   "datasetId": "550e8400-e29b-41d4-a716-446655440000",
     *   "row": {
     *     "name": "John Do",
     *     "email": "john.example.com",
     *     "age": "invalid"
     *   }
     * }
     *
     * Response:
     * {
     *   "tenantId": "tenant-123",
     *   "datasetId": "550e8400-e29b-41d4-a716-446655440000",
     *   "result": {
     *     "id": 1,
     *     "status": "processed",
     *     "suggestion": {
     *       "field": "email",
     *       "issue_type": "invalid_format",
     *       "suggested_fix": "Add @ symbol and valid domain",
     *       "confidence": 0.95
     *     }
     *   }
     * }
     */
    @PostMapping("/process-row")
    public ResponseEntity<?> processRow(@RequestBody Map<String, Object> request) {
        try {
            log.info("Received AI cleaning request");

            String tenantId = (String) request.get("tenantId");
            String datasetId = (String) request.get("datasetId");
            Map<String, Object> row = (Map<String, Object>) request.get("row");

            // Validate inputs
            if (tenantId == null || tenantId.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(new ErrorResponse("tenantId is required"));
            }

            if (datasetId == null || datasetId.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(new ErrorResponse("datasetId is required"));
            }

            if (row == null || row.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(new ErrorResponse("row data is required"));
            }

            // Call FastAPI service
            Map<String, Object> result = fastAPIService.processRow(tenantId, datasetId, row);

            log.info("AI cleaning result: {}", result);
            return ResponseEntity.ok(result);

        } catch (Exception e) {
            log.error("Error processing row: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Error processing row: " + e.getMessage()));
        }
    }

    /**
     * Process multiple rows in a batch.
     * Each row is processed individually through the AI engine.
     *
     * Request body:
     * {
     *   "tenantId": "tenant-123",
     *   "datasetId": "550e8400-e29b-41d4-a716-446655440000",
     *   "rows": [
     *     {"name": "John Do", "email": "john.example.com"},
     *     {"name": "Jane Smith", "email": "jane@example.com"}
     *   ]
     * }
     */
    @PostMapping("/process-batch")
    public ResponseEntity<?> processBatch(@RequestBody Map<String, Object> request) {
        try {
            log.info("Received batch AI cleaning request");

            String tenantId = (String) request.get("tenantId");
            String datasetId = (String) request.get("datasetId");
            java.util.List<Map<String, Object>> rows = (java.util.List<Map<String, Object>>) request.get("rows");

            if (tenantId == null || tenantId.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(new ErrorResponse("tenantId is required"));
            }

            if (datasetId == null || datasetId.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(new ErrorResponse("datasetId is required"));
            }

            if (rows == null || rows.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(new ErrorResponse("rows array is required"));
            }

            // Process each row
            java.util.List<Map<String, Object>> results = new java.util.ArrayList<>();
            int processedCount = 0;
            int errorCount = 0;

            for (Map<String, Object> row : rows) {
                try {
                    Map<String, Object> result = fastAPIService.processRow(tenantId, datasetId, row);
                    results.add(result);
                    processedCount++;
                } catch (Exception e) {
                    log.warn("Error processing individual row: {}", e.getMessage());
                    errorCount++;
                    // Continue processing other rows
                }
            }

            log.info("Batch processing complete: {} successful, {} failed", processedCount, errorCount);

            Map<String, Object> response = new HashMap<>();
            response.put("tenantId", tenantId);
            response.put("datasetId", datasetId);
            response.put("totalRows", rows.size());
            response.put("processedCount", processedCount);
            response.put("errorCount", errorCount);
            response.put("results", results);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error processing batch: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Error processing batch: " + e.getMessage()));
        }
    }

    /**
     * Check if FastAPI service is healthy
     */
    @GetMapping("/health")
    public ResponseEntity<?> healthCheck() {
        try {
            boolean healthy = fastAPIService.isHealthy();

            if (healthy) {
                return ResponseEntity.ok(new HashMap<String, String>() {{
                    put("status", "healthy");
                    put("fastApiUrl", fastAPIService.getFastApiBaseUrl());
                }});
            } else {
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                        .body(new ErrorResponse("FastAPI service is not responding"));
            }

        } catch (Exception e) {
            log.error("Health check failed: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(new ErrorResponse("AI service health check failed: " + e.getMessage()));
        }
    }

    /**
     * Get FastAPI service information
     */
    @GetMapping("/info")
    public ResponseEntity<?> getServiceInfo() {
        try {
            Map<String, Object> info = fastAPIService.getApiInfo();
            return ResponseEntity.ok(info);
        } catch (Exception e) {
            log.error("Error getting service info: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Error getting service info: " + e.getMessage()));
        }
    }

    /**
     * Error response DTO
     */
    @lombok.Data
    @lombok.AllArgsConstructor
    @lombok.NoArgsConstructor
    public static class ErrorResponse {
        private String error;
        private String timestamp = java.time.LocalDateTime.now().toString();

        public ErrorResponse(String error) {
            this.error = error;
        }
    }
}
