package com.server.server.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;
import com.server.server.websocket.DatasetWebSocketHandler;
import org.springframework.beans.factory.annotation.Autowired;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {
    
    @Autowired
    private DatasetWebSocketHandler datasetWebSocketHandler;
    
    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(datasetWebSocketHandler, "/ws/dataset/{datasetId}")
            .setAllowedOrigins("*");
        
        registry.addHandler(datasetWebSocketHandler, "/ws/dataset/{datasetId}/")
            .setAllowedOrigins("*");
    }
}
