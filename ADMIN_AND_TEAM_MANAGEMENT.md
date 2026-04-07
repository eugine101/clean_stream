# Multi-Tier Admin System & Team Management Guide

## Overview

This document outlines the complete multi-tier admin hierarchy and team management features that have been implemented in the Clean Stream platform.

---

## System Architecture

### User Role Hierarchy

```
┌─────────────────────────────────────────────┐
│     Platform Admin (SaaS Owner)           │
│  - System-wide access & configuration     │
│  - Manages all tenants                    │
│  - Views analytics across platform        │
└─────────────────────────────────────────────┘
             ↓ (Creates)
┌─────────────────────────────────────────────┐
│        Tenant Owner (Workspace Admin)      │
│  - Full control within their tenant        │
│  - Manages team members & roles            │
│  - Creates user groups                     │
│  - Configures workspace settings           │
└─────────────────────────────────────────────┘
             ↓ (Invites)
┌─────────────────────────────────────────────┐
│    Team Members (Editor / Viewer)         │
│  - Limited access as defined by role       │
│  - Works within assigned groups            │
│  - Collaborates on files & groups          │
└─────────────────────────────────────────────┘
```

---

## Features by Role

### 1. Platform Admin (`PLATFORM_ADMIN`)

**Location**: `/admin` dashboard

**Capabilities**:
- View all tenants in the system
- Monitor system-wide statistics:
  - Total tenants
  - Total active users
  - Total storage consumption
  - System health status
- Manage tenant lifecycle:
  - Toggle tenant active/paused status
  - Edit tenant information
  - Delete tenants
  - Search and filter tenants
- View subscription plans per tenant
- Monitor last activity timestamps
- Access system configuration

**Pages**:
- `/admin` - Main dashboard with tenant management

---

### 2. Tenant Owner (`OWNER` role)

**Location**: `/dashboard` section

**Capabilities**:
- **Team Management** (`/dashboard/team-members`):
  - Invite new members via email
  - Assign roles to members (admin, editor, viewer)
  - View member status (active, pending, inactive)
  - Edit existing member roles
  - Remove members from workspace
  - Track member join dates

- **User Groups** (`/dashboard/user-groups`):
  - Create user groups for organizing team
  - Delete groups (if empty)
  - Edit group details
  - View member count per group
  - Manage group memberships (add/remove members)

- **Permissions** (`/dashboard/permissions`):
  - Configure role-based access control
  - Define permissions per role:
    - File operations (upload, download, delete)
    - Group management
    - Member management
    - Settings access
  - Reset permissions to defaults
  - View permission matrix

- **Settings** (`/dashboard/settings`):
  - Account information (name, email, profile picture)
  - Workspace details (name, slug, plan)
  - Notification preferences
  - API keys management
  - Platform admin settings (if applicable)

**Pages**:
- `/dashboard/team-members` - Manage workspace members
- `/dashboard/user-groups` - Create and manage groups
- `/dashboard/permissions` - Configure role permissions
- `/dashboard/settings` - Workspace and account settings

---

### 3. Team Members (`EDITOR` / `VIEWER` roles)

**Location**: Limited `/dashboard` access

**Capabilities**:

**Editor**:
- Upload files to workspace
- Process/clean data
- View workspace data
- Download processed files
- Create/edit groups (optional, based on permissions)
- View team member list (read-only)
- Access settings (read-only)

**Viewer**:
- Download processed files
- View reports
- Access settings (read-only)
- Limited data visibility

**Pages** (Limited Access):
- `/dashboard` - File uploads and history
- `/dashboard/settings` - View settings only

---

## Role Permissions Matrix

