package com.server.server.websocket;

import com.server.server.security.JwtTokenProvider;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import org.springframework.stereotype.Component;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
public class DatasetWebSocketHandler extends TextWebSocketHandler {
    
    // Map to store active WebSocket sessions per dataset
    // datasetId -> Set of WebSocketSession
    private static final Map<String, Set<WebSocketSession>> DATASET_SESSIONS = new ConcurrentHashMap<>();
    
    // Map to store tenant info per session for validation
    // sessionId -> tenantId
    private static final Map<String, String> SESSION_TENANT_MAP = new ConcurrentHashMap<>();
    
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final JwtTokenProvider jwtTokenProvider;
    
    public DatasetWebSocketHandler(JwtTokenProvider jwtTokenProvider) {
        this.jwtTokenProvider = jwtTokenProvider;
    }
    
    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String datasetId = extractDatasetId(session);
        String sessionId = session.getId();
        
        log.info("WebSocket connection established - sessionId: {}, datasetId: {}", sessionId, datasetId);
        
        // Extract and validate JWT token
        String token = extractToken(session);
        String tenantId = null;
        
        if (token != null) {
            if (!jwtTokenProvider.validateToken(token)) {
                log.warn("Invalid JWT token provided for WebSocket connection - sessionId: {}", sessionId);
                sendMessage(session, WebSocketMessage.builder()
                    .type("error")
                    .datasetId(datasetId)
                    .message("Invalid or expired JWT token")
                    .timestamp(System.currentTimeMillis())
                    .build());
                session.close(CloseStatus.POLICY_VIOLATION);
                return;
            }
            
            tenantId = jwtTokenProvider.getTenantIdFromToken(token);
            if (tenantId == null) {
                log.warn("No tenantId found in JWT token - sessionId: {}", sessionId);
                sendMessage(session, WebSocketMessage.builder()
                    .type("error")
                    .datasetId(datasetId)
                    .message("No tenant ID found in JWT token")
                    .timestamp(System.currentTimeMillis())
                    .build());
                session.close(CloseStatus.POLICY_VIOLATION);
                return;
            }
        } else {
            // Fall back to extracting from query params or headers
            tenantId = extractTenantId(session);
            log.info("No JWT token provided, using header/query param tenantId: {}", tenantId);
        }
        
        SESSION_TENANT_MAP.put(sessionId, tenantId);
        
        // Add session to dataset sessions
        DATASET_SESSIONS.computeIfAbsent(datasetId, k -> ConcurrentHashMap.newKeySet())
            .add(session);
        
