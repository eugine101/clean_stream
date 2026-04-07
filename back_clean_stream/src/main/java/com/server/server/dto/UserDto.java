package com.server.server.dto;

import lombok.Data;
import jakarta.validation.constraints.*;
import java.util.*;

 
// ─── Response objects ─────────────────────────────────────────

 
@Data
class UserDto {
    String id;
    String email;
    String firstName;
    String lastName;
    boolean active;
    String createdAt;
    List<RoleDto> roles;
}
