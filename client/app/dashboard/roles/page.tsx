'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import {
  Shield, Plus, Copy, Edit2, Lock, Check, X, Sparkles,
} from 'lucide-react';
import {
  Card, CardHeader, CardTitle, CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Tooltip, TooltipTrigger, TooltipContent, TooltipProvider,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { createRole, getRoles } from '@/lib/api'; // adjust to your actual API imports

// ── Types ────────────────────────────────────────────────────────────────────

type PermissionResource = 'users' | 'roles' | 'billing' | 'analytics' | 'settings';
type PermissionAction   = 'read' | 'write' | 'delete' | 'export' | 'manage';

interface Permission {
  resource: PermissionResource;
  action:   PermissionAction;
}

interface Role {
  id:          string;
  name:        string;
  description: string;
  color:       string;
  isSystem?:   boolean;
  permissions: Permission[];
}

// ── Constants ────────────────────────────────────────────────────────────────

const resources: PermissionResource[] = ['users', 'roles', 'billing', 'analytics', 'settings'];
const actions:   PermissionAction[]   = ['read', 'write', 'delete', 'export', 'manage'];

const resourceLabels: Record<PermissionResource, string> = {
  users:     'Users',
  roles:     'Roles',
  billing:   'Billing',
  analytics: 'Analytics',
  settings:  'Settings',
};

const actionLabels: Record<PermissionAction, string> = {
  read:   'Read',
  write:  'Write',
  delete: 'Delete',
  export: 'Export',
  manage: 'Manage',
};

const COLOR_OPTIONS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#3b82f6', '#0ea5e9', '#10b981', '#f59e0b',
];

// ── Helpers ──────────────────────────────────────────────────────────────────

type PermMatrix = Record<PermissionResource, Record<PermissionAction, boolean>>;

function buildPermissionMatrix(role: Role): PermMatrix {
  const matrix = Object.fromEntries(
    resources.map(r => [r, Object.fromEntries(actions.map(a => [a, false]))])
  ) as PermMatrix;

  for (const { resource, action } of role.permissions) {
    if (matrix[resource]) matrix[resource][action] = true;
  }
  return matrix;
}

function emptyMatrix(): PermMatrix {
  return Object.fromEntries(
    resources.map(r => [r, Object.fromEntries(actions.map(a => [a, false]))])
  ) as PermMatrix;
}

// ── RoleCard ─────────────────────────────────────────────────────────────────

interface RoleCardProps {
  role:        Role;
  selected:    boolean;
  onClick:     () => void;
  onEdit:      () => void;
  onDuplicate: () => void;
  onDelete:    () => void;
}

function RoleCard({ role, selected, onClick, onEdit, onDuplicate, onDelete }: RoleCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'p-4 rounded-xl border cursor-pointer transition-all',
        selected
          ? 'border-blue-400 bg-blue-50/60 shadow-sm'
          : 'border-border hover:border-blue-200 hover:bg-muted/30',
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0"
          style={{ background: role.color }}
        >
          <Shield className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{role.name}</p>
          <p className="text-xs text-muted-foreground truncate">{role.description}</p>
        </div>
        {role.isSystem && (
          <Badge variant="outline" className="text-xs border-amber-200 bg-amber-50 text-amber-700 shrink-0">
            <Lock className="w-2.5 h-2.5 mr-1" /> System
          </Badge>
        )}
      </div>
    </div>
  );
}

// ── RoleManagement ────────────────────────────────────────────────────────────

interface EditorState {
  name:        string;
  description: string;
  color:       string;
  matrix:      PermMatrix;
}

