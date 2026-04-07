import { useState, useEffect, useCallback } from 'react';
import {
  getTenantRoles,
  getRolePermissions,
  createTenantRole,
  updateTenantRole,
  deleteTenantRole,
} from '@/lib/api';

export interface Permission {
  id: string;
  name: string;
  description: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  primary: boolean;
  permissions: Permission[];
}

export interface CreateRoleRequest {
  name: string;
  description?: string;
  permissionIds: string[];
}

export interface UpdateRoleRequest {
  description?: string;
  permissionIds?: string[];
}

export function useRoles() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getTenantRoles();
      setRoles(data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch roles';
      setError(message);
      console.error('Error fetching roles:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPermissions = useCallback(async () => {
    try {
      const data = await getRolePermissions();
      setPermissions(data || []);
    } catch (err) {
      console.error('Error fetching permissions:', err);
    }
  }, []);

  const createRole = useCallback(
    async (request: CreateRoleRequest) => {
      try {
        setLoading(true);
        setError(null);
        const newRole = await createTenantRole(
          request.name,
          request.description || '',
          Array.from(request.permissionIds)
        );
        setRoles((prev) => [...prev, newRole]);
        return newRole;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create role';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const updateRole = useCallback(
    async (roleId: string, request: UpdateRoleRequest) => {
      try {
        setLoading(true);
        setError(null);
        const updated = await updateTenantRole(
          roleId,
          request.description,
          request.permissionIds ? Array.from(request.permissionIds) : undefined
        );
        setRoles((prev) =>
          prev.map((r) => (r.id === roleId ? updated : r))
        );
        return updated;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update role';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteRole = useCallback(
    async (roleId: string) => {
      try {
        setLoading(true);
        setError(null);
        await deleteTenantRole(roleId);
        setRoles((prev) => prev.filter((r) => r.id !== roleId));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete role';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, [fetchRoles, fetchPermissions]);

  return {
    roles,
    permissions,
    loading,
    error,
    fetchRoles,
    fetchPermissions,
    createRole,
    updateRole,
    deleteRole,
  };
}