| Permission | Admin | Editor | Viewer |
|-----------|-------|--------|--------|
| **Files** |
| Upload Files | ✅ | ✅ | ❌ |
| Process Files | ✅ | ✅ | ❌ |
| Download Files | ✅ | ✅ | ✅ |
| Delete Files | ✅ | ❌ | ❌ |
| **Groups** |
| Create Groups | ✅ | ✅ | ❌ |
| Edit Groups | ✅ | ✅ | ❌ |
| Delete Groups | ✅ | ❌ | ❌ |
| Manage Group Members | ✅ | ✅ | ❌ |
| **Members** |
| Invite Members | ✅ | ❌ | ❌ |
| Edit Members | ✅ | ❌ | ❌ |
| Remove Members | ✅ | ❌ | ❌ |
| **Settings** |
| View Settings | ✅ | ✅ | ✅ |
| Manage Settings | ✅ | ❌ | ❌ |
| Manage Billing | ✅ | ❌ | ❌ |

---

## Frontend Pages & Components

### Navigation Structure

```
App
├── Auth Routes
│   ├── /auth/login
│   ├── /auth/signup
│   └── /auth/forgot-password
│
├── Dashboard (Tenant User)
│   ├── /dashboard (Home)
│   ├── /dashboard/upload
│   ├── /dashboard/history
│   ├── /dashboard/team-members ← New
│   ├── /dashboard/user-groups ← New
│   ├── /dashboard/permissions
│   └── /dashboard/settings
│
└── Admin (Platform Admin Only)
    ├── /admin (Main dashboard) ← New
    └── /admin/layout (Protected layout)
```

### Key Pages

#### 1. Team Members (`/dashboard/team-members`)
- **Components**:
  - Member table with search
  - Invite dialog
  - Edit member dialog
  - Role selection dropdown
  - Status badges
  - Statistics cards
- **Features**:
  - Invite new members
  - Manage existing members
  - Change member roles
  - Remove members
  - Filter by status/role

#### 2. User Groups (`/dashboard/user-groups`)
- **Components**:
  - Groups grid/list view
  - Create group dialog
  - Group cards with member count
  - Search functionality
  - Edit/Delete buttons
- **Features**:
  - Create new groups
  - Edit group details
  - Delete groups
  - Add/remove members
  - View group statistics

#### 3. Permissions (`/dashboard/permissions`)
- **Components**:
  - Permission matrix
  - Role selector tabs
  - Checkbox list per category
  - Permission percentage indicator
- **Features**:
  - View permission matrix by role
  - Toggle permissions on/off
  - Reset to defaults
  - View permission hierarchy

#### 4. Admin Dashboard (`/admin`)
- **Components**:
  - Statistics cards (tenants, users, storage)
  - Tenant table with search/filter
  - Tenant action buttons
  - System info panel
- **Features**:
  - View all tenants
  - Monitor system metrics
  - Pause/resume tenants
  - Edit/delete tenants
  - Filter by status

---

## Implementation Files

### Frontend
```
client/
├── app/
│   ├── admin/
│   │   ├── layout.tsx          # Admin layout with auth check
│   │   └── page.tsx            # Admin dashboard
│   └── dashboard/
│       ├── team-members/
│       │   └── page.tsx        # Member management
│       ├── user-groups/
│       │   └── page.tsx        # Group management
│       ├── permissions/
│       │   └── page.tsx        # Permission config
│       └── settings/
│           └── page.tsx        # Settings with admin tab
│
├── components/
│   ├── app-sidebar.tsx         # Updated with admin link
│   └── ui/                     # Existing UI components
│
└── lib/
    ├── auth-context.tsx        # Auth state & logout
    └── api.ts                  # API integration points
```

### Backend Integration Points

The following backend endpoints need to be implemented:

**User Groups API**:
```
POST   /api/user-groups              # Create group
GET    /api/user-groups              # List groups
PUT    /api/user-groups/{id}         # Update group
DELETE /api/user-groups/{id}         # Delete group
POST   /api/user-groups/{id}/members # Manage members
```

