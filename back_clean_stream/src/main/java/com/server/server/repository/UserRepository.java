package com.server.server.repository;

import com.server.server.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
 
public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByEmailAndTenantId(String email, String tenantId);
    Optional<User> findByEmail(String email);
    List<User> findAllByTenantId(String tenantId);
    boolean existsByEmailAndTenantId(String email, String tenantId);
}
