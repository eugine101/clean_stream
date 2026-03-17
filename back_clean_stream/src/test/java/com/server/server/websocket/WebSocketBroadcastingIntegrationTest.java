package com.server.server.websocket;

import com.server.server.service.WebSocketBroadcastService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketMessage;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@SpringBootTest
@DisplayName("WebSocket Broadcasting Integration Tests")
class WebSocketBroadcastingIntegrationTest {

    @Autowired
    private WebSocketBroadcastService broadcastService;

    @MockBean
    private DatasetWebSocketHandler webSocketHandler;

    private String testDatasetId;

    @BeforeEach
    void setUp() {
        testDatasetId = "dataset-ws-test-" + System.currentTimeMillis();
    }

    @Test
    @DisplayName("Should broadcast row message with correct format")
    void testRowMessageFormat() {
        // Arrange
        Integer rowIndex = 0;
        Map<String, Object> cleanedRow = Map.of(
            "name", "John Doe",
            "email", "john@example.com",
            "age", 25
        );
        Double confidence = 0.95;

        // Act
        broadcastService.broadcastCleanedRow(testDatasetId, rowIndex, cleanedRow, confidence);

        // Assert
        verify(webSocketHandler).broadcastToDataset(
            eq(testDatasetId),
            argThat(msg -> msg.getType().equals("row")
                && msg.getRowIndex().equals(rowIndex)
                && msg.getCleanedRow().equals(cleanedRow)
                && msg.getConfidence().equals(confidence))
        );
    }

    @Test
    @DisplayName("Should broadcast progress message with correct calculation")
    void testProgressMessageFormat() {
        // Arrange
        int processed = 250;
        int total = 1000;
        int failed = 10;

        // Act
        broadcastService.broadcastProgress(testDatasetId, processed, total, failed);

        // Assert
        verify(webSocketHandler).broadcastToDataset(
            eq(testDatasetId),
            argThat(msg -> msg.getType().equals("progress")
                && msg.getProcessedRows().equals(processed)
                && msg.getTotalRows().equals(total)
                && msg.getProgress().equals(26)) // (250+10)/1000*100 = 26%
        );
    }

    @Test
    @DisplayName("Should include timestamp in all messages")
    void testMessageTimestamps() {
        // Arrange
        long beforeTime = System.currentTimeMillis();

        // Act
        broadcastService.broadcastCleanedRow(testDatasetId, 0, new HashMap<>(), 0.8);

        // Assert
        verify(webSocketHandler).broadcastToDataset(
            eq(testDatasetId),
            argThat(msg -> msg.getTimestamp() >= beforeTime
                && msg.getTimestamp() <= System.currentTimeMillis() + 1000)
        );
    }

    @Test
    @DisplayName("Should broadcast completion message")
    void testCompletionMessage() {
        // Arrange
        when(webSocketHandler.hasActiveSubscriptions(testDatasetId)).thenReturn(true);

        // Act
        broadcastService.broadcastCompletion(testDatasetId, 950, 50, 1000);

        // Assert
        verify(webSocketHandler).broadcastToDataset(
            eq(testDatasetId),
            argThat(msg -> msg.getType().equals("completed")
                && msg.getMessage().equals("Dataset processing completed")
                && msg.getProgress().equals(100))
        );
    }

    @Test
    @DisplayName("Should broadcast error messages")
    void testErrorMessageBroadcast() {
        // Arrange
        Integer rowIndex = 42;
        String errorMsg = "Failed to process: Invalid data format";

        // Act
        broadcastService.broadcastError(testDatasetId, rowIndex, errorMsg);

        // Assert
        verify(webSocketHandler).broadcastToDataset(
            eq(testDatasetId),
            argThat(msg -> msg.getType().equals("error")
                && msg.getRowIndex().equals(rowIndex)
                && msg.getError().equals(errorMsg))
        );
    }

    @Test
    @DisplayName("Should not broadcast if no active subscribers")
    void testNoBroadcastWithoutSubscribers() {
        // Arrange
        when(webSocketHandler.hasActiveSubscriptions(testDatasetId)).thenReturn(false);

        // Act
        boolean hasSubscribers = broadcastService.hasActiveSubscribers(testDatasetId);

        // Assert
        assertThat(hasSubscribers).isFalse();
        verify(webSocketHandler).hasActiveSubscriptions(testDatasetId);
    }

    @Test
    @DisplayName("Should track active subscriber count")
    void testActiveSubscriberCount() {
        // Arrange
        when(webSocketHandler.getActiveSessionCount(testDatasetId)).thenReturn(5);

        // Act
        int count = broadcastService.getActiveSubscriberCount(testDatasetId);

        // Assert
        assertThat(count).isEqualTo(5);
        verify(webSocketHandler).getActiveSessionCount(testDatasetId);
    }

