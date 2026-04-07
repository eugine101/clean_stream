package com.server.server.repository;

import com.server.server.model.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
 
public interface RoleRepository extends JpaRepository<Role, String> {
    List<Role> findAllByTenantId(String tenantId);
    Optional<Role> findByNameAndTenantId(String name, String tenantId);
    boolean existsByNameAndTenantId(String name, String tenantId);
}
