package com.server.server.controller;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

/**
 * Error response DTO for API errors
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ErrorResponse {
    private String error;
    private String timestamp = LocalDateTime.now().toString();

    public ErrorResponse(String error) {
        this.error = error;
        this.timestamp = LocalDateTime.now().toString();
    }
}
