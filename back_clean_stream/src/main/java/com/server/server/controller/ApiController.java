package com.server.server.controller;

import com.server.server.service.FastAPIService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Simple controller for basic API endpoints.
 */
@Slf4j
@RestController
public class ApiController {

    private final FastAPIService fastAPIService;

    public ApiController(FastAPIService fastAPIService) {
        this.fastAPIService = fastAPIService;
    }

    /**
     * Process a dataset.
     * 
     * Request body:
     * {
     *   "datasetId": "550e8400-e29b-41d4-a716-446655440000",
     *   "tenantId": "tenant-123"
     * }
     */
    @PostMapping("/api/process-dataset")
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
            
            log.info("Starting dataset processing: datasetId={}, tenantId={}", datasetIdStr, tenantId);
            
            return ResponseEntity.ok(new HashMap<String, Object>() {{
                put("datasetId", datasetIdStr);
                put("tenantId", tenantId);
                put("status", "processing");
                put("message", "Dataset processing started");
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
