-- Miyabi Web API - RBAC (Role-Based Access Control) Schema
-- Created: 2025-11-25
-- Issue: #975 Phase 1.4 - RBAC Implementation
-- Description: Permissions, roles, and role-permission mapping

-- ============================================================================
-- Permissions Table
-- ============================================================================
-- All possible permissions in the system

CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Permission code (e.g., 'repositories.read', 'agents.execute')
    code VARCHAR(100) UNIQUE NOT NULL,
    -- Human-readable name
    name VARCHAR(255) NOT NULL,
    -- Description of what this permission allows
    description TEXT,
    -- Category for grouping (e.g., 'repositories', 'agents', 'workflows')
    category VARCHAR(50) NOT NULL,
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE permissions IS 'All available permissions in the system';
COMMENT ON COLUMN permissions.code IS 'Unique permission code like repositories.read';
COMMENT ON COLUMN permissions.category IS 'Permission category for grouping';

-- ============================================================================
-- Roles Table
-- ============================================================================
-- Role templates that can be assigned to users

CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Role code (e.g., 'org:owner', 'org:admin', 'team:lead')
    code VARCHAR(100) UNIQUE NOT NULL,
    -- Human-readable name
    name VARCHAR(255) NOT NULL,
    -- Description of this role
    description TEXT,
    -- Scope: 'organization', 'team', 'system'
    scope VARCHAR(50) NOT NULL DEFAULT 'organization',
    -- Whether this is a system-defined role (cannot be deleted)
    is_system BOOLEAN DEFAULT false,
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE roles IS 'Role definitions for RBAC';
COMMENT ON COLUMN roles.code IS 'Unique role code like org:owner';
COMMENT ON COLUMN roles.scope IS 'Role scope: organization, team, or system';

-- ============================================================================
-- Role Permissions Table (M:N Junction)
-- ============================================================================
-- Maps roles to their permissions

CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(role_id, permission_id)
);

COMMENT ON TABLE role_permissions IS 'Many-to-many mapping of roles to permissions';

-- ============================================================================
-- User Direct Permissions Table
-- ============================================================================
-- Direct permissions granted to users (outside of roles)

CREATE TABLE user_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- User reference
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    -- Permission reference
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    -- Organization scope (optional, if null = system-wide)
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    -- Granted by whom
    granted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    -- Expiration date (optional)
    expires_at TIMESTAMPTZ,
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- Unique constraint per user/permission/org combination
    UNIQUE(user_id, permission_id, organization_id)
);

COMMENT ON TABLE user_permissions IS 'Direct permissions granted to users outside of roles';

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

CREATE INDEX idx_permissions_code ON permissions(code);
CREATE INDEX idx_permissions_category ON permissions(category);

CREATE INDEX idx_roles_code ON roles(code);
CREATE INDEX idx_roles_scope ON roles(scope);

CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);

CREATE INDEX idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX idx_user_permissions_permission_id ON user_permissions(permission_id);
CREATE INDEX idx_user_permissions_organization_id ON user_permissions(organization_id);

-- ============================================================================
-- Default Permissions (27 permissions across 6 categories)
-- ============================================================================

INSERT INTO permissions (code, name, description, category) VALUES
-- Repositories (4 permissions)
('repositories.read', 'Read Repositories', 'View repository information and settings', 'repositories'),
('repositories.write', 'Write Repositories', 'Connect and configure repositories', 'repositories'),
('repositories.delete', 'Delete Repositories', 'Disconnect and remove repositories', 'repositories'),
('repositories.manage', 'Manage Repositories', 'Full repository management access', 'repositories'),

-- Agents (4 permissions)
('agents.read', 'Read Agents', 'View agent status and history', 'agents'),
('agents.execute', 'Execute Agents', 'Start agent executions', 'agents'),
('agents.stop', 'Stop Agents', 'Cancel running agents', 'agents'),
('agents.manage', 'Manage Agents', 'Full agent management access', 'agents'),

-- Workflows (5 permissions)
('workflows.read', 'Read Workflows', 'View workflow definitions', 'workflows'),
('workflows.create', 'Create Workflows', 'Create new workflows', 'workflows'),
('workflows.update', 'Update Workflows', 'Modify existing workflows', 'workflows'),
('workflows.delete', 'Delete Workflows', 'Remove workflows', 'workflows'),
('workflows.execute', 'Execute Workflows', 'Run workflow executions', 'workflows'),

-- Tasks (5 permissions)
('tasks.read', 'Read Tasks', 'View task information', 'tasks'),
('tasks.create', 'Create Tasks', 'Create new tasks', 'tasks'),
('tasks.update', 'Update Tasks', 'Modify existing tasks', 'tasks'),
('tasks.delete', 'Delete Tasks', 'Remove tasks', 'tasks'),
('tasks.assign', 'Assign Tasks', 'Assign tasks to team members', 'tasks'),

