package com.server.server.controller;

import com.server.server.dto.*;
import com.server.server.service.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.*;
 
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
 
    private final UserService userService;
 
    private String tenantId(Authentication auth) {
        String[] parts = auth.getName().split("\\|");
        return parts.length > 1 ? parts[1] : null;
    }
    
    private String userId(Authentication auth) {
        String[] parts = auth.getName().split("\\|");
        return parts[0];
    }

    @GetMapping("/profile")
    public ResponseEntity<Map<String, Object>> profile(Authentication auth) {
        return ResponseEntity.ok(userService.getUserProfile(userId(auth), tenantId(auth)));
    }

    @GetMapping
    @PreAuthorize("hasAuthority('users:read')")
    public ResponseEntity<List<Map<String, Object>>> list(Authentication auth) {
        return ResponseEntity.ok(userService.listUsers(tenantId(auth)));
    }
 
    @PostMapping("/invite")
    @PreAuthorize("hasAuthority('users:write')")
    public ResponseEntity<Map<String, Object>> invite(
            Authentication auth, @Valid @RequestBody InviteUserRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(userService.inviteUser(tenantId(auth), req));
    }
 
    @PutMapping("/{userId}/roles")
    @PreAuthorize("hasAuthority('users:write')")
    public ResponseEntity<Map<String, Object>> updateRoles(
            Authentication auth, @PathVariable String userId,
            @Valid @RequestBody UpdateUserRolesRequest req) {
        return ResponseEntity.ok(userService.updateUserRoles(tenantId(auth), userId, req));
    }
 
    @PatchMapping("/{userId}/toggle")
    @PreAuthorize("hasAuthority('users:write')")
    public ResponseEntity<Void> toggle(Authentication auth, @PathVariable String userId) {
        userService.toggleUserActive(tenantId(auth), userId);
        return ResponseEntity.noContent().build();
    }
 
    @DeleteMapping("/{userId}")
    @PreAuthorize("hasAuthority('users:delete')")
    public ResponseEntity<Void> delete(Authentication auth, @PathVariable String userId) {
        userService.deleteUser(tenantId(auth), userId);
        return ResponseEntity.noContent().build();
    }
}
 
 
@RestController
@RequestMapping("/api/roles")
@RequiredArgsConstructor
class RoleController {
 
    private final RoleService roleService;
 
    private String tenantId(Authentication auth) {
        return auth.getName().split("\\|")[1];
    }
 
    @GetMapping
    @PreAuthorize("hasAuthority('roles:read')")
    public ResponseEntity<List<Map<String, Object>>> list(Authentication auth) {
        return ResponseEntity.ok(roleService.listRoles(tenantId(auth)));
    }
 
    @GetMapping("/permissions")
    @PreAuthorize("hasAuthority('roles:read')")
    public ResponseEntity<List<Map<String, Object>>> permissions() {
        return ResponseEntity.ok(roleService.listPermissions());
    }
 
    @PostMapping
    @PreAuthorize("hasAuthority('roles:write')")
    public ResponseEntity<Map<String, Object>> create(
            Authentication auth, @Valid @RequestBody CreateRoleRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(roleService.createRole(tenantId(auth), req));
    }
 
    @PutMapping("/{roleId}")
    @PreAuthorize("hasAuthority('roles:write')")
    public ResponseEntity<Map<String, Object>> update(
            Authentication auth, @PathVariable String roleId,
            @RequestBody UpdateRoleRequest req) {
        return ResponseEntity.ok(roleService.updateRole(tenantId(auth), roleId, req));
    }
 
    @DeleteMapping("/{roleId}")
    @PreAuthorize("hasAuthority('roles:delete')")
    public ResponseEntity<Void> delete(Authentication auth, @PathVariable String roleId) {
        roleService.deleteRole(tenantId(auth), roleId);
        return ResponseEntity.noContent().build();
    }
}
