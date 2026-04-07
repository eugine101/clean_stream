package com.server.server.dto;

import lombok.Data;
import jakarta.validation.constraints.*;
import java.util.*;

 
// ─── Response objects ─────────────────────────────────────────
 

 
@Data
class RoleDto {
    String id;
    String name;
    String description;
    boolean primary;
    List<PermissionDto> permissions;
}
