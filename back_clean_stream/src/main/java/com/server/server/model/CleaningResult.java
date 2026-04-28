package com.server.server.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "cleaning_results", indexes = {
    @Index(name = "idx_cleaning_results_tenant_dataset", columnList = "tenant_id,dataset_id"),
    @Index(name = "idx_cleaning_results_tenant", columnList = "tenant_id"),
    @Index(name = "idx_cleaning_results_dataset", columnList = "dataset_id")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CleaningResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "tenant_id", nullable = false)
    private String tenantId;

    @Column(name = "dataset_id", nullable = false, columnDefinition = "uuid")
    private UUID datasetId;

    /**
     * Stored as JSON in PostgreSQL
     * Keep as String unless you want JsonNode mapping
     */
    @Column(name = "row_data", columnDefinition = "json", nullable = false)
    private String rowData;

    @Column(name = "ai_suggestion", columnDefinition = "json", nullable = false)
    private String aiSuggestion;

    @Column
    private Float confidence;

    @Column(length = 50)
    private String status; // processed, failed, pending

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;


}