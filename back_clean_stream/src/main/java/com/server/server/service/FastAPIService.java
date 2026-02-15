package com.server.server.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

/**
 * Service to integrate with FastAPI AI Engine for data cleaning suggestions.
 * Handles row processing and RAG context retrieval.
 */
@Slf4j
@Service
public class FastAPIService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${fastapi.base-url:http://localhost:8000}")
    private String fastApiBaseUrl;

    public FastAPIService(RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    /**
     * Process a single data row through FastAPI AI Engine.
     * Generates embeddings, retrieves RAG context, and generates cleaning suggestions.
     *
     * @param tenantId the tenant identifier for multi-tenant isolation
     * @param datasetId the UUID of the dataset
     * @param row the data row to process (as a Map)
     * @return processing result with cleaning suggestions
     */
    public Map<String, Object> processRow(String tenantId, String datasetId, Map<String, Object> row) {
        try {
            log.info("Sending row to FastAPI for tenant: {}, dataset: {}", tenantId, datasetId);

            // Build request payload
            Map<String, Object> payload = new HashMap<>();
            payload.put("tenantId", tenantId);
            payload.put("datasetId", datasetId);
            payload.put("row", row);

            // Create HTTP headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            // Send POST request to FastAPI /process-row endpoint
            String url = fastApiBaseUrl + "/process-row";
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);

            log.debug("Calling FastAPI endpoint: {}", url);
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);

            if (!response.getStatusCode().is2xxSuccessful()) {
                log.error("FastAPI returned error status: {}", response.getStatusCode());
                throw new RuntimeException("FastAPI processing failed: " + response.getStatusCode());
            }

            // Parse response
            JsonNode responseNode = objectMapper.readTree(response.getBody());
            log.info("Successfully processed row, got response");

            return objectMapper.convertValue(responseNode, Map.class);

        } catch (Exception e) {
            log.error("Error processing row via FastAPI: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to process row: " + e.getMessage(), e);
        }
    }

    /**
     * Check health status of FastAPI service
     *
     * @return true if FastAPI is healthy, false otherwise
     */
    public boolean isHealthy() {
        try {
            String url = fastApiBaseUrl + "/health";
            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            log.error("FastAPI health check failed: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Get API info from FastAPI
     *
     * @return info about the API
     */
    public Map<String, Object> getApiInfo() {
        try {
            String url = fastApiBaseUrl + "/";
            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);

            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new RuntimeException("Failed to get API info");
            }

            return objectMapper.readValue(response.getBody(), Map.class);

        } catch (Exception e) {
            log.error("Error getting FastAPI info: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to get API info: " + e.getMessage(), e);
        }
    }

    /**
     * Set the FastAPI base URL (useful for testing and dynamic configuration)
     *
     * @param baseUrl the base URL of the FastAPI service
     */
    public void setFastApiBaseUrl(String baseUrl) {
        this.fastApiBaseUrl = baseUrl;
        log.info("FastAPI base URL updated to: {}", baseUrl);
    }

    /**
     * Get current FastAPI base URL
     *
     * @return the base URL
     */
    public String getFastApiBaseUrl() {
        return fastApiBaseUrl;
    }
}
