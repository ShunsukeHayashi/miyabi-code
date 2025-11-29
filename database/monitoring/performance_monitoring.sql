-- Miyabi Database Performance Monitoring
-- Created: 2025-11-29
-- Description: Performance monitoring views and queries
-- Reference: docs/database-index-strategy.md

-- ============================================================================
-- SETUP: Enable Required Extensions
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Reset statistics (only do this once for clean monitoring)
-- SELECT pg_stat_statements_reset();

-- ============================================================================
-- VIEW 1: Index Usage Statistics
-- ============================================================================

CREATE OR REPLACE VIEW v_index_usage AS
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan as scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched,
    pg_size_pretty(pg_relation_size(indexrelid)) as size,
    CASE
        WHEN idx_scan = 0 THEN '❌ UNUSED'
        WHEN idx_scan < 100 THEN '⚠️ LOW USAGE'
        WHEN idx_scan < 1000 THEN '✅ MODERATE'
        ELSE '🔥 HIGH USAGE'
    END as usage_status
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

COMMENT ON VIEW v_index_usage IS 'Index usage statistics with visual status indicators';

-- Query to find unused indexes (candidates for removal)
CREATE OR REPLACE VIEW v_unused_indexes AS
SELECT
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as wasted_size,
    pg_relation_size(indexrelid) as size_bytes
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND indexrelid NOT IN (
      -- Exclude primary keys and unique constraints
      SELECT indexrelid
      FROM pg_index
      WHERE indisprimary OR indisunique
  )
ORDER BY pg_relation_size(indexrelid) DESC;

COMMENT ON VIEW v_unused_indexes IS 'Unused indexes (candidates for removal)';

-- ============================================================================
-- VIEW 2: Slow Queries
-- ============================================================================

CREATE OR REPLACE VIEW v_slow_queries AS
SELECT
    query,
    calls,
    total_time,
    mean_time,
    max_time,
    stddev_time,
    rows,
    100.0 * shared_blks_hit / NULLIF(shared_blks_hit + shared_blks_read, 0) AS cache_hit_ratio,
    CASE
        WHEN mean_time > 1000 THEN '🔴 CRITICAL'
        WHEN mean_time > 500 THEN '🟡 WARNING'
        WHEN mean_time > 100 THEN '🟢 MODERATE'
        ELSE '✅ FAST'
    END as performance_status
FROM pg_stat_statements
WHERE mean_time > 50  -- Only queries slower than 50ms
ORDER BY mean_time DESC
LIMIT 50;

COMMENT ON VIEW v_slow_queries IS 'Slow queries (> 50ms average)';

-- ============================================================================
-- VIEW 3: Table Bloat
-- ============================================================================

CREATE OR REPLACE VIEW v_table_bloat AS
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) as indexes_size,
    n_live_tup as live_tuples,
    n_dead_tup as dead_tuples,
    ROUND(100.0 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0), 2) as dead_ratio,
    CASE
        WHEN ROUND(100.0 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0), 2) > 20 THEN '🔴 NEEDS VACUUM'
        WHEN ROUND(100.0 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0), 2) > 10 THEN '🟡 WATCH'
        ELSE '✅ HEALTHY'
    END as bloat_status
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC;

COMMENT ON VIEW v_table_bloat IS 'Table bloat analysis';

-- ============================================================================
-- VIEW 4: Cache Hit Ratio
-- ============================================================================

CREATE OR REPLACE VIEW v_cache_hit_ratio AS
SELECT
    'Heap Blocks' as metric,
    ROUND(100.0 * sum(heap_blks_hit) / NULLIF(sum(heap_blks_hit) + sum(heap_blks_read), 0), 2) as hit_ratio,
    CASE
        WHEN ROUND(100.0 * sum(heap_blks_hit) / NULLIF(sum(heap_blks_hit) + sum(heap_blks_read), 0), 2) > 99 THEN '✅ EXCELLENT'
        WHEN ROUND(100.0 * sum(heap_blks_hit) / NULLIF(sum(heap_blks_hit) + sum(heap_blks_read), 0), 2) > 95 THEN '🟢 GOOD'
        WHEN ROUND(100.0 * sum(heap_blks_hit) / NULLIF(sum(heap_blks_hit) + sum(heap_blks_read), 0), 2) > 90 THEN '🟡 NEEDS TUNING'
        ELSE '🔴 CRITICAL'
    END as status
