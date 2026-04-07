package com.server.server.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "permissions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Permission {

    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    // e.g. "users:read", "users:write", "roles:manage", "billing:view"
    @Column(unique = true, nullable = false)
    private String name;

    private String description;
}