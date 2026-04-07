package com.server.server.dto;

import lombok.Data;
import jakarta.validation.constraints.*;
import java.util.*;

 
// ─── Response objects ─────────────────────────────────────────
 
@Data
class PermissionDto {
    String id;
    String name;
    String description;
}
