package com.server.server.controller;

import com.server.server.service.UserGroupService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

/**
 * REST controller for managing user groups within a tenant
 */
@Slf4j
@RestController
@RequestMapping("/api/user-groups")
@RequiredArgsConstructor
public class UserGroupController {

    private final UserGroupService userGroupService;

    /**
     * Helper to extract tenant ID from auth
     */
    private String getTenantId(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            throw new SecurityException("Not authenticated");
        }
        if (auth.getDetails() instanceof Map) {
            Object tenantId = ((Map<?, ?>) auth.getDetails()).get("tenantId");
            if (tenantId != null) return tenantId.toString();
        }
        return auth.getName();
    }

    /**
     * List all user groups in this tenant
     */
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> listGroups(Authentication auth) {
        String tenantId = getTenantId(auth);
        return ResponseEntity.ok(userGroupService.listGroups(tenantId));
    }

    /**
     * Get a specific user group
     */
    @GetMapping("/{groupId}")
    public ResponseEntity<Map<String, Object>> getGroup(
            @PathVariable String groupId,
            Authentication auth) {
        String tenantId = getTenantId(auth);
        return ResponseEntity.ok(userGroupService.getGroup(tenantId, groupId));
    }

    /**
     * Create a new user group
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> createGroup(
            @RequestBody Map<String, String> req,
            Authentication auth) {
        String tenantId = getTenantId(auth);

        String name = req.get("name");
        String description = req.get("description");

        if (name == null || name.isEmpty()) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Group name is required"));
        }

        return ResponseEntity.status(HttpStatus.CREATED)
            .body(userGroupService.createGroup(tenantId, name, description));
    }

    /**
     * Update group details
     */
    @PutMapping("/{groupId}")
    public ResponseEntity<Map<String, Object>> updateGroup(
            @PathVariable String groupId,
            @RequestBody Map<String, String> req,
            Authentication auth) {
        String tenantId = getTenantId(auth);

        String name = req.get("name");
        String description = req.get("description");

        return ResponseEntity.ok(userGroupService.updateGroup(tenantId, groupId, name, description));
    }

    /**
     * Add a member to the group
     */
    @PostMapping("/{groupId}/members/{userId}")
    public ResponseEntity<Map<String, Object>> addMember(
            @PathVariable String groupId,
            @PathVariable String userId,
            Authentication auth) {
        String tenantId = getTenantId(auth);
        return ResponseEntity.ok(userGroupService.addMember(tenantId, groupId, userId));
    }

    /**
     * Remove a member from the group
     */
    @DeleteMapping("/{groupId}/members/{userId}")
    public ResponseEntity<Map<String, Object>> removeMember(
            @PathVariable String groupId,
            @PathVariable String userId,
            Authentication auth) {
        String tenantId = getTenantId(auth);
        return ResponseEntity.ok(userGroupService.removeMember(tenantId, groupId, userId));
    }

    /**
     * Delete a group
     */
    @DeleteMapping("/{groupId}")
    public ResponseEntity<Map<String, String>> deleteGroup(
            @PathVariable String groupId,
            Authentication auth) {
        String tenantId = getTenantId(auth);
        userGroupService.deleteGroup(tenantId, groupId);
        return ResponseEntity.ok(Map.of("message", "Group deleted successfully"));
    }
}
