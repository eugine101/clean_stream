package com.server.server.service;

import com.server.server.dto.DatasetProgressDto;
import com.server.server.model.DatasetProgress;
import com.server.server.repository.DatasetProgressRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
public class DatasetProgressService {
    
    private final DatasetProgressRepository repository;
    
    public DatasetProgressService(DatasetProgressRepository repository) {
        this.repository = repository;
    }
    
    /**
     * Initialize dataset progress tracking
     */
    @Transactional
    public DatasetProgressDto initializeDatasetProgress(
        String tenantId,
        UUID datasetId,
        Integer totalRows) {
        
        log.info("Initializing dataset progress - tenant: {}, dataset: {}, totalRows: {}",
            tenantId, datasetId, totalRows);
        
        DatasetProgress progress = DatasetProgress.builder()
            .tenantId(tenantId)
            .datasetId(datasetId)
            .totalRows(totalRows)
            .processedRows(0)
            .failedRows(0)
            .status("processing")
            .build();
        
        DatasetProgress saved = repository.save(progress);
        return mapToDto(saved);
    }
    
    /**
     * Update dataset progress after processing a row
     */
    @Transactional
    public DatasetProgressDto updateRowProgress(
        UUID datasetId,
        boolean isSuccess) {
        
        Optional<DatasetProgress> optionalProgress = repository.findByDatasetId(datasetId);
        
        if (optionalProgress.isEmpty()) {
            throw new IllegalArgumentException("Dataset progress record not found for datasetId: " + datasetId);
        }
        
        DatasetProgress progress = optionalProgress.get();
        
        if (isSuccess) {
            progress.setProcessedRows(progress.getProcessedRows() + 1);
        } else {
            progress.setFailedRows(progress.getFailedRows() + 1);
        }
        
        // Check if all rows are processed
        if (progress.getProcessedRows() + progress.getFailedRows() >= progress.getTotalRows()) {
            progress.setStatus("completed");
            log.info("Dataset {} processing completed", datasetId);
        }
        
        DatasetProgress saved = repository.save(progress);
        return mapToDto(saved);
    }
    
    /**
     * Get current progress for a dataset
     */
    @Transactional(readOnly = true)
    public DatasetProgressDto getProgress(UUID datasetId) {
        return repository.findByDatasetId(datasetId)
            .map(this::mapToDto)
            .orElseThrow(() -> new IllegalArgumentException("Dataset progress not found: " + datasetId));
    }
    
    /**
     * Get progress with tenant validation
     */
    @Transactional(readOnly = true)
    public DatasetProgressDto getProgress(String tenantId, UUID datasetId) {
        return repository.findByTenantIdAndDatasetId(tenantId, datasetId)
            .map(this::mapToDto)
            .orElseThrow(() -> new IllegalArgumentException(
                "Dataset progress not found for tenant: " + tenantId + ", dataset: " + datasetId));
    }
    
    /**
     * Get all datasets for a tenant
     */
    @Transactional(readOnly = true)
    public List<DatasetProgressDto> getDatasetsByTenant(String tenantId) {
        return repository.findByTenantId(tenantId)
            .stream()
            .map(this::mapToDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get active (processing) datasets for a tenant
     */
    @Transactional(readOnly = true)
    public List<DatasetProgressDto> getActiveDatasetsByTenant(String tenantId) {
        return repository.findActiveByTenantId(tenantId)
            .stream()
            .map(this::mapToDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Pause dataset processing
     */
    @Transactional
    public DatasetProgressDto pauseDataset(String tenantId, UUID datasetId) {
        DatasetProgress progress = repository.findByTenantIdAndDatasetId(tenantId, datasetId)
            .orElseThrow(() -> new IllegalArgumentException("Dataset not found"));
        
        if (!progress.getStatus().equals("processing")) {
            throw new IllegalStateException("Cannot pause dataset with status: " + progress.getStatus());
        }
        
        progress.setStatus("paused");
        DatasetProgress saved = repository.save(progress);
        log.info("Dataset {} paused", datasetId);
        return mapToDto(saved);
    }
    
    /**
     * Resume dataset processing
     */
    @Transactional
    public DatasetProgressDto resumeDataset(String tenantId, UUID datasetId) {
        DatasetProgress progress = repository.findByTenantIdAndDatasetId(tenantId, datasetId)
            .orElseThrow(() -> new IllegalArgumentException("Dataset not found"));
        
        if (!progress.getStatus().equals("paused")) {
            throw new IllegalStateException("Can only resume paused datasets, current status: " + progress.getStatus());
        }
        
        progress.setStatus("processing");
        DatasetProgress saved = repository.save(progress);
        log.info("Dataset {} resumed", datasetId);
        return mapToDto(saved);
    }
    
    /**
     * Mark dataset as failed
     */
    @Transactional
    public DatasetProgressDto markAsFailedDataset(String tenantId, UUID datasetId, String errorMessage) {
        DatasetProgress progress = repository.findByTenantIdAndDatasetId(tenantId, datasetId)
            .orElseThrow(() -> new IllegalArgumentException("Dataset not found"));
        
        progress.setStatus("failed");
        DatasetProgress saved = repository.save(progress);
        log.error("Dataset {} marked as failed", datasetId);
        return mapToDto(saved);
    }
    
    /**
     * Convert entity to DTO
     */
    private DatasetProgressDto mapToDto(DatasetProgress entity) {
        return DatasetProgressDto.builder()
            .id(entity.getId())
            .tenantId(entity.getTenantId())
            .datasetId(entity.getDatasetId())
            .totalRows(entity.getTotalRows())
            .processedRows(entity.getProcessedRows())
            .failedRows(entity.getFailedRows())
            .remainingRows(entity.getRemainingRows())
            .status(entity.getStatus())
            .progressPercentage(entity.getProgressPercentage())
            .createdAt(entity.getCreatedAt())
            .updatedAt(entity.getUpdatedAt())
            .build();
    }
}
