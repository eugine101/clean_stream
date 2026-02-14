package com.server.server.service;

import com.server.server.model.FileRecord;
import com.server.server.model.OutputFile;
import com.server.server.repository.FileRecordRepository;
import com.server.server.repository.OutputFileRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.RestClientException;

import java.time.LocalDateTime;

@Slf4j
@Service
public class N8nWebhookService {

    @Value("${n8n.webhook.url:https://koyo.app.n8n.cloud/webhook/clean-data}")
    private String n8nWebhookUrl;

    private final RestTemplate restTemplate;
    private final FileRecordRepository fileRecordRepository;
    private final OutputFileRepository outputFileRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public N8nWebhookService(
            RestTemplate restTemplate,
            FileRecordRepository fileRecordRepository,
            OutputFileRepository outputFileRepository) {
        this.restTemplate = restTemplate;
        this.fileRecordRepository = fileRecordRepository;
        this.outputFileRepository = outputFileRepository;
    }

    /**
     * Send file to n8n webhook for processing
     * @param fileRecord The file to be processed
     * @return true if successful, false otherwise
     */
    public boolean sendFileToN8n(FileRecord fileRecord) {
        try {
            log.info("Sending file {} to n8n webhook at {}", fileRecord.getFilename(), n8nWebhookUrl);

            HttpHeaders headers = new HttpHeaders();
            
            // Send as plain text/CSV instead of binary to avoid encoding issues
            if ("CSV".equalsIgnoreCase(fileRecord.getFileType())) {
                headers.setContentType(MediaType.TEXT_PLAIN);
            } else if ("JSON".equalsIgnoreCase(fileRecord.getFileType())) {
                headers.setContentType(MediaType.APPLICATION_JSON);
            } else {
                headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            }
            
            headers.set("X-File-Name", fileRecord.getFilename());
            headers.set("X-File-Type", fileRecord.getFileType());
            headers.set("X-File-Id", fileRecord.getId());

            // Convert byte array to String for plain text transmission
            String fileContent = new String(fileRecord.getFileContent(), "UTF-8");
            HttpEntity<String> request = new HttpEntity<>(fileContent, headers);

            log.debug("Sending {} bytes as text to n8n", fileRecord.getFileContent().length);

            String response = restTemplate.postForObject(
                    n8nWebhookUrl,
                    request,
                    String.class
            );

            log.info("N8n webhook response: {}", response);

            // Check if response is synchronous (immediate data) or just acknowledgment
            if (response != null && !response.isEmpty() && isValidJsonArray(response)) {
                // Synchronous response - process immediately
                log.info("Received synchronous response from n8n, processing data immediately");
                saveOutputFile(fileRecord.getId(), fileRecord.getFilename(), response);
                
                // Update file record status to COMPLETED
                fileRecord.setStatus("COMPLETED");
                fileRecord.setProcessedAt(LocalDateTime.now());
                fileRecord.setN8nWebhookId("processed");
            } else {
                // Asynchronous response - waiting for callback
                log.info("N8n processing asynchronously, waiting for callback");
                fileRecord.setStatus("PROCESSING");
                fileRecord.setProcessedAt(LocalDateTime.now());
                fileRecord.setN8nWebhookId(response != null ? response.substring(0, Math.min(100, response.length())) : "webhook-sent");
            }
            
            fileRecordRepository.save(fileRecord);
            log.info("File {} status updated to: {}", fileRecord.getFilename(), fileRecord.getStatus());
            return true;

        } catch (RestClientException e) {
            log.warn("N8n webhook not available or network error: {}", e.getMessage());
            log.info("File will be stored locally with status UPLOADED. Can retry later.");
            
            // Store file but don't mark as failed - it's still uploaded
            fileRecord.setStatus("UPLOADED");
            fileRecord.setErrorMessage("N8n webhook temporarily unavailable: " + e.getMessage());
            fileRecordRepository.save(fileRecord);
            
            return false;

        } catch (Exception e) {
            log.error("Unexpected error sending file to n8n: {}", e.getMessage(), e);
            fileRecord.setStatus("UPLOADED");
            fileRecord.setErrorMessage("Error connecting to n8n: " + e.getMessage());
            fileRecordRepository.save(fileRecord);
            return false;
        }
    }

    /**
     * Check if response is a valid JSON array (cleaned data)
     */
    private boolean isValidJsonArray(String response) {
        try {
            String trimmed = response.trim();
            return trimmed.startsWith("[") && trimmed.endsWith("]");
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Save output file from n8n response
     */
    private void saveOutputFile(String inputFileId, String inputFilename, String responseData) {
        try {
            String outputFilename = generateOutputFilename(inputFilename, "JSON");
            byte[] outputContent = responseData.getBytes("UTF-8");
            
            OutputFile outputFile = OutputFile.builder()
                    .inputFileId(inputFileId)
                    .filename(outputFilename)
                    .fileType("JSON")
                    .contentType("application/json")
                    .fileContent(outputContent)
                    .fileSize(outputContent.length)
                    .createdAt(LocalDateTime.now())
                    .n8nStatus("completed")
                    .processingNotes("Cleaned data from n8n workflow")
                    .build();
            
            OutputFile saved = outputFileRepository.save(outputFile);
            log.info("Saved output file with ID: {} ({}KB)", saved.getId(), saved.getFileSize() / 1024);
        } catch (Exception e) {
            log.error("Error saving output file: {}", e.getMessage(), e);
        }
    }

    /**
     * Generate output filename based on input filename
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
     * Retry sending a file that failed
     * @param fileId The ID of the file to retry
     * @return true if successful, false otherwise
     */
    public boolean retrySendFile(String fileId) {
        try {
            FileRecord fileRecord = fileRecordRepository.findById(fileId).orElse(null);
            if (fileRecord == null) {
                log.error("File not found: {}", fileId);
                return false;
            }
            
            log.info("Retrying file send for: {}", fileRecord.getFilename());
            return sendFileToN8n(fileRecord);
            
        } catch (Exception e) {
            log.error("Error retrying file send: {}", e.getMessage(), e);
            return false;
        }
    }
}

