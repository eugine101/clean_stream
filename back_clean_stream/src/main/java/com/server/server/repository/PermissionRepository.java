package com.server.server.repository;

import com.server.server.model.Permission;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
 
public interface PermissionRepository extends JpaRepository<Permission, String> {
    List<Permission> findAllByNameIn(Set<String> names);
    List<Permission> findAllByIdIn(List<String> ids);
}
