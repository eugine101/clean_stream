'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Role, Permission, CreateRoleRequest, UpdateRoleRequest } from '@/hooks/useRoles';

interface RoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  role?: Role | null;
  permissions: Permission[];
  onSave: (request: CreateRoleRequest | UpdateRoleRequest) => Promise<void>;
  loading?: boolean;
}

export function RoleModal({
  isOpen,
  onClose,
  role,
  permissions,
  onSave,
  loading = false,
}: RoleModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (role) {
      setName(role.name);
      setDescription(role.description || '');
      setSelectedPermissions(new Set(role.permissions.map((p) => p.id)));
    } else {
      setName('');
      setDescription('');
      setSelectedPermissions(new Set());
    }
    setError('');
  }, [role, isOpen]);

  const handlePermissionToggle = (permissionId: string) => {
    const newSelected = new Set(selectedPermissions);
    if (newSelected.has(permissionId)) {
      newSelected.delete(permissionId);
    } else {
      newSelected.add(permissionId);
    }
    setSelectedPermissions(newSelected);
  };

  const handleSave = async () => {
    setError('');

    if (!name.trim()) {
      setError('Role name is required');
      return;
    }

    try {
      setIsSaving(true);
      const request = role
        ? ({
            description: description.trim() || undefined,
            permissionIds: Array.from(selectedPermissions),
          } as UpdateRoleRequest)
        : ({
            name: name.toUpperCase(),
            description: description.trim(),
            permissionIds: Array.from(selectedPermissions),
          } as CreateRoleRequest);

      await onSave(request);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save role');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{role ? 'Edit Role' : 'Create Role'}</DialogTitle>
          <DialogDescription>
            {role
              ? 'Update role details and permissions'
              : 'Create a new role and assign permissions'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Role Name */}
          <div>
            <Label htmlFor="role-name">Role Name *</Label>
            <Input
              id="role-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Data Analyst"
              disabled={role?.primary || isSaving || loading}
              className="mt-1"
            />
          </div>

          {/* Role Description */}
          <div>
            <Label htmlFor="role-description">Description</Label>
            <Input
              id="role-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this role"
              disabled={role?.primary || isSaving || loading}
              className="mt-1"
            />
          </div>

          {/* Permissions */}
          <div>
            <Label>Permissions</Label>
            <div className="border rounded-md p-4 mt-1 max-h-64 overflow-y-auto">
              <div className="space-y-3">
                {permissions.length === 0 ? (
                  <p className="text-sm text-gray-500">No permissions available</p>
                ) : (
                  permissions.map((permission) => (
                    <div key={permission.id} className="flex items-start space-x-2">
                      <Checkbox
                        id={`perm-${permission.id}`}
                        checked={selectedPermissions.has(permission.id)}
                        onCheckedChange={() => handlePermissionToggle(permission.id)}
                        disabled={isSaving || loading}
                      />
                      <div className="flex-1 min-w-0">
                        <Label
                          htmlFor={`perm-${permission.id}`}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {permission.name}
                        </Label>
                        <p className="text-xs text-gray-500">{permission.description}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSaving || loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || loading || (role?.primary ? true : false)}
          >
            {isSaving || loading ? 'Saving...' : role ? 'Update Role' : 'Create Role'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
