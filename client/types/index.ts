// types/index.ts

export type UserRole = 'owner' | 'admin' | 'analyst' | 'viewer' | 'custom';

export type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'execute';

export type PermissionResource =
  | 'datasets'
  | 'pipelines'
  | 'jobs'
  | 'members'
  | 'roles'
  | 'billing'
  | 'integrations'
  | 'reports'
  | 'audit_logs';

export interface Permission {
  id: string;
  resource: PermissionResource;
  action: PermissionAction;
  description?: string;
}

export interface Role {
  id: string;
  name: string;
  slug: UserRole | string;
  description: string;
  color: string;
  permissions: Permission[];
  memberCount: number;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrgMember {
  id: string;
  userId: string;
  orgId: string;
  role: Role;
  user: User;
  joinedAt: string;
  status: 'active' | 'invited' | 'suspended';
  invitedBy?: string;
  lastActive?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  plan: 'starter' | 'pro' | 'enterprise';
  ownerId: string;
  membersCount: number;
  createdAt: string;
}

export interface AuthUser extends User {
  currentOrg: Organization;
  orgRole: Role;
  orgs: Organization[];
  roles?: Array<{ id: string; name: string; slug?: string }>;
  isPlatformAdmin: boolean;
permissions: string[];
}

// Permission matrix type
export type PermissionMatrix = {
  [K in PermissionResource]: {
    [A in PermissionAction]: boolean;
  };
};

export interface InviteMemberPayload {
  email: string;
  roleId: string;
  message?: string;
}

export interface CreateRolePayload {
  name: string;
  description: string;
  color: string;
  permissions: { resource: PermissionResource; actions: PermissionAction[] }[];
}