package com.server.server.dto;

import lombok.Data;
import jakarta.validation.constraints.*;
import java.util.*;
 
 
// ─── Role DTOs ───────────────────────────────────────────────
 
@Data
public class CreateRoleRequest {
    @NotBlank String name;
    String description;
    Set<String> permissionIds = new HashSet<>();
}
