'use client';
// app/dashboard/permissions/page.tsx

import { useState, useEffect } from 'react';
import { getRoles } from '@/lib/api';
import { usePermissions } from '@/lib/permissions-context';
import { Role, PermissionResource, PermissionAction } from '@/types';
import { capitalizeFirst, cn } from '@/lib/utils';
import { Key, Info, Check, X, Search, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Helper to build permission matrix
function buildPermissionMatrix(role: Role, resources: PermissionResource[], actions: PermissionAction[]) {
  const matrix: Record<string, Record<string, boolean>> = {};
  resources.forEach(resource => {
    matrix[resource] = {};
    actions.forEach(action => {
      matrix[resource][action] = false;
    });
  });
  role.permissions.forEach((permission: any) => {
    if (resources.includes(permission.resource) && actions.includes(permission.action)) {
      matrix[permission.resource][permission.action] = true;
    }
  });
  return matrix;
}

const RESOURCE_LABELS: Record<PermissionResource, { label: string; desc: string }> = {
  datasets: { label: 'Datasets', desc: 'Access to data sources and uploaded files' },
  pipelines: { label: 'Pipelines', desc: 'Data cleaning pipeline configurations' },
  jobs: { label: 'Jobs', desc: 'Pipeline execution runs and schedules' },
  members: { label: 'Members', desc: 'Team member management and invitations' },
  roles: { label: 'Roles', desc: 'Role and permission configuration' },
  billing: { label: 'Billing', desc: 'Subscription, invoices and payment methods' },
  integrations: { label: 'Integrations', desc: 'Third-party app connections' },
  reports: { label: 'Reports', desc: 'Analytics dashboards and data quality reports' },
  audit_logs: { label: 'Audit Logs', desc: 'Activity history and compliance records' },
};

const ACTION_COLORS: Record<PermissionAction, string> = {
  create: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  read: 'bg-blue-100 text-blue-700 border-blue-200',
  update: 'bg-amber-100 text-amber-700 border-amber-200',
  delete: 'bg-red-100 text-red-700 border-red-200',
  execute: 'bg-purple-100 text-purple-700 border-purple-200',
};

function PermCell({ enabled, roleColor }: { enabled: boolean; roleColor: string }) {
  return (
    <div className="flex items-center justify-center">
      {enabled ? (
        <div className="w-6 h-6 rounded-md flex items-center justify-center"
          style={{ background: `${roleColor}20`, border: `1px solid ${roleColor}50` }}>
          <Check className="w-3.5 h-3.5" style={{ color: roleColor }} />
        </div>
      ) : (
        <div className="w-6 h-6 rounded-md bg-muted border border-border flex items-center justify-center">
          <X className="w-3 h-3 text-muted-foreground/30" />
        </div>
      )}
    </div>
  );
}

export default function PermissionsPage() {
  const { resources, actions } = usePermissions();
  
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'matrix' | 'by-role' | 'by-resource'>('matrix');
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('');

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setIsLoading(true);
        const rolesData = await getRoles();
        setAllRoles(rolesData);
        if (rolesData.length > 0) {
          setSelectedRole(rolesData[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load roles');
      } finally {
        setIsLoading(false);
      }
    };
    fetchRoles();
  }, []);

  const filtered = resources.filter(r =>
    !search || RESOURCE_LABELS[r].label.toLowerCase().includes(search.toLowerCase())
  );

  const allMatrices = Object.fromEntries(
    allRoles.map(role => [role.id, buildPermissionMatrix(role, resources, actions)])
  );

  const role = allRoles.find(r => r.id === selectedRole) || allRoles[0];
  const roleMatrix = selectedRole ? allMatrices[selectedRole] : {};

  return (
    <TooltipProvider>
      <div className="p-8 space-y-6 animate-in-up">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-2xl font-700 text-foreground">Permissions</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Full view of what each role can access across all resources
            </p>
          </div>
        </div>

        <Tabs value={viewMode} onValueChange={v => setViewMode(v as typeof viewMode)}>
          <div className="flex items-center justify-between">
            <TabsList className="bg-muted">
              <TabsTrigger value="matrix" className="text-sm">Full matrix</TabsTrigger>
              <TabsTrigger value="by-role" className="text-sm">By role</TabsTrigger>
              <TabsTrigger value="by-resource" className="text-sm">By resource</TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Filter resources..." className="pl-8 h-8 w-44 text-sm" />
              </div>
            </div>
          </div>

          {/* Full matrix tab */}
          <TabsContent value="matrix" className="mt-4">
            <Card className="border-border/50 shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted/50 border-b border-border">
                        <th className="text-left px-4 py-3 text-xs font-display font-600 uppercase tracking-wide text-muted-foreground w-40 sticky left-0 bg-muted/50">
                          Resource
                        </th>
                        {allRoles.map(role => (
                          <th key={role.id} colSpan={actions.length} className="px-2 py-3 border-l border-border">
                            <div className="flex items-center justify-center gap-1.5">
                              <div className="w-2 h-2 rounded-full" style={{ background: role.color }} />
                              <span className="text-xs font-display font-600 text-foreground">{role.name}</span>
                            </div>
                          </th>
                        ))}
                      </tr>
                      <tr className="border-b border-border bg-muted/30">
                        <td className="px-4 py-2 sticky left-0 bg-muted/30" />
                        {allRoles.map(role => (
                          actions.map((action: PermissionAction) => (
                            <td key={`${role.id}-${action}`} className="px-1 py-2 text-center first:border-l first:border-border">
                              <span className={cn('permission-chip text-[9px] border', ACTION_COLORS[action])}>
                                {action[0].toUpperCase()}
                              </span>
                            </td>
                          ))
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((resource, ri) => (
                        <tr key={resource} className={cn(
                          'border-b border-border/50 hover:bg-muted/20 transition-colors',
                          ri % 2 === 1 && 'bg-muted/10'
                        )}>
                          <td className="px-4 py-3 sticky left-0 bg-background">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-1.5 cursor-default">
                                  <span className="text-sm font-medium text-foreground">
                                    {RESOURCE_LABELS[resource].label}
                                  </span>
                                  <Info className="w-3 h-3 text-muted-foreground/50" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">{RESOURCE_LABELS[resource].desc}</p>
                              </TooltipContent>
                            </Tooltip>
                          </td>
                          {allRoles.map(role => (
                            actions.map((action: PermissionAction) => (
                              <td key={`${role.id}-${action}`} className="px-1 py-3 first:border-l first:border-border/50">
                                <PermCell
                                  enabled={allMatrices[role.id]?.[resource]?.[action] ?? false}
                                  roleColor={role.color}
                                />
                              </td>
                            ))
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* By role tab */}
          <TabsContent value="by-role" className="mt-4">
            <div className="flex gap-6">
              {/* Role selector */}
              <div className="w-56 space-y-2 shrink-0">
                <p className="text-xs font-600 uppercase tracking-wide text-muted-foreground font-display mb-3">Roles</p>
                {isLoading ? (
                  <p className="text-xs text-muted-foreground">Loading...</p>
                ) : error ? (
                  <p className="text-xs text-destructive">Error: {error}</p>
                ) : (
                  allRoles.map(r => (
                    <button
                      key={r.id}
                      onClick={() => setSelectedRole(r.id)}
                      className={cn(
                        'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 text-left transition-all text-sm',
                        selectedRole === r.id
                          ? 'border-blue-500 bg-blue-50/50 shadow-sm font-medium'
                          : 'border-border hover:border-blue-200 bg-white'
                      )}
                    >
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: r.color }} />
                      <span className="text-foreground">{r.name}</span>
                      <Badge variant="outline" className="ml-auto text-[10px] px-1.5 h-4">
                        {r.memberCount}
                      </Badge>
                    </button>
                  ))
                )}
              </div>

              {/* Role detail */}
              <Card className="flex-1 border-border/50 shadow-sm">
                {role ? (
                  <>
                    <CardHeader className="pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ background: role.color }}>
                          <Key className="w-5 h-5" />
                        </div>
                        <div>
                          <CardTitle className="font-display font-700 text-lg">{role.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">{role.description}</p>
                        </div>
                        <Badge className="ml-auto" style={{ background: `${role.color}20`, color: role.color, border: `1px solid ${role.color}40` }}>
                          {role.permissions.length} permissions
                        </Badge>
                      </div>
                    </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {resources.map((resource: PermissionResource) => {
                      const granted = actions.filter((a: PermissionAction) => roleMatrix[resource][a]);
                      if (granted.length === 0 && !search) return null;
                      if (search && !RESOURCE_LABELS[resource as PermissionResource].label.toLowerCase().includes(search.toLowerCase())) return null;
                      return (
                        <div key={resource} className="flex items-center gap-4 py-2.5 px-3 rounded-lg hover:bg-muted/40 transition-colors">
                          <div className="w-32 shrink-0">
                            <p className="text-sm font-medium text-foreground">{RESOURCE_LABELS[resource].label}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{RESOURCE_LABELS[resource].desc}</p>
                          </div>
                          <div className="flex-1 flex flex-wrap gap-1.5">
                            {actions.map((action: PermissionAction) => {
                              const allowed = roleMatrix[resource][action];
                              return (
                                <span key={action} className={cn(
                                  'permission-chip border text-[10px]',
                                  allowed ? ACTION_COLORS[action] : 'bg-muted text-muted-foreground/50 border-border'
                                )}>
                                  {allowed ? <Check className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />}
                                  {action}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
                  </>
                ) : (
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground">Select a role to view permissions</p>
                  </CardContent>
                )}
              </Card>
            </div>
          </TabsContent>

          {/* By resource tab */}
          <TabsContent value="by-resource" className="mt-4">
            <div className="space-y-3">
              {filtered.map(resource => (
                <Card key={resource} className="border-border/50 shadow-sm">
                  <CardHeader className="py-3 px-5">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-display font-600 text-sm text-foreground">{RESOURCE_LABELS[resource].label}</p>
                        <p className="text-xs text-muted-foreground">{RESOURCE_LABELS[resource].desc}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 px-5 pb-4">
                    <div className="grid grid-cols-5 gap-3">
                      {allRoles.map(role => {
                        const granted = actions.filter((a: PermissionAction) => allMatrices[role.id]?.[resource]?.[a]);
                        return (
                          <div key={role.id} className="p-3 rounded-lg border border-border bg-muted/20">
                            <div className="flex items-center gap-1.5 mb-2">
                              <div className="w-2 h-2 rounded-full" style={{ background: role.color }} />
                              <span className="text-xs font-medium text-foreground">{role.name}</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {actions.map((action: PermissionAction) => {
                                const allowed = allMatrices[role.id][resource][action];
                                return (
                                  <span key={action} className={cn(
                                    'text-[9px] px-1.5 py-0.5 rounded border font-medium',
                                    allowed ? ACTION_COLORS[action] : 'bg-muted text-muted-foreground/30 border-transparent'
                                  )}>
                                    {action[0].toUpperCase()}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}