FROM pg_statio_user_tables

UNION ALL

SELECT
    'Index Blocks' as metric,
    ROUND(100.0 * sum(idx_blks_hit) / NULLIF(sum(idx_blks_hit) + sum(idx_blks_read), 0), 2) as hit_ratio,
    CASE
        WHEN ROUND(100.0 * sum(idx_blks_hit) / NULLIF(sum(idx_blks_hit) + sum(idx_blks_read), 0), 2) > 99 THEN '✅ EXCELLENT'
        WHEN ROUND(100.0 * sum(idx_blks_hit) / NULLIF(sum(idx_blks_hit) + sum(idx_blks_read), 0), 2) > 95 THEN '🟢 GOOD'
        WHEN ROUND(100.0 * sum(idx_blks_hit) / NULLIF(sum(idx_blks_hit) + sum(idx_blks_read), 0), 2) > 90 THEN '🟡 NEEDS TUNING'
        ELSE '🔴 CRITICAL'
    END as status
FROM pg_statio_user_indexes;

COMMENT ON VIEW v_cache_hit_ratio IS 'Cache hit ratio for heap and index blocks';

-- ============================================================================
-- VIEW 5: Lock Monitoring
-- ============================================================================

CREATE OR REPLACE VIEW v_locks AS
SELECT
    pg_stat_activity.pid,
    pg_stat_activity.usename,
    pg_stat_activity.application_name,
    pg_stat_activity.state,
    pg_stat_activity.wait_event_type,
    pg_stat_activity.wait_event,
    age(now(), pg_stat_activity.query_start) AS query_age,
    pg_locks.locktype,
    pg_locks.mode,
    pg_locks.granted,
    substring(pg_stat_activity.query, 1, 100) as query_preview
FROM pg_stat_activity
JOIN pg_locks ON pg_stat_activity.pid = pg_locks.pid
WHERE NOT pg_locks.granted
ORDER BY query_age DESC;

COMMENT ON VIEW v_locks IS 'Active locks (blocking queries)';

-- ============================================================================
-- VIEW 6: Table Scan Analysis
-- ============================================================================

CREATE OR REPLACE VIEW v_table_scans AS
SELECT
    schemaname,
    tablename,
    seq_scan as sequential_scans,
    seq_tup_read as tuples_read_seq,
    idx_scan as index_scans,
    idx_tup_fetch as tuples_fetched_idx,
    n_live_tup as live_tuples,
    CASE
        WHEN seq_scan = 0 THEN 0
        ELSE ROUND(100.0 * seq_scan / NULLIF(seq_scan + idx_scan, 0), 2)
    END as seq_scan_ratio,
    CASE
        WHEN seq_scan = 0 THEN '✅ NO SEQ SCANS'
        WHEN ROUND(100.0 * seq_scan / NULLIF(seq_scan + idx_scan, 0), 2) > 50 THEN '🔴 TOO MANY SEQ SCANS'
        WHEN ROUND(100.0 * seq_scan / NULLIF(seq_scan + idx_scan, 0), 2) > 20 THEN '🟡 MODERATE SEQ SCANS'
        ELSE '✅ MOSTLY INDEX SCANS'
    END as scan_status
FROM pg_stat_user_tables
WHERE seq_scan + idx_scan > 0
ORDER BY seq_scan DESC;

COMMENT ON VIEW v_table_scans IS 'Table scan vs index scan analysis';

