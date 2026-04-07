'use client';
// app/dashboard/org-members/page.tsx

import { useState, useEffect } from 'react';
import { OrgMember, Role } from '@/types';
import { getMembers, getRoles, inviteMember, updateMemberRole, updateMemberStatus, removeMember } from '@/lib/api';
import { formatDate, formatRelativeTime, getInitials, generateAvatarColor, cn } from '@/lib/utils';
import {
  UserPlus, Search, MoreHorizontal, Mail, Shield, Ban, Trash2,
  ChevronDown, Check, X, Clock, Filter, Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

const statusConfig = {
  active: { label: 'Active', class: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  invited: { label: 'Invited', class: 'bg-amber-50 text-amber-700 border-amber-200' },
  suspended: { label: 'Suspended', class: 'bg-red-50 text-red-700 border-red-200' },
};

export default function OrgMembersPage() {
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [invitedEmails, setInvitedEmails] = useState<string[]>([]);
  const [pendingEmail, setPendingEmail] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [membersData, rolesData] = await Promise.all([getMembers(), getRoles()]);
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

  const filtered = members.filter(m => {
    const matchSearch = !search ||
      m.user.name.toLowerCase().includes(search.toLowerCase()) ||
      m.user.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || m.role.id === roleFilter;
    const matchStatus = statusFilter === 'all' || m.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  const handleAddEmail = () => {
    if (pendingEmail && !invitedEmails.includes(pendingEmail)) {
      setInvitedEmails([...invitedEmails, pendingEmail]);
      setPendingEmail('');
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteLoading(true);
    try {
      for (const email of invitedEmails) {
        await inviteMember(email, inviteRole, inviteMessage);
      }
      // Refresh members list
      const membersData = await getMembers();
      setMembers(membersData);
      setShowInvite(false);
      setInvitedEmails([]);
      setInviteRole('');
      setInviteMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to invite members');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleStatusChange = async (memberId: string, status: OrgMember['status']) => {
    try {
      await updateMemberStatus(memberId, status);
      const membersData = await getMembers();
      setMembers(membersData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const handleRoleChange = async (memberId: string, roleId: string) => {
    try {
      await updateMemberRole(memberId, roleId);
      const membersData = await getMembers();
      setMembers(membersData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role');
    }
  };

  const handleRemove = async (memberId: string) => {
    try {
      await removeMember(memberId);
      const membersData = await getMembers();
      setMembers(membersData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member');
    }
  };

  const counts = {
    total: members.length,
    active: members.filter(m => m.status === 'active').length,
    invited: members.filter(m => m.status === 'invited').length,
    suspended: members.filter(m => m.status === 'suspended').length,
  };

  return (
    <div className="p-8 space-y-6 animate-in-up">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-700 text-foreground">Team Members</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage who has access to your workspace
          </p>
        </div>
        <Button onClick={() => setShowInvite(true)} className="bg-blue-600 hover:bg-blue-500 text-white gap-2">
          <UserPlus className="w-4 h-4" /> Invite members
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total', value: counts.total, active: statusFilter === 'all', key: 'all' },
          { label: 'Active', value: counts.active, active: statusFilter === 'active', key: 'active' },
          { label: 'Pending invite', value: counts.invited, active: statusFilter === 'invited', key: 'invited' },
          { label: 'Suspended', value: counts.suspended, active: statusFilter === 'suspended', key: 'suspended' },
        ].map(item => (
          <button
            key={item.key}
            onClick={() => setStatusFilter(item.active ? 'all' : item.key)}
            className={cn(
              'p-4 rounded-xl border text-left transition-all',
              item.active
                ? 'bg-blue-50 border-blue-200 shadow-sm'
                : 'bg-white border-border hover:border-blue-200 hover:bg-blue-50/50'
            )}
          >
            <p className="font-display text-2xl font-700 text-foreground">{item.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-0">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-50">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="pl-9 h-9 bg-background" />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-40 h-9">
                <SelectValue placeholder="All roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                {roles.map(r => (
                  <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="h-9 gap-2">
              <Download className="w-3.5 h-3.5" /> Export
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50">
                <TableHead className="font-display font-600 text-xs uppercase tracking-wide text-muted-foreground">Member</TableHead>
                <TableHead className="font-display font-600 text-xs uppercase tracking-wide text-muted-foreground">Role</TableHead>
                <TableHead className="font-display font-600 text-xs uppercase tracking-wide text-muted-foreground">Status</TableHead>
                <TableHead className="font-display font-600 text-xs uppercase tracking-wide text-muted-foreground">Joined</TableHead>
                <TableHead className="font-display font-600 text-xs uppercase tracking-wide text-muted-foreground">Last active</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(member => (
                <TableRow key={member.id} className="border-border/50 hover:bg-muted/30">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ background: generateAvatarColor(member.user.name) }}
                      >
                        {getInitials(member.user.name)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{member.user.name}</p>
                        <p className="text-xs text-muted-foreground">{member.user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={member.role.id}
                      onValueChange={roleId => handleRoleChange(member.id, roleId)}
                    >
                      <SelectTrigger className="h-7 text-xs border-0 bg-transparent hover:bg-muted px-2 w-auto gap-1.5 font-medium" style={{ color: member.role.color }}>
                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: member.role.color }} />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map(r => (
                          <SelectItem key={r.id} value={r.id}>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ background: r.color }} />
                              {r.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn('text-xs border', statusConfig[member.status as keyof typeof statusConfig].class)}>
                      {statusConfig[member.status as keyof typeof statusConfig].label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDate(member.joinedAt)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {member.lastActive ? formatRelativeTime(member.lastActive) : '—'}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem className="gap-2 cursor-pointer">
                          <Mail className="w-4 h-4" /> Resend invite
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 cursor-pointer">
                          <Shield className="w-4 h-4" /> Change role
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {member.status === 'active' ? (
                          <DropdownMenuItem
                            className="gap-2 text-amber-600 cursor-pointer"
                            onClick={() => handleStatusChange(member.id, 'suspended')}
                          >
                            <Ban className="w-4 h-4" /> Suspend
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            className="gap-2 text-emerald-600 cursor-pointer"
                            onClick={() => handleStatusChange(member.id, 'active')}
                          >
                            <Check className="w-4 h-4" /> Reactivate
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="gap-2 text-destructive cursor-pointer"
                          onClick={() => handleRemove(member.id)}
                        >
                          <Trash2 className="w-4 h-4" /> Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {error && (
            <div className="text-center py-12">
              <p className="text-sm text-destructive mb-2">Error loading members</p>
              <p className="text-xs text-muted-foreground">{error}</p>
            </div>
          )}
          {isLoading && (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground">Loading members...</p>
            </div>
          )}
          {!isLoading && !error && filtered.length === 0 && (
            <div className="text-center py-12">
              <Search className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No members match your filters</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite dialog */}
      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-700">Invite team members</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleInvite} className="space-y-5">
            <div className="space-y-2">
              <Label>Email addresses</Label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  value={pendingEmail}
                  onChange={e => setPendingEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="flex-1"
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddEmail())}
                />
                <Button type="button" variant="outline" onClick={handleAddEmail}>Add</Button>
              </div>
              {invitedEmails.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {invitedEmails.map(email => (
                    <span key={email} className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs">
                      {email}
                      <button type="button" onClick={() => setInvitedEmails(prev => prev.filter(e => e !== email))}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Assign role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role..." />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(role => (
                    <SelectItem key={role.id} value={role.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: role.color }} />
                        <div>
                          <span className="font-medium">{role.name}</span>
                          <span className="text-muted-foreground ml-2 text-xs">{role.description}</span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Personal message <span className="text-muted-foreground">(optional)</span></Label>
              <Textarea
                value={inviteMessage}
                onChange={e => setInviteMessage(e.target.value)}
                placeholder="Hey, I'd like to invite you to our data cleaning workspace..."
                className="resize-none h-20 text-sm"
              />
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setShowInvite(false)}>Cancel</Button>
              <Button
                type="submit"
                disabled={inviteLoading || (invitedEmails.length === 0 && !pendingEmail) || !inviteRole}
                className="bg-blue-600 hover:bg-blue-500 text-white gap-2"
              >
                {inviteLoading ? 'Sending...' : `Send invite${invitedEmails.length > 1 ? 's' : ''}`}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}