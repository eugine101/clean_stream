package com.server.server.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DatasetProgressDto {
    private Long id;
    private String tenantId;
    private UUID datasetId;
    private Integer totalRows;
    private Integer processedRows;
    private Integer failedRows;
    private Integer remainingRows;
    private String status;
    private Double progressPercentage;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
