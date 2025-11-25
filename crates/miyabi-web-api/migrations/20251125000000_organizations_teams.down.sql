-- Rollback: Organizations and Teams Schema
-- Issue: #970 Phase 1.3

-- Drop views first
DROP VIEW IF EXISTS user_organizations;
DROP VIEW IF EXISTS organization_summary;

-- Drop triggers
DROP TRIGGER IF EXISTS update_team_members_updated_at ON team_members;
DROP TRIGGER IF EXISTS update_teams_updated_at ON teams;
DROP TRIGGER IF EXISTS update_organization_members_updated_at ON organization_members;
DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;

-- Remove columns from repositories
ALTER TABLE repositories DROP COLUMN IF EXISTS team_id;
ALTER TABLE repositories DROP COLUMN IF EXISTS organization_id;

-- Drop tables in correct order (respect foreign keys)
DROP TABLE IF EXISTS team_members;
DROP TABLE IF EXISTS teams;
DROP TABLE IF EXISTS organization_members;
DROP TABLE IF EXISTS organizations;

-- Drop custom types
DROP TYPE IF EXISTS team_member_role;
DROP TYPE IF EXISTS org_member_role;
