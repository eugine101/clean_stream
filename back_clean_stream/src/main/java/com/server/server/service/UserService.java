package com.server.server.service;

import com.server.server.dto.*;
import com.server.server.model.*;
import com.server.server.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
import java.util.stream.Collectors;
 
@Service
@RequiredArgsConstructor
public class UserService {
 
    private final UserRepository userRepo;
    private final RoleRepository roleRepo;
    private final TenantRepository tenantRepo;
    private final PasswordEncoder encoder;
 
    @Transactional(readOnly = true)
    public List<Map<String, Object>> listUsers(String tenantId) {
        return userRepo.findAllByTenantId(tenantId).stream()
            .map(this::userToMap).collect(Collectors.toList());
    }
 
    @Transactional
    public Map<String, Object> inviteUser(String tenantId, InviteUserRequest req) {
        if (userRepo.existsByEmailAndTenantId(req.getEmail(), tenantId))
            throw new IllegalArgumentException("Email already exists in this organization");
 
        Tenant tenant = tenantRepo.findById(tenantId).orElseThrow();
        Set<Role> roles = resolveRoles(req.getRoleIds(), tenantId);
 
        // Generate temp password — in prod, send invitation email instead
        String tempPassword = UUID.randomUUID().toString().substring(0, 12);
 
        User user = userRepo.save(User.builder()
            .email(req.getEmail())
            .password(encoder.encode(tempPassword))
            .firstName(req.getFirstName())
            .lastName(req.getLastName())
            .tenant(tenant)
            .roles(roles)
            .build());
 
        Map<String, Object> result = userToMap(user);
        result.put("tempPassword", tempPassword); // Return once, never stored plain
        return result;
    }
 
    @Transactional
    public Map<String, Object> updateUserRoles(String tenantId, String userId, UpdateUserRolesRequest req) {
        User user = userRepo.findById(userId).orElseThrow();
        if (!user.getTenant().getId().equals(tenantId))
            throw new SecurityException("Access denied");
 
        Set<Role> roles = resolveRoles(req.getRoleIds(), tenantId);
        user.setRoles(roles);
        return userToMap(userRepo.save(user));
    }
 
    @Transactional
    public void toggleUserActive(String tenantId, String userId) {
        User user = userRepo.findById(userId).orElseThrow();
        if (!user.getTenant().getId().equals(tenantId)) throw new SecurityException("Access denied");
        user.setActive(!user.isActive());
        userRepo.save(user);
    }
 
    @Transactional
    public void deleteUser(String tenantId, String userId) {
        User user = userRepo.findById(userId).orElseThrow();
        if (!user.getTenant().getId().equals(tenantId)) throw new SecurityException("Access denied");
        // Check not deleting the only owner
        boolean isOwner = user.getRoles().stream().anyMatch(r -> r.getName().equals("OWNER"));
        if (isOwner) {
            long ownerCount = userRepo.findAllByTenantId(tenantId).stream()
                .filter(u -> u.getRoles().stream().anyMatch(r -> r.getName().equals("OWNER")))
                .count();
            if (ownerCount <= 1) throw new IllegalArgumentException("Cannot remove the last owner");
        }
        userRepo.delete(user);
    }
 
    // ── Helpers ──────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Map<String, Object> getUserProfile(String userId, String tenantId) {
        User user = userRepo.findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        // For platform admins, tenantId will be null
        if (tenantId != null && !tenantId.equals("null")) {
            if (user.getTenant() == null || !user.getTenant().getId().equals(tenantId)) 
                throw new SecurityException("Access denied");
        }
        
        Map<String, Object> profile = userToMap(user);
        
        // Add tenant info if user has a tenant
        if (user.getTenant() != null) {
            profile.put("tenantId", user.getTenant().getId());
            profile.put("tenantName", user.getTenant().getName());
            profile.put("tenantSlug", user.getTenant().getSlug());
        } else {
            // Platform admin
            profile.put("tenantId", null);
            profile.put("tenantName", "Platform Admin");
            profile.put("tenantSlug", null);
        }
        
        profile.put("isPlatformAdmin", user.isPlatformAdmin());
        
        return profile;
    }
 
    private Set<Role> resolveRoles(Set<String> roleIds, String tenantId) {
        Set<Role> roles = new HashSet<>();
        for (String id : roleIds) {
            Role r = roleRepo.findById(id).orElseThrow(() -> new IllegalArgumentException("Role not found: " + id));
            if (!r.getTenant().getId().equals(tenantId)) throw new SecurityException("Role does not belong to tenant");
            roles.add(r);
        }
        return roles;
    }
 
    private Map<String, Object> userToMap(User u) {
        List<Map<String, Object>> roles = u.getRoles().stream().map(r -> Map.<String, Object>of(
            "id", r.getId(), "name", r.getName(), "primary", r.isPrimary()
        )).collect(Collectors.toList());
        return new LinkedHashMap<>(Map.of(
            "id", u.getId(),
            "email", u.getEmail(),
            "firstName", u.getFirstName(),
            "lastName", u.getLastName(),
            "active", u.isActive(),
            "createdAt", u.getCreatedAt().toString(),
            "roles", roles,
            "permissions", u.getPermissionNames()
        ));
    }
}
