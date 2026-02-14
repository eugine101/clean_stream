package com.server.server.controller;

import com.server.server.dto.FileUploadResponse;
import com.server.server.dto.FileStatusResponse;
import com.server.server.model.FileRecord;
import com.server.server.model.OutputFile;
import com.server.server.repository.FileRecordRepository;
import com.server.server.repository.OutputFileRepository;
import com.server.server.service.FileProcessingService;
import com.server.server.service.N8nWebhookService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/files")
public class FileUploadController {

    private final FileRecordRepository fileRecordRepository;
    private final OutputFileRepository outputFileRepository;
    private final N8nWebhookService n8nWebhookService;
    private final FileProcessingService fileProcessingService;

    public FileUploadController(
            FileRecordRepository fileRecordRepository,
            OutputFileRepository outputFileRepository,
            N8nWebhookService n8nWebhookService,
            FileProcessingService fileProcessingService) {
        this.fileRecordRepository = fileRecordRepository;
        this.outputFileRepository = outputFileRepository;
        this.n8nWebhookService = n8nWebhookService;
        this.fileProcessingService = fileProcessingService;
    }

    /**
     * Upload a CSV or JSON file
     */
    @PostMapping("/upload")
    public ResponseEntity<FileUploadResponse> uploadFile(@RequestParam("file") MultipartFile file) {
        try {
            log.info("Received file upload: {}", file.getOriginalFilename());

            // Validate file type
            String filename = file.getOriginalFilename();
            String fileType = getFileType(filename);

            if (!isValidFileType(fileType)) {
                return ResponseEntity.badRequest().body(
                        FileUploadResponse.builder()
                                .success(false)
                                .message("Invalid file type. Only CSV and JSON files are supported.")
                                .build()
                );
            }

            byte[] fileContent = file.getBytes();

            // Validate file content
            if (!fileProcessingService.validateFile(fileContent, fileType)) {
                return ResponseEntity.badRequest().body(
                        FileUploadResponse.builder()
                                .success(false)
                                .message("Invalid " + fileType + " file format.")
                                .build()
                );
            }

            // Create file record
            FileRecord fileRecord = FileRecord.builder()
                    .filename(filename)
                    .fileType(fileType)
                    .contentType(file.getContentType())
                    .fileContent(fileContent)
                    .fileSize(file.getSize())
                    .status("UPLOADED")
                    .uploadedAt(LocalDateTime.now())
                    .build();

            FileRecord saved = fileRecordRepository.save(fileRecord);
            log.info("File saved to MongoDB with ID: {}", saved.getId());

            // Send to n8n webhook
            boolean sent = n8nWebhookService.sendFileToN8n(saved);

            if (!sent) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                        FileUploadResponse.builder()
                                .success(false)
                                .fileId(saved.getId())
                                .message("File uploaded but failed to send to n8n webhook.")
                                .build()
                );
            }