**Team Members API**:
```
POST   /api/members/invite           # Invite member
GET    /api/members                  # List members
PUT    /api/members/{id}             # Update member role
DELETE /api/members/{id}             # Remove member
```

**Platform Admin API**:
```
GET    /api/admin/tenants            # List all tenants
GET    /api/admin/stats              # System statistics
PUT    /api/admin/tenants/{id}/status # Change status
DELETE /api/admin/tenants/{id}       # Delete tenant
```

---

## Authentication & Authorization

### Frontend Checks
```typescript
// Platform Admin check
const isPlatformAdmin = user?.roles?.some((r: any) => r.name === 'PLATFORM_ADMIN');

// Tenant Owner check
const isOwner = user?.orgRole?.slug === 'owner' || 
                user?.orgRole?.slug === 'admin';

// Role-based checks
const canInviteMembers = user?.roles?.some((r: any) => 
  ['admin', 'editor'].includes(r.name)
);
```

### JWT Token Structure
```json
{
  "sub": "userId",
  "tenantId": "c651e93b-1f27-48b4-8092-13744689052a",
  "roles": [
    { "name": "OWNER", "id": "role_1" }
  ],
  "orgRole": {
    "slug": "owner",
    "name": "Owner"
  }
}
```

---

## Task Workflow

### Creating a New Team Member
1. Tenant Owner navigates to `/dashboard/team-members`
2. Clicks "Invite Member"
3. Enters email and selects role (admin/editor/viewer)
4. System sends invitation email
5. User status shows as "Pending"
6. Once accepted, status changes to "Active"
7. Owner can later edit role or remove member

### Creating a User Group
1. Tenant Owner navigates to `/dashboard/user-groups`
2. Clicks "Create Group"
3. Enters group name and description
4. Group is created with 0 members
5. Owner clicks "Manage Members" to add people
6. Members are added from available team members

### Managing Permissions
1. Tenant Owner navigates to `/dashboard/permissions`
2. Selects a role (Admin/Editor/Viewer)
3. Checks/unchecks permissions per category
4. Permissions update in real-time
5. Can reset to defaults if needed

### Platform Admin Monitoring
1. Platform Admin navigates to `/admin`
2. Views system-wide statistics
3. Can see all tenants and their usage
4. Can pause/resume specific tenants
5. Can delete tenants if needed
6. Monitors storage and user counts

---

## Sidebar Navigation

The sidebar automatically updates based on user role:

**All Users**:
- Dashboard
- Uploads
- History

**Team Owners + Members**:
- Team Members
- User Groups
- Permissions
- Settings

**Platform Admins** (Additional):
- Admin Panel (links to `/admin`)

---

## Future Enhancements

1. **Email Integration**:
   - Send invitation emails to new members
   - Verification links
   - Onboarding emails

2. **Batch Operations**:
   - Bulk invite members
   - Bulk assign to groups
   - Bulk permission changes

3. **Audit Logs**:
   - Track all member changes
   - Log permission modifications
   - Monitor admin actions

4. **Advanced Permissions**:
   - Custom permission templates
   - Inherited permissions
   - Time-based access

5. **SSO Integration**:
   - Google/Microsoft login
   - LDAP for enterprises
   - Okta integration

---

## Troubleshooting

### Admin Panel Not Showing
- Verify user has `PLATFORM_ADMIN` role in database
- Check JWT token contains correct role
- Clear browser cache and re-login

### Permission Changes Not Applying
- Ensure backend is validating permissions on each request
- Check JWT token is refreshed after permission change
- Verify frontend is calling correct API endpoint

### Team Member Invite Not Sending
- Implement email service in backend
- Check SMTP/Email provider configuration
- Log invitation attempts for debugging

---

## Support & Documentation

For more information:
- See `/README.md` for project setup
- Check `BACKEND_TESTS.md` for API testing
- Review current backend controller implementations for patterns

---

**Status**: ✅ Frontend Implementation Complete
**Next**: Backend API Integration Required
