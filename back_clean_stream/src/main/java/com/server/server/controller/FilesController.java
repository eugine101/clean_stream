package com.server.server.controller;

import com.server.server.service.FileProcessingJobService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;

/**
 * Controller for file management operations.
 * Handles listing files and other file-related operations.
 */
@Slf4j
@RestController
@RequestMapping("/api/files")
public class FilesController {

    private final FileProcessingJobService jobService;

    public FilesController(FileProcessingJobService jobService) {
        this.jobService = jobService;
    }

    /**
     * Extract tenant ID from authentication principal (format: userId|tenantId)
     */
    private String getTenantId(Authentication auth) {
        if (auth == null) return null;
        String principal = (String) auth.getPrincipal();
        if (principal != null && principal.contains("|")) {
            return principal.split("\\|")[1];
        }
        return null;
    }

    /**
     * Upload a file for processing via dataset API.
     * 
     * Request: Multipart file upload
     * - file: The CSV or JSON file to upload
     * - datasetId: UUID of the dataset
     * - tenantId: Tenant identifier
     * 
     * Response:
     * {
     *   "datasetId": "550e8400-e29b-41d4-a716-446655440000",
     *   "fileName": "test-data.csv",
     *   "status": "uploaded",
     *   "message": "File uploaded successfully"
     * }
     */
    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("datasetId") String datasetId,
            @RequestParam("tenantId") String tenantId) {
        try {
            // Validate inputs
            if (file == null || file.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(new ErrorResponse("file is required"));
            }
            
            if (datasetId == null || datasetId.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(new ErrorResponse("datasetId is required"));
            }
            
            if (tenantId == null || tenantId.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(new ErrorResponse("tenantId is required"));
            }

            String filename = file.getOriginalFilename();
            log.info("File uploaded - filename: {}, datasetId: {}, tenantId: {}, size: {}",
                    filename, datasetId, tenantId, file.getSize());

            return ResponseEntity.ok(new HashMap<String, Object>() {{
                put("datasetId", datasetId);
                put("fileName", filename);
                put("status", "uploaded");
                put("message", "File uploaded successfully");
                put("size", file.getSize());
                put("timestamp", System.currentTimeMillis());
            }});

        } catch (Exception e) {
            log.error("Error uploading file: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Error uploading file: " + e.getMessage()));
        }
    }

    /**
     * List all uploaded files with optional status filtering.
     * 
     * Query Parameters:
     * - status (optional): Filter by status (PROCESSING, COMPLETED, FAILED, UPLOADED)
     * 
     * Response: List of file information objects
     * Example: GET /api/files/list?status=PROCESSING
     */
    @GetMapping("/list")
    public ResponseEntity<?> listFiles(
            @RequestParam(required = false) String status,
            Authentication auth) {
        try {
            String tenantId = getTenantId(auth);
            if (tenantId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new ErrorResponse("Tenant ID not found in authentication"));
            }

            List<FileProcessingJobService.FileProcessingJob> jobs = jobService.getAllJobsByTenant(status, tenantId);
            
            List<Map<String, Object>> response = new ArrayList<>();
            for (FileProcessingJobService.FileProcessingJob job : jobs) {
                response.add(new HashMap<String, Object>() {{
                    put("fileId", job.getJobId());
                    put("filename", job.getFilename());
                    put("fileType", detectFileType(job.getFilename()));
                    put("status", job.getStatus());
                    put("uploadedAt", job.getStartTime());
                    put("fileSize", job.getTotalRows()); // Using total rows as a proxy for file size
                    put("progress", job.getProgress());
                    put("processedRows", job.getProcessedRows());
                    put("failedRows", job.getFailedRows());
                }});
            }
            
            log.info("Listed {} files for tenant {} with status filter: {}", response.size(), tenantId, status);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error listing files: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Error listing files: " + e.getMessage()));
        }
    }

    /**
     * Get status of a specific file.
     * 
     * Path Parameters:
     * - fileId: The ID of the file to check
     * 
     * Response: File status information
     * Example: GET /api/files/status/550e8400-e29b-41d4-a716-446655440000
     */
    @GetMapping("/status/{fileId}")
    public ResponseEntity<?> getFileStatus(@PathVariable String fileId) {
        try {
            FileProcessingJobService.FileProcessingJob job = jobService.getJob(fileId);
            
            if (job == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new ErrorResponse("File not found: " + fileId));
            }

            Map<String, Object> response = new HashMap<String, Object>() {{
                put("fileId", job.getJobId());
                put("filename", job.getFilename());
                put("fileType", detectFileType(job.getFilename()));
                put("status", job.getStatus());
                put("uploadedAt", job.getStartTime());
                put("fileSize", job.getTotalRows());
                put("progress", job.getProgress());
                put("processedRows", job.getProcessedRows());
                put("failedRows", job.getFailedRows());
                put("totalRows", job.getTotalRows());
            }};

            // Include error message if job failed
            if ("FAILED".equals(job.getStatus())) {
                response.put("errorMessage", job.getErrorMessage());
            }

            log.info("Retrieved status for file: {} (status: {})", fileId, job.getStatus());
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error retrieving file status: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Error retrieving file status: " + e.getMessage()));
        }
    }

    /**
     * Get processed rows for a specific file with pagination.
     * 
     * Path Parameters:
     * - fileId: The ID of the file
     * 
     * Query Parameters:
     * - page (optional, default=0): Page number (0-indexed)
     * - pageSize (optional, default=20): Rows per page
     * 
     * Response: Paginated processed rows with metadata
     * Example: GET /api/files/550e8400-e29b-41d4-a716-446655440000/rows?page=0&pageSize=20
     */
    @GetMapping("/{fileId}/rows")
    public ResponseEntity<?> getProcessedRows(
            @PathVariable String fileId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int pageSize) {
        try {
            if (page < 0 || pageSize <= 0 || pageSize > 100) {
                return ResponseEntity.badRequest()
                        .body(new ErrorResponse("Invalid pagination parameters. Page >= 0, 0 < pageSize <= 100"));
            }

            Map<String, Object> result = jobService.getProcessedRows(fileId, page, pageSize);
            
            if (result == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new ErrorResponse("File not found: " + fileId));
            }

            log.info("Retrieved rows for file: {} (page: {}, pageSize: {})", fileId, page, pageSize);
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("Error retrieving processed rows: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Error retrieving processed rows: " + e.getMessage()));
        }
    }

    /**
     * Pause processing of a file.
     * 
     * Path Parameters:
     * - fileId: The ID of the file to pause
     * 
     * Example: POST /api/files/550e8400-e29b-41d4-a716-446655440000/pause
     */
    @PostMapping("/{fileId}/pause")
    public ResponseEntity<?> pauseFile(@PathVariable String fileId) {
        try {
            boolean paused = jobService.pauseJob(fileId);
            
            if (!paused) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(new ErrorResponse("Cannot pause file: not currently processing"));
            }

            FileProcessingJobService.FileProcessingJob job = jobService.getJob(fileId);
            log.info("File processing paused: {} (processed: {}, failed: {})", fileId, job.getProcessedRows(), job.getFailedRows());
            
            return ResponseEntity.ok(new HashMap<String, Object>() {{
                put("success", true);
                put("message", "Processing paused");
                put("fileId", fileId);
                put("processedRows", job.getProcessedRows());
                put("failedRows", job.getFailedRows());
            }});
            
        } catch (Exception e) {
            log.error("Error pausing file: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Error pausing file: " + e.getMessage()));
        }
    }

    /**
     * Resume processing of a paused file from the last processed row.
     * 
     * Path Parameters:
     * - fileId: The ID of the file to resume
     * 
     * Example: POST /api/files/550e8400-e29b-41d4-a716-446655440000/resume
     */
    @PostMapping("/{fileId}/resume")
    public ResponseEntity<?> resumeFile(@PathVariable String fileId) {
        try {
            boolean resumed = jobService.resumeJob(fileId);
            
            if (!resumed) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(new ErrorResponse("Cannot resume file: not currently paused"));
            }

            FileProcessingJobService.FileProcessingJob job = jobService.getJob(fileId);
            log.info("File processing resumed: {} (processed: {}, failed: {})", fileId, job.getProcessedRows(), job.getFailedRows());
            
            return ResponseEntity.ok(new HashMap<String, Object>() {{
                put("success", true);
                put("message", "Processing resumed");
                put("fileId", fileId);
                put("processedRows", job.getProcessedRows());
                put("failedRows", job.getFailedRows());
            }});
            
        } catch (Exception e) {
            log.error("Error resuming file: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Error resuming file: " + e.getMessage()));
        }
    }

    /**
     * Debug endpoint to verify tenant filtering and file storage
     * Shows all files in system and what tenant you have access to
     */
    @GetMapping("/debug")
    public ResponseEntity<?> debug(Authentication auth) {
        try {
            String tenantId = getTenantId(auth);
            
            // Get all jobs in the system
            List<FileProcessingJobService.FileProcessingJob> allJobs = jobService.getAllJobs(null);
            
            // Get jobs for this tenant
            List<FileProcessingJobService.FileProcessingJob> userJobs = jobService.getAllJobsByTenant(null, tenantId);
            
            Map<String, Object> response = new HashMap<String, Object>() {{
                put("authenticated", auth != null && auth.isAuthenticated());
                put("yourTenantId", tenantId);
                put("totalJobsInSystem", allJobs.size());
                put("jobsForYourTenant", userJobs.size());
                put("allJobsByTenant", new HashMap<String, Object>() {{
                    Map<String, Integer> tenantCounts = new java.util.HashMap<>();
                    for (FileProcessingJobService.FileProcessingJob job : allJobs) {
                        String jt = job.getTenantId() != null ? job.getTenantId() : "null";
                        tenantCounts.put(jt, tenantCounts.getOrDefault(jt, 0) + 1);
                    }
                    putAll(tenantCounts);
                }});
                put("yourFiles", new ArrayList<Object>() {{
                    for (FileProcessingJobService.FileProcessingJob job : userJobs) {
                        add(new HashMap<String, Object>() {{
                            put("jobId", job.getJobId());
                            put("filename", job.getFilename());
                            put("tenantId", job.getTenantId());
                            put("status", job.getStatus());
                        }});
                    }
                }});
            }};
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error in debug endpoint: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Debug error: " + e.getMessage()));
        }
    }

    /**
     * Detect file type from filename
     */
    private String detectFileType(String filename) {
        if (filename == null) {
            return "UNKNOWN";
        }
        if (filename.toLowerCase().endsWith(".csv")) {
            return "CSV";
        } else if (filename.toLowerCase().endsWith(".json")) {
            return "JSON";
        } else if (filename.toLowerCase().endsWith(".xlsx") || filename.toLowerCase().endsWith(".xls")) {
            return "EXCEL";
        }
        return "UNKNOWN";
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
