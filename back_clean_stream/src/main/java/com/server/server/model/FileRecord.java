package com.server.server.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "fileRecords")
public class FileRecord {
    @Id
    private String id;
    
    private String filename;
    private String fileType; // CSV or JSON
    private String contentType;
    private byte[] fileContent;
    private long fileSize;
    private String status; // UPLOADED, PROCESSED, FAILED
    private LocalDateTime uploadedAt;
    private LocalDateTime processedAt;
    private String n8nWebhookId; // Reference to n8n processing
    private String errorMessage; // If processing failed
}
