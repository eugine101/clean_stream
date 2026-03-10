package com.server.server.service;

import com.server.server.websocket.*;
import lombok.extern.slf4j.Slf4j;
import lombok.Builder;
import org.springframework.stereotype.Service;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
public class WebSocketBroadcastService {
    
    private final DatasetWebSocketHandler webSocketHandler;
    
    public WebSocketBroadcastService(DatasetWebSocketHandler webSocketHandler) {
        this.webSocketHandler = webSocketHandler;
    }
    
    /**
     * Broadcast cleaned row to all WebSocket subscribers for a dataset
     */
    public void broadcastCleanedRow(
        String datasetId,
        Integer rowIndex,
        Map<String, Object> cleanedRow,
        Double confidence) {
        
        log.debug("Broadcasting cleaned row to dataset: {}, rowIndex: {}", datasetId, rowIndex);
        
        WebSocketMessage message = WebSocketMessage.builder()
            .type("row")
            .datasetId(datasetId)
            .rowIndex(rowIndex)
            .cleanedRow(cleanedRow)
            .confidence(confidence)
            .timestamp(System.currentTimeMillis())
            .build();
        
        webSocketHandler.broadcastToDataset(datasetId, message);
    }
    
    /**
     * Broadcast progress update to all WebSocket subscribers for a dataset
     */
    public void broadcastProgress(
        String datasetId,
        Integer processedRows,
        Integer totalRows,
        Integer failedRows) {
        
        int progress = totalRows > 0 ? (int) ((double) (processedRows + failedRows) / totalRows * 100) : 0;
        
        log.debug("Broadcasting progress to dataset: {}, progress: {}%", datasetId, progress);
        
        WebSocketMessage message = WebSocketMessage.builder()
            .type("progress")
            .datasetId(datasetId)
            .processedRows(processedRows)
            .totalRows(totalRows)
            .failedRows(failedRows)
            .progress(progress)
            .timestamp(System.currentTimeMillis())
            .build();
        
        webSocketHandler.broadcastToDataset(datasetId, message);
    }
    
    /**
     * Broadcast completion message to all WebSocket subscribers
     */
    public void broadcastCompletion(
        String datasetId,
        Integer totalProcessed,
        Integer totalFailed,
        Integer totalRows) {
        
        log.info("Broadcasting completion to dataset: {}", datasetId);
        
        WebSocketMessage message = WebSocketMessage.builder()
            .type("completed")
            .datasetId(datasetId)
            .message("Dataset processing completed")
            .processedRows(totalProcessed)
            .failedRows(totalFailed)
            .totalRows(totalRows)
            .progress(100)
            .timestamp(System.currentTimeMillis())
            .build();
        
        webSocketHandler.broadcastToDataset(datasetId, message);
    }
    
    /**
     * Broadcast error message to all WebSocket subscribers
     */
    public void broadcastError(
        String datasetId,
        Integer rowIndex,
        String errorMessage) {
        
        log.error("Broadcasting error to dataset: {}, rowIndex: {}, error: {}",
            datasetId, rowIndex, errorMessage);
        
        WebSocketMessage message = WebSocketMessage.builder()
            .type("error")
            .datasetId(datasetId)
            .rowIndex(rowIndex)
            .error(errorMessage)
            .timestamp(System.currentTimeMillis())
            .build();
        
        webSocketHandler.broadcastToDataset(datasetId, message);
    }
    
    /**
     * Check if dataset has active WebSocket subscribers
     */
    public boolean hasActiveSubscribers(String datasetId) {
        return webSocketHandler.hasActiveSubscriptions(datasetId);
    }
    
    /**
     * Get count of active subscribers for a dataset
     */
    public int getActiveSubscriberCount(String datasetId) {
        return webSocketHandler.getActiveSessionCount(datasetId);
    }
}
