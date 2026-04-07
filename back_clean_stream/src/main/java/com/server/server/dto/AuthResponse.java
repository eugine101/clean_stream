package com.server.server.dto;

import lombok.Data;
import jakarta.validation.constraints.*;
import java.util.*;
 
@Data
class AuthResponse {
    String token;
    UserDto user;
    String tenantId;
    String tenantName;
}
