package com.server.server.websocket;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class WebSocketMessage {
    
    /**
     * Message type: "row", "progress", "completed", "error", "connected", "pong"
     */
    private String type;
    
    /**
     * Dataset ID this message relates to
     */
    private String datasetId;
    
    /**
     * Row index (for "row" type messages)
     */
    private Integer rowIndex;
    
    /**
     * Generic message text
     */
    private String message;
    
    /**
     * Cleaned row data (for "row" type messages)
     */
    private Map<String, Object> cleanedRow;
    
    /**
     * AI confidence score (0.0 - 1.0)
     */
    private Double confidence;
    
    /**
     * Overall dataset progress (0 - 100)
     */
    private Integer progress;
    
    /**
     * Processed row count
     */
    private Integer processedRows;
    
    /**
     * Total rows in dataset
     */
    private Integer totalRows;
    
    /**
     * Failed row count
     */
    private Integer failedRows;
    
    /**
     * Error message if applicable
     */
    private String error;
    
    /**
     * Timestamp (milliseconds since epoch)
     */
    private Long timestamp = System.currentTimeMillis();
}
