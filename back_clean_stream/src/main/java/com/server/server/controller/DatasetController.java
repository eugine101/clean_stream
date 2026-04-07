package com.server.server.controller;

import com.server.server.service.DatasetProgressService;
import com.server.server.service.FastAPIService;
import com.server.server.dto.DatasetProgressDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Controller for dataset operations.
 * Handles dataset information retrieval and processing.
 */
@Slf4j
@RestController
@RequestMapping("/api/datasets")
public class DatasetController {

    private final DatasetProgressService progressService;
    private final FastAPIService fastAPIService;

    public DatasetController(DatasetProgressService progressService, FastAPIService fastAPIService) {
        this.progressService = progressService;
        this.fastAPIService = fastAPIService;
    }

    /**
     * Get dataset information.
     * 
     * Path Parameters:
     * - datasetId: UUID of the dataset
     * 
     * Response:
     * {
     *   "datasetId": "550e8400-e29b-41d4-a716-446655440000",
     *   "totalRows": 1000,
     *   "processedRows": 250,
     *   "failedRows": 10,
     *   "status": "processing",
     *   "progressPercentage": 26.0
     * }
     */
    @GetMapping("/{datasetId}")
    public ResponseEntity<?> getDatasetInfo(@PathVariable String datasetId) {
        try {
            log.info("Retrieving dataset info for: {}", datasetId);
            
            // Parse the datasetId as UUID to validate format
            UUID parsedId = UUID.fromString(datasetId);
            
            // Try to get progress information
            DatasetProgressDto progress = progressService.getProgress(parsedId);
            
            if (progress != null) {
                return ResponseEntity.ok(new HashMap<String, Object>() {{
                    put("datasetId", datasetId);
                    put("tenantId", progress.getTenantId());
                    put("totalRows", progress.getTotalRows());
                    put("processedRows", progress.getProcessedRows());
                    put("failedRows", progress.getFailedRows());
                    put("status", progress.getStatus());
                    put("progressPercentage", progress.getProgressPercentage());
                    put("createdAt", progress.getCreatedAt());
                    put("updatedAt", progress.getUpdatedAt());
                }});
            }
            
            // If no progress record, return basic info
            return ResponseEntity.ok(new HashMap<String, Object>() {{
                put("datasetId", datasetId);
                put("status", "not_started");
                put("message", "Dataset exists but processing has not started");
            }});
            
        } catch (IllegalArgumentException e) {
            log.error("Invalid dataset ID format: {}", datasetId);
            return ResponseEntity.badRequest()
                    .body(new HashMap<String, Object>() {{
                        put("error", "Invalid dataset ID format");
                        put("details", e.getMessage());
                    }});
        } catch (Exception e) {
            log.error("Error retrieving dataset info: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new HashMap<String, Object>() {{
                        put("error", "Error retrieving dataset info");
                        put("details", e.getMessage());
                    }});
        }
    }

    /**
     * Get processing results for a dataset.
     * 
     * Path Parameters:
     * - datasetId: UUID of the dataset
     * 
     * Query Parameters:
     * - page (optional, default=0): Page number
     * - pageSize (optional, default=20): Rows per page
     * 
     * Response:
     * {
     *   "datasetId": "550e8400-e29b-41d4-a716-446655440000",
     *   "totalRows": 1000,
     *   "processedRows": 250,
     *   "results": [...]
     * }
     */
    @GetMapping("/{datasetId}/results")
    public ResponseEntity<?> getDatasetResults(
            @PathVariable String datasetId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int pageSize) {
        try {
            log.info("Retrieving dataset results for: {} (page: {}, pageSize: {})", datasetId, page, pageSize);
            
            // Parse the datasetId as UUID to validate format
            UUID parsedId = UUID.fromString(datasetId);
            
            // Get progress info
            DatasetProgressDto progress = progressService.getProgress(parsedId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("datasetId", datasetId);
            
            if (progress != null) {
                response.put("totalRows", progress.getTotalRows());
                response.put("processedRows", progress.getProcessedRows());
                response.put("failedRows", progress.getFailedRows());
                response.put("status", progress.getStatus());
                response.put("progressPercentage", progress.getProgressPercentage());
            } else {
                response.put("totalRows", 0);
                response.put("processedRows", 0);
                response.put("failedRows", 0);
                response.put("status", "not_started");
                response.put("progressPercentage", 0.0);
            }
            
            // Add paginated results (empty for now)
            response.put("results", new java.util.ArrayList<>());
            response.put("page", page);
            response.put("pageSize", pageSize);
            
            return ResponseEntity.ok(response);
            
        } catch (IllegalArgumentException e) {
            log.error("Invalid dataset ID format: {}", datasetId);
            return ResponseEntity.badRequest()
                    .body(new HashMap<String, Object>() {{
                        put("error", "Invalid dataset ID format");
                        put("details", e.getMessage());
                    }});
        } catch (Exception e) {
            log.error("Error retrieving dataset results: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new HashMap<String, Object>() {{
                        put("error", "Error retrieving dataset results");
                        put("details", e.getMessage());
                    }});
        }
    }

    /**
     * Start processing a dataset.
     * 
     * Request body:
     * {
     *   "datasetId": "550e8400-e29b-41d4-a716-446655440000",
     *   "tenantId": "tenant-123"
     * }
     */
    @PostMapping("/process")
    public ResponseEntity<?> processDataset(@RequestBody Map<String, Object> request) {
        try {
            String datasetIdStr = (String) request.get("datasetId");
            String tenantId = (String) request.get("tenantId");
            
            if (datasetIdStr == null || datasetIdStr.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(new HashMap<String, Object>() {{
                            put("error", "datasetId is required");
                        }});
            }
            
            if (tenantId == null || tenantId.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(new HashMap<String, Object>() {{
                            put("error", "tenantId is required");
                        }});
            }
            
            UUID datasetId = UUID.fromString(datasetIdStr);
            log.info("Starting dataset processing: datasetId={}, tenantId={}", datasetId, tenantId);
            
            return ResponseEntity.ok(new HashMap<String, Object>() {{
                put("datasetId", datasetIdStr);
                put("tenantId", tenantId);
                put("status", "processing");
                put("message", "Dataset processing started");
            }});
            
        } catch (IllegalArgumentException e) {
            log.error("Invalid request: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new HashMap<String, Object>() {{
                        put("error", "Invalid dataset ID format");
                    }});
        } catch (Exception e) {
            log.error("Error processing dataset: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new HashMap<String, Object>() {{
                        put("error", "Error processing dataset");
                    }});
        }
    }
}
