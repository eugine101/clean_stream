package com.server.server.service;

import com.server.server.websocket.DatasetWebSocketHandler;
import com.server.server.websocket.WebSocketMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@DisplayName("WebSocketBroadcastService Tests")
class WebSocketBroadcastServiceTest {

    @Mock
    private DatasetWebSocketHandler webSocketHandler;

    private WebSocketBroadcastService service;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        service = new WebSocketBroadcastService(webSocketHandler);
    }

    @Test
    @DisplayName("Should broadcast cleaned row with correct data")
    void testBroadcastCleanedRow() {
        // Arrange
        String datasetId = "dataset-123";
        Integer rowIndex = 0;
        Map<String, Object> cleanedRow = new HashMap<>();
        cleanedRow.put("name", "John Doe");
        cleanedRow.put("email", "john@example.com");
        Double confidence = 0.95;

        ArgumentCaptor<String> datasetCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<WebSocketMessage> messageCaptor = ArgumentCaptor.forClass(WebSocketMessage.class);

        // Act
        service.broadcastCleanedRow(datasetId, rowIndex, cleanedRow, confidence);

        // Assert
        verify(webSocketHandler, times(1)).broadcastToDataset(
            datasetCaptor.capture(),
            messageCaptor.capture()
        );

        String capturedDatasetId = datasetCaptor.getValue();
        WebSocketMessage capturedMessage = messageCaptor.getValue();

        assertThat(capturedDatasetId).isEqualTo(datasetId);
        assertThat(capturedMessage.getType()).isEqualTo("row");
        assertThat(capturedMessage.getDatasetId()).isEqualTo(datasetId);
        assertThat(capturedMessage.getRowIndex()).isEqualTo(rowIndex);
        assertThat(capturedMessage.getCleanedRow()).isEqualTo(cleanedRow);
        assertThat(capturedMessage.getConfidence()).isEqualTo(confidence);
        assertThat(capturedMessage.getTimestamp()).isNotNull();
    }

    @Test
    @DisplayName("Should broadcast progress update")
    void testBroadcastProgress() {
        // Arrange
        String datasetId = "dataset-456";
        Integer processedRows = 50;
        Integer totalRows = 100;
        Integer failedRows = 2;

        ArgumentCaptor<WebSocketMessage> messageCaptor = ArgumentCaptor.forClass(WebSocketMessage.class);

        // Act
        service.broadcastProgress(datasetId, processedRows, totalRows, failedRows);

        // Assert
        verify(webSocketHandler, times(1)).broadcastToDataset(
            eq(datasetId),
            messageCaptor.capture()
        );

        WebSocketMessage message = messageCaptor.getValue();
        assertThat(message.getType()).isEqualTo("progress");
        assertThat(message.getProcessedRows()).isEqualTo(processedRows);
        assertThat(message.getTotalRows()).isEqualTo(totalRows);
        assertThat(message.getFailedRows()).isEqualTo(failedRows);
        assertThat(message.getProgress()).isEqualTo(52); // (50+2)/100*100 = 52%
    }

    @Test
    @DisplayName("Should calculate progress percentage correctly")
    void testProgressPercentageCalculation() {
        // Arrange
        String datasetId = "dataset-789";
        Integer processedRows = 33;
        Integer totalRows = 100;
        Integer failedRows = 1;

        ArgumentCaptor<WebSocketMessage> messageCaptor = ArgumentCaptor.forClass(WebSocketMessage.class);

        // Act
        service.broadcastProgress(datasetId, processedRows, totalRows, failedRows);

        // Assert
        verify(webSocketHandler).broadcastToDataset(eq(datasetId), messageCaptor.capture());
        WebSocketMessage message = messageCaptor.getValue();
        assertThat(message.getProgress()).isEqualTo(34); // (33+1)/100*100 = 34%
    }

    @Test
    @DisplayName("Should broadcast completion message")
    void testBroadcastCompletion() {
        // Arrange
        String datasetId = "dataset-complete";
        Integer totalProcessed = 1000;
        Integer totalFailed = 5;
        Integer totalRows = 1005;

        ArgumentCaptor<WebSocketMessage> messageCaptor = ArgumentCaptor.forClass(WebSocketMessage.class);

        // Act
        service.broadcastCompletion(datasetId, totalProcessed, totalFailed, totalRows);

        // Assert
        verify(webSocketHandler).broadcastToDataset(eq(datasetId), messageCaptor.capture());
        
        WebSocketMessage message = messageCaptor.getValue();
        assertThat(message.getType()).isEqualTo("completed");
        assertThat(message.getMessage()).isEqualTo("Dataset processing completed");
        assertThat(message.getProcessedRows()).isEqualTo(totalProcessed);
        assertThat(message.getFailedRows()).isEqualTo(totalFailed);
        assertThat(message.getTotalRows()).isEqualTo(totalRows);
        assertThat(message.getProgress()).isEqualTo(100);
    }

    @Test
    @DisplayName("Should broadcast error message")
    void testBroadcastError() {
        // Arrange
        String datasetId = "dataset-error";
        Integer rowIndex = 42;
        String errorMessage = "Failed to clean row: Invalid email format";

        ArgumentCaptor<WebSocketMessage> messageCaptor = ArgumentCaptor.forClass(WebSocketMessage.class);

        // Act
        service.broadcastError(datasetId, rowIndex, errorMessage);

        // Assert
        verify(webSocketHandler).broadcastToDataset(eq(datasetId), messageCaptor.capture());
        
        WebSocketMessage message = messageCaptor.getValue();
        assertThat(message.getType()).isEqualTo("error");
        assertThat(message.getDatasetId()).isEqualTo(datasetId);
        assertThat(message.getRowIndex()).isEqualTo(rowIndex);
        assertThat(message.getError()).isEqualTo(errorMessage);
        assertThat(message.getTimestamp()).isNotNull();
    }

    @Test
    @DisplayName("Should check for active subscribers")
    void testHasActiveSubscribers() {
        // Arrange
        String datasetId = "dataset-active";
        when(webSocketHandler.hasActiveSubscriptions(datasetId)).thenReturn(true);

        // Act
        boolean hasSubscribers = service.hasActiveSubscribers(datasetId);

        // Assert
        assertThat(hasSubscribers).isTrue();
        verify(webSocketHandler).hasActiveSubscriptions(datasetId);
    }

    @Test
    @DisplayName("Should return false when no active subscribers")
    void testNoActiveSubscribers() {
        // Arrange
        String datasetId = "dataset-inactive";
        when(webSocketHandler.hasActiveSubscriptions(datasetId)).thenReturn(false);

        // Act
        boolean hasSubscribers = service.hasActiveSubscribers(datasetId);

        // Assert
        assertThat(hasSubscribers).isFalse();
        verify(webSocketHandler).hasActiveSubscriptions(datasetId);
    }

    @Test
    @DisplayName("Should get active subscriber count")
    void testGetActiveSubscriberCount() {
        // Arrange
        String datasetId = "dataset-count";
        int expectedCount = 5;
        when(webSocketHandler.getActiveSessionCount(datasetId)).thenReturn(expectedCount);

        // Act
        int count = service.getActiveSubscriberCount(datasetId);

        // Assert
        assertThat(count).isEqualTo(expectedCount);
        verify(webSocketHandler).getActiveSessionCount(datasetId);
    }

    @Test
    @DisplayName("Should include timestamp in all messages")
    void testMessageTimestamps() {
        // Arrange
        String datasetId = "dataset-timestamp";
        long beforeTime = System.currentTimeMillis();

        ArgumentCaptor<WebSocketMessage> messageCaptor = ArgumentCaptor.forClass(WebSocketMessage.class);

        // Act
        service.broadcastCompletion(datasetId, 100, 0, 100);

        // Assert
        verify(webSocketHandler).broadcastToDataset(eq(datasetId), messageCaptor.capture());
        long afterTime = System.currentTimeMillis();
        
        WebSocketMessage message = messageCaptor.getValue();
        assertThat(message.getTimestamp()).isBetween(beforeTime, afterTime + 1000);
    }

    @Test
    @DisplayName("Should handle empty cleaned row")
    void testBroadcastEmptyRow() {
        // Arrange
        String datasetId = "dataset-empty";
        Integer rowIndex = 10;
        Map<String, Object> emptyRow = new HashMap<>();
        Double confidence = 0.5;

        ArgumentCaptor<WebSocketMessage> messageCaptor = ArgumentCaptor.forClass(WebSocketMessage.class);

        // Act
        service.broadcastCleanedRow(datasetId, rowIndex, emptyRow, confidence);

        // Assert
        verify(webSocketHandler).broadcastToDataset(eq(datasetId), messageCaptor.capture());
        WebSocketMessage message = messageCaptor.getValue();
        assertThat(message.getCleanedRow()).isNotNull();
        assertThat(message.getCleanedRow()).isEmpty();
    }

    @Test
    @DisplayName("Should handle zero progress")
    void testZeroProgress() {
        // Arrange
        String datasetId = "dataset-zero";

        ArgumentCaptor<WebSocketMessage> messageCaptor = ArgumentCaptor.forClass(WebSocketMessage.class);

        // Act
        service.broadcastProgress(datasetId, 0, 100, 0);

        // Assert
        verify(webSocketHandler).broadcastToDataset(eq(datasetId), messageCaptor.capture());
        WebSocketMessage message = messageCaptor.getValue();
        assertThat(message.getProgress()).isEqualTo(0);
    }
}
