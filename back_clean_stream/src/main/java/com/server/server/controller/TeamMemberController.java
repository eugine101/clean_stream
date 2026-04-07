package com.server.server.controller;

import com.server.server.service.TeamMemberService;
import com.server.server.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * REST controller for managing team members within a tenant
 */
@Slf4j
@RestController
@RequestMapping("/api/team-members")
@RequiredArgsConstructor
public class TeamMemberController {

    private final TeamMemberService teamMemberService;
    private final JwtUtil jwtUtil;

    /**
     * Helper to extract tenant ID from auth
     */
    private String getTenantId(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            throw new SecurityException("Not authenticated");
        }
        // Extract from JWT token in auth details, or from principal
        if (auth.getDetails() instanceof Map) {
            Object tenantId = ((Map<?, ?>) auth.getDetails()).get("tenantId");
            if (tenantId != null) return tenantId.toString();
        }
        return auth.getName();  // Fallback
    }

    /**
     * List all team members in this tenant
     */
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> listMembers(Authentication auth) {
        String tenantId = getTenantId(auth);
        return ResponseEntity.ok(teamMemberService.listMembers(tenantId));
    }

    /**
     * Get a specific team member
     */
    @GetMapping("/{userId}")
    public ResponseEntity<Map<String, Object>> getMember(
            @PathVariable String userId,
            Authentication auth) {
        String tenantId = getTenantId(auth);
        return ResponseEntity.ok(teamMemberService.getMember(tenantId, userId));
    }

    /**
     * Invite a new member to the team
     */
    @PostMapping("/invite")
    public ResponseEntity<Map<String, Object>> inviteMember(
            @RequestBody Map<String, Object> req,
            Authentication auth) {
        String tenantId = getTenantId(auth);

        String email = (String) req.get("email");
        String firstName = (String) req.getOrDefault("firstName", "");
        String lastName = (String) req.getOrDefault("lastName", "");
        @SuppressWarnings("unchecked")
        Set<String> roleIds = (Set<String>) req.getOrDefault("roleIds", Set.of());

        if (email == null || email.isEmpty()) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Email is required"));
        }

        return ResponseEntity.status(HttpStatus.CREATED)
            .body(teamMemberService.inviteMember(tenantId, email, firstName, lastName, roleIds));
    }

    /**
     * Update member roles
     */
    @PutMapping("/{userId}/roles")
    public ResponseEntity<Map<String, Object>> updateMemberRoles(
            @PathVariable String userId,
            @RequestBody Map<String, Object> req,
            Authentication auth) {
        String tenantId = getTenantId(auth);

        @SuppressWarnings("unchecked")
        Set<String> roleIds = (Set<String>) req.getOrDefault("roleIds", Set.of());

        if (roleIds.isEmpty()) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "At least one role is required"));
        }

        return ResponseEntity.ok(teamMemberService.updateMemberRoles(tenantId, userId, roleIds));
    }

    /**
     * Remove a member from the team
     */
    @DeleteMapping("/{userId}")
    public ResponseEntity<Map<String, String>> removeMember(
            @PathVariable String userId,
            Authentication auth) {
        String tenantId = getTenantId(auth);
        teamMemberService.removeMember(tenantId, userId);
        return ResponseEntity.ok(Map.of("message", "Member removed successfully"));
    }

    /**
     * Toggle member active/inactive status
     */
    @PutMapping("/{userId}/status")
    public ResponseEntity<Map<String, Object>> toggleMemberStatus(
            @PathVariable String userId,
            Authentication auth) {
        String tenantId = getTenantId(auth);
        return ResponseEntity.ok(teamMemberService.toggleMemberStatus(tenantId, userId));
    }
}
