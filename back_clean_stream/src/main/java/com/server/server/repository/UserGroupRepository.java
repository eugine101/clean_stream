package com.server.server.repository;

import com.server.server.model.UserGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserGroupRepository extends JpaRepository<UserGroup, String> {
    List<UserGroup> findAllByTenantId(String tenantId);
    Optional<UserGroup> findByIdAndTenantId(String id, String tenantId);
    boolean existsByNameAndTenantId(String name, String tenantId);
}