            return ResponseEntity.ok(
                    FileUploadResponse.builder()
                            .success(true)
                            .fileId(saved.getId())
                            .filename(saved.getFilename())
                            .fileType(saved.getFileType())
                            .fileSize(saved.getFileSize())
                            .message("File uploaded successfully and sent to n8n for processing.")
                            .build()
            );

        } catch (IOException e) {
            log.error("Error uploading file: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                    FileUploadResponse.builder()
                            .success(false)
                            .message("Error uploading file: " + e.getMessage())
                            .build()
            );
        } catch (Exception e) {
            log.error("Unexpected error during file upload: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                    FileUploadResponse.builder()
                            .success(false)
                            .message("Unexpected error: " + e.getMessage())
                            .build()
            );
        }
    }

    /**
     * Upload file and convert format
     */
    @PostMapping("/upload-and-convert")
    public ResponseEntity<FileUploadResponse> uploadAndConvert(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "targetFormat", required = false) String targetFormat) {
        try {
            log.info("Received file upload with conversion request: {}", file.getOriginalFilename());

            String filename = file.getOriginalFilename();
            String fileType = getFileType(filename);

            if (!isValidFileType(fileType)) {
                return ResponseEntity.badRequest().body(
                        FileUploadResponse.builder()
                                .success(false)
                                .message("Invalid file type. Only CSV and JSON files are supported.")
                                .build()
                );
            }

            byte[] fileContent = file.getBytes();

            if (!fileProcessingService.validateFile(fileContent, fileType)) {
                return ResponseEntity.badRequest().body(
                        FileUploadResponse.builder()
                                .success(false)
                                .message("Invalid " + fileType + " file format.")
                                .build()
                );
            }

            // Create original file record
            FileRecord originalFile = FileRecord.builder()
                    .filename(filename)
                    .fileType(fileType)
                    .contentType(file.getContentType())
                    .fileContent(fileContent)
                    .fileSize(file.getSize())
                    .status("UPLOADED")
                    .uploadedAt(LocalDateTime.now())
                    .build();

            FileRecord saved = fileRecordRepository.save(originalFile);
            log.info("Original file saved with ID: {}", saved.getId());

            // Convert file if target format specified
            if (targetFormat != null && !targetFormat.isEmpty()) {
                byte[] convertedContent = convertFile(fileContent, fileType, targetFormat);
                if (convertedContent != null && convertedContent.length > 0) {
                    log.info("File converted from {} to {}", fileType, targetFormat);
                }
            }

            // Send to n8n
            boolean sent = n8nWebhookService.sendFileToN8n(saved);

            return ResponseEntity.ok(
                    FileUploadResponse.builder()
                            .success(sent)
                            .fileId(saved.getId())
                            .filename(saved.getFilename())
                            .fileType(saved.getFileType())
                            .fileSize(saved.getFileSize())
                            .message(sent ? "File uploaded, converted, and sent to n8n." : "File uploaded but conversion/sending failed.")
                            .build()
            );

        } catch (IOException e) {
            log.error("Error in upload and convert: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                    FileUploadResponse.builder()
                            .success(false)
                            .message("Error: " + e.getMessage())
                            .build()
            );
        }
    }

    /**
     * Get file status
     */
    @GetMapping("/status/{fileId}")
    public ResponseEntity<FileStatusResponse> getFileStatus(@PathVariable String fileId) {
        try {
            return fileRecordRepository.findById(fileId)
                    .map(fileRecord -> ResponseEntity.ok(
                            FileStatusResponse.builder()
                                    .fileId(fileRecord.getId())
                                    .filename(fileRecord.getFilename())
                                    .fileType(fileRecord.getFileType())
                                    .status(fileRecord.getStatus())
                                    .uploadedAt(fileRecord.getUploadedAt())
                                    .processedAt(fileRecord.getProcessedAt())
                                    .fileSize(fileRecord.getFileSize())
                                    .errorMessage(fileRecord.getErrorMessage())
                                    .n8nWebhookId(fileRecord.getN8nWebhookId())
                                    .build()
                    ))
                    .orElse(ResponseEntity.notFound().build());

        } catch (Exception e) {
            log.error("Error getting file status: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get all uploaded files (sorted by upload date, newest first)
     */
    @GetMapping("/list")
    public ResponseEntity<List<FileStatusResponse>> getAllFiles(
            @RequestParam(value = "status", required = false) String status) {
        try {
            List<FileRecord> files;

            if (status != null && !status.isEmpty()) {
                files = fileRecordRepository.findByStatus(status);
            } else {
                files = fileRecordRepository.findAll();
            }

            List<FileStatusResponse> response = files.stream()
                    .sorted((a, b) -> {
                        if (a.getUploadedAt() == null || b.getUploadedAt() == null) return 0;
                        return b.getUploadedAt().compareTo(a.getUploadedAt());
                    })
                    .map(f -> FileStatusResponse.builder()
                            .fileId(f.getId())
                            .filename(f.getFilename())
                            .fileType(f.getFileType())
                            .status(f.getStatus())
                            .uploadedAt(f.getUploadedAt())
                            .processedAt(f.getProcessedAt())
                            .fileSize(f.getFileSize())
                            .errorMessage(f.getErrorMessage())
                            .build())
                    .collect(Collectors.toList());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error listing files: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Retry sending a file to n8n
     */
    @PostMapping("/retry/{fileId}")
    public ResponseEntity<FileUploadResponse> retrySendFile(@PathVariable String fileId) {
        try {
            log.info("Retrying file send for ID: {}", fileId);
            
            return fileRecordRepository.findById(fileId)
                    .map(fileRecord -> {
                        boolean sent = n8nWebhookService.sendFileToN8n(fileRecord);
                        
                        if (sent) {
                            return ResponseEntity.ok(
                                    FileUploadResponse.builder()
                                            .success(true)
                                            .fileId(fileRecord.getId())
                                            .filename(fileRecord.getFilename())
                                            .fileType(fileRecord.getFileType())
                                            .message("File resent to n8n webhook successfully.")
                                            .build()
                            );
                        } else {
                            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                                    FileUploadResponse.builder()
                                            .success(false)
                                            .fileId(fileRecord.getId())
                                            .message("Failed to resend file to n8n webhook.")
                                            .build()
                            );
                        }
                    })
                    .orElse(ResponseEntity.notFound().build());
                    
        } catch (Exception e) {
            log.error("Error retrying file send: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                    FileUploadResponse.builder()
                            .success(false)
                            .message("Error: " + e.getMessage())
                            .build()
            );
        }
    }

    /**
     * Get output file for a given input file ID
     */
    @GetMapping("/{fileId}/output")
    public ResponseEntity<FileStatusResponse> getOutputFileForInput(@PathVariable String fileId) {
        try {
            log.info("Fetching output file for input: {}", fileId);
            
            List<OutputFile> outputs = outputFileRepository.findByInputFileId(fileId);
            
            if (outputs.isEmpty()) {
                log.warn("No output file found for input: {}", fileId);
                return ResponseEntity.notFound().build();
            }
            
            // Return the most recent output
            OutputFile outputFile = outputs.get(0);
            
            return ResponseEntity.ok(
                    FileStatusResponse.builder()
                            .fileId(outputFile.getId())
                            .filename(outputFile.getFilename())
                            .fileType(outputFile.getFileType())
                            .status(outputFile.getN8nStatus())
                            .uploadedAt(outputFile.getCreatedAt())
                            .processedAt(outputFile.getCreatedAt())
                            .fileSize(outputFile.getFileSize())
                            .build()
            );
            
        } catch (Exception e) {
            log.error("Error getting output file: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Download output file content in specified format
     * Supports: JSON, CSV, XLSX
     */
    @GetMapping("/{fileId}/output/download")
    public ResponseEntity<byte[]> downloadOutputFile(
            @PathVariable String fileId,
            @RequestParam(value = "format", defaultValue = "JSON") String format) {
        try {
            log.info("Downloading output file for input: {} in format: {}", fileId, format);
            
            List<OutputFile> outputs = outputFileRepository.findByInputFileId(fileId);
            
            if (outputs.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            OutputFile outputFile = outputs.get(0);
            
            // Get the JSON content (original format from n8n)
            byte[] contentToReturn = outputFile.getFileContent();
            String contentType = "application/json";
            String filename = outputFile.getFilename();
            
            // Convert if requested format is different
            if ("CSV".equalsIgnoreCase(format)) {
                contentToReturn = fileProcessingService.convertJSONtoCSV(outputFile.getFileContent());
                contentType = "text/csv";
                filename = filename.replace(".json", ".csv");
            } else if ("XLSX".equalsIgnoreCase(format)) {
                contentToReturn = fileProcessingService.convertJSONtoXLSX(outputFile.getFileContent());
                contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
                filename = filename.replace(".json", ".xlsx");
            }
            
            return ResponseEntity.ok()
                    .header("Content-Type", contentType)
                    .header("Content-Disposition", "attachment; filename=\"" + filename + "\"")
                    .body(contentToReturn);
            
        } catch (Exception e) {
            log.error("Error downloading output file: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Delete a file record
     */
    @DeleteMapping("/{fileId}")
    public ResponseEntity<Void> deleteFile(@PathVariable String fileId) {
        try {
            fileRecordRepository.deleteById(fileId);
            log.info("File deleted: {}", fileId);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            log.error("Error deleting file: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Download input file content
     */
    @GetMapping("/{fileId}/download")
    public ResponseEntity<byte[]> downloadInputFile(@PathVariable String fileId) {
        try {
            log.info("Downloading input file: {}", fileId);
            
            return fileRecordRepository.findById(fileId)
                    .map(fileRecord -> ResponseEntity.ok()
                            .header("Content-Type", fileRecord.getContentType() != null ? fileRecord.getContentType() : "application/octet-stream")
                            .header("Content-Disposition", "attachment; filename=\"" + fileRecord.getFilename() + "\"")
                            .body(fileRecord.getFileContent()))
                    .orElse(ResponseEntity.notFound().build());
            
        } catch (Exception e) {
            log.error("Error downloading input file: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Helper method to get file type from filename
     */
    private String getFileType(String filename) {
        if (filename == null) return "";
        String extension = filename.substring(filename.lastIndexOf(".") + 1).toUpperCase();
        return extension;
    }

    /**
     * Helper method to validate file type
     */
    private boolean isValidFileType(String fileType) {
        return fileType.equals("CSV") || fileType.equals("JSON");
    }

    /**
     * Helper method to convert between formats
     */
    private byte[] convertFile(byte[] content, String sourceFormat, String targetFormat) {
        try {
            if (sourceFormat.equalsIgnoreCase("CSV") && targetFormat.equalsIgnoreCase("JSON")) {
                return fileProcessingService.convertCSVtoJSON(content);
            } else if (sourceFormat.equalsIgnoreCase("JSON") && targetFormat.equalsIgnoreCase("CSV")) {
                return fileProcessingService.convertJSONtoCSV(content);
            }
            return null;
        } catch (IOException e) {
            log.error("Error converting file: {}", e.getMessage(), e);
            return null;
        }
    }
}