        // Send connection confirmation
        sendMessage(session, WebSocketMessage.builder()
            .type("connected")
            .datasetId(datasetId)
            .message("WebSocket connection established for dataset: " + datasetId)
            .timestamp(System.currentTimeMillis())
            .build());
    }
    
    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String payload = message.getPayload();
        String sessionId = session.getId();
        String tenantId = SESSION_TENANT_MAP.get(sessionId);
        
        log.debug("Received WebSocket message - sessionId: {}, tenantId: {}", sessionId, tenantId);
        
        try {
            // Parse incoming message
            WebSocketMessage incomingMsg = objectMapper.readValue(payload, WebSocketMessage.class);
            
            // Handle different message types (e.g., ping, status request)
            if ("ping".equals(incomingMsg.getType())) {
                sendMessage(session, WebSocketMessage.builder()
                    .type("pong")
                    .datasetId(incomingMsg.getDatasetId())
                    .message("pong")
                    .timestamp(System.currentTimeMillis())
                    .build());
            }
            
        } catch (Exception e) {
            log.error("Error processing WebSocket message: {}", e.getMessage());
            sendMessage(session, WebSocketMessage.builder()
                .type("error")
                .message("Error processing message: " + e.getMessage())
                .timestamp(System.currentTimeMillis())
                .build());
        }
    }
    
    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        String datasetId = extractDatasetId(session);
        String sessionId = session.getId();
        
        log.info("WebSocket connection closed - sessionId: {}, datasetId: {}, status: {}",
            sessionId, datasetId, status);
        
        // Remove session from dataset sessions
        Set<WebSocketSession> sessions = DATASET_SESSIONS.get(datasetId);
        if (sessions != null) {
            sessions.remove(session);
            if (sessions.isEmpty()) {
                DATASET_SESSIONS.remove(datasetId);
                log.debug("Removed empty dataset session set for datasetId: {}", datasetId);
            }
        }
        
        // Remove tenant mapping
        SESSION_TENANT_MAP.remove(sessionId);
    }
    
    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
        String datasetId = extractDatasetId(session);
        String sessionId = session.getId();
        
        log.error("WebSocket transport error - sessionId: {}, datasetId: {}, error: {}",
            sessionId, datasetId, exception.getMessage(), exception);
    }
    
    /**
     * Broadcast message to all clients subscribed to a dataset
     */
    public void broadcastToDataset(String datasetId, WebSocketMessage message) {
        Set<WebSocketSession> sessions = DATASET_SESSIONS.get(datasetId);
        
        if (sessions == null || sessions.isEmpty()) {
            log.debug("No active WebSocket sessions for datasetId: {}", datasetId);
            return;
        }
        
        log.debug("Broadcasting message to {} sessions for datasetId: {}", sessions.size(), datasetId);
        
        for (WebSocketSession session : new ArrayList<>(sessions)) {
            try {
                sendMessage(session, message);
            } catch (IOException e) {
                log.error("Error broadcasting to session {}: {}",
                    session.getId(), e.getMessage());
                try {
                    sessions.remove(session);
                    session.close();
                } catch (IOException ex) {
                    log.error("Error closing session: {}", ex.getMessage());
                }
            }
        }
    }
    
    /**
     * Send a message to a specific session
     */
    private void sendMessage(WebSocketSession session, WebSocketMessage message) throws IOException {
        if (session.isOpen()) {
            String json = objectMapper.writeValueAsString(message);
            session.sendMessage(new TextMessage(json));
        }
    }
    
    /**
     * Extract JWT token from query parameters or headers
     */
    private String extractToken(WebSocketSession session) {
        String uri = session.getUri().toString();
        
        // Try to extract from query parameter: ?token=xxx or ?jwt=xxx
        if (uri.contains("token=")) {
            try {
                String[] parts = uri.split("token=");
                if (parts.length > 1) {
                    String tokenPart = parts[1];
                    String token = tokenPart.split("[&]")[0];
                    return !token.isEmpty() ? token : null;
                }
            } catch (Exception e) {
                log.debug("Could not extract token from URI: {}", uri);
            }
        }
        
        // Try from Authorization header
        try {
            String authHeader = session.getHandshakeHeaders().getFirst("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                return authHeader.substring(7);
            }
        } catch (Exception e) {
            log.debug("Could not extract Authorization header");
        }
        
        return null;
    }
    
    /**
     * Extract dataset ID from WebSocket URI path
     */
    private String extractDatasetId(WebSocketSession session) {
        String uri = session.getUri().toString();
        String[] parts = uri.split("/");
        if (parts.length > 0) {
            String lastPart = parts[parts.length - 1];
            if (!lastPart.isEmpty() && !lastPart.contains("?")) {
                return lastPart;
            }
            // Handle case where query params are included
            if (!lastPart.isEmpty()) {
                return lastPart.split("\\?")[0];
            }
        }
        return "unknown";
    }
    
    /**
     * Extract tenant ID from query parameters or headers
     */
    private String extractTenantId(WebSocketSession session) {
        String uri = session.getUri().toString();
        
        // Try to extract from query parameter: ?tenantId=xxx
        if (uri.contains("tenantId=")) {
            try {
                String[] parts = uri.split("tenantId=");
                if (parts.length > 1) {
                    String tenantPart = parts[1];
                    String tenant = tenantPart.split("[&]")[0];
                    return !tenant.isEmpty() ? tenant : "default-tenant";
                }
            } catch (Exception e) {
                log.debug("Could not extract tenantId from URI: {}", uri);
            }
        }
        
        // Try from HTTP headers
        try {
            String tenant = session.getHandshakeHeaders().getFirst("X-Tenant-ID");
            if (tenant != null && !tenant.isEmpty()) {
                return tenant;
            }
        } catch (Exception e) {
            log.debug("Could not extract X-Tenant-ID header");
        }
        
        return "default-tenant";
    }
    
    /**
     * Get count of active sessions for a dataset
     */
    public int getActiveSessionCount(String datasetId) {
        Set<WebSocketSession> sessions = DATASET_SESSIONS.get(datasetId);
        return sessions != null ? sessions.size() : 0;
    }
    
    /**
     * Check if dataset has active subscriptions
     */
    public boolean hasActiveSubscriptions(String datasetId) {
        return DATASET_SESSIONS.containsKey(datasetId) &&
            !DATASET_SESSIONS.get(datasetId).isEmpty();
    }
}
