package com.server.server.dto;

import lombok.Data;
import jakarta.validation.constraints.*;
import java.util.*;
 
 
// ─── Invite / User management ────────────────────────────────
 

 
@Data
public class UpdateUserRolesRequest {
    @NotNull Set<String> roleIds;
}
