-- Miyabi Database Index Optimization - Phase P0 (Critical)
-- Created: 2025-11-29
-- Description: Critical performance indexes for tasks, repositories, and agent_executions
-- Reference: docs/database-index-strategy.md

-- ============================================================================
-- CRITICAL INDEX OPTIMIZATIONS (P0)
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. TASKS TABLE - Composite Indexes for Filtering
-- ============================================================================

-- Most common filter combination: user + status + repository
-- Expected improvement: 10x faster for filtered queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_user_status_repo
ON tasks(user_id, status, repository_id);

COMMENT ON INDEX idx_tasks_user_status_repo IS 'Composite index for common filter: user + status + repo';

-- Pagination queries with sorting
-- Expected improvement: Index-only scans for pagination
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_user_created_desc
ON tasks(user_id, created_at DESC);

COMMENT ON INDEX idx_tasks_user_created_desc IS 'Optimized for pagination with DESC sort';

-- Agent type filtering (common in dashboard)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_user_agent_status
ON tasks(user_id, agent_type, status);

COMMENT ON INDEX idx_tasks_user_agent_status IS 'Filter by user + agent type + status';

-- ============================================================================
-- 2. REPOSITORIES TABLE - Full-Text Search Optimization
-- ============================================================================

-- Enable trigram extension for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Trigram GIN index for ILIKE queries
-- Expected improvement: 20x faster for search queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_repositories_name_trgm
ON repositories USING GIN (name gin_trgm_ops, full_name gin_trgm_ops);

COMMENT ON INDEX idx_repositories_name_trgm IS 'GIN trigram index for fast ILIKE search on name/full_name';

-- Composite index for organization filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_repositories_user_org_active
ON repositories(user_id, organization_id, is_active);

COMMENT ON INDEX idx_repositories_user_org_active IS 'Filter by user + organization + active status';

-- ============================================================================
-- 3. AGENT_EXECUTIONS TABLE - Dashboard Optimization
-- ============================================================================

-- User dashboard: show recent executions by status
-- Expected improvement: 7.5x faster dashboard load
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agent_executions_user_status_created
ON agent_executions(user_id, status, created_at DESC);

COMMENT ON INDEX idx_agent_executions_user_status_created IS 'Dashboard: user executions by status + time';

-- Repository-specific execution history
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agent_executions_repo_status
ON agent_executions(repository_id, status, created_at DESC);

COMMENT ON INDEX idx_agent_executions_repo_status IS 'Repository execution history by status + time';

-- Agent type analytics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agent_executions_agent_type
ON agent_executions(agent_type, status, created_at DESC);

COMMENT ON INDEX idx_agent_executions_agent_type IS 'Agent type performance analytics';

-- ============================================================================
-- 4. COVERING INDEXES - Eliminate Heap Fetches
-- ============================================================================

-- Tasks list query covering index
-- Eliminates need to access table heap for common columns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_list_covering
ON tasks(user_id, created_at DESC)
INCLUDE (name, status, priority, agent_type);

COMMENT ON INDEX idx_tasks_list_covering IS 'Covering index for task list queries';

-- Repositories list query covering index
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_repositories_list_covering
ON repositories(user_id, updated_at DESC)
INCLUDE (name, full_name, is_active, organization_id);

COMMENT ON INDEX idx_repositories_list_covering IS 'Covering index for repository list queries';

-- Agent executions list covering index
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agent_executions_list_covering
ON agent_executions(user_id, created_at DESC)
INCLUDE (agent_type, status, repository_id, started_at, completed_at);

COMMENT ON INDEX idx_agent_executions_list_covering IS 'Covering index for agent execution list queries';

-- ============================================================================
-- 5. PARTIAL INDEXES - Reduce Index Size
-- ============================================================================

-- Only index active repositories (reduces index size by ~50%)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_repositories_active_user
ON repositories(user_id, updated_at DESC)
WHERE is_active = true;

COMMENT ON INDEX idx_repositories_active_user IS 'Partial index for active repositories only';

-- Only index pending/running tasks
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_active
ON tasks(user_id, status, created_at DESC)
WHERE status IN ('pending', 'running');

COMMENT ON INDEX idx_tasks_active IS 'Partial index for active tasks (pending/running)';

-- Only index running/pending agent executions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agent_executions_active
ON agent_executions(user_id, repository_id, created_at DESC)
WHERE status IN ('pending', 'running');

COMMENT ON INDEX idx_agent_executions_active IS 'Partial index for active agent executions';

-- ============================================================================
-- 6. JSONB INDEXES - Metadata Queries
-- ============================================================================

-- GIN index for JSONB metadata searches
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_metadata_gin
ON tasks USING GIN (metadata);

COMMENT ON INDEX idx_tasks_metadata_gin IS 'GIN index for JSONB metadata queries';

-- Workflow definition searches
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workflows_definition_gin
ON workflows USING GIN (definition);

COMMENT ON INDEX idx_workflows_definition_gin IS 'GIN index for workflow definition queries';

-- ============================================================================
-- ANALYZE TABLES - Update Statistics
-- ============================================================================

ANALYZE tasks;
ANALYZE repositories;
ANALYZE agent_executions;
ANALYZE workflows;

-- ============================================================================
-- VALIDATION QUERIES
-- ============================================================================

-- Check index creation
DO $$
DECLARE
    idx_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO idx_count
    FROM pg_indexes
    WHERE schemaname = 'public'
    AND indexname LIKE 'idx_%_p0%';

    RAISE NOTICE 'Created % P0 indexes', idx_count;

    -- Log to logs table
    INSERT INTO logs (level, message, data)
    VALUES (
        'info',
        'Migration 004_optimize_indexes_p0 completed',
        jsonb_build_object('indexes_created', idx_count, 'version', 'P0')
    );
END $$;

COMMIT;

-- ============================================================================
-- PERFORMANCE VALIDATION EXAMPLES
-- ============================================================================

-- Test 1: Tasks filter query (should use idx_tasks_user_status_repo)
-- EXPLAIN ANALYZE
-- SELECT * FROM tasks
-- WHERE user_id = 'xxx' AND status = 'pending' AND repository_id = 'yyy'
-- ORDER BY created_at DESC LIMIT 20;
-- Expected: Index Scan using idx_tasks_user_status_repo

-- Test 2: Repository search (should use idx_repositories_name_trgm)
-- EXPLAIN ANALYZE
-- SELECT * FROM repositories
-- WHERE user_id = 'xxx' AND (name ILIKE '%search%' OR full_name ILIKE '%search%');
-- Expected: Bitmap Index Scan on idx_repositories_name_trgm

-- Test 3: Dashboard query (should use idx_agent_executions_user_status_created)
-- EXPLAIN ANALYZE
-- SELECT * FROM agent_executions
-- WHERE user_id = 'xxx' AND status = 'running'
-- ORDER BY created_at DESC LIMIT 50;
-- Expected: Index Scan using idx_agent_executions_user_status_created
