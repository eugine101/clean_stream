package com.server.server.repository;

import com.server.server.model.DatasetProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DatasetProgressRepository extends JpaRepository<DatasetProgress, Long> {
    
    Optional<DatasetProgress> findByDatasetId(UUID datasetId);
    
    List<DatasetProgress> findByTenantId(String tenantId);
    
    List<DatasetProgress> findByTenantIdAndStatus(String tenantId, String status);
    
    @Query("SELECT dp FROM DatasetProgress dp WHERE dp.tenantId = :tenantId AND dp.datasetId = :datasetId")
    Optional<DatasetProgress> findByTenantIdAndDatasetId(
        @Param("tenantId") String tenantId,
        @Param("datasetId") UUID datasetId
    );
    
    @Query("SELECT dp FROM DatasetProgress dp WHERE dp.tenantId = :tenantId AND dp.status = 'processing'")
    List<DatasetProgress> findActiveByTenantId(@Param("tenantId") String tenantId);
}