-- ============================================================================
-- VIEW 7: Database Size Summary
-- ============================================================================

CREATE OR REPLACE VIEW v_database_size AS
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    pg_total_relation_size(schemaname||'.'||tablename) as total_bytes,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) as indexes_size,
    ROUND(100.0 * pg_indexes_size(schemaname||'.'||tablename) /
          NULLIF(pg_total_relation_size(schemaname||'.'||tablename), 0), 2) as index_ratio
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

COMMENT ON VIEW v_database_size IS 'Database size breakdown by table';

-- ============================================================================
-- VIEW 8: Query Performance by Table
-- ============================================================================

CREATE OR REPLACE VIEW v_query_performance_by_table AS
SELECT
    schemaname,
    tablename,
    seq_scan + idx_scan as total_scans,
    seq_scan,
    idx_scan,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_tup_hot_upd as hot_updates,
    ROUND(100.0 * n_tup_hot_upd / NULLIF(n_tup_upd, 0), 2) as hot_update_ratio,
    CASE
        WHEN ROUND(100.0 * n_tup_hot_upd / NULLIF(n_tup_upd, 0), 2) > 90 THEN '✅ EXCELLENT'
        WHEN ROUND(100.0 * n_tup_hot_upd / NULLIF(n_tup_upd, 0), 2) > 70 THEN '🟢 GOOD'
        WHEN ROUND(100.0 * n_tup_hot_upd / NULLIF(n_tup_upd, 0), 2) > 50 THEN '🟡 MODERATE'
        ELSE '🔴 NEEDS TUNING'
    END as hot_update_status
FROM pg_stat_user_tables
ORDER BY n_tup_upd DESC;

COMMENT ON VIEW v_query_performance_by_table IS 'Query performance metrics by table';

-- ============================================================================
-- MONITORING FUNCTIONS
-- ============================================================================

-- Function: Get current performance snapshot
CREATE OR REPLACE FUNCTION get_performance_snapshot()
RETURNS TABLE(
    metric TEXT,
    value NUMERIC,
    status TEXT,
    unit TEXT
) AS $$
BEGIN
    RETURN QUERY
    -- Cache hit ratio
    SELECT
        'cache_hit_ratio' as metric,
        ROUND(100.0 * sum(heap_blks_hit) / NULLIF(sum(heap_blks_hit) + sum(heap_blks_read), 0), 2),
        CASE
            WHEN ROUND(100.0 * sum(heap_blks_hit) / NULLIF(sum(heap_blks_hit) + sum(heap_blks_read), 0), 2) > 95 THEN 'GOOD'
            WHEN ROUND(100.0 * sum(heap_blks_hit) / NULLIF(sum(heap_blks_hit) + sum(heap_blks_read), 0), 2) > 90 THEN 'WARNING'
            ELSE 'CRITICAL'
        END,
        '%' as unit
    FROM pg_statio_user_tables

    UNION ALL

    -- Average query time
    SELECT
        'avg_query_time',
        ROUND(avg(mean_time)::NUMERIC, 2),
        CASE
            WHEN avg(mean_time) < 100 THEN 'GOOD'
            WHEN avg(mean_time) < 500 THEN 'WARNING'
            ELSE 'CRITICAL'
        END,
        'ms'
    FROM pg_stat_statements

    UNION ALL

    -- Total database size
    SELECT
        'total_db_size',
        ROUND(sum(pg_total_relation_size(schemaname||'.'||tablename)) / 1024.0 / 1024.0, 2),
        'INFO',
        'MB'
    FROM pg_stat_user_tables

    UNION ALL

    -- Active connections
    SELECT
        'active_connections',
        count(*)::NUMERIC,
        CASE
            WHEN count(*) > 80 THEN 'CRITICAL'
            WHEN count(*) > 50 THEN 'WARNING'
            ELSE 'GOOD'
        END,
        'connections'
    FROM pg_stat_activity
    WHERE state = 'active';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_performance_snapshot IS 'Get current performance metrics snapshot';

