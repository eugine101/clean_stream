-- V3__Add_platform_admin_and_user_groups.sql
-- Add is_platform_admin column to users table
ALTER TABLE users 
ADD COLUMN is_platform_admin BOOLEAN DEFAULT FALSE NOT NULL;

-- Make tenant_id nullable for platform admins
ALTER TABLE users 
ALTER COLUMN tenant_id DROP NOT NULL;

-- Update unique constraint to allow multiple platforms admins with NULL tenant_id
ALTER TABLE users 
DROP CONSTRAINT IF EXISTS users_tenant_id_key CASCADE;

ALTER TABLE users
ADD CONSTRAINT users_email_tenant_unique UNIQUE (email, tenant_id);

-- Create user_groups table
CREATE TABLE IF NOT EXISTS user_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, name)
);

-- Create group_members join table
CREATE TABLE IF NOT EXISTS group_members (
    group_id UUID NOT NULL REFERENCES user_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (group_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_groups_tenant_id ON user_groups(tenant_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);
