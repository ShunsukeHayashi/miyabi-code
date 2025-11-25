-- Miyabi Web API - Organizations and Teams Schema
-- Created: 2025-11-25
-- Issue: #970 Phase 1.3 - Organization/Team Schema Implementation
-- Description: Multi-tenant organization structure with teams and RBAC

-- ============================================================================
-- Organizations Table
-- ============================================================================
-- Organizations are the top-level entity for multi-tenancy
-- Each organization can have multiple teams and members

CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Organization name (display name)
    name VARCHAR(255) NOT NULL,
    -- Unique slug for URL-safe identification
    slug VARCHAR(100) UNIQUE NOT NULL,
    -- Organization description
    description TEXT,
    -- Organization avatar/logo URL
    avatar_url TEXT,
    -- GitHub organization ID (if linked)
    github_org_id BIGINT UNIQUE,
    -- GitHub organization login name
    github_org_login VARCHAR(255),
    -- Organization settings (JSON)
    settings JSONB DEFAULT '{}',
    -- Billing plan (free, pro, enterprise)
    plan VARCHAR(50) DEFAULT 'free',
    -- Maximum number of members allowed
    max_members INTEGER DEFAULT 5,
    -- Maximum number of repositories allowed
    max_repositories INTEGER DEFAULT 10,
    -- Whether organization is active
    is_active BOOLEAN DEFAULT true,
    -- Owner user ID (the creator)
    owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Organization Members Table
-- ============================================================================
-- Junction table for organization membership with roles

CREATE TYPE org_member_role AS ENUM ('owner', 'admin', 'member', 'viewer');

CREATE TABLE organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Organization reference
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    -- User reference
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    -- Member role in organization
    role org_member_role NOT NULL DEFAULT 'member',
    -- Invitation status
    status VARCHAR(20) DEFAULT 'active', -- 'invited', 'active', 'suspended'
    -- Invited by user ID
    invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
    -- Invitation accepted at
    accepted_at TIMESTAMPTZ,
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Ensure unique membership per org
    UNIQUE(organization_id, user_id)
);

-- ============================================================================
-- Teams Table
-- ============================================================================
-- Teams within organizations for finer-grained access control

CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Organization this team belongs to
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    -- Team name
    name VARCHAR(255) NOT NULL,
    -- Team slug (unique within organization)
    slug VARCHAR(100) NOT NULL,
    -- Team description
    description TEXT,
    -- Team settings (JSON)
    settings JSONB DEFAULT '{}',
    -- Whether team is visible to all org members
    is_visible BOOLEAN DEFAULT true,
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Unique slug per organization
    UNIQUE(organization_id, slug)
);

-- ============================================================================
-- Team Members Table
-- ============================================================================
-- Junction table for team membership

CREATE TYPE team_member_role AS ENUM ('lead', 'member');

CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Team reference
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    -- User reference (must be org member)
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    -- Role within team
    role team_member_role NOT NULL DEFAULT 'member',
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Ensure unique membership per team
    UNIQUE(team_id, user_id)
);

-- ============================================================================
-- Repository Organization Link
-- ============================================================================
-- Link repositories to organizations (optional, extends existing repos table)

ALTER TABLE repositories
    ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE SET NULL;

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- Organizations indexes
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_owner_id ON organizations(owner_id);
CREATE INDEX idx_organizations_github_org_id ON organizations(github_org_id);
CREATE INDEX idx_organizations_is_active ON organizations(is_active);

-- Organization members indexes
CREATE INDEX idx_org_members_organization_id ON organization_members(organization_id);
CREATE INDEX idx_org_members_user_id ON organization_members(user_id);
CREATE INDEX idx_org_members_role ON organization_members(role);
CREATE INDEX idx_org_members_status ON organization_members(status);

-- Teams indexes
CREATE INDEX idx_teams_organization_id ON teams(organization_id);
CREATE INDEX idx_teams_slug ON teams(organization_id, slug);

-- Team members indexes
CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);

-- Repository organization indexes
CREATE INDEX idx_repositories_organization_id ON repositories(organization_id);
CREATE INDEX idx_repositories_team_id ON repositories(team_id);

-- ============================================================================
-- Triggers for updated_at
-- ============================================================================

CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organization_members_updated_at
    BEFORE UPDATE ON organization_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at
    BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_members_updated_at
    BEFORE UPDATE ON team_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Helper Views
-- ============================================================================

-- View: Organization with member count
CREATE OR REPLACE VIEW organization_summary AS
SELECT
    o.id,
    o.name,
    o.slug,
    o.plan,
    o.is_active,
    o.created_at,
    COUNT(DISTINCT om.user_id) FILTER (WHERE om.status = 'active') as member_count,
    COUNT(DISTINCT t.id) as team_count,
    COUNT(DISTINCT r.id) as repository_count
FROM organizations o
LEFT JOIN organization_members om ON o.id = om.organization_id
LEFT JOIN teams t ON o.id = t.organization_id
LEFT JOIN repositories r ON o.id = r.organization_id
GROUP BY o.id;

-- View: User's organizations with roles
CREATE OR REPLACE VIEW user_organizations AS
SELECT
    om.user_id,
    o.id as organization_id,
    o.name as organization_name,
    o.slug as organization_slug,
    o.avatar_url,
    om.role,
    om.status,
    om.created_at as joined_at
FROM organization_members om
JOIN organizations o ON om.organization_id = o.id
WHERE o.is_active = true;
