package com.server.server.controller;

import com.server.server.service.DatasetProgressService;
import com.server.server.service.WebSocketBroadcastService;
import com.server.server.dto.DatasetProgressDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.fasterxml.jackson.databind.JsonNode;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/dataset-processing")
public class DatasetProcessingController {
    
    private final DatasetProgressService progressService;
    private final WebSocketBroadcastService broadcastService;
    
    public DatasetProcessingController(
        DatasetProgressService progressService,
        WebSocketBroadcastService broadcastService) {
        this.progressService = progressService;
        this.broadcastService = broadcastService;
    }
    
    /**
     * Callback endpoint that receives cleaned rows from FastAPI
     * FastAPI calls this after cleaning each row
     * 
     * Request body:
     * {
     *   "tenantId": "tenant-123",
     *   "datasetId": "550e8400-e29b-41d4-a716-446655440000",
     *   "rowIndex": 0,
     *   "cleanedRow": {...},
     *   "confidence": 0.94
     * }
     */
    @PostMapping("/row-processed")
    public ResponseEntity<?> onRowProcessed(@RequestBody Map<String, Object> payload) {
        try {
            String tenantId = (String) payload.get("tenantId");
            String datasetIdStr = (String) payload.get("datasetId");
            Integer rowIndex = ((Number) payload.get("rowIndex")).intValue();
            Map<String, Object> cleanedRow = (Map<String, Object>) payload.get("cleanedRow");
            Double confidence = 0.0;
            
            if (payload.get("confidence") != null) {
                Object confObj = payload.get("confidence");
                if (confObj instanceof Number) {
                    confidence = ((Number) confObj).doubleValue();
                }
            }
            
            UUID datasetId = UUID.fromString(datasetIdStr);
            
            log.info("Received row processed callback - tenant: {}, dataset: {}, rowIndex: {}",
                tenantId, datasetId, rowIndex);
            
            // Update dataset progress
            DatasetProgressDto progress = progressService.updateRowProgress(datasetId, true);
            
            // Broadcast cleaned row to WebSocket clients
            broadcastService.broadcastCleanedRow(datasetIdStr, rowIndex, cleanedRow, confidence);
            
            // Broadcast progress update
            broadcastService.broadcastProgress(
                datasetIdStr,
                progress.getProcessedRows(),
                progress.getTotalRows(),
                progress.getFailedRows()
            );
            
            // If dataset is completed, broadcast completion message
            if ("completed".equals(progress.getStatus())) {
                broadcastService.broadcastCompletion(
                    datasetIdStr,
                    progress.getProcessedRows(),
                    progress.getFailedRows(),
                    progress.getTotalRows()
                );
            }
            
            return ResponseEntity.ok(new HashMap<String, Object>() {{
                put("success", true);
                put("message", "Row processed and broadcasted");
                put("progress", progress.getProgressPercentage());
            }});
            
        } catch (IllegalArgumentException e) {
            log.error("Invalid dataset ID: {}", e.getMessage());
            return ResponseEntity.badRequest()
                .body(new HashMap<String, Object>() {{
                    put("success", false);
                    put("error", "Invalid dataset ID: " + e.getMessage());
                }});
        } catch (Exception e) {
            log.error("Error processing row callback: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new HashMap<String, Object>() {{
                    put("success", false);
                    put("error", "Error processing row: " + e.getMessage());
                }});
        }
    }
    
    /**
     * Callback endpoint that receives error notifications from FastAPI
     * 
     * Request body:
     * {
     *   "tenantId": "tenant-123",
     *   "datasetId": "550e8400-e29b-41d4-a716-446655440000",
     *   "rowIndex": 5,
     *   "error": "Error message"
     * }
     */
    @PostMapping("/row-error")
    public ResponseEntity<?> onRowError(@RequestBody Map<String, Object> payload) {
        try {
            String tenantId = (String) payload.get("tenantId");
            String datasetIdStr = (String) payload.get("datasetId");
            Integer rowIndex = ((Number) payload.get("rowIndex")).intValue();
            String error = (String) payload.get("error");
            
            UUID datasetId = UUID.fromString(datasetIdStr);
            
            log.error("Received row error callback - tenant: {}, dataset: {}, rowIndex: {}, error: {}",
                tenantId, datasetId, rowIndex, error);
            
            // Update dataset progress (mark as failed)
            DatasetProgressDto progress = progressService.updateRowProgress(datasetId, false);
            
            // Broadcast error to WebSocket clients
            broadcastService.broadcastError(datasetIdStr, rowIndex, error);
            
            // Broadcast progress update
            broadcastService.broadcastProgress(
                datasetIdStr,
                progress.getProcessedRows(),
                progress.getTotalRows(),
                progress.getFailedRows()
            );
            
            return ResponseEntity.ok(new HashMap<String, Object>() {{
                put("success", true);
                put("message", "Row error processed and broadcasted");
            }});
            
        } catch (Exception e) {
            log.error("Error processing row error callback: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new HashMap<String, Object>() {{
                    put("success", false);
                    put("error", "Error processing row error: " + e.getMessage());
                }});
        }
    }
    
    /**
     * Endpoint for Frontend to initialize dataset processing
     * 
     * Returns the current progress status
     */
    @GetMapping("/progress/{datasetId}")
    public ResponseEntity<?> getDatasetProgress(
        @PathVariable String datasetId,
        @RequestParam(required = false) String tenantId) {
        try {
            UUID id = UUID.fromString(datasetId);
            DatasetProgressDto progress;
            
            if (tenantId != null && !tenantId.isEmpty()) {
                progress = progressService.getProgress(tenantId, id);
            } else {
                progress = progressService.getProgress(id);
            }
            
            return ResponseEntity.ok(progress);
            
        } catch (IllegalArgumentException e) {
            log.error("Progress not found: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }
}
