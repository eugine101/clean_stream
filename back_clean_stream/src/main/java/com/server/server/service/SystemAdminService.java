package com.server.server.service;

import com.server.server.model.*;
import com.server.server.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.text.Normalizer;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Service for platform-level admin operations.
 * Only accessible by users with isPlatformAdmin = true
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SystemAdminService {

    private final TenantRepository tenantRepo;
    private final UserRepository userRepo;
    private final RoleRepository roleRepo;

    /**
     * Get all tenants in the system
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAllTenants() {
        return tenantRepo.findAll().stream()
            .map(this::tenantToMap)
            .collect(Collectors.toList());
    }

    /**
     * Get tenant by ID with detailed statistics
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getTenantDetails(String tenantId) {
        Tenant tenant = tenantRepo.findById(tenantId)
            .orElseThrow(() -> new IllegalArgumentException("Tenant not found: " + tenantId));

        Map<String, Object> details = tenantToMap(tenant);

        // Add statistics
        List<User> tenantUsers = userRepo.findAllByTenantId(tenantId);
        details.put("totalUsers", tenantUsers.size());
        details.put("activeUsers", tenantUsers.stream().filter(User::isActive).count());
        details.put("roles", tenant.getRoles().stream()
            .map(r -> Map.of("id", r.getId(), "name", r.getName(), "isPrimary", r.isPrimary()))
            .collect(Collectors.toList()));

        return details;
    }

    /**
     * Create a new tenant (for initial setup or admin creation)
     */
    @Transactional
    public Map<String, Object> createTenant(String name, String slug) {
        String normalizedSlug = slugify(slug != null ? slug : name);

        if (tenantRepo.existsBySlug(normalizedSlug)) {
            throw new IllegalArgumentException("Tenant slug already exists: " + normalizedSlug);
        }

        Tenant tenant = tenantRepo.save(Tenant.builder()
            .name(name)
            .slug(normalizedSlug)
            .build());

        log.info("✓ Created tenant via admin: {} ({})", name, normalizedSlug);
        return tenantToMap(tenant);
    }

    /**
     * Update tenant details
     */
    @Transactional
    public Map<String, Object> updateTenant(String tenantId, String name, String slug) {
        Tenant tenant = tenantRepo.findById(tenantId)
            .orElseThrow(() -> new IllegalArgumentException("Tenant not found"));

        if (name != null) tenant.setName(name);
        if (slug != null) {
            String normalizedSlug = slugify(slug);
            if (!normalizedSlug.equals(tenant.getSlug()) && tenantRepo.existsBySlug(normalizedSlug)) {
                throw new IllegalArgumentException("Tenant slug already exists: " + normalizedSlug);
            }
            tenant.setSlug(normalizedSlug);
        }

        tenant = tenantRepo.save(tenant);
        log.info("✓ Updated tenant: {}", tenantId);
        return tenantToMap(tenant);
    }

    /**
     * Toggle tenant active/paused status
     */
    @Transactional
    public Map<String, Object> toggleTenantStatus(String tenantId, String newStatus) {
        Tenant tenant = tenantRepo.findById(tenantId)
            .orElseThrow(() -> new IllegalArgumentException("Tenant not found"));

        // For now, we just track status in audit logs or cache
        // In production, you'd add a 'status' field to Tenant model
        log.info("Tenant {} status changed to: {}", tenantId, newStatus);

        // Disable all users in tenant if pausing
        if ("paused".equals(newStatus)) {
            List<User> tenantUsers = userRepo.findAllByTenantId(tenantId);
            tenantUsers.forEach(u -> u.setActive(false));
            userRepo.saveAll(tenantUsers);
            log.info("Disabled all users in paused tenant: {}", tenantId);
        }

        return tenantToMap(tenant);
    }

    /**
     * Delete a tenant and all associated data
     */
    @Transactional
    public void deleteTenant(String tenantId) {
        Tenant tenant = tenantRepo.findById(tenantId)
            .orElseThrow(() -> new IllegalArgumentException("Tenant not found"));

        // Delete all users in tenant
        List<User> tenantUsers = userRepo.findAllByTenantId(tenantId);
        userRepo.deleteAll(tenantUsers);

        // Delete all roles in tenant
        List<Role> tenantRoles = roleRepo.findAllByTenantId(tenantId);
        roleRepo.deleteAll(tenantRoles);

        // Delete tenant
        tenantRepo.delete(tenant);

        log.info("✓ Deleted tenant: {} with {} users", tenantId, tenantUsers.size());
    }

    /**
     * Promote a regular user to platform admin
     */
    @Transactional
    public Map<String, Object> promoteUserToAdmin(String userId) {
        User user = userRepo.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        user.setPlatformAdmin(true);
        user = userRepo.save(user);

        log.info("✓ Promoted user to platform admin: {}", user.getEmail());
        return userToMap(user);
    }

    /**
     * Demote a platform admin back to regular user
     */
    @Transactional
    public Map<String, Object> demoteAdminToUser(String userId) {
        User user = userRepo.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        user.setPlatformAdmin(false);
        user = userRepo.save(user);

        log.info("✓ Demoted user from platform admin: {}", user.getEmail());
        return userToMap(user);
    }

    /**
     * Get system statistics
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getSystemStats() {
        List<Tenant> allTenants = tenantRepo.findAll();
        long totalUsers = userRepo.count();
        long platformAdmins = userRepo.findAll().stream()
            .filter(User::isPlatformAdmin)
            .count();

        return Map.of(
            "totalTenants", allTenants.size(),
            "totalUsers", totalUsers,
            "platformAdmins", platformAdmins,
            "activeTenants", allTenants.size(),  // Could add status field to track
            "timestamp", System.currentTimeMillis()
        );
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private Map<String, Object> tenantToMap(Tenant t) {
        long userCount = userRepo.findAllByTenantId(t.getId()).size();
        return new LinkedHashMap<>(Map.of(
            "id", t.getId(),
            "name", t.getName(),
            "slug", t.getSlug(),
            "createdAt", t.getCreatedAt().toString(),
            "userCount", userCount,
            "status", "active"  // In production, add status field to model
        ));
    }

    private Map<String, Object> userToMap(User u) {
        return new LinkedHashMap<>(Map.of(
            "id", u.getId(),
            "email", u.getEmail(),
            "firstName", u.getFirstName(),
            "lastName", u.getLastName(),
            "isPlatformAdmin", u.isPlatformAdmin(),
            "active", u.isActive(),
            "createdAt", u.getCreatedAt().toString()
        ));
    }

    private String slugify(String input) {
        String normalized = Normalizer.normalize(input, Normalizer.Form.NFD);
        return Pattern.compile("[^\\w\\s-]").matcher(normalized).replaceAll("")
            .trim().toLowerCase().replaceAll("[\\s-]+", "-");
    }
}
