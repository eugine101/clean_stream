package com.server.server.config;

import com.server.server.model.*;
import com.server.server.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

/**
 * Initialize database with sample data on application startup.
 * Creates platform admin and sample tenants with their own users.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepo;
    private final TenantRepository tenantRepo;
    private final RoleRepository roleRepo;
    private final PermissionRepository permissionRepo;
    private final PasswordEncoder encoder;

    @Override
    @Transactional
    public void run(String... args) {
        try {
            log.info("Initializing database with sample data...");

            // 1. Initialize system permissions
            initializePermissions();

            // 2. Create or verify platform admin role
            initializePlatformAdminRole();

            // 3. Create or verify platform admin user
            initializePlatformAdmin();

            // 4. Create sample tenants if needed
            initializeSampleTenants();

            log.info("Database initialization completed successfully");
        } catch (Exception e) {
            log.error("Database initialization failed", e);
        }
    }

    /**
     * Ensure system permissions exist
     */
    private void initializePermissions() {
        Set<String> systemPerms = Set.of(
            "users:read", "users:write", "users:delete",
            "roles:read", "roles:write", "roles:delete",
            "billing:read", "billing:write",
            "settings:read", "settings:write"
        );

        for (String permName : systemPerms) {
            List<Permission> existing = permissionRepo.findAllByNameIn(Set.of(permName));
            if (existing.isEmpty()) {
                permissionRepo.save(Permission.builder()
                    .name(permName)
                    .description(permName.replace(":", " "))
                    .build());
                log.debug("Created permission: {}", permName);
            }
        }
    }

    /**
     * Create PLATFORM_ADMIN role if it doesn't exist
     */
    private void initializePlatformAdminRole() {
        List<Role> existing = roleRepo.findAll().stream()
            .filter(r -> "PLATFORM_ADMIN".equals(r.getName()) && r.getTenant() == null)
            .toList();

        if (!existing.isEmpty()) {
            log.info("PLATFORM_ADMIN role already exists");
            return;
        }

        // Get all permissions for platform admin
        Set<Permission> allPerms = new HashSet<>(permissionRepo.findAll());

        Role platformAdminRole = roleRepo.save(Role.builder()
            .name("PLATFORM_ADMIN")
            .description("Platform Administrator - Full system access")
            .isPrimary(true)
            .tenant(null)  // Platform-wide role, no specific tenant
            .permissions(allPerms)
            .build());

        log.info("✓ Created PLATFORM_ADMIN role");
    }

    /**
     * Create platform admin user if it doesn't exist
     */
    private void initializePlatformAdmin() {
        String adminEmail = "admin@cleanstream.com";

        // Check if platform admin exists
        List<User> admins = userRepo.findAll().stream()
            .filter(u -> u.isPlatformAdmin() && u.getEmail().equals(adminEmail))
            .toList();

        if (!admins.isEmpty()) {
            log.info("Platform admin already exists: {}", adminEmail);
            return;
        }

        // Get or find PLATFORM_ADMIN role
        Role platformAdminRole = roleRepo.findAll().stream()
            .filter(r -> "PLATFORM_ADMIN".equals(r.getName()) && r.getTenant() == null)
            .findFirst()
            .orElseThrow(() -> new RuntimeException("PLATFORM_ADMIN role not found"));

        // Create platform admin (no tenant)
        User platformAdmin = userRepo.save(User.builder()
            .email(adminEmail)
            .password(encoder.encode("AdminPassword123!"))
            .firstName("Platform")
            .lastName("Admin")
            .active(true)
            .isPlatformAdmin(true)
            .tenant(null)  // Platform admin has no tenant
            .roles(Set.of(platformAdminRole))  // Assign PLATFORM_ADMIN role
            .build());

        log.info("✓ Created platform admin user: {}", adminEmail);
        log.info("  Password: AdminPassword123! (CHANGE AFTER FIRST LOGIN)");
        log.info("  Role: PLATFORM_ADMIN");
    }

    /**
     * Create sample tenant (Test3-org) with users if it doesn't exist
     */
    private void initializeSampleTenants() {
        String tenantSlug = "test3-org";

        if (tenantRepo.findBySlug(tenantSlug).isPresent()) {
            log.info("Sample tenant '{}' already exists", tenantSlug);
            return;
        }

        // Create tenant
        Tenant tenant = tenantRepo.save(Tenant.builder()
            .slug(tenantSlug)
            .name("Test3-org")
            .build());

        log.info("✓ Created tenant: {} ({})", tenant.getName(), tenant.getSlug());

        // Get permissions
        Set<Permission> adminPerms = new HashSet<>(
            permissionRepo.findAllByNameIn(Set.of(
                "users:read", "users:write", "users:delete",
                "roles:read", "roles:write", "roles:delete",
                "billing:read", "billing:write",
                "settings:read", "settings:write"
            ))
        );

        Set<Permission> editorPerms = new HashSet<>(
            permissionRepo.findAllByNameIn(Set.of(
                "users:read", "roles:read", "settings:read", "billing:read"
            ))
        );

        // Create roles for this tenant
        Role ownerRole = roleRepo.save(Role.builder()
            .name("OWNER")
            .description("Full access, cannot be modified")
            .isPrimary(true)
            .tenant(tenant)
            .permissions(adminPerms)
            .build());

        Role adminRole = roleRepo.save(Role.builder()
            .name("ADMIN")
            .description("Administrative access")
            .isPrimary(true)
            .tenant(tenant)
            .permissions(editorPerms)
            .build());

        Role memberRole = roleRepo.save(Role.builder()
            .name("MEMBER")
            .description("Standard member access")
            .isPrimary(true)
            .tenant(tenant)
            .permissions(new HashSet<>(
                permissionRepo.findAllByNameIn(Set.of("users:read", "roles:read", "settings:read"))
            ))
            .build());

        log.debug("  Created roles: OWNER, ADMIN, MEMBER");

        // Create sample users for this tenant
        createSampleUser(tenant, ownerRole, "Eugine", "Smith", "eugine@test3-org.com");
        createSampleUser(tenant, adminRole, "John", "Developer", "john@test3-org.com");
        createSampleUser(tenant, memberRole, "Sarah", "Analyst", "sarah@test3-org.com");
        createSampleUser(tenant, adminRole, "Michael", "Manager", "michael@test3-org.com");
    }

    /**
     * Helper to create a sample user
     */
    private void createSampleUser(Tenant tenant, Role role, String firstName, String lastName, String email) {
        if (userRepo.findByEmailAndTenantId(email, tenant.getId()).isPresent()) {
            log.debug("  User already exists: {}", email);
            return;
        }

        User user = userRepo.save(User.builder()
            .email(email)
            .password(encoder.encode("TempPassword123!"))
            .firstName(firstName)
            .lastName(lastName)
            .active(true)
            .isPlatformAdmin(false)
            .tenant(tenant)
            .roles(Set.of(role))
            .build());

        log.debug("  ✓ Created user: {} {} ({})", firstName, lastName, email);
    }
}
