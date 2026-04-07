package com.server.server.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;
import java.util.*;
 
@Entity
@Table(name = "users",
    uniqueConstraints = @UniqueConstraint(columnNames = {"email"}))
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class User {
 
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
 
    @Column(nullable = false)
    private String email;
 
    @Column(nullable = false)
    private String password; // BCrypt hashed
 
    @Column(nullable = false)
    private String firstName;
 
    @Column(nullable = false)
    private String lastName;
 
    private boolean active = true;
 
    @Column(name = "is_platform_admin", nullable = false)
    private boolean isPlatformAdmin = false;
 
    @CreationTimestamp
    private LocalDateTime createdAt;
 
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = true)
    private Tenant tenant;
 
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "user_roles",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    private Set<Role> roles = new HashSet<>();
 
    public Set<String> getPermissionNames() {
        Set<String> perms = new HashSet<>();
        roles.forEach(r -> r.getPermissions().forEach(p -> perms.add(p.getName())));
        return perms;
    }
}
 