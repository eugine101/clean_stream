'use client';
// app/admin/page.tsx

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getAllTenants, getSystemStats, toggleTenantStatus, deleteTenant } from '@/lib/api';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Building2,
  Users,
  Activity,
  TrendingUp,
  Plus,
  Search,
  ChevronRight,
  Edit2,
  Trash2,
  AlertCircle,
  PauseCircle,
  PlayCircle,
  Database,
  Loader,
} from 'lucide-react';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  userCount?: number;
  status?: 'active' | 'pending' | 'paused' | 'suspended';
  plan?: 'free' | 'pro' | 'enterprise';
  createdAt: string;
  lastActivity?: string;
  storage?: number;
}

interface SystemStats {
  totalTenants: number;
  totalUsers: number;
  activeTenants: number;
  totalStorage: number;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [stats, setStats] = useState<SystemStats>({
    totalTenants: 0,
    totalUsers: 0,
    activeTenants: 0,
    totalStorage: 0,
  });
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'paused' | 'suspended'>('all');
  const [showDialog, setShowDialog] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [tenantsData, statsData] = await Promise.all([
          getAllTenants(),
          getSystemStats(),
        ]);
        setTenants(tenantsData);
        setStats(statsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const filtered = tenants.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.slug.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || (t.status && t.status === filter);
    return matchesSearch && matchesFilter;
  });

  const handleToggleTenant = async (tenant: Tenant, newStatus: 'active' | 'paused') => {
    setIsSaving(true);
    try {
      await toggleTenantStatus(tenant.id);
      const updated = await getAllTenants();
      setTenants(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update tenant');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTenant = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      try {
        await deleteTenant(id);
        setTenants(tenants.filter(t => t.id !== id));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete tenant');
      }
    }
  };

  const statusConfig = {
    active: { icon: PlayCircle, color: 'text-green-600', bg: 'bg-green-50' },
    paused: { icon: PauseCircle, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    suspended: { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
    pending: { icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50' },
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-background to-muted/20">
      <div className="p-8 space-y-6">
        {/* Error message */}
        {error && (
          <div className="bg-red-100 border border-red-200 text-red-800 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-3xl font-700 text-foreground">Platform Admin</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage all tenants and system configuration</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-500 text-white gap-2">
            <Plus className="w-4 h-4" />
            Create Tenant
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Tenants</p>
                  <p className="text-3xl font-bold mt-2">{stats.totalTenants}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Users</p>
                  <p className="text-3xl font-bold mt-2">{stats.totalUsers}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Active Tenants</p>
                  <p className="text-3xl font-bold mt-2">{stats.activeTenants}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Storage</p>
                  <p className="text-3xl font-bold mt-2">{(stats.totalStorage || 0).toFixed(1)}GB</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Database className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tenants List */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Tenants</CardTitle>
                <CardDescription>Manage workspace instances and subscriptions</CardDescription>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search tenants..."
                    className="pl-9 h-10 w-60"
                  />
                </div>
                <Select value={filter} onValueChange={v => setFilter(v as any)}>
                  <SelectTrigger className="w-40 h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-t border-b text-left bg-muted/50">
                    <th className="px-6 py-4 font-semibold text-muted-foreground">Tenant</th>
                    <th className="px-6 py-4 font-semibold text-muted-foreground">Users</th>
                    <th className="px-6 py-4 font-semibold text-muted-foreground">Created</th>
                    <th className="px-6 py-4 font-semibold text-muted-foreground">Status</th>
                    <th className="px-6 py-4 font-semibold text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(tenant => {
                    const tenantStatus = tenant.status || 'active';
                    const StatusIcon = statusConfig[tenantStatus]?.icon || PlayCircle;
                    return (
                      <tr key={tenant.id} className="border-b hover:bg-accent/50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium">{tenant.name}</p>
                            <p className="text-xs text-muted-foreground">{tenant.slug}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-medium">{tenant.userCount || 0}</span>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {new Date(tenant.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className={`flex items-center gap-2 ${statusConfig[tenantStatus]?.color || 'text-gray-600'}`}>
                            <StatusIcon className="w-4 h-4" />
                            <span className="capitalize text-sm font-medium">{tenantStatus}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                handleToggleTenant(tenant, tenantStatus === 'active' ? 'paused' : 'active');
                              }}
                              disabled={isSaving}
                            >
                              {tenantStatus === 'active' ? (
                                <PauseCircle className="w-4 h-4 text-yellow-600" />
                              ) : (
                                <PlayCircle className="w-4 h-4 text-green-600" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:text-red-700"
                              onClick={() => handleDeleteTenant(tenant.id, tenant.name)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filtered.length === 0 && (
                <div className="py-12 text-center">
                  <Building2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">No tenants found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* System Info */}
        <Card className="border-border/50 shadow-sm bg-linear-to-br from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="text-sm text-blue-900">System Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-blue-600 font-medium">Platform Version</p>
              <p className="text-blue-900 font-semibold mt-1">v2.1.0</p>
            </div>
            <div>
              <p className="text-blue-600 font-medium">API Status</p>
              <p className="text-blue-900 font-semibold mt-1">
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Operational
              </p>
            </div>
            <div>
              <p className="text-blue-600 font-medium">Database</p>
              <p className="text-blue-900 font-semibold mt-1">MongoDB Atlas</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
