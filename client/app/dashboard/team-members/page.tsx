'use client';
// app/dashboard/team-members/page.tsx

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getTeamMembers, inviteTeamMember, updateTeamMemberRoles, removeTeamMember, updateTeamMemberStatus, getRoles } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Users, Plus, Trash2, Edit2, Search, Mail, Shield, UserX, Loader } from 'lucide-react';

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roles?: Array<{ id: string; name: string }>;
  active: boolean;
  createdAt: string;
}

interface Role {
  id: string;
  name: string;
  description?: string;
}

const roleConfig: Record<string, { label: string; color: string }> = {
  OWNER: { label: 'Owner', color: 'bg-purple-100 text-purple-800' },
  ADMIN: { label: 'Admin', color: 'bg-red-100 text-red-800' },
  MEMBER: { label: 'Member', color: 'bg-blue-100 text-blue-800' },
};

const statusConfig = {
  active: { label: 'Active', color: 'bg-green-100 text-green-800' },
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  inactive: { label: 'Inactive', color: 'bg-gray-100 text-gray-800' },
};

export default function TeamMembersPage() {
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [search, setSearch] = useState('');
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [newInvite, setNewInvite] = useState({ email: '', roles: [] as string[] });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isOwner = user?.roles?.some((r: any) => r.slug === 'owner' || r.slug === 'admin');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [membersData, rolesData] = await Promise.all([
          getTeamMembers(),
          getRoles(),
        ]);
        setMembers(membersData);
        setRoles(rolesData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const filtered = members.filter(m =>
    `${m.firstName} ${m.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleInviteMember = async () => {
    if (!newInvite.email || newInvite.roles.length === 0) return;

    setIsSaving(true);
    try {
      await inviteTeamMember(newInvite.email, newInvite.roles);
      const updated = await getTeamMembers();
      setMembers(updated);
      setNewInvite({ email: '', roles: [] });
      setShowInviteDialog(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to invite member');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateMember = async () => {
    if (!editingMember || !editingMember.roles) return;

    setIsSaving(true);
    try {
      await updateTeamMemberRoles(editingMember.id, editingMember.roles.map(r => r.id));
      const updated = await getTeamMembers();
      setMembers(updated);
      setEditingMember(null);
      setShowEditDialog(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update member');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveMember = async (id: string) => {
    if (confirm('Are you sure you want to remove this member from the workspace?')) {
      try {
        await removeTeamMember(id);
        setMembers(members.filter(m => m.id !== id));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to remove member');
      }
    }
  };

  const handleToggleStatus = async (member: TeamMember) => {
    try {
      await updateTeamMemberStatus(member.id, !member.active);
      const updated = await getTeamMembers();
      setMembers(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 animate-in-up">
      {/* Error message */}
      {error && (
        <div className="bg-red-100 border border-red-200 text-red-800 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-700 text-foreground">Team Members</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage workspace members and their permissions</p>
        </div>
        {isOwner && (
          <Button onClick={() => setShowInviteDialog(true)} className="bg-blue-600 hover:bg-blue-500 text-white gap-2">
            <Plus className="w-4 h-4" />
            Invite Member
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Members', value: members.length, color: 'bg-blue-50 text-blue-600' },
          { label: 'Active', value: members.filter(m => m.active).length, color: 'bg-green-50 text-green-600' },
          { label: 'Admins', value: members.filter(m => m.roles?.some(r => r.name === 'ADMIN')).length, color: 'bg-red-50 text-red-600' },
          { label: 'Inactive', value: members.filter(m => !m.active).length, color: 'bg-yellow-50 text-yellow-600' },
        ].map((stat, i) => (
          <Card key={i} className="border-border/50 shadow-sm">
            <CardContent className={`pt-6 ${stat.color}`}>
              <p className="text-sm font-medium opacity-75">{stat.label}</p>
              <p className="text-3xl font-bold mt-2">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <Card className="border-border/50 shadow-sm">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="pl-9 h-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Members Table */}
      <Card className="border-border/50 shadow-sm">
        <CardContent className="pt-6">
          {filtered.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-semibold text-muted-foreground">Name</th>
                    <th className="pb-3 font-semibold text-muted-foreground">Email</th>
                    <th className="pb-3 font-semibold text-muted-foreground">Roles</th>
                    <th className="pb-3 font-semibold text-muted-foreground">Status</th>
                    <th className="pb-3 font-semibold text-muted-foreground">Joined</th>
                    <th className="pb-3 font-semibold text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(member => (
                    <tr key={member.id} className="border-b hover:bg-accent/50 transition-colors">
                      <td className="py-4 font-medium">{member.firstName} {member.lastName}</td>
                      <td className="py-4 text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          {member.email}
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="flex gap-1 flex-wrap">
                          {member.roles?.map(role => (
                            <Badge key={role.id} variant="secondary" className={roleConfig[role.name]?.color || 'bg-gray-100 text-gray-800'}>
                              {roleConfig[role.name]?.label || role.name}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="py-4">
                        <Badge variant="secondary" className={member.active ? statusConfig.active.color : statusConfig.inactive.color}>
                          {member.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="py-4 text-muted-foreground">{new Date(member.createdAt).toLocaleDateString()}</td>
                      <td className="py-4">
                        {isOwner && member.id !== user?.id && (
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setEditingMember(member);
                                setShowEditDialog(true);
                              }}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:text-red-700"
                              onClick={() => handleRemoveMember(member.id)}
                            >
                              <UserX className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center">
              <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">No members found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-700">Invite Team Member</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email Address *</Label>
              <Input
                type="email"
                value={newInvite.email}
                onChange={e => setNewInvite({ ...newInvite, email: e.target.value })}
                placeholder="colleague@example.com"
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label>Roles *</Label>
              <Select value={newInvite.roles[0] || ''} onValueChange={roleId => setNewInvite({ ...newInvite, roles: [roleId] })}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(role => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowInviteDialog(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleInviteMember}
              disabled={!newInvite.email || newInvite.roles.length === 0 || isSaving}
              className="bg-blue-600 hover:bg-blue-500"
            >
              {isSaving ? 'Sending...' : 'Send Invite'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Member Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-700">Edit Member</DialogTitle>
          </DialogHeader>

          {editingMember && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={`${editingMember.firstName} ${editingMember.lastName}`}
                  disabled
                  className="h-10 opacity-50"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={editingMember.email}
                  disabled
                  className="h-10 opacity-50"
                />
              </div>
              <div className="space-y-2">
                <Label>Roles</Label>
                <Select 
                  value={editingMember.roles?.[0]?.id || ''} 
                  onValueChange={roleId => {
                    const role = roles.find(r => r.id === roleId);
                    if (role) {
                      setEditingMember({ 
                        ...editingMember, 
                        roles: [role]
                      });
                    }
                  }}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map(role => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateMember}
              disabled={isSaving}
              className="bg-blue-600 hover:blue-500"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