-- Organization (5 permissions)
('organization.read', 'Read Organization', 'View organization information', 'organization'),
('organization.update', 'Update Organization', 'Modify organization settings', 'organization'),
('organization.delete', 'Delete Organization', 'Delete the organization', 'organization'),
('organization.members.read', 'Read Members', 'View organization members', 'organization'),
('organization.members.manage', 'Manage Members', 'Invite, remove, and change member roles', 'organization'),

-- Teams (4 permissions)
('teams.read', 'Read Teams', 'View team information', 'teams'),
('teams.create', 'Create Teams', 'Create new teams', 'teams'),
('teams.update', 'Update Teams', 'Modify team settings', 'teams'),
('teams.delete', 'Delete Teams', 'Remove teams', 'teams');

-- ============================================================================
-- Default Roles (6 roles)
-- ============================================================================

INSERT INTO roles (code, name, description, scope, is_system) VALUES
-- Organization roles
('org:owner', 'Organization Owner', 'Full access to all organization resources', 'organization', true),
('org:admin', 'Organization Admin', 'Manage members and most settings', 'organization', true),
('org:member', 'Organization Member', 'Standard access to organization resources', 'organization', true),
('org:viewer', 'Organization Viewer', 'Read-only access to organization', 'organization', true),
-- Team roles
('team:lead', 'Team Lead', 'Full access to team resources', 'team', true),
('team:member', 'Team Member', 'Standard team member access', 'team', true);

-- ============================================================================
-- Role-Permission Mappings
-- ============================================================================

-- Owner: All permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'org:owner';

-- Admin: All except organization.delete
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'org:admin'
  AND p.code != 'organization.delete';

-- Member: Read + Execute + Create/Update (no delete/manage)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'org:member'
  AND p.code IN (
    'repositories.read', 'repositories.write',
    'agents.read', 'agents.execute', 'agents.stop',
    'workflows.read', 'workflows.create', 'workflows.update', 'workflows.execute',
    'tasks.read', 'tasks.create', 'tasks.update',
    'organization.read', 'organization.members.read',
    'teams.read'
  );

-- Viewer: Read-only
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'org:viewer'
  AND p.code IN (
    'repositories.read',
    'agents.read',
    'workflows.read',
    'tasks.read',
    'organization.read', 'organization.members.read',
    'teams.read'
  );

-- Team Lead: Team-scoped management
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'team:lead'
  AND p.code IN (
    'repositories.read', 'repositories.write',
    'agents.read', 'agents.execute', 'agents.stop',
    'workflows.read', 'workflows.create', 'workflows.update', 'workflows.delete', 'workflows.execute',
    'tasks.read', 'tasks.create', 'tasks.update', 'tasks.delete', 'tasks.assign',
    'teams.read', 'teams.update'
  );

-- Team Member: Basic team access
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'team:member'
  AND p.code IN (
    'repositories.read',
    'agents.read', 'agents.execute',
    'workflows.read', 'workflows.execute',
    'tasks.read', 'tasks.create', 'tasks.update',
    'teams.read'
  );

-- ============================================================================
-- Helper Views for RBAC
-- ============================================================================

-- View: User's effective permissions (from roles + direct grants)
CREATE OR REPLACE VIEW user_effective_permissions AS
WITH role_based AS (
    -- Permissions from organization roles
    SELECT
        om.user_id,
        om.organization_id,
        p.code as permission_code,
        p.category,
        'role' as source,
        r.code as role_code
    FROM organization_members om
    JOIN roles r ON om.role::text = REPLACE(r.code, 'org:', '')
    JOIN role_permissions rp ON r.id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE om.status = 'active'

    UNION ALL

    -- Permissions from team roles
    SELECT
        tm.user_id,
        t.organization_id,
        p.code as permission_code,
        p.category,
        'team_role' as source,
        r.code as role_code
    FROM team_members tm
    JOIN teams t ON tm.team_id = t.id
    JOIN roles r ON ('team:' || tm.role::text) = r.code
    JOIN role_permissions rp ON r.id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
),
direct AS (
    -- Direct user permissions
    SELECT
        up.user_id,
        up.organization_id,
        p.code as permission_code,
        p.category,
        'direct' as source,
        NULL as role_code
    FROM user_permissions up
    JOIN permissions p ON up.permission_id = p.id
    WHERE (up.expires_at IS NULL OR up.expires_at > NOW())
)
SELECT DISTINCT user_id, organization_id, permission_code, category, source, role_code
FROM (
    SELECT * FROM role_based
    UNION ALL
    SELECT * FROM direct
) combined;

COMMENT ON VIEW user_effective_permissions IS 'Combined view of all user permissions from roles and direct grants';

-- ============================================================================
-- Function: Check User Permission
-- ============================================================================

CREATE OR REPLACE FUNCTION has_permission(
    p_user_id UUID,
    p_organization_id UUID,
    p_permission_code VARCHAR(100)
) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_effective_permissions
        WHERE user_id = p_user_id
          AND organization_id = p_organization_id
          AND permission_code = p_permission_code
    );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION has_permission IS 'Check if user has specific permission in organization';

-- ============================================================================
-- Migration Complete
-- ============================================================================
