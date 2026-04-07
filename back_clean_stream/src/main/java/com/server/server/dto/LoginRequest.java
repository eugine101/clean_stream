package com.server.server.dto;

import lombok.Data;
import jakarta.validation.constraints.*;
import java.util.*;
 
// ─── Auth DTOs ───────────────────────────────────────────────
 
@Data
public class LoginRequest {
    @Email @NotBlank String email;
    @NotBlank String password;
    String tenantSlug; // Optional - if not provided, will be looked up by email
}
