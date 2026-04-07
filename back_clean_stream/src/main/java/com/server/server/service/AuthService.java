package com.server.server.service;

import com.server.server.dto.*;
import com.server.server.model.*;
import com.server.server.repository.*;
import com.server.server.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.text.Normalizer;
import java.util.*;
import java.util.regex.Pattern;
 
@Service
@RequiredArgsConstructor
public class AuthService {
 
    private final TenantRepository tenantRepo;
    private final UserRepository userRepo;
    private final RoleRepository roleRepo;
    private final PermissionRepository permissionRepo;
    private final PasswordEncoder encoder;
    private final JwtUtil jwtUtil;
 
    /** System-wide permissions seeded on first startup */
    public static final List<String> SYSTEM_PERMISSIONS = List.of(
        "users:read", "users:write", "users:delete",
        "roles:read", "roles:write", "roles:delete",
        "billing:read", "billing:write",
        "settings:read", "settings:write"
    );
 
    /**
     * Primary tenant signup — creates organization + owner role + owner user.
     */
    @Transactional
    public Map<String, Object> signup(TenantSignupRequest req) {
        String slug = slugify(req.getOrganizationName());
        if (tenantRepo.existsBySlug(slug)) {
            throw new IllegalArgumentException("Organization slug already taken: " + slug);
        }
 
        // 1. Create tenant
        Tenant tenant = tenantRepo.save(Tenant.builder()
            .name(req.getOrganizationName())
            .slug(slug)
            .build());
 
        // 2. Ensure permissions exist (idempotent)
        ensurePermissionsExist();
 
        // 3. Create primary roles
        Role ownerRole = createPrimaryRole(tenant, "OWNER", "Full access, cannot be modified",
            Set.of("users:read","users:write","users:delete",
                   "roles:read","roles:write","roles:delete",
                   "billing:read","billing:write","settings:read","settings:write"));
 
        createPrimaryRole(tenant, "ADMIN", "Administrative access",
            Set.of("users:read","users:write","users:delete",
                   "roles:read","roles:write",
                   "settings:read","settings:write","billing:read"));
 
        createPrimaryRole(tenant, "MEMBER", "Standard member access",
            Set.of("users:read","roles:read","settings:read"));
 
        // 4. Create owner user
        User owner = userRepo.save(User.builder()
            .email(req.getEmail())
            .password(encoder.encode(req.getPassword()))
            .firstName(req.getFirstName())
            .lastName(req.getLastName())
            .active(true)
            .tenant(tenant)
            .roles(Set.of(ownerRole))
            .isPlatformAdmin(false)
            .build());

        String token = jwtUtil.generate(owner.getId(), tenant.getId(), owner.getPermissionNames(), owner.isPlatformAdmin());
        return buildAuthResponse(token, owner, tenant);
    }
 
    @Transactional(readOnly = true)
    public Map<String, Object> login(LoginRequest req) {
        Tenant tenant;
        User user;
        
        if (req.getTenantSlug() != null && !req.getTenantSlug().isEmpty()) {
            // If tenantSlug provided, use it to find tenant and user
            tenant = tenantRepo.findBySlug(req.getTenantSlug())
                .orElseThrow(() -> new IllegalArgumentException("Organization not found"));
            
            user = userRepo.findByEmailAndTenantId(req.getEmail(), tenant.getId())
                .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));
        } else {
            // If tenantSlug not provided, search for user by email globally
            // This handles both platform admins (no tenant) and regular users
            user = userRepo.findByEmail(req.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));
            
            tenant = user.getTenant();  // Will be null for platform admins
        }
        
        if (!user.isActive()) throw new IllegalArgumentException("Account is disabled");
        if (!encoder.matches(req.getPassword(), user.getPassword()))
            throw new IllegalArgumentException("Invalid credentials");
        
        // Generate token with tenant ID (null for platform admins)
        String tenantId = tenant != null ? tenant.getId() : null;
        String token = jwtUtil.generate(user.getId(), tenantId, user.getPermissionNames(), user.isPlatformAdmin());
        return buildAuthResponse(token, user, tenant);
    }
 
    // ── Helpers ──────────────────────────────────────────────────────────────
 
    private Role createPrimaryRole(Tenant tenant, String name, String desc, Set<String> permNames) {
        Set<Permission> perms = new HashSet<>(permissionRepo.findAllByNameIn(permNames));
        return roleRepo.save(Role.builder()
            .name(name).description(desc)
            .isPrimary(true)
            .tenant(tenant)
            .permissions(perms)
            .build());
    }
 
    private void ensurePermissionsExist() {
        List<Permission> existing = permissionRepo.findAll();
        Set<String> existingNames = new HashSet<>();
        existing.forEach(p -> existingNames.add(p.getName()));
        SYSTEM_PERMISSIONS.forEach(name -> {
            if (!existingNames.contains(name)) {
                permissionRepo.save(Permission.builder()
                    .name(name)
                    .description(name.replace(":", " "))
                    .build());
            }
        });
    }
 
    private Map<String, Object> buildAuthResponse(String token, User user, Tenant tenant) {
        List<Map<String, String>> rolesList = user.getRoles().stream()
            .map(r -> Map.of("id", r.getId(), "name", r.getName()))
            .toList();
        
        // Build response that handles platform admins (no tenant)
        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("user", Map.of(
            "id", user.getId(),
            "email", user.getEmail(),
            "firstName", user.getFirstName(),
            "lastName", user.getLastName(),
            "permissions", user.getPermissionNames(),
            "roles", rolesList,
            "isPlatformAdmin", user.isPlatformAdmin()
        ));
        
        // Add tenant info only if user has a tenant (not platform admin)
        if (tenant != null) {
            response.put("tenantId", tenant.getId());
            response.put("tenantName", tenant.getName());
            response.put("tenantSlug", tenant.getSlug());
        } else {
            // Platform admin response
            response.put("tenantId", null);
            response.put("tenantName", "Platform Admin");
            response.put("tenantSlug", null);
        }
        
        return response;
    }
 
    private String slugify(String input) {
        String normalized = Normalizer.normalize(input, Normalizer.Form.NFD);
        return Pattern.compile("[^\\w\\s-]").matcher(normalized).replaceAll("")
            .trim().toLowerCase().replaceAll("[\\s-]+", "-");
    }
}
