'use client';
// app/dashboard/settings/page.tsx

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Users, Shield, Building2, Mail, Bell } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState('account');
  const [isSaving, setIsSaving] = useState(false);

  const isOwner = user?.orgRole?.slug === 'owner' || user?.orgRole?.slug === 'admin';
  const isPlatformAdmin = user?.roles?.some((r: any) => r.name === 'PLATFORM_ADMIN');

  return (
    <div className="p-8 space-y-6 animate-in-up">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-700 text-foreground">Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your account and workspace preferences</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 bg-muted">
          <TabsTrigger value="account" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Account</span>
          </TabsTrigger>
          <TabsTrigger value="workspace" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            <span className="hidden sm:inline">Workspace</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="api" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">API Keys</span>
          </TabsTrigger>
          {isPlatformAdmin && (
            <TabsTrigger value="platform" className="flex items-center gap-2 col-span-1">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Platform</span>
            </TabsTrigger>
          )}
        </TabsList>

        {/* Account Tab */}
        <TabsContent value="account" className="space-y-6 mt-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Update your personal account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input defaultValue={user?.name?.split(' ')?.[0] || ''} placeholder="First name" disabled />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input defaultValue={user?.name?.split(' ').slice(1).join(' ') || ''} placeholder="Last name" disabled />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input defaultValue={user?.email || ''} placeholder="Email" disabled />
              </div>
              <div className="space-y-2">
                <Label>Profile Picture</Label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-xl bg-linear-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                    {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                  </div>
                  <Button variant="outline">Upload Picture</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workspace Tab */}
        <TabsContent value="workspace" className="space-y-6 mt-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>Workspace Details</CardTitle>
              <CardDescription>Information about your current workspace</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Workspace Name</Label>
                  <Input defaultValue={user?.currentOrg?.name || ''} placeholder="Workspace name" disabled />
                </div>
                <div className="space-y-2">
                  <Label>Workspace Slug</Label>
                  <Input defaultValue={user?.currentOrg?.slug || ''} placeholder="Workspace slug" disabled />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Workspace ID</Label>
                <Input defaultValue={user?.currentOrg?.id || ''} placeholder="Workspace ID" disabled className="font-mono text-xs" />
              </div>
              <div className="space-y-2">
                <Label>Plan</Label>
                <div className="flex items-center gap-3">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-100 border border-blue-200">
                    <span className="text-sm font-semibold text-blue-700">{user?.currentOrg?.plan || 'Pro'}</span>
                  </div>
                </div>
              </div>
              {isOwner && (
                <Button className="mt-4 bg-blue-600 hover:bg-blue-500">
                  <Building2 className="w-4 h-4 mr-2" />
                  Manage Workspace
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6 mt-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>Choose what emails you want to receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-sm">Pipeline Updates</p>
                  <p className="text-xs text-muted-foreground">Get notified when your data cleaning jobs complete</p>
                </div>
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-sm">Team Invitations</p>
                  <p className="text-xs text-muted-foreground">Notify when new team members join</p>
                </div>
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-sm">Billing Alerts</p>
                  <p className="text-xs text-muted-foreground">Notifications about your subscription and billing</p>
                </div>
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
              </div>
              <Button className="mt-4 bg-blue-600 hover:bg-blue-500">Save Preferences</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Keys Tab */}
        <TabsContent value="api" className="space-y-6 mt-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>Manage API keys for programmatic access</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                <p className="text-sm text-amber-800">
                  <strong>Note:</strong> API keys are coming soon. You'll be able to generate and manage keys for third-party integrations.
                </p>
              </div>
              <Button disabled className="gap-2">
                <Shield className="w-4 h-4" />
                Generate API Key
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Platform Admin Tab */}
        {isPlatformAdmin && (
          <TabsContent value="platform" className="space-y-6 mt-6">
            <Card className="border-border/50 shadow-sm bg-red-50/50 border-red-200">
              <CardHeader>
                <CardTitle className="text-red-700">Platform Administration</CardTitle>
                <CardDescription>System-wide management for SaaS owners</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg bg-white border border-red-200">
                    <p className="text-2xl font-bold text-red-600">-</p>
                    <p className="text-xs text-muted-foreground">Total Tenants</p>
                  </div>
                  <div className="p-4 rounded-lg bg-white border border-red-200">
                    <p className="text-2xl font-bold text-red-600">-</p>
                    <p className="text-xs text-muted-foreground">Total Users</p>
                  </div>
                  <div className="p-4 rounded-lg bg-white border border-red-200">
                    <p className="text-2xl font-bold text-red-600">-</p>
                    <p className="text-xs text-muted-foreground">Active Sessions</p>
                  </div>
                  <div className="p-4 rounded-lg bg-white border border-red-200">
                    <p className="text-2xl font-bold text-red-600">-</p>
                    <p className="text-xs text-muted-foreground">System Health</p>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <Button className="gap-2 bg-red-600 hover:bg-red-500">
                    <Users className="w-4 h-4" />
                    View All Tenants
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
