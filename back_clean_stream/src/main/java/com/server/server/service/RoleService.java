package com.server.server.service;

import com.server.server.dto.*;
import com.server.server.model.*;
import com.server.server.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
import java.util.stream.Collectors;
 
@Service
@RequiredArgsConstructor
public class RoleService {
 
    private final RoleRepository roleRepo;
    private final TenantRepository tenantRepo;
    private final PermissionRepository permissionRepo;
 
    @Transactional(readOnly = true)
    public List<Map<String, Object>> listRoles(String tenantId) {
        return roleRepo.findAllByTenantId(tenantId).stream()
            .map(this::roleToMap).collect(Collectors.toList());
    }
 
    @Transactional(readOnly = true)
    public List<Map<String, Object>> listPermissions() {
        return permissionRepo.findAll().stream().map(p -> Map.<String, Object>of(
            "id", p.getId(), "name", p.getName(), "description", p.getDescription()
        )).collect(Collectors.toList());
    }
 
    @Transactional
    public Map<String, Object> createRole(String tenantId, CreateRoleRequest req) {
        if (roleRepo.existsByNameAndTenantId(req.getName().toUpperCase(), tenantId))
            throw new IllegalArgumentException("Role name already exists");
 
        Tenant tenant = tenantRepo.findById(tenantId).orElseThrow();
        Set<Permission> perms = new HashSet<>(permissionRepo.findAllByIdIn(new ArrayList<>(req.getPermissionIds()))); 
        Role role = roleRepo.save(Role.builder()
            .name(req.getName().toUpperCase())
            .description(req.getDescription())
            .isPrimary(false) // custom roles are never primary
            .tenant(tenant)
            .permissions(perms)
            .build());
        return roleToMap(role);
    }
 
    @Transactional
    public Map<String, Object> updateRole(String tenantId, String roleId, UpdateRoleRequest req) {
        Role role = getAndVerify(roleId, tenantId);
        if (role.isPrimary() && req.getPermissionIds() != null)
            throw new IllegalArgumentException("Cannot change permissions of a primary role");
 
        if (req.getDescription() != null && !role.isPrimary())
            role.setDescription(req.getDescription());
 
        if (req.getPermissionIds() != null && !role.isPrimary()) {
Set<Permission> perms = new HashSet<>(permissionRepo.findAllByIdIn(new ArrayList<>(req.getPermissionIds())));            role.setPermissions(perms);
        }
        return roleToMap(roleRepo.save(role));
    }
 
    @Transactional
    public void deleteRole(String tenantId, String roleId) {
        Role role = getAndVerify(roleId, tenantId);
        if (role.isPrimary()) throw new IllegalArgumentException("Cannot delete a primary role");
        roleRepo.delete(role);
    }
 
    // ── Helpers ──────────────────────────────────────────────────────────────
 
    private Role getAndVerify(String roleId, String tenantId) {
        Role role = roleRepo.findById(roleId).orElseThrow();
        if (!role.getTenant().getId().equals(tenantId)) throw new SecurityException("Access denied");
        return role;
    }
 
    private Map<String, Object> roleToMap(Role r) {
        List<Map<String, Object>> perms = r.getPermissions().stream().map(p -> Map.<String, Object>of(
            "id", p.getId(), "name", p.getName(), "description", p.getDescription()
        )).collect(Collectors.toList());
        return Map.of(
            "id", r.getId(), "name", r.getName(),
            "description", r.getDescription() == null ? "" : r.getDescription(),
            "primary", r.isPrimary(),
            "permissions", perms
        );
    }
}
