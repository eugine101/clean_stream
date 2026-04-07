'use client';
// app/dashboard/user-groups/page.tsx

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getUserGroups, createUserGroup, updateUserGroup, deleteUserGroup } from '@/lib/api';
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
import { Users, Plus, Trash2, Edit2, Search, Loader } from 'lucide-react';

interface UserGroup {
  id: string;
  name: string;
  description?: string;
  memberCount?: number;
  createdAt: string;
}

export default function UserGroupsPage() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [search, setSearch] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingGroup, setEditingGroup] = useState<UserGroup | null>(null);
  const [newGroup, setNewGroup] = useState({ name: '', description: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isOwner = user?.roles?.some((r: any) => r.slug === 'owner' || r.slug === 'admin');

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        setIsLoading(true);
        const data = await getUserGroups();
        setGroups(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load groups');
      } finally {
        setIsLoading(false);
      }
    };
    fetchGroups();
  }, []);

  const filtered = groups.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    (g.description && g.description.toLowerCase().includes(search.toLowerCase()))
  );

  const handleCreateGroup = async () => {
    if (!newGroup.name) return;
    
    setIsSaving(true);
    try {
      await createUserGroup(newGroup.name, newGroup.description);
      const updated = await getUserGroups();
      setGroups(updated);
      setNewGroup({ name: '', description: '' });
      setShowCreateDialog(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create group');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateGroup = async () => {
    if (!editingGroup) return;
    
    setIsSaving(true);
    try {
      await updateUserGroup(editingGroup.id, editingGroup.name, editingGroup.description || '');
      const updated = await getUserGroups();
      setGroups(updated);
      setEditingGroup(null);
      setShowEditDialog(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update group');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteGroup = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete the group "${name}"?`)) {
      try {
        await deleteUserGroup(id);
        setGroups(groups.filter(g => g.id !== id));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete group');
      }
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
          <h1 className="font-display text-2xl font-700 text-foreground">User Groups</h1>
          <p className="text-muted-foreground text-sm mt-1">Organize team members into groups and manage permissions</p>
        </div>
        {isOwner && (
          <Button onClick={() => setShowCreateDialog(true)} className="bg-blue-600 hover:bg-blue-500 text-white gap-2">
            <Plus className="w-4 h-4" />
            Create Group
          </Button>
        )}
      </div>

      {/* Stats */}
      <Card className="border-border/50 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Total Groups</p>
              <p className="text-3xl font-bold mt-2">{groups.length}</p>
            </div>
            <Users className="w-12 h-12 text-muted-foreground/30" />
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <Card className="border-border/50 shadow-sm">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search groups..."
              className="pl-9 h-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(group => (
          <Card key={group.id} className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base">{group.name}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{group.description || 'No description'}</p>
                </div>
                {isOwner && (
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => {
                        setEditingGroup(group);
                        setShowEditDialog(true);
                      }}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-600 hover:text-red-700"
                      onClick={() => handleDeleteGroup(group.id, group.name)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between py-3 border-t">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{group.memberCount || 0} members</span>
                </div>
                <Button variant="outline" size="sm" className="h-8 text-xs">
                  Manage
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <Card className="border-border/50 shadow-sm">
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">No groups found. Create one to get started!</p>
          </CardContent>
        </Card>
      )}

      {/* Create Group Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-700">Create New Group</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Group Name *</Label>
              <Input
                value={newGroup.name}
                onChange={e => setNewGroup({ ...newGroup, name: e.target.value })}
                placeholder="e.g. Data Engineers"
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={newGroup.description}
                onChange={e => setNewGroup({ ...newGroup, description: e.target.value })}
                placeholder="What is this group for?"
                className="h-10"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateGroup}
              disabled={!newGroup.name || isSaving}
              className="bg-blue-600 hover:bg-blue-500"
            >
              {isSaving ? 'Creating...' : 'Create Group'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Group Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-700">Edit Group</DialogTitle>
          </DialogHeader>

          {editingGroup && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Group Name *</Label>
                <Input
                  value={editingGroup.name}
                  onChange={e => setEditingGroup({ ...editingGroup, name: e.target.value })}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={editingGroup.description || ''}
                  onChange={e => setEditingGroup({ ...editingGroup, description: e.target.value })}
                  className="h-10"
                />
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
              onClick={handleUpdateGroup}
              disabled={!editingGroup?.name || isSaving}
              className="bg-blue-600 hover:bg-blue-500"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