-- ============================================================================
-- DAILY MONITORING QUERIES
-- ============================================================================

-- Run these queries daily for monitoring

-- 1. Top 10 Slow Queries
COMMENT ON VIEW v_slow_queries IS '
DAILY CHECK:
SELECT * FROM v_slow_queries LIMIT 10;
';

-- 2. Unused Indexes (consider dropping)
COMMENT ON VIEW v_unused_indexes IS '
WEEKLY CHECK:
SELECT * FROM v_unused_indexes;
';

-- 3. Cache Hit Ratio (should be > 95%)
COMMENT ON VIEW v_cache_hit_ratio IS '
DAILY CHECK:
SELECT * FROM v_cache_hit_ratio;
';

-- 4. Table Bloat (run VACUUM if needed)
COMMENT ON VIEW v_table_bloat IS '
WEEKLY CHECK:
SELECT * FROM v_table_bloat WHERE dead_ratio > 10;
';

-- 5. Current Performance Snapshot
COMMENT ON FUNCTION get_performance_snapshot IS '
DAILY CHECK:
SELECT * FROM get_performance_snapshot();
';

-- ============================================================================
-- PERFORMANCE ALERTS
-- ============================================================================

-- Function: Check performance thresholds and alert
CREATE OR REPLACE FUNCTION check_performance_alerts()
RETURNS TABLE(
    alert_level TEXT,
    metric TEXT,
    current_value NUMERIC,
    threshold NUMERIC,
    message TEXT
) AS $$
BEGIN
    -- Cache hit ratio alert
    RETURN QUERY
    SELECT
        '🔴 CRITICAL' as alert_level,
        'cache_hit_ratio' as metric,
        ROUND(100.0 * sum(heap_blks_hit) / NULLIF(sum(heap_blks_hit) + sum(heap_blks_read), 0), 2),
        95.0 as threshold,
        'Cache hit ratio below 95%' as message
    FROM pg_statio_user_tables
    WHERE ROUND(100.0 * sum(heap_blks_hit) / NULLIF(sum(heap_blks_hit) + sum(heap_blks_read), 0), 2) < 95

    UNION ALL

    -- Slow query alert
    SELECT
        '🟡 WARNING',
        'avg_query_time',
        ROUND(avg(mean_time)::NUMERIC, 2),
        500.0,
        'Average query time exceeds 500ms'
    FROM pg_stat_statements
    WHERE avg(mean_time) > 500

    UNION ALL

    -- Table bloat alert
    SELECT
        '🟡 WARNING',
        'table_bloat_' || tablename,
        ROUND(100.0 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0), 2),
        20.0,
        'Table ' || tablename || ' has high bloat, run VACUUM'
    FROM pg_stat_user_tables
    WHERE ROUND(100.0 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0), 2) > 20;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_performance_alerts IS 'Check performance thresholds and generate alerts';

-- ============================================================================
-- EXAMPLE USAGE
-- ============================================================================

/*
-- Daily monitoring routine:

-- 1. Performance snapshot
SELECT * FROM get_performance_snapshot();

-- 2. Check alerts
SELECT * FROM check_performance_alerts();

-- 3. Review slow queries
SELECT * FROM v_slow_queries LIMIT 10;

-- 4. Check cache hit ratio
SELECT * FROM v_cache_hit_ratio;

-- 5. Monitor table scans
SELECT * FROM v_table_scans WHERE seq_scan_ratio > 50;

-- Weekly monitoring:

-- 1. Review unused indexes
SELECT * FROM v_unused_indexes;

-- 2. Check table bloat
SELECT * FROM v_table_bloat WHERE dead_ratio > 10;

-- 3. Database size report
SELECT * FROM v_database_size;

-- 4. Index usage report
SELECT * FROM v_index_usage WHERE usage_status IN ('❌ UNUSED', '⚠️ LOW USAGE');

*/
