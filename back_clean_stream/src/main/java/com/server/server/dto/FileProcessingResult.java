package com.server.server.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for file processing results
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FileProcessingResult {
    private String filename;
    private String fileType;
    private int totalRows;
    private int processedRows;
    private int failedRows;
    private Object results;
}
