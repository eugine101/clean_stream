package com.server.server.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.*;

@Entity
@Table(name = "roles",
    uniqueConstraints = @UniqueConstraint(columnNames = {"tenant_id", "name"}))
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class Role {

    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String name; // e.g. "OWNER", "ADMIN", "MEMBER", or custom

    private String description;

    /**
     * Primary (system) roles cannot be renamed, deleted, or have their
     * core permissions removed by tenant admins.
     * OWNER and ADMIN are always primary.
     */
    @Column(name = "is_primary", nullable = false)
    private boolean isPrimary = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id")
    private Tenant tenant;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "role_permissions",
        joinColumns = @JoinColumn(name = "role_id"),
        inverseJoinColumns = @JoinColumn(name = "permission_id")
    )
    private Set<Permission> permissions = new HashSet<>();
}