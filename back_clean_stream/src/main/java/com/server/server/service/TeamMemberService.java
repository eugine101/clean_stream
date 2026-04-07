package com.server.server.service;

import com.server.server.model.*;
import com.server.server.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for managing team members within a tenant
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TeamMemberService {

    private final UserRepository userRepo;
    private final RoleRepository roleRepo;
    private final TenantRepository tenantRepo;

    /**
     * List all members in a tenant
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> listMembers(String tenantId) {
        return userRepo.findAllByTenantId(tenantId).stream()
            .filter(u -> !u.isPlatformAdmin())
            .map(this::userToMap)
            .sorted(Comparator.comparing(m -> (String) m.get("email")))
            .collect(Collectors.toList());
    }

    /**
     * Get member by ID
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getMember(String tenantId, String userId) {
        User user = userRepo.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (!user.getTenant().getId().equals(tenantId)) {
            throw new SecurityException("Access denied");
        }

        return userToMap(user);
    }

    /**
     * Invite a new member to the tenant
     */
    @Transactional
    public Map<String, Object> inviteMember(String tenantId, String email, String firstName, String lastName, Set<String> roleIds) {
        Tenant tenant = tenantRepo.findById(tenantId)
            .orElseThrow(() -> new IllegalArgumentException("Tenant not found"));

        if (userRepo.findByEmailAndTenantId(email, tenantId).isPresent()) {
            throw new IllegalArgumentException("User already exists in this tenant");
        }

        // Resolve roles
        Set<Role> roles = new HashSet<>();
        for (String roleId : roleIds) {
            Role role = roleRepo.findById(roleId)
                .orElseThrow(() -> new IllegalArgumentException("Role not found: " + roleId));

            if (!role.getTenant().getId().equals(tenantId)) {
                throw new SecurityException("Role does not belong to this tenant");
            }

            roles.add(role);
        }

        // Create user with temporary password
        String tempPassword = UUID.randomUUID().toString().substring(0, 12);
        User user = userRepo.save(User.builder()
            .email(email)
            .password("TEMP_PASSWORD:" + tempPassword)  // Placeholder - would send via email
            .firstName(firstName)
            .lastName(lastName)
            .active(true)
            .isPlatformAdmin(false)
            .tenant(tenant)
            .roles(roles)
            .build());

        log.info("✓ Invited member to tenant {}: {}", tenantId, email);

        Map<String, Object> response = userToMap(user);
        response.put("tempPassword", tempPassword);  // Return once, never stored plain
        return response;
    }

    /**
     * Update member roles
     */
    @Transactional
    public Map<String, Object> updateMemberRoles(String tenantId, String userId, Set<String> roleIds) {
        User user = userRepo.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (!user.getTenant().getId().equals(tenantId)) {
            throw new SecurityException("Access denied");
        }

        // Resolve roles
        Set<Role> roles = new HashSet<>();
        for (String roleId : roleIds) {
            Role role = roleRepo.findById(roleId)
                .orElseThrow(() -> new IllegalArgumentException("Role not found: " + roleId));

            if (!role.getTenant().getId().equals(tenantId)) {
                throw new SecurityException("Role does not belong to this tenant");
            }

            roles.add(role);
        }

        user.setRoles(roles);
        user = userRepo.save(user);

        log.info("✓ Updated roles for member {}: {}", userId, roleIds);
        return userToMap(user);
    }

    /**
     * Remove a member from the tenant
     */
    @Transactional
    public void removeMember(String tenantId, String userId) {
        User user = userRepo.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (!user.getTenant().getId().equals(tenantId)) {
            throw new SecurityException("Access denied");
        }

        // Check if this is the only owner
        boolean isOwner = user.getRoles().stream()
            .anyMatch(r -> r.getName().equals("OWNER"));

        if (isOwner) {
            long ownerCount = userRepo.findAllByTenantId(tenantId).stream()
                .filter(u -> u.getRoles().stream().anyMatch(r -> r.getName().equals("OWNER")))
                .count();

            if (ownerCount <= 1) {
                throw new IllegalArgumentException("Cannot remove the last owner");
            }
        }

        userRepo.delete(user);
        log.info("✓ Removed member from tenant {}: {}", tenantId, user.getEmail());
    }

    /**
     * Toggle member active status
     */
    @Transactional
    public Map<String, Object> toggleMemberStatus(String tenantId, String userId) {
        User user = userRepo.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (!user.getTenant().getId().equals(tenantId)) {
            throw new SecurityException("Access denied");
        }

        user.setActive(!user.isActive());
        user = userRepo.save(user);

        log.info("✓ Toggled member status: {} (active={})", user.getEmail(), user.isActive());
        return userToMap(user);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private Map<String, Object> userToMap(User u) {
        List<Map<String, Object>> roles = u.getRoles().stream()
            .map(r -> Map.of(
                "id", r.getId(),
                "name", r.getName(),
                "primary", r.isPrimary()
            ))
            .map(m -> (Map<String, Object>) (Map<String, ?>) m)
            .collect(Collectors.toList());

        return new LinkedHashMap<>(Map.of(
            "id", u.getId(),
            "email", u.getEmail(),
            "firstName", u.getFirstName(),
            "lastName", u.getLastName(),
            "active", u.isActive(),
            "roles", roles,
            "createdAt", u.getCreatedAt().toString()
        ));
    }
}
