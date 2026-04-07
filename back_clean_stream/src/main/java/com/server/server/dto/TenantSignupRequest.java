package com.server.server.dto;

import lombok.Data;
import jakarta.validation.constraints.*;
import java.util.*;
 
// ─── Auth DTOs ───────────────────────────────────────────────
 
@Data
public class TenantSignupRequest {
    @NotBlank String organizationName;
    @NotBlank String firstName;
    @NotBlank String lastName;
    @Email @NotBlank String email;
    @Size(min = 8) String password;
}