function RoleManagement() {
  const [roles,      setRoles]      = useState<Role[]>([]);
  const [selected,   setSelected]   = useState<Role | null>(null);
  const [isLoading,  setIsLoading]  = useState(true);
  const [isSaving,   setIsSaving]   = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editMode,   setEditMode]   = useState<Role | null>(null);
  const [editor,     setEditor]     = useState<EditorState>({
    name: '', description: '', color: COLOR_OPTIONS[4], matrix: emptyMatrix(),
  });

  // Derived permission matrix for the selected role
  const permMatrix: PermMatrix = selected ? buildPermissionMatrix(selected) : emptyMatrix();

  // Load roles on mount
  useEffect(() => {
    (async () => {
      try {
        const data = await getRoles();
        setRoles(data);
        if (data.length > 0) setSelected(data[0]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load roles');
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // ── Editor helpers ──────────────────────────────────────────────────────────

  const togglePermission = (resource: PermissionResource, action: PermissionAction) => {
    setEditor(prev => ({
      ...prev,
      matrix: {
        ...prev.matrix,
        [resource]: {
          ...prev.matrix[resource],
          [action]: !prev.matrix[resource][action],
        },
      },
    }));
  };

  const toggleAll = (resource: PermissionResource, value: boolean) => {
    setEditor(prev => ({
      ...prev,
      matrix: {
        ...prev.matrix,
        [resource]: Object.fromEntries(actions.map(a => [a, value])) as Record<PermissionAction, boolean>,
      },
    }));
  };

  // ── Open dialogs ────────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditor({ name: '', description: '', color: COLOR_OPTIONS[4], matrix: emptyMatrix() });
    setEditMode(null);
    setShowCreate(true);
  };

  const openDuplicate = (role: Role) => {
    setEditor({
      name:        `${role.name} (copy)`,
      description: role.description,
      color:       role.color,
      matrix:      buildPermissionMatrix(role),
    });
    setEditMode(null);
    setShowCreate(true);
  };

  // ── Save ────────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!editor.name) return;
    try {
      setIsSaving(true);
      const permissions: Permission[] = resources.flatMap(resource =>
        actions
          .filter(action => editor.matrix[resource]?.[action])
          .map(action => ({ resource, action })),
      );
      await createRole(editor.name, editor.description, editor.color, permissions);

      const rolesData = await getRoles();
      setRoles(rolesData);
      if (rolesData.length > 0) setSelected(rolesData[0]);
      setShowCreate(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save role');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <TooltipProvider>
      <div className="p-8 space-y-6 animate-in-up">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Roles</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Define what each role can do in your workspace
            </p>
          </div>
          <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-500 text-white gap-2">
            <Plus className="w-4 h-4" /> Create role
          </Button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive">Error: {error}</p>
          </div>
        )}

        {/* Body */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading roles…</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Role list */}
            <div className="lg:col-span-2 space-y-2">
              {roles.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No roles found</p>
              ) : (
                roles.map(role => (
                  <RoleCard
                    key={role.id}
                    role={role}
                    selected={selected?.id === role.id}
                    onClick={() => setSelected(role)}
                    onEdit={() => openDuplicate(role)}
                    onDuplicate={() => openDuplicate(role)}
                    onDelete={() => setRoles(prev => prev.filter(r => r.id !== role.id))}
                  />
                ))
              )}
            </div>

            {/* Permission matrix */}
            <div className="lg:col-span-3">
              {selected ? (
                <Card className="border-border/50 shadow-sm sticky top-6">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center text-white"
                          style={{ background: selected.color }}
                        >
                          <Shield className="w-4 h-4" />
                        </div>
                        <div>
                          <CardTitle className="font-display text-base font-semibold">
                            {selected.name}
                          </CardTitle>
                          <p className="text-xs text-muted-foreground mt-0.5">{selected.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {selected.isSystem && (
                          <Badge variant="outline" className="text-xs border-amber-200 bg-amber-50 text-amber-700">
                            <Lock className="w-2.5 h-2.5 mr-1" /> System
                          </Badge>
                        )}
                        <Button
                          variant="outline" size="sm"
                          onClick={() => openDuplicate(selected)}
                          className="gap-1.5 h-8 text-xs"
                        >
                          <Copy className="w-3.5 h-3.5" /> Duplicate
                        </Button>
                        {!selected.isSystem && (
                          <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs">
                            <Edit2 className="w-3.5 h-3.5" /> Edit
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    {/* Column headers */}
                    <div className="grid grid-cols-6 gap-2 mb-3 pl-2">
                      <div />
                      {actions.map(action => (
                        <div key={action} className="text-center">
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            {actionLabels[action]}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Rows */}
                    <div className="space-y-1">
                      {resources.map(resource => (
                        <div
                          key={resource}
                          className="grid grid-cols-6 gap-2 items-center py-1.5 px-2 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="text-sm font-medium text-foreground text-left">
                            {resourceLabels[resource]}
                          </div>
                          {actions.map(action => {
                            const enabled = permMatrix[resource]?.[action];
                            return (
                              <Tooltip key={action}>
                                <TooltipTrigger asChild>
                                  <div className="flex justify-center">
                                    <div className={cn(
                                      'w-6 h-6 rounded-md flex items-center justify-center',
                                      enabled
                                        ? 'bg-blue-100 border border-blue-300'
                                        : 'bg-muted border border-border',
                                    )}>
                                      {enabled
                                        ? <Check className="w-3.5 h-3.5 text-blue-600" />
                                        : <X className="w-3 h-3 text-muted-foreground/40" />
                                      }
                                    </div>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">
                                    {enabled ? 'Allowed' : 'Denied'}: {actionLabels[action]} {resourceLabels[resource]}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-border/50 shadow-sm sticky top-6">
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground">Select a role to view permissions</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Create / Edit dialog */}
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display text-xl font-bold">
                {editMode ? `Edit ${editMode.name}` : 'Create new role'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Role name</Label>
                  <Input
                    value={editor.name}
                    onChange={e => setEditor(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Pipeline Manager"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex gap-2 flex-wrap pt-1">
                    {COLOR_OPTIONS.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setEditor(p => ({ ...p, color }))}
                        className={cn(
                          'w-7 h-7 rounded-full transition-all',
                          editor.color === color
                            ? 'ring-2 ring-offset-2 ring-blue-500 scale-110'
                            : 'hover:scale-105',
                        )}
                        style={{ background: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={editor.description}
                  onChange={e => setEditor(p => ({ ...p, description: e.target.value }))}
                  placeholder="Describe what this role can do…"
                  className="resize-none h-16 text-sm"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Permissions</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button" variant="outline" size="sm" className="h-7 text-xs"
                      onClick={() => setEditor(p => ({
                        ...p,
                        matrix: Object.fromEntries(
                          resources.map(r => [r, Object.fromEntries(actions.map(a => [a, true]))])
                        ) as PermMatrix,
                      }))}
                    >
                      <Sparkles className="w-3 h-3 mr-1" /> Grant all
                    </Button>
                    <Button
                      type="button" variant="outline" size="sm" className="h-7 text-xs"
                      onClick={() => setEditor(p => ({ ...p, matrix: emptyMatrix() }))}
                    >
                      Clear all
                    </Button>
                  </div>
                </div>

                <div className="border rounded-xl overflow-hidden">
                  {/* Header row */}
                  <div className="grid grid-cols-6 gap-0 bg-muted/50 border-b">
                    <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Resource
                    </div>
                    {actions.map(a => (
                      <div key={a} className="px-2 py-2 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {actionLabels[a]}
                      </div>
                    ))}
                  </div>

                  {/* Resource rows */}
                  {resources.map((resource, i) => {
                    const allOn = actions.every(a => editor.matrix[resource][a]);
                    return (
                      <div
                        key={resource}
                        className={cn(
                          'grid grid-cols-6 gap-0 border-b last:border-0 hover:bg-muted/20 transition-colors',
                          i % 2 !== 0 && 'bg-muted/10',
                        )}
                      >
                        <div className="px-3 py-2.5 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleAll(resource, !allOn)}
                            className={cn(
                              'w-3.5 h-3.5 rounded border-2 flex items-center justify-center transition-colors shrink-0',
                              allOn ? 'bg-blue-600 border-blue-600' : 'border-border',
                            )}
                          >
                            {allOn && <Check className="w-2 h-2 text-white" />}
                          </button>
                          <span className="text-xs font-medium text-foreground">
                            {resourceLabels[resource]}
                          </span>
                        </div>

                        {actions.map(action => (
                          <div key={action} className="flex items-center justify-center py-2.5">
                            <button
                              type="button"
                              onClick={() => togglePermission(resource, action)}
                              className={cn(
                                'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                                editor.matrix[resource][action]
                                  ? 'bg-blue-600 border-blue-600'
                                  : 'border-border hover:border-blue-400',
                              )}
                            >
                              {editor.matrix[resource][action] && (
                                <Check className="w-2.5 h-2.5 text-white" />
                              )}
                            </button>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 mt-6">
              <Button
                type="button" variant="outline"
                onClick={() => setShowCreate(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={!editor.name || isSaving}
                className="bg-blue-600 hover:bg-blue-500 text-white"
              >
                {isSaving ? 'Saving…' : editMode ? 'Save changes' : 'Create role'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function RolesPage() {
  return (
    <ProtectedRoute requiredPermissions={['roles:read']}>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Role Management</h1>
          <p className="text-gray-600 mt-2">Manage roles and their associated permissions</p>
        </div>
        <RoleManagement />
      </div>
    </ProtectedRoute>
  );
}