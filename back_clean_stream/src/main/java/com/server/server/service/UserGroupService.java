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
 * Service for managing user groups within a tenant
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserGroupService {

    private final UserGroupRepository userGroupRepo;
    private final UserRepository userRepo;
    private final TenantRepository tenantRepo;

    /**
     * List all groups in a tenant
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> listGroups(String tenantId) {
        return userGroupRepo.findAllByTenantId(tenantId).stream()
            .map(this::groupToMap)
            .sorted(Comparator.comparing(m -> (String) m.get("name")))
            .collect(Collectors.toList());
    }

    /**
     * Get group by ID
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getGroup(String tenantId, String groupId) {
        UserGroup group = userGroupRepo.findByIdAndTenantId(groupId, tenantId)
            .orElseThrow(() -> new IllegalArgumentException("Group not found"));

        return groupToMap(group);
    }

    /**
     * Create a new user group
     */
    @Transactional
    public Map<String, Object> createGroup(String tenantId, String name, String description) {
        Tenant tenant = tenantRepo.findById(tenantId)
            .orElseThrow(() -> new IllegalArgumentException("Tenant not found"));

        if (userGroupRepo.existsByNameAndTenantId(name, tenantId)) {
            throw new IllegalArgumentException("Group with this name already exists");
        }

        UserGroup group = userGroupRepo.save(UserGroup.builder()
            .name(name)
            .description(description)
            .tenant(tenant)
            .members(new HashSet<>())
            .build());

        log.info("✓ Created user group: {} in tenant {}", name, tenantId);
        return groupToMap(group);
    }

    /**
     * Update group details
     */
    @Transactional
    public Map<String, Object> updateGroup(String tenantId, String groupId, String name, String description) {
        UserGroup group = userGroupRepo.findByIdAndTenantId(groupId, tenantId)
            .orElseThrow(() -> new IllegalArgumentException("Group not found"));

        if (name != null) {
            if (!name.equals(group.getName()) && userGroupRepo.existsByNameAndTenantId(name, tenantId)) {
                throw new IllegalArgumentException("Another group with this name already exists");
            }
            group.setName(name);
        }

        if (description != null) {
            group.setDescription(description);
        }

        group = userGroupRepo.save(group);
        log.info("✓ Updated group: {} in tenant {}", groupId, tenantId);
        return groupToMap(group);
    }

    /**
     * Add member to group
     */
    @Transactional
    public Map<String, Object> addMember(String tenantId, String groupId, String userId) {
        UserGroup group = userGroupRepo.findByIdAndTenantId(groupId, tenantId)
            .orElseThrow(() -> new IllegalArgumentException("Group not found"));

        User user = userRepo.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (!user.getTenant().getId().equals(tenantId)) {
            throw new SecurityException("User does not belong to this tenant");
        }

        if (group.getMembers().contains(user)) {
            throw new IllegalArgumentException("User is already a member of this group");
        }

        group.getMembers().add(user);
        group = userGroupRepo.save(group);

        log.info("✓ Added user {} to group {}", userId, groupId);
        return groupToMap(group);
    }

    /**
     * Remove member from group
     */
    @Transactional
    public Map<String, Object> removeMember(String tenantId, String groupId, String userId) {
        UserGroup group = userGroupRepo.findByIdAndTenantId(groupId, tenantId)
            .orElseThrow(() -> new IllegalArgumentException("Group not found"));

        User user = userRepo.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (!group.getMembers().remove(user)) {
            throw new IllegalArgumentException("User is not a member of this group");
        }

        group = userGroupRepo.save(group);
        log.info("✓ Removed user {} from group {}", userId, groupId);
        return groupToMap(group);
    }

    /**
     * Delete a group
     */
    @Transactional
    public void deleteGroup(String tenantId, String groupId) {
        UserGroup group = userGroupRepo.findByIdAndTenantId(groupId, tenantId)
            .orElseThrow(() -> new IllegalArgumentException("Group not found"));

        userGroupRepo.delete(group);
        log.info("✓ Deleted group: {} from tenant {}", groupId, tenantId);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private Map<String, Object> groupToMap(UserGroup g) {
        List<Map<String, String>> members = g.getMembers().stream()
            .map(u -> Map.of(
                "id", u.getId(),
                "email", u.getEmail(),
                "firstName", u.getFirstName(),
                "lastName", u.getLastName()
            ))
            .map(m -> (Map<String, String>) m)
            .sorted(Comparator.comparing(m -> m.get("email")))
            .collect(Collectors.toList());

        return new LinkedHashMap<>(Map.of(
            "id", g.getId(),
            "name", g.getName(),
            "description", g.getDescription() != null ? g.getDescription() : "",
            "memberCount", g.getMembers().size(),
            "members", members,
            "createdAt", g.getCreatedAt().toString()
        ));
    }
}
