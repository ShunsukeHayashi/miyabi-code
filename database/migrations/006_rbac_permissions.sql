-- Miyabi RBAC - Role-Based Access Control Permissions
-- Migration 006: RBAC tables, roles, permissions, and functions
-- Version: 1.0.0
-- Created: 2025-11-27
-- Issue: #1176

-- ============================================================================
-- 1. PERMISSIONS TABLE - 27 permissions across 5 categories
-- ============================================================================

CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE permissions IS 'Available permissions in the system';
COMMENT ON COLUMN permissions.code IS 'Unique permission code (e.g., tasks:read)';
COMMENT ON COLUMN permissions.category IS 'Permission category (tasks, org, agent, deploy, admin)';

-- Insert 27 permissions across 5 categories
INSERT INTO permissions (code, name, description, category) VALUES
-- Tasks category (5 permissions)
('tasks:read', 'Read Tasks', 'View tasks and task details', 'tasks'),
('tasks:write', 'Write Tasks', 'Create and update tasks', 'tasks'),
('tasks:delete', 'Delete Tasks', 'Delete tasks', 'tasks'),
('tasks:assign', 'Assign Tasks', 'Assign tasks to team members', 'tasks'),
('tasks:approve', 'Approve Tasks', 'Approve completed tasks', 'tasks'),

-- Organization category (7 permissions)
('org:read', 'Read Organization', 'View organization details', 'org'),
('org:update', 'Update Organization', 'Update organization settings', 'org'),
('org:invite', 'Invite Members', 'Invite new members to organization', 'org'),
('org:remove_member', 'Remove Members', 'Remove members from organization', 'org'),
('org:change_roles', 'Change Roles', 'Change member roles in organization', 'org'),
('org:manage_teams', 'Manage Teams', 'Create and manage teams', 'org'),
('org:billing', 'Manage Billing', 'View and manage billing', 'org'),

-- Agent category (5 permissions)
('agent:read', 'Read Agents', 'View agent information', 'agent'),
('agent:execute', 'Execute Agents', 'Execute agent tasks', 'agent'),
('agent:configure', 'Configure Agents', 'Configure agent settings', 'agent'),
('agent:create', 'Create Agents', 'Create new agents', 'agent'),
('agent:delete', 'Delete Agents', 'Delete agents', 'agent'),

-- Deploy category (5 permissions)
('deploy:staging', 'Deploy to Staging', 'Deploy to staging environment', 'deploy'),
('deploy:production', 'Deploy to Production', 'Deploy to production environment', 'deploy'),
('deploy:rollback', 'Rollback Deployment', 'Rollback deployments', 'deploy'),
('deploy:view_logs', 'View Deploy Logs', 'View deployment logs', 'deploy'),
('deploy:configure', 'Configure Deployment', 'Configure deployment settings', 'deploy'),

-- Admin category (5 permissions)
('admin:users', 'Manage Users', 'Full user management access', 'admin'),
('admin:system', 'System Administration', 'System configuration access', 'admin'),
('admin:audit', 'View Audit Logs', 'View audit logs', 'admin'),
('admin:billing', 'Global Billing', 'Global billing management', 'admin'),
('admin:super', 'Super Admin', 'Full system access', 'admin')
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- 2. ROLES TABLE - 6 roles (3 org-scoped, 3 system-scoped)
-- ============================================================================

CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    scope VARCHAR(20) NOT NULL DEFAULT 'organization',
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT valid_scope CHECK (scope IN ('organization', 'system', 'team'))
);

COMMENT ON TABLE roles IS 'Available roles in the system';
COMMENT ON COLUMN roles.scope IS 'Role scope: organization, system, or team';
COMMENT ON COLUMN roles.is_system IS 'Whether this is a system-defined role';

-- Insert 6 roles
INSERT INTO roles (code, name, description, scope, is_system) VALUES
-- Organization-scoped roles
('org:owner', 'Organization Owner', 'Full control over organization', 'organization', true),
('org:admin', 'Organization Admin', 'Administrative access to organization', 'organization', true),
('org:member', 'Organization Member', 'Standard member access', 'organization', true),

-- System-scoped roles
('system:admin', 'System Administrator', 'Full system administration', 'system', true),
('system:support', 'Support Agent', 'Customer support access', 'system', true),
('system:viewer', 'System Viewer', 'Read-only system access', 'system', true)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- 3. ROLE_PERMISSIONS TABLE - Maps roles to permissions
-- ============================================================================

CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(role_id, permission_id)
);

COMMENT ON TABLE role_permissions IS 'Maps roles to their permissions';

-- Assign permissions to roles
-- org:owner - all permissions except admin:super
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'org:owner' AND p.code NOT LIKE 'admin:%'
ON CONFLICT DO NOTHING;

-- org:admin - most permissions except billing and admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'org:admin'
  AND p.code IN (
    'tasks:read', 'tasks:write', 'tasks:delete', 'tasks:assign', 'tasks:approve',
    'org:read', 'org:update', 'org:invite', 'org:remove_member', 'org:manage_teams',
    'agent:read', 'agent:execute', 'agent:configure',
    'deploy:staging', 'deploy:view_logs'
  )
