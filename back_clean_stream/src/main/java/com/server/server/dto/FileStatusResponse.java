package com.server.server.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FileStatusResponse {
    private String fileId;
    private String filename;
    private String fileType;
    private String status;
    private LocalDateTime uploadedAt;
    private LocalDateTime processedAt;
    private long fileSize;
    private String errorMessage;
    private String n8nWebhookId;
}
