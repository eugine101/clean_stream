package com.server.server.controller;

import com.server.server.service.SystemAdminService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

/**
 * REST controller for platform admin operations.
 * All endpoints require isPlatformAdmin = true in JWT token.
 */
@Slf4j
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class SystemAdminController {

    private final SystemAdminService systemAdminService;

    /**
     * Verify user is platform admin
     */
    private void requirePlatformAdmin(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            throw new SecurityException("Not authenticated");
        }
        // Check if JWT contains isPlatformAdmin = true
        // This is validated by SecurityConfig/JwtFilter
        Object isPlatformAdmin = auth.getDetails() instanceof Map
            ? ((Map<?, ?>) auth.getDetails()).get("isPlatformAdmin")
            : null;

        if (!Boolean.TRUE.equals(isPlatformAdmin)) {
            throw new SecurityException("Not authorized: Platform admin access required");
        }
    }

    /**
     * Get system statistics (tenants, users, etc.)
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getSystemStats(Authentication auth) {
        requirePlatformAdmin(auth);
        return ResponseEntity.ok(systemAdminService.getSystemStats());
    }

    /**
     * List all tenants in the system
     */
    @GetMapping("/tenants")
    public ResponseEntity<List<Map<String, Object>>> getAllTenants(Authentication auth) {
        requirePlatformAdmin(auth);
        return ResponseEntity.ok(systemAdminService.getAllTenants());
    }

    /**
     * Get detailed information about a specific tenant
     */
    @GetMapping("/tenants/{tenantId}")
    public ResponseEntity<Map<String, Object>> getTenantDetails(
            @PathVariable String tenantId,
            Authentication auth) {
        requirePlatformAdmin(auth);
        return ResponseEntity.ok(systemAdminService.getTenantDetails(tenantId));
    }

    /**
     * Create a new tenant (admin setup)
     */
    @PostMapping("/tenants")
    public ResponseEntity<Map<String, Object>> createTenant(
            @RequestBody Map<String, String> req,
            Authentication auth) {
        requirePlatformAdmin(auth);
        String name = req.get("name");
        String slug = req.get("slug");

        if (name == null || name.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Name is required"));
        }

        return ResponseEntity.status(HttpStatus.CREATED)
            .body(systemAdminService.createTenant(name, slug));
    }

    /**
     * Update tenant details
     */
    @PutMapping("/tenants/{tenantId}")
    public ResponseEntity<Map<String, Object>> updateTenant(
            @PathVariable String tenantId,
            @RequestBody Map<String, String> req,
            Authentication auth) {
        requirePlatformAdmin(auth);
        String name = req.get("name");
        String slug = req.get("slug");

        return ResponseEntity.ok(systemAdminService.updateTenant(tenantId, name, slug));
    }

    /**
     * Toggle tenant status (pause/resume)
     */
    @PutMapping("/tenants/{tenantId}/status")
    public ResponseEntity<Map<String, Object>> toggleTenantStatus(
            @PathVariable String tenantId,
            @RequestBody Map<String, String> req,
            Authentication auth) {
        requirePlatformAdmin(auth);
        String newStatus = req.get("status");

        if (newStatus == null || (!newStatus.equals("active") && !newStatus.equals("paused"))) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Status must be 'active' or 'paused'"));
        }

        return ResponseEntity.ok(systemAdminService.toggleTenantStatus(tenantId, newStatus));
    }

    /**
     * Delete a tenant
     */
    @DeleteMapping("/tenants/{tenantId}")
    public ResponseEntity<Map<String, String>> deleteTenant(
            @PathVariable String tenantId,
            Authentication auth) {
        requirePlatformAdmin(auth);
        systemAdminService.deleteTenant(tenantId);
        return ResponseEntity.ok(Map.of("message", "Tenant deleted successfully"));
    }

    /**
     * Promote user to platform admin
     */
    @PostMapping("/users/{userId}/promote")
    public ResponseEntity<Map<String, Object>> promoteToAdmin(
            @PathVariable String userId,
            Authentication auth) {
        requirePlatformAdmin(auth);
        return ResponseEntity.ok(systemAdminService.promoteUserToAdmin(userId));
    }

    /**
     * Demote platform admin to regular user
     */
    @PostMapping("/users/{userId}/demote")
    public ResponseEntity<Map<String, Object>> demoteFromAdmin(
            @PathVariable String userId,
            Authentication auth) {
        requirePlatformAdmin(auth);
        return ResponseEntity.ok(systemAdminService.demoteAdminToUser(userId));
    }
}
