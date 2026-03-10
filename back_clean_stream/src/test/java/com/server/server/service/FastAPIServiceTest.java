package com.server.server.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@DisplayName("FastAPIService Tests")
class FastAPIServiceTest {

    @Mock
    private RestTemplate restTemplate;

    private ObjectMapper objectMapper;
    private FastAPIService service;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        objectMapper = new ObjectMapper();
        service = new FastAPIService(restTemplate, objectMapper);
        // Set the FastAPI base URL for testing
        ReflectionTestUtils.setField(service, "fastApiBaseUrl", "http://localhost:8000");
    }

    @Test
    @DisplayName("Should process single row successfully")
    void testProcessRowSuccess() {
        // Arrange
        String tenantId = "tenant-123";
        String datasetId = "dataset-456";
        Map<String, Object> row = new HashMap<>();
        row.put("name", "John Do");
        row.put("email", "john.example.com");

        String responseJson = """
            {
                "tenantId": "tenant-123",
                "datasetId": "dataset-456",
                "result": {
                    "id": 1,
                    "status": "processed",
                    "suggestion": {
                        "field": "email",
                        "issue_type": "invalid_format",
                        "suggested_fix": "john@example.com",
                        "confidence": 0.95
                    }
                }
            }
            """;

        when(restTemplate.postForEntity(
            eq("http://localhost:8000/process-row"),
            any(),
            eq(String.class)
        )).thenReturn(new ResponseEntity<>(responseJson, HttpStatus.OK));

        // Act
        Map<String, Object> result = service.processRow(tenantId, datasetId, row);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.get("tenantId")).isEqualTo(tenantId);
        assertThat(result.get("datasetId")).isEqualTo(datasetId);
        assertThat(result).containsKey("result");

        verify(restTemplate, times(1)).postForEntity(
            eq("http://localhost:8000/process-row"),
            any(),
            eq(String.class)
        );
    }

    @Test
    @DisplayName("Should throw exception on FastAPI error response")
    void testProcessRowFailureNon2xx() {
        // Arrange
        String tenantId = "tenant-123";
        String datasetId = "dataset-456";
        Map<String, Object> row = new HashMap<>();

        when(restTemplate.postForEntity(
            anyString(),
            any(),
            eq(String.class)
        )).thenReturn(new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR));

        // Act & Assert
        assertThatThrownBy(() -> service.processRow(tenantId, datasetId, row))
            .isInstanceOf(RuntimeException.class)
            .hasMessageContaining("FastAPI processing failed");
    }

    @Test
    @DisplayName("Should throw exception on network error")
    void testProcessRowNetworkError() {
        // Arrange
        String tenantId = "tenant-123";
        String datasetId = "dataset-456";
        Map<String, Object> row = new HashMap<>();

        when(restTemplate.postForEntity(
            anyString(),
            any(),
            eq(String.class)
        )).thenThrow(new RestClientException("Connection refused"));

        // Act & Assert
        assertThatThrownBy(() -> service.processRow(tenantId, datasetId, row))
            .isInstanceOf(RuntimeException.class)
            .hasMessageContaining("Failed to process row");
    }

    @Test
    @DisplayName("Should process dataset batch")
    void testProcessDatasetSuccess() {
        // Arrange
        String tenantId = "tenant-123";
        String datasetId = "dataset-789";
        List<Map<String, Object>> rows = List.of(
            Map.of("name", "John", "email", "john@example.com"),
            Map.of("name", "Jane", "email", "jane@example.com")
        );

        String responseJson = """
            {
                "tenantId": "tenant-123",
                "datasetId": "dataset-789",
                "status": "processing",
                "message": "Dataset batch processing started",
                "taskId": "task-xyz"
            }
            """;

        when(restTemplate.postForEntity(
            eq("http://localhost:8000/process-dataset"),
            any(),
            eq(String.class)
        )).thenReturn(new ResponseEntity<>(responseJson, HttpStatus.OK));

        // Act
        Map<String, Object> result = service.processDataset(tenantId, datasetId, rows);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.get("tenantId")).isEqualTo(tenantId);
        assertThat(result.get("status")).isEqualTo("processing");
    }

    @Test
    @DisplayName("Should handle response with cleaning suggestions")
    void testProcessRowWithSuggestions() {
        // Arrange
        String tenantId = "tenant-123";
        String datasetId = "dataset-456";
        Map<String, Object> row = Map.of(
            "name", "John Do",
            "email", "john.example",
            "age", "invalid"
        );

        String responseJson = """
            {
                "tenantId": "tenant-123",
                "result": {
                    "status": "processed",
                    "suggestions": [
                        {
                            "field": "name",
                            "issue": "Possible typo",
                            "suggestion": "John Doe",
                            "confidence": 0.92
                        },
                        {
                            "field": "email",
                            "issue": "Missing domain",
                            "suggestion": "john@example.com",
                            "confidence": 0.88
                        },
                        {
                            "field": "age",
                            "issue": "Invalid type",
                            "suggestion": "25",
                            "confidence": 0.75
                        }
                    ]
                }
            }
            """;

        when(restTemplate.postForEntity(
            anyString(),
            any(),
            eq(String.class)
        )).thenReturn(new ResponseEntity<>(responseJson, HttpStatus.OK));

        // Act
        Map<String, Object> result = service.processRow(tenantId, datasetId, row);

        // Assert
        assertThat(result).isNotNull();
        Map<String, Object> resultData = (Map<String, Object>) result.get("result");
        assertThat(resultData.get("status")).isEqualTo("processed");
        assertThat(resultData).containsKey("suggestions");
    }

    @Test
    @DisplayName("Should handle JSON parsing error")
    void testProcessRowJsonParseError() {
        // Arrange
        String tenantId = "tenant-123";
        String datasetId = "dataset-456";
        Map<String, Object> row = new HashMap<>();

        when(restTemplate.postForEntity(
            anyString(),
            any(),
            eq(String.class)
        )).thenReturn(new ResponseEntity<>("{invalid json}", HttpStatus.OK));

        // Act & Assert
        assertThatThrownBy(() -> service.processRow(tenantId, datasetId, row))
            .isInstanceOf(RuntimeException.class)
            .hasMessageContaining("Failed to process row");
    }

    @Test
    @DisplayName("Should preserve row data in request")
    void testProcessRowPreservesData() {
        // Arrange
        String tenantId = "tenant-123";
        String datasetId = "dataset-456";
        Map<String, Object> row = new HashMap<>();
        row.put("id", 123);
        row.put("name", "John Doe");
        row.put("email", "john@example.com");
        row.put("age", 25);
        row.put("address", "123 Main St");

        String responseJson = """
            {
                "result": {
                    "status": "processed"
                }
            }
            """;

        when(restTemplate.postForEntity(
            anyString(),
            any(),
            eq(String.class)
        )).thenReturn(new ResponseEntity<>(responseJson, HttpStatus.OK));

        // Act
        service.processRow(tenantId, datasetId, row);

        // Assert
        verify(restTemplate).postForEntity(
            anyString(),
            argThat(request -> {
                // Verify request contains all row fields
                String body = ((org.springframework.http.HttpEntity<?>) request).getBody().toString();
                return body.contains("John Doe") && 
                       body.contains("john@example.com") &&
                       body.contains("123");
            }),
            eq(String.class)
        );
    }

    @Test
    @DisplayName("Should handle empty row")
    void testProcessEmptyRow() {
        // Arrange
        String tenantId = "tenant-123";
        String datasetId = "dataset-456";
        Map<String, Object> emptyRow = new HashMap<>();

        String responseJson = """
            {
                "result": {
                    "status": "processed"
                }
            }
            """;

        when(restTemplate.postForEntity(
            anyString(),
            any(),
            eq(String.class)
        )).thenReturn(new ResponseEntity<>(responseJson, HttpStatus.OK));

        // Act
        Map<String, Object> result = service.processRow(tenantId, datasetId, emptyRow);

        // Assert
        assertThat(result).isNotNull();
    }

    @Test
    @DisplayName("Should handle 400 Bad Request")
    void testProcessRow400Error() {
        // Arrange
        String tenantId = "tenant-123";
        String datasetId = "dataset-456";
        Map<String, Object> row = new HashMap<>();

        when(restTemplate.postForEntity(
            anyString(),
            any(),
            eq(String.class)
        )).thenReturn(new ResponseEntity<>(HttpStatus.BAD_REQUEST));

        // Act & Assert
        assertThatThrownBy(() -> service.processRow(tenantId, datasetId, row))
            .isInstanceOf(RuntimeException.class)
            .hasMessageContaining("FastAPI processing failed");
    }

    @Test
    @DisplayName("Should handle 503 Service Unavailable")
    void testProcessRow503Error() {
        // Arrange
        String tenantId = "tenant-123";
        String datasetId = "dataset-456";
        Map<String, Object> row = new HashMap<>();

        when(restTemplate.postForEntity(
            anyString(),
            any(),
            eq(String.class)
        )).thenReturn(new ResponseEntity<>(HttpStatus.SERVICE_UNAVAILABLE));

        // Act & Assert
        assertThatThrownBy(() -> service.processRow(tenantId, datasetId, row))
            .isInstanceOf(RuntimeException.class);
    }

    @Test
    @DisplayName("Should use configured FastAPI base URL")
    void testCustomFastApiUrl() {
        // Arrange
        String customUrl = "http://custom-api:8000";
        ReflectionTestUtils.setField(service, "fastApiBaseUrl", customUrl);

        String tenantId = "tenant-123";
        String datasetId = "dataset-456";
        Map<String, Object> row = new HashMap<>();

        String responseJson = """
            {
                "result": {
                    "status": "processed"
                }
            }
            """;

        when(restTemplate.postForEntity(
            eq(customUrl + "/process-row"),
            any(),
            eq(String.class)
        )).thenReturn(new ResponseEntity<>(responseJson, HttpStatus.OK));

        // Act
        service.processRow(tenantId, datasetId, row);

        // Assert
        verify(restTemplate).postForEntity(
            eq(customUrl + "/process-row"),
            any(),
            eq(String.class)
        );
    }
}
