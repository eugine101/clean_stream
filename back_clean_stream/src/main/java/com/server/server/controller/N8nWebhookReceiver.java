package com.server.server.controller;

import com.server.server.dto.FileStatusResponse;
import com.server.server.model.OutputFile;
import com.server.server.repository.FileRecordRepository;
import com.server.server.repository.OutputFileRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/webhooks")
public class N8nWebhookReceiver {

    private final OutputFileRepository outputFileRepository;
    private final FileRecordRepository fileRecordRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public N8nWebhookReceiver(
            OutputFileRepository outputFileRepository,
            FileRecordRepository fileRecordRepository) {
        this.outputFileRepository = outputFileRepository;
        this.fileRecordRepository = fileRecordRepository;
    }

    /**
     * Receive processed data from n8n workflow (handles both CSV and JSON)
     */
    @PostMapping("/n8n-callback")
    public ResponseEntity<Map<String, String>> receiveN8nCallback(
            @RequestBody Map<String, Object> payload,
            @RequestHeader(value = "X-File-Id", required = false) String fileId,
            @RequestHeader(value = "X-File-Name", required = false) String filename,
            @RequestHeader(value = "X-File-Type", required = false) String fileType,
            @RequestHeader(value = "X-Workflow-Id", required = false) String workflowId) {

        try {
            log.info("Received callback from n8n for file: {} (type: {})", fileId, fileType);
            log.debug("Payload: {}", payload);

            if (fileId == null || fileId.isEmpty()) {
                log.warn("No X-File-Id header in webhook callback");
                return ResponseEntity.badRequest().body(
                        Map.of("error", "Missing X-File-Id header")
                );
            }

            // Find the original file record
            var fileRecord = fileRecordRepository.findById(fileId);
            if (fileRecord.isEmpty()) {
                log.warn("File record not found: {}", fileId);
                return ResponseEntity.notFound().build();
            }

            // Detect file type from header or payload
            String detectedFileType = detectFileType(fileType, payload);
            log.info("Detected file type: {}", detectedFileType);

            // Convert payload to appropriate format (CSV or JSON)
            byte[] outputContent = convertPayloadToFormat(payload, detectedFileType);

            // Determine output filename
            String outputFilename = generateOutputFilename(filename, detectedFileType);

            // Create output file record
            OutputFile outputFile = OutputFile.builder()
                    .inputFileId(fileId)
                    .filename(outputFilename)
                    .fileType(detectedFileType)
                    .contentType(getContentType(detectedFileType))
                    .fileContent(outputContent)
                    .fileSize(outputContent.length)
                    .createdAt(LocalDateTime.now())
                    .n8nWorkflowId(workflowId)
                    .n8nStatus("completed")
                    .processingNotes("Processed by n8n workflow - " + detectedFileType + " format")
                    .build();

            OutputFile saved = outputFileRepository.save(outputFile);
            log.info("Saved output file with ID: {} ({}KB)", saved.getId(), saved.getFileSize() / 1024);

            // Update original file status
            var file = fileRecord.get();
            file.setStatus("COMPLETED");
            file.setProcessedAt(LocalDateTime.now());
            fileRecordRepository.save(file);
            log.info("Updated file status to COMPLETED: {}", fileId);

            return ResponseEntity.ok(
                    Map.of(
                            "success", "true",
                            "outputFileId", saved.getId(),
                            "filename", outputFilename,
                            "fileType", detectedFileType,
                            "message", "Processed data stored successfully"
                    )
            );

        } catch (Exception e) {
            log.error("Error processing n8n callback: {}", e.getMessage(), e);
            
            // Update file status to failed
            if (fileId != null && !fileId.isEmpty()) {
                try {
                    var fileRecord = fileRecordRepository.findById(fileId);
                    if (fileRecord.isPresent()) {
                        var file = fileRecord.get();
                        file.setStatus("FAILED");
                        file.setErrorMessage("Callback processing error: " + e.getMessage());
                        fileRecordRepository.save(file);
                    }
                } catch (Exception ex) {
                    log.error("Failed to update file status on error: {}", ex.getMessage());
                }
            }
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                    Map.of("error", "Failed to process callback: " + e.getMessage())
            );
        }
    }

    /**
     * Detect file type from header or payload structure
     */
    private String detectFileType(String headerFileType, Map<String, Object> payload) {
        if (headerFileType != null && !headerFileType.isEmpty()) {
            return headerFileType.toUpperCase().equals("CSV") ? "CSV" : "JSON";
        }

        // Try to detect from payload structure
        if (payload.containsKey("data") && payload.get("data") instanceof java.util.List) {
            return "JSON";
        }

        // Default to JSON
        return "JSON";
    }

    /**
     * Convert payload to CSV or JSON format
     */
    private byte[] convertPayloadToFormat(Map<String, Object> payload, String fileType) throws Exception {
        String outputData;

        if ("CSV".equalsIgnoreCase(fileType)) {
            outputData = convertToCSV(payload);
        } else {
            outputData = objectMapper.writerWithDefaultPrettyPrinter()
                    .writeValueAsString(payload);
        }

        return outputData.getBytes();
    }

    /**
     * Convert payload to CSV format
     */
    private String convertToCSV(Map<String, Object> payload) throws Exception {
        StringBuilder csv = new StringBuilder();

        // Handle if payload contains a "data" key with list
        Object dataObj = payload.get("data");
        if (dataObj instanceof java.util.List) {
            java.util.List<?> dataList = (java.util.List<?>) dataObj;
            if (!dataList.isEmpty()) {
                // Get first record to extract headers
                Object firstRecord = dataList.get(0);
                if (firstRecord instanceof Map) {
                    Map<String, Object> firstMap = (Map<String, Object>) firstRecord;
                    
                    // Write headers
                    csv.append(String.join(",", firstMap.keySet())).append("\n");
                    
                    // Write data rows
                    for (Object record : dataList) {
                        if (record instanceof Map) {
                            Map<String, Object> recordMap = (Map<String, Object>) record;
                            java.util.List<String> values = new java.util.ArrayList<>();
                            for (String key : firstMap.keySet()) {
                                Object value = recordMap.get(key);
                                values.add(value != null ? escapeCSVValue(value.toString()) : "");
                            }
                            csv.append(String.join(",", values)).append("\n");
                        }
                    }
                }
            }
        } else {
            // If it's a single object, convert to JSON
            return objectMapper.writerWithDefaultPrettyPrinter()
                    .writeValueAsString(payload);
        }

        return csv.toString();
    }

    /**
     * Escape CSV values that contain commas or quotes
     */
    private String escapeCSVValue(String value) {
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }

    /**
     * Generate output filename based on input and file type
     */
    private String generateOutputFilename(String originalFilename, String fileType) {
        if (originalFilename == null || originalFilename.isEmpty()) {
            return "output_" + System.currentTimeMillis() + "." + fileType.toLowerCase();
        }

        String baseName = originalFilename.substring(0, originalFilename.lastIndexOf('.') > 0 
                ? originalFilename.lastIndexOf('.') 
                : originalFilename.length());
        
        return baseName + "_cleaned." + fileType.toLowerCase();
    }

    /**
     * Get content type for file type
     */
    private String getContentType(String fileType) {
        return "CSV".equalsIgnoreCase(fileType) ? "text/csv" : "application/json";
    }

    /**
     * Get output file by ID
     */
    @GetMapping("/output/{outputFileId}")
    public ResponseEntity<FileStatusResponse> getOutputFile(@PathVariable String outputFileId) {
        try {
            return outputFileRepository.findById(outputFileId)
                    .map(outputFile -> ResponseEntity.ok(
                            FileStatusResponse.builder()
                                    .fileId(outputFile.getId())
                                    .filename(outputFile.getFilename())
                                    .fileType(outputFile.getFileType())
                                    .status(outputFile.getN8nStatus())
                                    .uploadedAt(outputFile.getCreatedAt())
                                    .fileSize(outputFile.getFileSize())
                                    .build()
                    ))
                    .orElse(ResponseEntity.notFound().build());

        } catch (Exception e) {
            log.error("Error getting output file: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Download output file content
     */
    @GetMapping("/output/{outputFileId}/download")
    public ResponseEntity<byte[]> downloadOutputFile(@PathVariable String outputFileId) {
        try {
            return outputFileRepository.findById(outputFileId)
                    .map(outputFile -> ResponseEntity.ok()
                            .header("Content-Type", outputFile.getContentType())
                            .header("Content-Disposition", "attachment; filename=\"" + outputFile.getFilename() + "\"")
                            .body(outputFile.getFileContent()))
                    .orElse(ResponseEntity.notFound().build());

        } catch (Exception e) {
            log.error("Error downloading output file: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}