ON CONFLICT DO NOTHING;

-- org:member - basic read/write permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'org:member'
  AND p.code IN (
    'tasks:read', 'tasks:write',
    'org:read',
    'agent:read', 'agent:execute',
    'deploy:view_logs'
  )
ON CONFLICT DO NOTHING;

-- system:admin - all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'system:admin'
ON CONFLICT DO NOTHING;

-- system:support - read permissions plus user management
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'system:support'
  AND p.code IN (
    'tasks:read', 'org:read', 'agent:read', 'deploy:view_logs',
    'admin:users', 'admin:audit'
  )
ON CONFLICT DO NOTHING;

-- system:viewer - read-only permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'system:viewer'
  AND p.code IN ('tasks:read', 'org:read', 'agent:read', 'deploy:view_logs')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 4. USER_PERMISSIONS TABLE - Direct permission grants to users
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES web_users(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    granted_by UUID REFERENCES web_users(id),
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(user_id, permission_id, organization_id)
);

COMMENT ON TABLE user_permissions IS 'Direct permission grants to users';
COMMENT ON COLUMN user_permissions.organization_id IS 'NULL for global permissions';
COMMENT ON COLUMN user_permissions.expires_at IS 'NULL for permanent grants';

-- ============================================================================
-- 5. ORGANIZATION_MEMBERS TABLE - If not exists, create it
-- ============================================================================

CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    avatar_url TEXT,
    created_by UUID REFERENCES web_users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE organizations IS 'Organizations for multi-tenant access';

CREATE TABLE IF NOT EXISTS organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES web_users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'member',
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    invited_by UUID REFERENCES web_users(id),
    joined_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(organization_id, user_id),
    CONSTRAINT valid_role CHECK (role IN ('owner', 'admin', 'member')),
    CONSTRAINT valid_status CHECK (status IN ('active', 'invited', 'suspended'))
);

COMMENT ON TABLE organization_members IS 'Organization membership with roles';

-- ============================================================================
-- 6. USER_EFFECTIVE_PERMISSIONS VIEW - Combined view of all user permissions
-- ============================================================================

CREATE OR REPLACE VIEW user_effective_permissions AS
-- Permissions from organization role
SELECT
    om.user_id,
    om.organization_id,
    p.code AS permission_code,
    p.category,
    'role' AS source,
    CONCAT('org:', om.role) AS role_code
FROM organization_members om
JOIN roles r ON r.code = CONCAT('org:', om.role)
JOIN role_permissions rp ON rp.role_id = r.id
JOIN permissions p ON p.id = rp.permission_id
WHERE om.status = 'active'

UNION

-- Direct user permissions (organization-scoped)
SELECT
    up.user_id,
    up.organization_id,
    p.code AS permission_code,
    p.category,
    'direct' AS source,
    NULL AS role_code
FROM user_permissions up
JOIN permissions p ON p.id = up.permission_id
WHERE up.organization_id IS NOT NULL
  AND (up.expires_at IS NULL OR up.expires_at > NOW())

UNION

-- Direct user permissions (global)
SELECT
    up.user_id,
    om.organization_id,
    p.code AS permission_code,
    p.category,
    'direct_global' AS source,
    NULL AS role_code
FROM user_permissions up
JOIN permissions p ON p.id = up.permission_id
CROSS JOIN organization_members om
WHERE up.organization_id IS NULL
  AND up.user_id = om.user_id
  AND (up.expires_at IS NULL OR up.expires_at > NOW());

COMMENT ON VIEW user_effective_permissions IS 'Combined view of all user permissions from roles and direct grants';

-- ============================================================================
-- 7. HAS_PERMISSION FUNCTION - Check if user has permission
-- ============================================================================

CREATE OR REPLACE FUNCTION has_permission(
    p_user_id UUID,
    p_organization_id UUID,
    p_permission_code VARCHAR
) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM user_effective_permissions
        WHERE user_id = p_user_id
          AND organization_id = p_organization_id
          AND permission_code = p_permission_code
    );
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION has_permission IS 'Check if user has specific permission in organization';

-- ============================================================================
-- 8. INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_permissions_code ON permissions(code);
CREATE INDEX IF NOT EXISTS idx_permissions_category ON permissions(category);
CREATE INDEX IF NOT EXISTS idx_roles_code ON roles(code);
CREATE INDEX IF NOT EXISTS idx_roles_scope ON roles(scope);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_org ON user_permissions(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_expires ON user_permissions(expires_at);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_status ON organization_members(status);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verify migration
DO $$
DECLARE
    perm_count INTEGER;
    role_count INTEGER;
    rp_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO perm_count FROM permissions;
    SELECT COUNT(*) INTO role_count FROM roles;
    SELECT COUNT(*) INTO rp_count FROM role_permissions;

    RAISE NOTICE 'Migration 006_rbac_permissions complete: % permissions, % roles, % role_permissions',
        perm_count, role_count, rp_count;
END $$;
