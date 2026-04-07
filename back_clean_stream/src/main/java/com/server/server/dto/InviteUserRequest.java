package com.server.server.dto;

import lombok.Data;
import jakarta.validation.constraints.*;
import java.util.*;
 
 
// ─── Invite / User management ────────────────────────────────
 
@Data
public class InviteUserRequest {
    @Email @NotBlank String email;
    @NotBlank String firstName;
    @NotBlank String lastName;
    @NotNull Set<String> roleIds;
}
