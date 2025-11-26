-- Rollback Business Agent Persistence Enhancement

-- Drop view
DROP VIEW IF EXISTS v_business_agent_summary;

-- Drop tables
DROP TABLE IF EXISTS agent_execution_logs;
DROP TABLE IF EXISTS business_agent_analytics;

-- Note: We don't remove columns from agent_executions as they might be in use
-- If you need to rollback completely, manually remove:
-- - user_id column
-- - error_message column
-- Or restore from backup
