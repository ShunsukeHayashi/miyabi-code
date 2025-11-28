-- Rollback RLS Policies
-- Issue: #1177

-- ============================================================================
-- Drop RLS Policies
-- ============================================================================

DROP POLICY IF EXISTS tasks_org_isolation ON tasks;
DROP POLICY IF EXISTS tasks_superuser ON tasks;

DROP POLICY IF EXISTS repositories_org_isolation ON repositories;
DROP POLICY IF EXISTS repositories_superuser ON repositories;

DROP POLICY IF EXISTS teams_org_isolation ON teams;
DROP POLICY IF EXISTS teams_superuser ON teams;

DROP POLICY IF EXISTS team_members_org_isolation ON team_members;
DROP POLICY IF EXISTS team_members_superuser ON team_members;

DROP POLICY IF EXISTS execution_logs_org_isolation ON execution_logs;
DROP POLICY IF EXISTS execution_logs_superuser ON execution_logs;

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'business_agent_data') THEN
        EXECUTE 'DROP POLICY IF EXISTS business_agent_data_org_isolation ON business_agent_data';
        EXECUTE 'DROP POLICY IF EXISTS business_agent_data_superuser ON business_agent_data';
    END IF;
END $$;

-- ============================================================================
-- Disable RLS on tables
-- ============================================================================

ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE repositories DISABLE ROW LEVEL SECURITY;
ALTER TABLE teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE team_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE execution_logs DISABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'business_agent_data') THEN
        EXECUTE 'ALTER TABLE business_agent_data DISABLE ROW LEVEL SECURITY';
    END IF;
END $$;

-- ============================================================================
-- Drop helper function
-- ============================================================================

DROP FUNCTION IF EXISTS get_current_org_id();