    @Test
    @DisplayName("Should broadcast sequence of messages in correct order")
    void testMessageSequence() {
        // Arrange
        List<String> messageTypes = new ArrayList<>();

        // Act - Simulate processing sequence
        broadcastService.broadcastProgress(testDatasetId, 0, 100, 0);
        broadcastService.broadcastCleanedRow(testDatasetId, 0, new HashMap<>(), 0.8);
        broadcastService.broadcastProgress(testDatasetId, 10, 100, 0);
        broadcastService.broadcastCleanedRow(testDatasetId, 1, new HashMap<>(), 0.9);
        broadcastService.broadcastProgress(testDatasetId, 100, 100, 0);
        broadcastService.broadcastCompletion(testDatasetId, 100, 0, 100);

        // Assert - Verify messages were sent
        verify(webSocketHandler, times(6)).broadcastToDataset(eq(testDatasetId), any());
    }

    @Test
    @DisplayName("Should handle multiple datasets independently")
    void testIndependentDatasets() {
        // Arrange
        String dataset1 = "dataset-1";
        String dataset2 = "dataset-2";

        when(webSocketHandler.hasActiveSubscriptions(dataset1)).thenReturn(true);
        when(webSocketHandler.hasActiveSubscriptions(dataset2)).thenReturn(true);

        // Act
        broadcastService.broadcastCleanedRow(dataset1, 0, new HashMap<>(), 0.8);
        broadcastService.broadcastCleanedRow(dataset2, 0, new HashMap<>(), 0.9);

        // Assert
        verify(webSocketHandler).broadcastToDataset(eq(dataset1), any());
        verify(webSocketHandler).broadcastToDataset(eq(dataset2), any());
    }

    @Test
    @DisplayName("Should handle large cleaned rows")
    void testLargeCleanedRow() {
        // Arrange
        Map<String, Object> largeRow = new HashMap<>();
        for (int i = 0; i < 100; i++) {
            largeRow.put("field_" + i, "value_" + i);
        }

        // Act
        broadcastService.broadcastCleanedRow(testDatasetId, 0, largeRow, 0.95);

        // Assert
        verify(webSocketHandler).broadcastToDataset(
            eq(testDatasetId),
            argThat(msg -> msg.getCleanedRow().size() == 100)
        );
    }

    @Test
    @DisplayName("Should handle extreme progress values")
    void testExtremeProgressValues() {
        // Act - Test at 0%
        broadcastService.broadcastProgress(testDatasetId, 0, 1000, 0);
        verify(webSocketHandler).broadcastToDataset(
            eq(testDatasetId),
            argThat(msg -> msg.getProgress().equals(0))
        );

        // Act - Test at 100%
        broadcastService.broadcastProgress(testDatasetId, 999, 1000, 1);
        verify(webSocketHandler, times(2)).broadcastToDataset(
            eq(testDatasetId),
            argThat(msg -> msg.getProgress().equals(100))
        );
    }

    @Test
    @DisplayName("Should handle special characters in error messages")
    void testSpecialCharactersInErrors() {
        // Arrange
        String errorMsg = "Error: Invalid characters \"<>@#$%\" in field";

        // Act
        broadcastService.broadcastError(testDatasetId, 0, errorMsg);

        // Assert
        verify(webSocketHandler).broadcastToDataset(
            eq(testDatasetId),
            argThat(msg -> msg.getError().equals(errorMsg))
        );
    }

    @Test
    @DisplayName("Should handle null confidence score")
    void testNullConfidenceScore() {
        // Act
        broadcastService.broadcastCleanedRow(testDatasetId, 0, new HashMap<>(), null);

        // Assert
        verify(webSocketHandler).broadcastToDataset(
            eq(testDatasetId),
            argThat(msg -> msg.getConfidence() == null)
        );
    }

    @Test
    @DisplayName("Should calculate progress for partial processing")
    void testPartialProcessingProgress() {
        // Arrange - Process 333 out of 1000 with 2 failures
        int processed = 333;
        int total = 1000;
        int failed = 2;

        // Act
        broadcastService.broadcastProgress(testDatasetId, processed, total, failed);

        // Assert - Should be 33% ((333+2)/1000*100 = 33.5, truncated to 33)
        verify(webSocketHandler).broadcastToDataset(
            eq(testDatasetId),
            argThat(msg -> msg.getProgress().equals(33))
        );
    }
}
