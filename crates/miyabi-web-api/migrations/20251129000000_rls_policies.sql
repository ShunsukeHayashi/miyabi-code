-- Row Level Security (RLS) Policies for Multi-Tenant Data Isolation
-- Issue: #1177
--
-- This migration enables RLS on all organization-scoped tables and creates
-- policies that use the session variable `app.current_org_id` to filter data.

-- ============================================================================
-- Enable RLS on organization-scoped tables
-- ============================================================================

-- Tasks table
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks FORCE ROW LEVEL SECURITY;

-- Repositories table
ALTER TABLE repositories ENABLE ROW LEVEL SECURITY;
ALTER TABLE repositories FORCE ROW LEVEL SECURITY;

-- Teams table
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams FORCE ROW LEVEL SECURITY;

-- Team members table
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members FORCE ROW LEVEL SECURITY;

-- Execution logs table
ALTER TABLE execution_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE execution_logs FORCE ROW LEVEL SECURITY;

-- Business agent data table (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'business_agent_data') THEN
        EXECUTE 'ALTER TABLE business_agent_data ENABLE ROW LEVEL SECURITY';
        EXECUTE 'ALTER TABLE business_agent_data FORCE ROW LEVEL SECURITY';
    END IF;
END $$;

-- ============================================================================
-- Create helper function for getting current org ID
-- ============================================================================

CREATE OR REPLACE FUNCTION get_current_org_id()
RETURNS uuid AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_org_id', true), '')::uuid;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RLS Policies - Tasks
-- ============================================================================

-- Allow all operations on tasks within the current organization
CREATE POLICY tasks_org_isolation ON tasks
    FOR ALL
    USING (organization_id = get_current_org_id())
    WITH CHECK (organization_id = get_current_org_id());

-- Allow superuser/service accounts to bypass RLS
CREATE POLICY tasks_superuser ON tasks
    FOR ALL
    TO postgres
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- RLS Policies - Repositories
-- ============================================================================

CREATE POLICY repositories_org_isolation ON repositories
    FOR ALL
    USING (organization_id = get_current_org_id() OR organization_id IS NULL)
    WITH CHECK (organization_id = get_current_org_id() OR organization_id IS NULL);

CREATE POLICY repositories_superuser ON repositories
    FOR ALL
    TO postgres
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- RLS Policies - Teams
-- ============================================================================

CREATE POLICY teams_org_isolation ON teams
    FOR ALL
    USING (organization_id = get_current_org_id())
    WITH CHECK (organization_id = get_current_org_id());

CREATE POLICY teams_superuser ON teams
    FOR ALL
    TO postgres
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- RLS Policies - Team Members
-- ============================================================================

-- Team members can only be accessed if the team belongs to current org
CREATE POLICY team_members_org_isolation ON team_members
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM teams t
            WHERE t.id = team_members.team_id
            AND t.organization_id = get_current_org_id()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM teams t
            WHERE t.id = team_members.team_id
            AND t.organization_id = get_current_org_id()
        )
    );

CREATE POLICY team_members_superuser ON team_members
    FOR ALL
    TO postgres
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- RLS Policies - Execution Logs
-- ============================================================================

CREATE POLICY execution_logs_org_isolation ON execution_logs
    FOR ALL
    USING (organization_id = get_current_org_id() OR organization_id IS NULL)
    WITH CHECK (organization_id = get_current_org_id() OR organization_id IS NULL);

CREATE POLICY execution_logs_superuser ON execution_logs
    FOR ALL
    TO postgres
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- RLS Policies - Business Agent Data (if exists)
-- ============================================================================

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'business_agent_data') THEN
        EXECUTE '
            CREATE POLICY business_agent_data_org_isolation ON business_agent_data
                FOR ALL
                USING (organization_id = get_current_org_id())
                WITH CHECK (organization_id = get_current_org_id())
        ';

        EXECUTE '
            CREATE POLICY business_agent_data_superuser ON business_agent_data
                FOR ALL
                TO postgres
                USING (true)
                WITH CHECK (true)
        ';
    END IF;
END $$;

-- ============================================================================
-- Grant application role permissions
-- ============================================================================

-- Create application role if not exists (for non-superuser connections)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'miyabi_app') THEN
        CREATE ROLE miyabi_app WITH LOGIN;
    END IF;
END $$;

-- Grant necessary permissions to application role
GRANT USAGE ON SCHEMA public TO miyabi_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO miyabi_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO miyabi_app;

-- ============================================================================
-- Add organization_id column to tables that don't have it
-- ============================================================================

-- Add to execution_logs if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'execution_logs' AND column_name = 'organization_id'
    ) THEN
        ALTER TABLE execution_logs ADD COLUMN organization_id uuid REFERENCES organizations(id);
        CREATE INDEX idx_execution_logs_org ON execution_logs(organization_id);
    END IF;
END $$;

-- ============================================================================
-- Comments for documentation
-- ============================================================================

COMMENT ON FUNCTION get_current_org_id() IS
    'Returns the current organization ID from session variable app.current_org_id. Used by RLS policies.';

COMMENT ON POLICY tasks_org_isolation ON tasks IS
    'Enforces organization isolation - users can only access tasks belonging to their current organization.';

COMMENT ON POLICY repositories_org_isolation ON repositories IS
    'Enforces organization isolation for repositories. Allows NULL org_id for personal repos.';

COMMENT ON POLICY teams_org_isolation ON teams IS
    'Enforces organization isolation - teams are only visible within their organization.';

COMMENT ON POLICY team_members_org_isolation ON team_members IS
    'Enforces organization isolation via team membership lookup.';
