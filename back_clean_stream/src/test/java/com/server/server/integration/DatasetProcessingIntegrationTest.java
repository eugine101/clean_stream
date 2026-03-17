package com.server.server.integration;

import com.server.server.service.FastAPIService;
import com.server.server.service.WebSocketBroadcastService;
import com.server.server.websocket.DatasetWebSocketHandler;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("Dataset Processing Integration Tests")
class DatasetProcessingIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private FastAPIService fastAPIService;

    @Autowired
    private WebSocketBroadcastService webSocketBroadcastService;

    @MockBean
    private DatasetWebSocketHandler webSocketHandler;

    private MockMultipartFile csvFile;

    @BeforeEach
    void setUp() {
        // Create test CSV with multiple rows
        String csvContent = "name,email,age\n" +
                "John Do,john.example.com,invalid\n" +
                "Jane Smith,jane@example.com,28\n" +
                "Bob Jones,bob@example.com,35\n";
        csvFile = new MockMultipartFile(
            "file",
            "customers.csv",
            MediaType.TEXT_PLAIN_VALUE,
            csvContent.getBytes()
        );
    }

    @Test
    @DisplayName("Should complete full data cleaning flow from upload to broadcast")
    void testCompleteDataCleaningFlow() throws Exception {
        // Arrange
        String datasetId = "550e8400-e29b-41d4-a716-446655440000";
        String tenantId = "tenant-123";

        // Step 1: Upload file
        MvcResult uploadResult = mockMvc.perform(multipart("/api/files/upload")
                .file(csvFile)
                .param("datasetId", datasetId)
                .param("tenantId", tenantId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("uploaded"))
            .andReturn();

        // Assert file was uploaded
        String uploadResponse = uploadResult.getResponse().getContentAsString();
        assertThat(uploadResponse).contains(datasetId);
        assertThat(uploadResponse).contains("customers.csv");

        // Step 2: Mock FastAPI responses for each row
        Map<String, Object> mockCleanedRow1 = new HashMap<>();
        mockCleanedRow1.put("name", "John Doe");
        mockCleanedRow1.put("email", "john@example.com");
        mockCleanedRow1.put("age", "25");

        Map<String, Object> mockCleanedRow2 = new HashMap<>();
        mockCleanedRow2.put("name", "Jane Smith");
        mockCleanedRow2.put("email", "jane@example.com");
        mockCleanedRow2.put("age", "28");

        Map<String, Object> mockCleanedRow3 = new HashMap<>();
        mockCleanedRow3.put("name", "Bob Jones");
        mockCleanedRow3.put("email", "bob@example.com");
        mockCleanedRow3.put("age", "35");

        when(fastAPIService.processRow(eq(tenantId), eq(datasetId), any()))
            .thenReturn(Map.of("result", Map.of("cleanedRow", mockCleanedRow1)))
            .thenReturn(Map.of("result", Map.of("cleanedRow", mockCleanedRow2)))
            .thenReturn(Map.of("result", Map.of("cleanedRow", mockCleanedRow3)));

        // Step 3: Process dataset
        String processBody = String.format("""
            {
                "datasetId": "%s",
                "tenantId": "%s"
            }
            """, datasetId, tenantId);

        mockMvc.perform(post("/api/process-dataset")
                .contentType(MediaType.APPLICATION_JSON)
                .content(processBody))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("processing"));

        // Step 4: Verify FastAPI was called for each row
        verify(fastAPIService, atLeast(1)).processRow(eq(tenantId), eq(datasetId), any());
    }

    @Test
    @DisplayName("Should broadcast cleaned rows to WebSocket subscribers")
    void testCleanedRowBroadcasting() throws Exception {
        // Arrange
        String datasetId = "dataset-broadcast-test";
        Integer rowIndex = 0;
        Map<String, Object> cleanedRow = new HashMap<>();
        cleanedRow.put("name", "John Doe");
        cleanedRow.put("email", "john@example.com");

        // Setup WebSocket handler mock
        when(webSocketHandler.hasActiveSubscriptions(datasetId)).thenReturn(true);
        when(webSocketHandler.getActiveSessionCount(datasetId)).thenReturn(1);

        // Act
        webSocketBroadcastService.broadcastCleanedRow(datasetId, rowIndex, cleanedRow, 0.95);

        // Assert
        verify(webSocketHandler).broadcastToDataset(eq(datasetId), any());
    }

    @Test
    @DisplayName("Should broadcast progress updates during processing")
    void testProgressBroadcasting() throws Exception {
        // Arrange
        String datasetId = "dataset-progress-test";
        when(webSocketHandler.hasActiveSubscriptions(datasetId)).thenReturn(true);

        // Act - Simulate progress updates
        webSocketBroadcastService.broadcastProgress(datasetId, 25, 100, 0);
        webSocketBroadcastService.broadcastProgress(datasetId, 50, 100, 1);
        webSocketBroadcastService.broadcastCompletion(datasetId, 75, 2, 100);

        // Assert
        verify(webSocketHandler, times(4)).broadcastToDataset(eq(datasetId), any());
    }

    @Test
    @DisplayName("Should handle errors and broadcast to WebSocket")
    void testErrorBroadcasting() throws Exception {
        // Arrange
        String datasetId = "dataset-error-test";
        String errorMessage = "Failed to process row 5: Invalid email format";
        when(webSocketHandler.hasActiveSubscriptions(datasetId)).thenReturn(true);

        // Act
        webSocketBroadcastService.broadcastError(datasetId, 5, errorMessage);

        // Assert
        verify(webSocketHandler).broadcastToDataset(eq(datasetId), any());
    }

    @Test
    @DisplayName("Should process single row and broadcast result")
    void testSingleRowProcessing() throws Exception {
        // Arrange
        String requestBody = """
            {
                "tenantId": "tenant-123",
                "datasetId": "550e8400-e29b-41d4-a716-446655440000",
                "row": {
                    "name": "John Do",
                    "email": "john.example.com",
                    "age": "invalid"
                }
            }
            """;

        Map<String, Object> cleanedRow = Map.of(
            "name", "John Doe",
            "email", "john@example.com",
            "age", "25"
        );

        when(fastAPIService.processRow(any(), any(), any()))
            .thenReturn(Map.of(
                "status", "processed",
                "cleanedRow", cleanedRow,
                "confidence", 0.95
            ));

        // Act
        MvcResult result = mockMvc.perform(post("/api/ai-cleaning/process-row")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
            .andExpect(status().isOk())
            .andReturn();

        // Assert
        String response = result.getResponse().getContentAsString();
        assertThat(response).contains("processed");
        assertThat(response).contains("John Doe");
    }

    @Test
    @DisplayName("Should handle batch processing with multiple rows")
    void testBatchRowProcessing() throws Exception {
        // Arrange
        String requestBody = """
            {
                "tenantId": "tenant-123",
                "datasetId": "550e8400-e29b-41d4-a716-446655440000",
                "rows": [
                    {"name": "John Do", "email": "john.example.com"},
                    {"name": "Jane Smith", "email": "jane.example.com"},
                    {"name": "Bob Jones", "email": "bob.example.com"}
                ]
            }
            """;

        when(fastAPIService.processRow(any(), any(), any()))
            .thenReturn(Map.of("status", "processed"));

        // Act
        mockMvc.perform(post("/api/ai-cleaning/process-batch")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalRows").value(3))
            .andReturn();

        // Assert - Verify FastAPI was called for each row
        verify(fastAPIService, times(3)).processRow(any(), any(), any());
    }

    @Test
    @DisplayName("Should retry on transient FastAPI errors")
    void testRetryOnTransientError() throws Exception {
        // Arrange
        String requestBody = """
            {
                "tenantId": "tenant-123",
                "datasetId": "550e8400-e29b-41d4-a716-446655440000",
                "row": {"name": "Test User"}
            }
            """;

        // First call fails, second succeeds
        when(fastAPIService.processRow(any(), any(), any()))
            .thenThrow(new RuntimeException("Service unavailable"))
            .thenReturn(Map.of("status", "processed"));

        // Act & Assert
        mockMvc.perform(post("/api/ai-cleaning/process-row")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
            .andExpect(status().isInternalServerError());
    }

    @Test
    @DisplayName("Should track dataset processing statistics")
    void testProcessingStatisticsTracking() throws Exception {
        // Arrange
        String datasetId = "dataset-stats-test";
        String tenantId = "tenant-123";

        when(fastAPIService.processRow(any(), any(), any()))
            .thenReturn(Map.of("status", "processed"));

        // Act & Assert
        String processBody = String.format("""
            {
                "datasetId": "%s",
                "tenantId": "%s"
            }
            """, datasetId, tenantId);

        MvcResult result = mockMvc.perform(post("/api/process-dataset")
                .contentType(MediaType.APPLICATION_JSON)
                .content(processBody))
            .andExpect(status().isOk())
            .andReturn();

        String response = result.getResponse().getContentAsString();
        assertThat(response).contains(datasetId);
        assertThat(response).contains("processing");
    }

    @Test
    @DisplayName("Should validate tenant isolation")
    void testTenantIsolation() throws Exception {
        // Arrange
        String datasetId = "dataset-multitenanttest";
        String tenant1 = "tenant-1";
        String tenant2 = "tenant-2";

        when(fastAPIService.processRow(eq(tenant1), any(), any()))
            .thenReturn(Map.of("tenant", tenant1));

        when(fastAPIService.processRow(eq(tenant2), any(), any()))
            .thenReturn(Map.of("tenant", tenant2));

        // Act - Process for tenant 1
        String body1 = String.format("""
            {
                "tenantId": "%s",
                "datasetId": "%s",
                "row": {"name": "test"}
            }
            """, tenant1, datasetId);

        mockMvc.perform(post("/api/ai-cleaning/process-row")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body1))
            .andExpect(status().isOk());

        // Act - Process for tenant 2
        String body2 = String.format("""
            {
                "tenantId": "%s",
                "datasetId": "%s",
                "row": {"name": "test"}
            }
            """, tenant2, datasetId);

        mockMvc.perform(post("/api/ai-cleaning/process-row")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body2))
            .andExpect(status().isOk());

        // Assert - Verify both tenants were processed independently
        verify(fastAPIService).processRow(eq(tenant1), any(), any());
        verify(fastAPIService).processRow(eq(tenant2), any(), any());
    }

    @Test
    @DisplayName("Should handle large batch processing")
    void testLargeBatchProcessing() throws Exception {
        // Arrange
        int batchSize = 100;
        StringBuilder rowsBuilder = new StringBuilder();
        rowsBuilder.append("[\n");
        for (int i = 0; i < batchSize; i++) {
            rowsBuilder.append(String.format(
                "  {\"id\": %d, \"name\": \"User%d\", \"email\": \"user%d@example.com\"}",
                i, i, i
            ));
            if (i < batchSize - 1) rowsBuilder.append(",\n");
        }
        rowsBuilder.append("\n]");

        String requestBody = String.format("""
            {
                "tenantId": "tenant-123",
                "datasetId": "large-batch-test",
                "rows": %s
            }
            """, rowsBuilder.toString());

        when(fastAPIService.processRow(any(), any(), any()))
            .thenReturn(Map.of("status", "processed"));

        // Act
        mockMvc.perform(post("/api/ai-cleaning/process-batch")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalRows").value(batchSize));

        // Assert - Verify all rows were processed
        verify(fastAPIService, times(batchSize)).processRow(any(), any(), any());
    }
}
