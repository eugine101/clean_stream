package com.server.server.service;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Service to track file processing jobs and their progress.
 * Stores job status in memory for real-time updates to frontend.
 */
@Slf4j
@Service
public class FileProcessingJobService {

    private final Map<String, FileProcessingJob> jobRegistry = new ConcurrentHashMap<>();

    /**
     * Create a new processing job
     */
    public String createJob(String filename, int totalRows) {
        String jobId = UUID.randomUUID().toString();
        FileProcessingJob job = new FileProcessingJob(jobId, filename, totalRows);
        jobRegistry.put(jobId, job);
        log.info("Created job {} for processing file: {} ({} rows)", jobId, filename, totalRows);
        return jobId;
    }

    /**
     * Get job status by ID
     */
    public FileProcessingJob getJob(String jobId) {
        return jobRegistry.get(jobId);
    }

    /**
     * Update job progress
     */
    public void updateProgress(String jobId, int processedRows, int failedRows) {
        FileProcessingJob job = jobRegistry.get(jobId);
        if (job != null) {
            job.setProcessedRows(processedRows);
            job.setFailedRows(failedRows);
            job.setProgress((processedRows + failedRows) * 100 / job.getTotalRows());
            job.setLastUpdated(LocalDateTime.now());
        }
    }

    /**
     * Add a single processed row immediately (real-time posting)
     */
    public void addProcessedRow(String jobId, Map<String, Object> rowResult) {
        FileProcessingJob job = jobRegistry.get(jobId);
        if (job != null) {
            job.getResults().add(rowResult);
            job.setLastUpdated(LocalDateTime.now());
        }
    }

    /**
     * Mark job as complete and store results
     */
    public void completeJob(String jobId, List<Map<String, Object>> results) {
        FileProcessingJob job = jobRegistry.get(jobId);
        if (job != null) {
            job.setStatus("COMPLETED");
            // Results are already added incrementally via addProcessedRow
            job.setEndTime(LocalDateTime.now());
            log.info("Job {} completed: {} rows processed, {} failed", 
                jobId, job.getProcessedRows(), job.getFailedRows());
        }
    }

    /**
     * Mark job as failed
     */
    public void failJob(String jobId, String errorMessage) {
        FileProcessingJob job = jobRegistry.get(jobId);
        if (job != null) {
            job.setStatus("FAILED");
            job.setErrorMessage(errorMessage);
            job.setEndTime(LocalDateTime.now());
            log.error("Job {} failed: {}", jobId, errorMessage);
        }
    }

    /**
     * Get all jobs with optional status filtering
     */
    public List<FileProcessingJob> getAllJobs(String statusFilter) {
        List<FileProcessingJob> jobs = new ArrayList<>(jobRegistry.values());
        if (statusFilter != null && !statusFilter.isEmpty()) {
            jobs.removeIf(job -> !job.getStatus().equalsIgnoreCase(statusFilter));
        }
        jobs.sort((a, b) -> b.getStartTime().compareTo(a.getStartTime()));
        return jobs;
    }

    /**
     * Get paginated processed rows for a job
     */
    public Map<String, Object> getProcessedRows(String jobId, int page, int pageSize) {
        FileProcessingJob job = jobRegistry.get(jobId);
        if (job == null) {
            return null;
        }

        List<Map<String, Object>> results = job.getResults();
        int totalRows = results.size();
        int startIndex = page * pageSize;
        int endIndex = Math.min(startIndex + pageSize, totalRows);

        List<Map<String, Object>> pageRows = results.subList(startIndex, endIndex);

        return new java.util.LinkedHashMap<String, Object>() {{
            put("jobId", jobId);
            put("filename", job.getFilename());
            put("status", job.getStatus());
            put("totalProcessed", totalRows);
            put("totalRows", job.getTotalRows());
            put("progress", job.getProgress());
            put("page", page);
            put("pageSize", pageSize);
            put("totalPages", (totalRows + pageSize - 1) / pageSize);
            put("rows", pageRows);
        }};
    }

    /**
     * Pause a processing job
     */
    public boolean pauseJob(String jobId) {
        FileProcessingJob job = jobRegistry.get(jobId);
        if (job != null && "PROCESSING".equals(job.getStatus())) {
            job.setPaused(true);
            log.info("Job {} paused at row {}/{}", jobId, job.getProcessedRows() + job.getFailedRows(), job.getTotalRows());
            return true;
        }
        return false;
    }

    /**
     * Resume a paused processing job
     */
    public boolean resumeJob(String jobId) {
        FileProcessingJob job = jobRegistry.get(jobId);
        if (job != null && job.isPaused()) {
            job.setPaused(false);
            log.info("Job {} resumed from row {}/{}", jobId, job.getProcessedRows() + job.getFailedRows(), job.getTotalRows());
            return true;
        }
        return false;
    }

    /**
     * Check if job is paused
     */
    public boolean isJobPaused(String jobId) {
        FileProcessingJob job = jobRegistry.get(jobId);
        return job != null && job.isPaused();
    }

    /**
     * Clean up old completed jobs (optional - run periodically)
     */
    public void cleanupOldJobs(int retentionMinutes) {
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(retentionMinutes);
        jobRegistry.entrySet().removeIf(entry -> 
            entry.getValue().getEndTime() != null && 
            entry.getValue().getEndTime().isBefore(cutoff) &&
            !entry.getValue().getStatus().equals("PROCESSING")
        );
    }

    /**
     * Job status DTO
     */
    @Data
    @AllArgsConstructor
    public static class FileProcessingJob {
        private String jobId;
        private String filename;
        private int totalRows;
        private int processedRows = 0;
        private int failedRows = 0;
        private int progress = 0; // 0-100
        private String status = "PROCESSING"; // PROCESSING, COMPLETED, FAILED, PAUSED
        private String errorMessage;
        private List<Map<String, Object>> results = new ArrayList<>();
        private LocalDateTime startTime = LocalDateTime.now();
        private LocalDateTime endTime;
        private LocalDateTime lastUpdated = LocalDateTime.now();
        private boolean paused = false;
        private int lastProcessedRowNumber = 0; // Track last row number for resume functionality

        public FileProcessingJob(String jobId, String filename, int totalRows) {
            this.jobId = jobId;
            this.filename = filename;
            this.totalRows = totalRows;
        }
    }
}
