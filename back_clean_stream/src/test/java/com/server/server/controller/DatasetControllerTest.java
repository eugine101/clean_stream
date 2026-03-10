package com.server.server.controller;

import com.server.server.service.FastAPIService;
import com.server.server.service.WebSocketBroadcastService;
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

import java.util.HashMap;
import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("Dataset Controller Tests")
class DatasetControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private FastAPIService fastAPIService;

    @MockBean
    private WebSocketBroadcastService webSocketBroadcastService;

    private MockMultipartFile csvFile;

    @BeforeEach
    void setUp() {
        // Create a sample CSV file
        String csvContent = "name,email,age\n" +
                "John Do,john.example.com,invalid\n" +
                "Jane Smith,jane@example.com,28\n";
        csvFile = new MockMultipartFile(
            "file",
            "test-data.csv",
            MediaType.TEXT_PLAIN_VALUE,
            csvContent.getBytes()
        );
    }

    @Test
    @DisplayName("Should upload file successfully")
    void testUploadFileSuccess() throws Exception {
        // Arrange
        String datasetId = "550e8400-e29b-41d4-a716-446655440000";
        String tenantId = "tenant-123";

        // Act & Assert
        mockMvc.perform(multipart("/api/files/upload")
                .file(csvFile)
                .param("datasetId", datasetId)
                .param("tenantId", tenantId))
            .andDo(print())
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.datasetId").value(datasetId))
            .andExpect(jsonPath("$.fileName").value("test-data.csv"))
            .andExpect(jsonPath("$.status").value("uploaded"));
    }

    @Test
    @DisplayName("Should reject missing file parameter")
    void testUploadFileMissing() throws Exception {
        // Arrange
        String datasetId = "550e8400-e29b-41d4-a716-446655440000";
        String tenantId = "tenant-123";

        // Act & Assert
        mockMvc.perform(multipart("/api/files/upload")
                .param("datasetId", datasetId)
                .param("tenantId", tenantId))
            .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Should reject missing datasetId parameter")
    void testUploadFileMissingDatasetId() throws Exception {
        // Arrange
        String tenantId = "tenant-123";

        // Act & Assert
        mockMvc.perform(multipart("/api/files/upload")
                .file(csvFile)
                .param("tenantId", tenantId))
            .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Should process dataset successfully")
    void testProcessDatasetSuccess() throws Exception {
        // Arrange
        String datasetId = "550e8400-e29b-41d4-a716-446655440000";
        String tenantId = "tenant-123";

        String requestBody = String.format("""
            {
                "datasetId": "%s",
                "tenantId": "%s"
            }
            """, datasetId, tenantId);

        // Mock FastAPI response
        Map<String, Object> mockCleanedRow = new HashMap<>();
        mockCleanedRow.put("name", "John Doe");
        mockCleanedRow.put("email", "john@example.com");

        when(fastAPIService.processRow(any(), any(), any()))
            .thenReturn(Map.of("result", mockCleanedRow));

        // Act & Assert
        mockMvc.perform(post("/api/process-dataset")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
            .andDo(print())
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.datasetId").value(datasetId))
            .andExpect(jsonPath("$.status").value("processing"));

        verify(fastAPIService, atLeastOnce()).processRow(any(), any(), any());
    }

    @Test
    @DisplayName("Should return dataset info")
    void testGetDatasetInfo() throws Exception {
        // Arrange
        String datasetId = "550e8400-e29b-41d4-a716-446655440000";

        // Act & Assert
        mockMvc.perform(get("/api/datasets/{datasetId}", datasetId))
            .andDo(print())
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.datasetId").value(datasetId));
    }

    @Test
    @DisplayName("Should return results for dataset")
    void testGetDatasetResults() throws Exception {
        // Arrange
        String datasetId = "550e8400-e29b-41d4-a716-446655440000";

        // Act & Assert
        mockMvc.perform(get("/api/datasets/{datasetId}/results", datasetId))
            .andDo(print())
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.datasetId").value(datasetId));
    }

    @Test
    @DisplayName("Should process single row through AI cleaning endpoint")
    void testProcessRowEndpoint() throws Exception {
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

        Map<String, Object> mockResult = new HashMap<>();
        mockResult.put("status", "processed");
        mockResult.put("cleanedRow", Map.of(
            "name", "John Doe",
            "email", "john@example.com",
            "age", "25"
        ));

        when(fastAPIService.processRow(any(), any(), any())).thenReturn(mockResult);

        // Act & Assert
        mockMvc.perform(post("/api/ai-cleaning/process-row")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
            .andDo(print())
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("processed"))
            .andExpect(jsonPath("$.cleanedRow.name").value("John Doe"));

        verify(fastAPIService, times(1)).processRow(
            eq("tenant-123"),
            eq("550e8400-e29b-41d4-a716-446655440000"),
            any()
        );
    }

    @Test
    @DisplayName("Should return health status")
    void testHealthEndpoint() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/ai-cleaning/health"))
            .andDo(print())
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    @DisplayName("Should return API info")
    void testInfoEndpoint() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/ai-cleaning/info"))
            .andDo(print())
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.service").value("AI-Cleaning-Service"));
    }

    @Test
    @DisplayName("Should handle invalid request body")
    void testInvalidRequestBody() throws Exception {
        // Arrange
        String invalidRequestBody = "{invalid json}";

        // Act & Assert
        mockMvc.perform(post("/api/ai-cleaning/process-row")
                .contentType(MediaType.APPLICATION_JSON)
                .content(invalidRequestBody))
            .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Should handle FastAPI service error gracefully")
    void testProcessRowWhenFastAPIFails() throws Exception {
        // Arrange
        String requestBody = """
            {
                "tenantId": "tenant-123",
                "datasetId": "550e8400-e29b-41d4-a716-446655440000",
                "row": {"name": "Test"}
            }
            """;

        when(fastAPIService.processRow(any(), any(), any()))
            .thenThrow(new RuntimeException("FastAPI service unavailable"));

        // Act & Assert
        mockMvc.perform(post("/api/ai-cleaning/process-row")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
            .andDo(print())
            .andExpect(status().isInternalServerError());
    }

    @Test
    @DisplayName("Should process batch with multiple rows")
    void testProcessBatchEndpoint() throws Exception {
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

        Map<String, Object> mockResult = new HashMap<>();
        mockResult.put("totalRows", 3);
        mockResult.put("processedCount", 3);
        mockResult.put("errorCount", 0);

        when(fastAPIService.processRow(any(), any(), any())).thenReturn(
            Map.of("status", "processed")
        );

        // Act & Assert
        mockMvc.perform(post("/api/ai-cleaning/process-batch")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
            .andDo(print())
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalRows").value(3))
            .andExpect(jsonPath("$.processedCount").value(3))
            .andExpect(jsonPath("$.errorCount").value(0));
    }
}
