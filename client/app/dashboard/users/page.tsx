'use client';
// app/dashboard/users/page.tsx

import { useState, useEffect } from 'react';
import { OrgMember, Role } from '@/types';
import { getMembers, getRoles } from '@/lib/api';
import { formatDate, getInitials, generateAvatarColor, cn } from '@/lib/utils';
import {
  Search, Filter, MoreHorizontal, UserCheck, UserX, Shield,
  Mail, Download, ChevronUp, ChevronDown, Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

export default function UsersPage() {
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selected, setSelected] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState<'name' | 'role' | 'joined' | 'status'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

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

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const filtered = members
    .filter(m => {
      const matchSearch = !search ||
        m.user.name.toLowerCase().includes(search.toLowerCase()) ||
        m.user.email.toLowerCase().includes(search.toLowerCase());
      const matchRole = roleFilter === 'all' || m.role.id === roleFilter;
      return matchSearch && matchRole;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'name') cmp = a.user.name.localeCompare(b.user.name);
      if (sortKey === 'role') cmp = a.role.name.localeCompare(b.role.name);
      if (sortKey === 'joined') cmp = a.joinedAt.localeCompare(b.joinedAt);
      if (sortKey === 'status') cmp = a.status.localeCompare(b.status);
      return sortDir === 'asc' ? cmp : -cmp;
    });

  const toggleSelect = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    setSelected(prev => prev.length === filtered.length ? [] : filtered.map(m => m.id));
  };

  const SortIcon = ({ k }: { k: typeof sortKey }) => {
    if (sortKey !== k) return <ChevronUp className="w-3 h-3 opacity-20" />;
    return sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />;
  };

  return (
    <div className="p-8 space-y-6 animate-in-up">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-700 text-foreground">Users</h1>
          <p className="text-muted-foreground text-sm mt-1">All users across your organization</p>
        </div>
        <div className="flex items-center gap-2">
          {selected.length > 0 && (
            <>
              <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs">
                <Shield className="w-3.5 h-3.5" /> Change role ({selected.length})
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs text-destructive border-destructive/30 hover:bg-destructive/10">
                <UserX className="w-3.5 h-3.5" /> Suspend ({selected.length})
              </Button>
            </>
          )}
          <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs">
            <Download className="w-3.5 h-3.5" /> Export
          </Button>
        </div>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search users..." className="pl-9 h-9" />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-36 h-9">
                <SelectValue placeholder="All roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                {roles.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="text-xs text-muted-foreground whitespace-nowrap">
              {filtered.length} of {members.length}
            </div>
          </div>

          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-3 py-2.5 w-10">
                    <Checkbox
                      checked={selected.length === filtered.length && filtered.length > 0}
                      onCheckedChange={toggleAll}
                    />
                  </th>
                  {[
                    { key: 'name', label: 'User' },
                    { key: 'role', label: 'Role' },
                    { key: 'status', label: 'Status' },
                    { key: 'joined', label: 'Joined' },
                  ].map(({ key, label }) => (
                    <th key={key}
                      className="px-3 py-2.5 text-left cursor-pointer select-none"
                      onClick={() => toggleSort(key as typeof sortKey)}
                    >
                      <div className="flex items-center gap-1 text-xs font-display font-600 uppercase tracking-wide text-muted-foreground">
                        {label} <SortIcon k={key as typeof sortKey} />
                      </div>
                    </th>
                  ))}
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {filtered.map(member => (
                  <tr key={member.id}
                    className={cn(
                      'border-t border-border/50 hover:bg-muted/20 transition-colors',
                      selected.includes(member.id) && 'bg-blue-50/50'
                    )}>
                    <td className="px-3 py-3">
                      <Checkbox
                        checked={selected.includes(member.id)}
                        onCheckedChange={() => toggleSelect(member.id)}
                      />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                          style={{ background: generateAvatarColor(member.user.name) }}
                        >
                          {getInitials(member.user.name)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{member.user.name}</p>
                          <p className="text-xs text-muted-foreground">{member.user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: member.role.color }} />
                        <span className="text-sm text-foreground">{member.role.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <Badge variant="outline" className={cn('text-xs border', {
                        'bg-emerald-50 text-emerald-700 border-emerald-200': member.status === 'active',
                        'bg-amber-50 text-amber-700 border-amber-200': member.status === 'invited',
                        'bg-red-50 text-red-700 border-red-200': member.status === 'suspended',
                      })}>
                        {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 text-xs text-muted-foreground">{formatDate(member.joinedAt)}</td>
                    <td className="px-3 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem className="gap-2 cursor-pointer text-sm">
                            <UserCheck className="w-3.5 h-3.5" /> View profile
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 cursor-pointer text-sm">
                            <Shield className="w-3.5 h-3.5" /> Change role
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 cursor-pointer text-sm">
                            <Mail className="w-3.5 h-3.5" /> Send email
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="gap-2 cursor-pointer text-sm text-destructive">
                            <UserX className="w-3.5 h-3.5" /> Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {error && (
              <div className="text-center py-12">
                <p className="text-sm text-destructive mb-2">Error loading users</p>
                <p className="text-xs text-muted-foreground">{error}</p>
              </div>
            )}
            {isLoading && (
              <div className="text-center py-12">
                <p className="text-sm text-muted-foreground">Loading users...</p>
              </div>
            )}
            {!isLoading && !error && filtered.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No users match your search</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}