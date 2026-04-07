package com.server.server.dto;


import lombok.Data;
import jakarta.validation.constraints.*;
import java.util.*;
 
 
// ─── Role DTOs ───────────────────────────────────────────────
@Data
public class UpdateRoleRequest {
    String description;
    Set<String> permissionIds;
}
