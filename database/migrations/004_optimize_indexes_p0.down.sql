-- Miyabi Database Index Optimization - Phase P0 Rollback
-- Created: 2025-11-29
-- Description: Rollback script for critical performance indexes

BEGIN;

-- ============================================================================
-- DROP ALL P0 INDEXES
-- ============================================================================

-- Tasks table indexes
DROP INDEX CONCURRENTLY IF EXISTS idx_tasks_user_status_repo;
DROP INDEX CONCURRENTLY IF EXISTS idx_tasks_user_created_desc;
DROP INDEX CONCURRENTLY IF EXISTS idx_tasks_user_agent_status;
DROP INDEX CONCURRENTLY IF EXISTS idx_tasks_list_covering;
DROP INDEX CONCURRENTLY IF EXISTS idx_tasks_active;
DROP INDEX CONCURRENTLY IF EXISTS idx_tasks_metadata_gin;

-- Repositories table indexes
DROP INDEX CONCURRENTLY IF EXISTS idx_repositories_name_trgm;
DROP INDEX CONCURRENTLY IF EXISTS idx_repositories_user_org_active;
DROP INDEX CONCURRENTLY IF EXISTS idx_repositories_list_covering;
DROP INDEX CONCURRENTLY IF EXISTS idx_repositories_active_user;

-- Agent executions table indexes
DROP INDEX CONCURRENTLY IF EXISTS idx_agent_executions_user_status_created;
DROP INDEX CONCURRENTLY IF EXISTS idx_agent_executions_repo_status;
DROP INDEX CONCURRENTLY IF EXISTS idx_agent_executions_agent_type;
DROP INDEX CONCURRENTLY IF EXISTS idx_agent_executions_list_covering;
DROP INDEX CONCURRENTLY IF EXISTS idx_agent_executions_active;

-- Workflows table indexes
DROP INDEX CONCURRENTLY IF EXISTS idx_workflows_definition_gin;

-- Log rollback
INSERT INTO logs (level, message, data)
VALUES (
    'info',
    'Migration 004_optimize_indexes_p0 rolled back',
    jsonb_build_object('action', 'rollback', 'version', 'P0')
);

COMMIT;
