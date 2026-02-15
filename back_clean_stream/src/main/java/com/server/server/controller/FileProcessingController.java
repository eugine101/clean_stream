package com.server.server.controller;

import com.server.server.service.FastAPIService;
import com.server.server.service.FileParsingService;
import com.server.server.service.FileProcessingJobService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;

/**
 * Controller for processing uploaded files (CSV/JSON) with AI cleaning engine.
 * Accepts files, parses them into rows, and processes each row through FastAPI.
 */
@Slf4j
@RestController
@RequestMapping("/api/process-file")
public class FileProcessingController {

    private final FileParsingService fileParsingService;
    private final FastAPIService fastAPIService;
    private final FileProcessingJobService jobService;

    public FileProcessingController(
            FileParsingService fileParsingService,
            FastAPIService fastAPIService,
            FileProcessingJobService jobService) {
        this.fileParsingService = fileParsingService;
        this.fastAPIService = fastAPIService;
        this.jobService = jobService;
    }

    /**
     * Upload and process a file (CSV or JSON) with AI cleaning.
     * This endpoint returns immediately with a job ID.
     * Processing happens in the background asynchronously.
     *
     * Request: Multipart file upload with required parameters
     * - file: The CSV or JSON file to process
     * - tenantId: Tenant identifier for multi-tenant isolation
     * - datasetId: UUID of the dataset
     *
     * Response:
     * {
     *   "success": true,
     *   "jobId": "550e8400-e29b-41d4-a716-446655440000",
     *   "message": "File upload started. Check status with /api/process-file/status/{jobId}"
     * }
     */
    @PostMapping("/upload-and-process")
    public ResponseEntity<?> uploadAndProcessFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "tenantId", required = false) String tenantId,
            @RequestParam(value = "datasetId", required = false) String datasetId) {
        try {
            // Use defaults if not provided
            if (tenantId == null || tenantId.isEmpty()) {
                tenantId = "default-tenant";
            }
            // Always generate a fresh UUID for datasetId (ignore frontend value)
            datasetId = UUID.randomUUID().toString();

            log.info("Received file upload request: filename={}, tenantId={}, datasetId={}, size={}", 
                file.getOriginalFilename(), tenantId, datasetId, file.getSize());

            // Validate file
            if (file == null || file.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(new ErrorResponse("file is required"));
            }

            // Check file size (100MB limit)
            if (file.getSize() > 104857600) {
                return ResponseEntity.badRequest()
                        .body(new ErrorResponse("File size exceeds 100MB limit"));
            }

            // Get file type from filename
            String filename = file.getOriginalFilename();
            String fileType = fileParsingService.detectFileType(filename);

            // Parse file into rows to count total
            byte[] fileContent = file.getBytes();
            List<Map<String, Object>> rows = fileParsingService.parseFile(fileContent, fileType);

            if (rows == null || rows.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(new ErrorResponse("File contains no data rows"));
            }

            // Create job and return immediately
            String jobId = jobService.createJob(filename, rows.size());
            
            // Process file asynchronously in background
            processFileAsync(jobId, tenantId, datasetId, rows);

            log.info("File upload accepted with jobId: {}", jobId);

            return ResponseEntity.ok(new HashMap<String, Object>() {{
                put("success", true);
                put("jobId", jobId);
                put("filename", filename);
                put("totalRows", rows.size());
                put("message", "File upload started. Check status with /api/process-file/status/" + jobId);
            }});

        } catch (IllegalArgumentException e) {
            log.error("Invalid input: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse(e.getMessage()));

        } catch (Exception e) {
            log.error("Error uploading file: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Error uploading file: " + e.getMessage()));
        }
    }

    /**
     * Get the status of a file processing job
     *
     * Response:
     * {
     *   "jobId": "550e8400-e29b-41d4-a716-446655440000",
     *   "filename": "data.csv",
     *   "status": "PROCESSING",
     *   "progress": 45,
     *   "totalRows": 1000,
     *   "processedRows": 450,
     *   "failedRows": 5,
     *   "results": [...] (only when status is COMPLETED)
     * }
     */
    @GetMapping("/status/{jobId}")
    public ResponseEntity<?> getJobStatus(@PathVariable String jobId) {
        try {
            FileProcessingJobService.FileProcessingJob job = jobService.getJob(jobId);
            
            if (job == null) {
                return ResponseEntity.notFound().build();
            }

            Map<String, Object> response = new HashMap<String, Object>() {{
                put("jobId", job.getJobId());
                put("filename", job.getFilename());
                put("status", job.getStatus());
                put("progress", job.getProgress());
                put("totalRows", job.getTotalRows());
                put("processedRows", job.getProcessedRows());
                put("failedRows", job.getFailedRows());
                put("startTime", job.getStartTime());
                put("endTime", job.getEndTime());
                put("lastUpdated", job.getLastUpdated());
            }};

            // Include results only when job is completed
            if ("COMPLETED".equals(job.getStatus())) {
                response.put("results", job.getResults());
            }

            // Include error message if job failed
            if ("FAILED".equals(job.getStatus())) {
                response.put("errorMessage", job.getErrorMessage());
            }

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error retrieving job status: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Error retrieving job status: " + e.getMessage()));
        }
    }

    /**
     * Process file asynchronously in background thread.
     * This doesn't block the HTTP request.
     * Respects pause/resume state during processing.
     */
    private void processFileAsync(String jobId, String tenantId, String datasetId, List<Map<String, Object>> rows) {
        new Thread(() -> {
            try {
                int processedCount = 0;
                int failedCount = 0;
                FileProcessingJobService.FileProcessingJob job = jobService.getJob(jobId);

                for (int i = 0; i < rows.size(); i++) {
                    final int rowNumber = i + 1;
                    Map<String, Object> row = rows.get(i);

                    // Skip rows that were already processed before pause
                    if (rowNumber <= job.getLastProcessedRowNumber()) {
                        log.debug("Skipping already processed row {}", rowNumber);
                        continue;
                    }

                    // Wait if job is paused
                    while (jobService.isJobPaused(jobId)) {
                        log.info("Job {} is paused, waiting to resume...", jobId);
                        try {
                            Thread.sleep(1000); // Check pause status every second
                        } catch (InterruptedException e) {
                            Thread.currentThread().interrupt();
                            break;
                        }
                    }

                    try {
                        log.debug("Processing row {} of {} (jobId: {})", rowNumber, rows.size(), jobId);
                        
                        Map<String, Object> result = fastAPIService.processRow(tenantId, datasetId, row);

                        // Post each row result immediately (real-time)
                        Map<String, Object> rowResultMap = new HashMap<String, Object>() {{
                            put("rowNumber", rowNumber);
                            put("rowData", row);
                            put("result", result);
                            put("error", null);
                        }};
                        jobService.addProcessedRow(jobId, rowResultMap);

                        processedCount++;
                        job.setLastProcessedRowNumber(rowNumber); // Track processed row for resume
                        log.debug("Row {} processed successfully and posted (jobId: {})", rowNumber, jobId);

                    } catch (Exception e) {
                        log.warn("Error processing row {} (jobId: {}): {}", rowNumber, jobId, e.getMessage());
                        
                        // Post error row result immediately (real-time)
                        Map<String, Object> rowResultMap = new HashMap<String, Object>() {{
                            put("rowNumber", rowNumber);
                            put("rowData", row);
                            put("result", null);
                            put("error", e.getMessage());
                        }};
                        jobService.addProcessedRow(jobId, rowResultMap);

                        failedCount++;
                        job.setLastProcessedRowNumber(rowNumber); // Track even failed rows
                    }

                    // Update progress every 10 rows or at the end
                    if (rowNumber % 10 == 0 || rowNumber == rows.size()) {
                        jobService.updateProgress(jobId, processedCount, failedCount);
                        log.info("Job {} progress: {}/{} rows processed, {} failed", jobId, processedCount, failedCount, rowNumber);
                    }
                }

                log.info("File processing complete for jobId {}: {} successful, {} failed", 
                    jobId, processedCount, failedCount);

                jobService.completeJob(jobId, new ArrayList<>()); // No need to pass results anymore

            } catch (Exception e) {
                log.error("Fatal error processing file (jobId: {}): {}", jobId, e.getMessage(), e);
                jobService.failJob(jobId, e.getMessage());
            }
        }).start();
    }

    /**
     * Process a file from request body (for testing without multipart).
     *
     * Request body:
     * {
     *   "tenantId": "tenant-123",
     *   "datasetId": "550e8400-e29b-41d4-a716-446655440000",
     *   "fileType": "JSON",
     *   "rows": [{...}, {...}]
     * }
     */
    @PostMapping("/process-rows")
    public ResponseEntity<?> processRowsFromBody(@RequestBody Map<String, Object> request) {
        try {
            log.info("Received rows processing request");

            String tenantId = (String) request.get("tenantId");
            String datasetId = (String) request.get("datasetId");
            List<Map<String, Object>> rows = (List<Map<String, Object>>) request.get("rows");

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
                        .body(new ErrorResponse("rows array is required and cannot be empty"));
            }

            log.info("Processing {} rows", rows.size());

            // Process each row through FastAPI
            List<Map<String, Object>> results = new ArrayList<>();
            int processedCount = 0;
            int failedCount = 0;

            for (int i = 0; i < rows.size(); i++) {
                final int rowNumber = i + 1;
                Map<String, Object> row = rows.get(i);
                try {
                    Map<String, Object> result = fastAPIService.processRow(tenantId, datasetId, row);

                    results.add(new HashMap<String, Object>() {{
                        put("rowNumber", rowNumber);
                        put("rowData", row);
                        put("result", result);
                        put("error", null);
                    }});

                    processedCount++;

                } catch (Exception e) {
                    log.warn("Error processing row {}: {}", rowNumber, e.getMessage());

                    results.add(new HashMap<String, Object>() {{
                        put("rowNumber", rowNumber);
                        put("rowData", row);
                        put("result", null);
                        put("error", e.getMessage());
                    }});

                    failedCount++;
                }
            }

            log.info("Rows processing complete: {} successful, {} failed", processedCount, failedCount);

            final int finalProcessedCount = processedCount;
            final int finalFailedCount = failedCount;
            return ResponseEntity.ok(new HashMap<String, Object>() {{
                put("success", true);
                put("totalRows", rows.size());
                put("processedRows", finalProcessedCount);
                put("failedRows", finalFailedCount);
                put("results", results);
            }});

        } catch (Exception e) {
            log.error("Error processing rows: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Error processing rows: " + e.getMessage()));
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
