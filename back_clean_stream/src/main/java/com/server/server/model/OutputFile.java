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
@Document(collection = "outputFiles")
public class OutputFile {
    @Id
    private String id;
    
    private String inputFileId; // Reference to original FileRecord
    private String filename;
    private String fileType; // CSV or JSON
    private String contentType;
    private byte[] fileContent;
    private long fileSize;
    private LocalDateTime createdAt;
    private String n8nWorkflowId;
    private String n8nStatus; // Status from n8n
    private String processingNotes;
}
