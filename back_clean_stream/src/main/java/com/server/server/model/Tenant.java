package com.server.server.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;
import java.util.*;
 
@Entity
@Table(name = "tenants")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class Tenant {
 
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
 
    @Column(unique = true, nullable = false)
    private String slug; // e.g. "acme-corp"
 
    @Column(nullable = false)
    private String name;
 
    @CreationTimestamp
    private LocalDateTime createdAt;
 
    @OneToMany(mappedBy = "tenant", cascade = CascadeType.ALL)
    private List<User> users = new ArrayList<>();
 
    @OneToMany(mappedBy = "tenant", cascade = CascadeType.ALL)
    private List<Role> roles = new ArrayList<>();
}