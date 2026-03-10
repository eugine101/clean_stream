package com.server.server.model;

import jakarta.persistence.*;
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
@Entity
@Table(
    name = "dataset_progress",
    indexes = {
        @Index(name = "idx_dataset_progress_tenant", columnList = "tenant_id"),
        @Index(name = "idx_dataset_progress_dataset", columnList = "dataset_id")
    }
)
public class DatasetProgress {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, length = 255)
    private String tenantId;
    
    @Column(nullable = false, unique = true)
    private UUID datasetId;
    
    @Column(nullable = false)
    private Integer totalRows;
    
    @Column(nullable = false)
    private Integer processedRows = 0;
    
    @Column(nullable = false)
    private Integer failedRows = 0;
    
    @Column(nullable = false, length = 50)
    private String status = "processing"; // 'processing', 'completed', 'failed', 'paused'
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(nullable = false)
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    public Integer getRemainingRows() {
        return totalRows - processedRows - failedRows;
    }
    
    public Double getProgressPercentage() {
        if (totalRows == 0) return 0.0;
        return ((double) (processedRows + failedRows) / totalRows) * 100;
    }
}
