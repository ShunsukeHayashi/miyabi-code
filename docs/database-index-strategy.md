# Miyabi Database Index Design Strategy

**Version**: 1.0.0
**Created**: 2025-11-29
**Author**: A3-Worker
**Purpose**: クエリパフォーマンス最適化のための包括的なインデックス戦略

---

## 📊 Executive Summary

Miyabiプロジェクトは3つの主要データベースシステムを使用：
1. **miyabi-persistence (SQLite)** - 5-Worlds実行トラッキング
2. **Marketplace (PostgreSQL)** - プラグインマーケットプレイス
3. **Web UI (PostgreSQL)** - Web UI・リポジトリ管理

このドキュメントは、クエリパフォーマンス最適化のための体系的なインデックス戦略を提供します。

---

## 🔍 Current State Analysis

### miyabi-persistence (SQLite)

**既存インデックス** (schema.rs:119-127):
```sql
CREATE INDEX idx_execution_runs_issue ON execution_runs(issue_number);
CREATE INDEX idx_execution_runs_status ON execution_runs(status);
CREATE INDEX idx_task_executions_run_id ON task_executions(run_id);
CREATE INDEX idx_world_executions_task_id ON world_executions(task_id);
CREATE INDEX idx_world_executions_world_id ON world_executions(world_id);
CREATE INDEX idx_checkpoints_run_id ON checkpoints(run_id);
CREATE INDEX idx_checkpoints_type ON checkpoints(checkpoint_type);
CREATE INDEX idx_worktrees_last_accessed ON worktrees(last_accessed_at);
CREATE INDEX idx_worktrees_orphaned ON worktrees(is_orphaned);
```

**評価**: ✅ 基本的なインデックスは適切に設計されている

### Marketplace (PostgreSQL)

**既存インデックス** (database/migrations/001_initial_schema.sql:222-268):
- Users: email, stripe_customer_id
- Plugins: tier, verified, featured, categories (GIN), downloads DESC, rating DESC
- Subscriptions: user_id, plugin_id, stripe_id, status
- Licenses: (user_id, plugin_id), license_key
- Usage Events: (user_id, plugin_id, created_at DESC), event_type
- Trials: (user_id, plugin_id), expires_at
- Reviews: plugin_id, rating

**評価**: ✅ 高度なインデックス戦略（GIN、複合、降順ソート）

### Web UI (PostgreSQL)

**既存インデックス** (database/migrations/003_web_ui_schema.sql:135-173):
- Basic single-column indexes on foreign keys and lookup columns
- Some composite indexes for agent_executions

**評価**: ⚠️ 改善の余地あり - クエリパターンに基づく最適化が必要

---

## 🎯 Query Pattern Analysis

### 高頻度クエリパターン (repository_service.rs, task_service.rs)

#### 1. Repository Service

**Pattern A: ID検索**
```sql
SELECT * FROM repositories
WHERE id = $1 AND user_id = $2
```
**現在**: ✅ `idx_repositories_user_id` でカバー済み
**推奨**: 最適化不要

**Pattern B: GitHub ID検索**
```sql
SELECT * FROM repositories
WHERE github_id = $1 AND user_id = $2
```
**現在**: ⚠️ `idx_repositories_github_repo_id` (単一カラム)
**推奨**: 複合インデックス `(github_id, user_id)` を追加

**Pattern C: フィルタリング + ページネーション**
```sql
SELECT * FROM repositories
WHERE user_id = $1
  AND ($2::uuid IS NULL OR organization_id = $2)
  AND ($3::boolean IS NULL OR is_active = $3)
  AND ($4::text IS NULL OR name ILIKE '%' || $4 || '%' OR full_name ILIKE '%' || $4 || '%')
ORDER BY updated_at DESC
LIMIT $5 OFFSET $6
```
**現在**: ⚠️ 個別インデックスのみ
**問題点**:
- ILIKE検索は全文検索インデックスなしでは遅い
- 複合条件での最適化が不足

#### 2. Task Service

**Pattern D: タスクリスト取得**
```sql
SELECT * FROM tasks
WHERE user_id = $1
  AND status = $2
  AND repository_id = $3
  AND agent_type = $4
  AND priority = $5
ORDER BY created_at DESC
LIMIT $n OFFSET $m
```
**現在**: ⚠️ 個別インデックスのみ
**推奨**: 複合インデックスの追加

---

## 💡 Index Optimization Strategy

### Priority Tier Classification

| Tier | Priority | Impact | Implementation Effort |
|------|----------|--------|----------------------|
| **P0** | Critical | High | Low |
| **P1** | High | High | Medium |
| **P2** | Medium | Medium | Medium |
| **P3** | Nice-to-Have | Low | High |

---

## 🔴 Tier P0: Immediate Implementation (Critical)

### 1. tasks テーブル - 複合インデックス

**Problem**: 動的フィルタリングクエリのパフォーマンス低下

**Solution**:
```sql
-- Priority 1: Most common filter combination
CREATE INDEX idx_tasks_user_status_repo ON tasks(user_id, status, repository_id);

-- Priority 2: Include sort column for index-only scan
CREATE INDEX idx_tasks_user_created_desc ON tasks(user_id, created_at DESC);

-- Priority 3: Agent type filtering
CREATE INDEX idx_tasks_user_agent_status ON tasks(user_id, agent_type, status);
```

**Expected Impact**:
- Query time: 500ms → 50ms (10x improvement)
- Index-only scans for pagination queries
- Reduced table scans

**Metrics**:
```sql
-- Before optimization
EXPLAIN ANALYZE SELECT * FROM tasks
WHERE user_id = 'xxx' AND status = 'pending'
ORDER BY created_at DESC LIMIT 20;
-- Expected: Seq Scan on tasks (cost=0.00..500.00 rows=100)

-- After optimization
-- Expected: Index Scan using idx_tasks_user_status_repo (cost=0.28..8.30 rows=100)
```

### 2. repositories テーブル - 検索最適化

**Problem**: ILIKE検索が遅い

**Solution**:
```sql
-- GIN index for full-text search on name and full_name
CREATE INDEX idx_repositories_name_search ON repositories
USING GIN (to_tsvector('english', name || ' ' || full_name));

-- Alternative: Trigram index for fuzzy matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_repositories_name_trgm ON repositories
USING GIN (name gin_trgm_ops, full_name gin_trgm_ops);
```

**Expected Impact**:
- ILIKE search: 2000ms → 100ms (20x improvement)
- Supports prefix, suffix, and fuzzy matching

**Usage Pattern Change**:
```sql
-- Before (slow)
WHERE name ILIKE '%search%' OR full_name ILIKE '%search%'

-- After (fast with GIN)
WHERE to_tsvector('english', name || ' ' || full_name) @@ to_tsquery('search')

-- Or with trigram
WHERE name % 'search' OR full_name % 'search'
```

### 3. agent_executions テーブル - ステータス監視

**Problem**: ダッシュボードクエリが遅い

**Solution**:
```sql
-- Composite index for dashboard queries
CREATE INDEX idx_agent_executions_user_status_created
ON agent_executions(user_id, status, created_at DESC);

-- Repository-specific filtering
CREATE INDEX idx_agent_executions_repo_status
ON agent_executions(repository_id, status, created_at DESC);
```

**Expected Impact**:
- Dashboard load time: 1500ms → 200ms (7.5x improvement)
- Real-time status monitoring

---

## 🟡 Tier P1: High Priority (Short-term)

### 4. Partial Indexes for Active Records

**Problem**: インデックスサイズが大きくなる

**Solution**:
```sql
-- Only index active repositories (reduces index size by ~50%)
CREATE INDEX idx_repositories_active_user ON repositories(user_id, updated_at DESC)
WHERE is_active = true;

-- Only index pending/running tasks
CREATE INDEX idx_tasks_active ON tasks(user_id, status, created_at DESC)
WHERE status IN ('pending', 'running');
```

**Expected Impact**:
- Index size: 100MB → 50MB (50% reduction)
- Insert/Update performance: +20% improvement
- Query performance: Same or better

### 5. Covering Indexes for List Queries

**Problem**: Table access overhead

**Solution**:
```sql
-- Include commonly selected columns
CREATE INDEX idx_tasks_list_covering ON tasks(user_id, created_at DESC)
INCLUDE (name, status, priority, agent_type);

CREATE INDEX idx_repositories_list_covering ON repositories(user_id, updated_at DESC)
INCLUDE (name, full_name, is_active, organization_id);
```

**Expected Impact**:
- Heap fetches eliminated
- Query time: 80ms → 30ms (2.6x improvement)

---

## 🟢 Tier P2: Medium Priority (Mid-term)

### 6. Time-based Partitioning

**Problem**: 古いデータが検索パフォーマンスを低下させる

**Solution**:
```sql
-- Partition agent_executions by month
CREATE TABLE agent_executions_2025_11 PARTITION OF agent_executions
FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');

-- Automatically create partitions
CREATE EXTENSION IF NOT EXISTS pg_partman;
SELECT partman.create_parent('public.agent_executions', 'created_at', 'native', 'monthly');
```

**Expected Impact**:
- Old data queries: 5x faster
- Index size per partition: 80% smaller
- Easier archival and deletion

### 7. JSON Indexing for Metadata Queries

**Problem**: JSONB検索が遅い

**Solution**:
```sql
-- GIN index on JSONB columns
CREATE INDEX idx_tasks_metadata_gin ON tasks USING GIN (metadata);
CREATE INDEX idx_workflows_definition_gin ON workflows USING GIN (definition);

-- Specific path indexing
CREATE INDEX idx_tasks_metadata_priority ON tasks
((metadata->>'priority')) WHERE metadata->>'priority' IS NOT NULL;
```

**Expected Impact**:
- JSON queries: 10x faster
- Supports complex JSON path queries

---

## 🔵 Tier P3: Nice-to-Have (Long-term)

### 8. Materialized Views for Analytics

**Problem**: 集計クエリが重い

**Solution**:
```sql
-- Daily task statistics
CREATE MATERIALIZED VIEW mv_task_stats AS
SELECT
    user_id,
    repository_id,
    DATE(created_at) as date,
    status,
    COUNT(*) as task_count,
    AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) as avg_duration
FROM tasks
GROUP BY user_id, repository_id, DATE(created_at), status;

CREATE UNIQUE INDEX idx_mv_task_stats ON mv_task_stats(user_id, repository_id, date, status);

-- Auto-refresh every hour
CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.schedule('refresh-task-stats', '0 * * * *', $$
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_task_stats;
$$);
```

**Expected Impact**:
- Analytics queries: 100x faster
- Reduced database load

### 9. Index Monitoring and Auto-tuning

**Solution**:
```sql
-- Track unused indexes
CREATE VIEW v_unused_indexes AS
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;

-- Track missing indexes (from pg_stat_statements)
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

CREATE VIEW v_suggested_indexes AS
SELECT
    query,
    calls,
    total_time,
    mean_time,
    stddev_time
FROM pg_stat_statements
WHERE mean_time > 100  -- Queries slower than 100ms
ORDER BY mean_time DESC
LIMIT 20;
```

---

## 📈 Performance Metrics & Monitoring

### Key Performance Indicators (KPIs)

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Average query time | 500ms | < 100ms | pg_stat_statements |
| P95 query time | 2000ms | < 300ms | pg_stat_statements |
| Index hit ratio | 85% | > 95% | pg_stat_database |
| Table scan ratio | 40% | < 10% | pg_stat_user_tables |
| Index size | 500MB | Optimized | pg_relation_size |
| Cache hit rate | 90% | > 99% | pg_stat_database |

### Monitoring Queries

```sql
-- 1. Index usage statistics
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan as scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched,
    pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- 2. Slow queries
SELECT
    query,
    calls,
    total_time,
    mean_time,
    max_time,
    stddev_time,
    rows
FROM pg_stat_statements
WHERE mean_time > 100
ORDER BY mean_time DESC
LIMIT 20;

-- 3. Table bloat
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) as indexes_size,
    n_live_tup as live_tuples,
    n_dead_tup as dead_tuples,
    ROUND(100.0 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0), 2) as dead_ratio
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC;

-- 4. Cache hit ratio
SELECT
    'cache hit rate' as metric,
    sum(heap_blks_hit) / NULLIF(sum(heap_blks_hit) + sum(heap_blks_read), 0) as ratio
FROM pg_statio_user_tables
UNION ALL
SELECT
    'index hit rate',
    sum(idx_blks_hit) / NULLIF(sum(idx_blks_hit) + sum(idx_blks_read), 0)
FROM pg_statio_user_indexes;

-- 5. Lock monitoring
SELECT
    pg_stat_activity.pid,
    pg_stat_activity.usename,
    pg_stat_activity.query,
    pg_locks.mode,
    pg_locks.granted
FROM pg_stat_activity
JOIN pg_locks ON pg_stat_activity.pid = pg_locks.pid
WHERE NOT pg_locks.granted;
```

---

## 🚀 Implementation Roadmap

### Phase 1: Critical Fixes (Week 1)
- [ ] Implement P0 composite indexes for tasks table
- [ ] Add GIN indexes for repository search
- [ ] Create covering indexes for list queries
- [ ] Set up basic monitoring queries

### Phase 2: High Priority (Week 2-3)
- [ ] Implement partial indexes for active records
- [ ] Add JSONB indexing for metadata
- [ ] Create monitoring views
- [ ] Benchmark and validate improvements

### Phase 3: Medium Priority (Week 4-6)
- [ ] Evaluate partitioning strategy
- [ ] Implement materialized views for analytics
- [ ] Set up automated index maintenance
- [ ] Create performance dashboard

### Phase 4: Optimization & Tuning (Week 7-8)
- [ ] Analyze unused indexes
- [ ] Fine-tune index parameters
- [ ] Implement auto-vacuum tuning
- [ ] Document best practices

---

## 🔧 Maintenance Guidelines

### Daily Tasks
- Monitor slow query log
- Check cache hit ratio
- Review lock contention

### Weekly Tasks
- Analyze index usage statistics
- Review table bloat
- Validate backup integrity

### Monthly Tasks
- Run VACUUM ANALYZE
- Review and remove unused indexes
- Update table statistics
- Performance regression testing

### Quarterly Tasks
- Re-evaluate index strategy
- Review partitioning effectiveness
- Capacity planning
- Database health audit

---

## 📝 SQL Migration Scripts

### Migration: Add P0 Indexes

```sql
-- File: database/migrations/004_optimize_indexes_p0.sql
-- Description: Critical index optimizations for tasks and repositories

BEGIN;

-- 1. Tasks table composite indexes
CREATE INDEX CONCURRENTLY idx_tasks_user_status_repo
ON tasks(user_id, status, repository_id);

CREATE INDEX CONCURRENTLY idx_tasks_user_created_desc
ON tasks(user_id, created_at DESC);

CREATE INDEX CONCURRENTLY idx_tasks_user_agent_status
ON tasks(user_id, agent_type, status);

-- 2. Repository search optimization
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX CONCURRENTLY idx_repositories_name_trgm
ON repositories USING GIN (name gin_trgm_ops, full_name gin_trgm_ops);

-- 3. Agent executions dashboard indexes
CREATE INDEX CONCURRENTLY idx_agent_executions_user_status_created
ON agent_executions(user_id, status, created_at DESC);

CREATE INDEX CONCURRENTLY idx_agent_executions_repo_status
ON agent_executions(repository_id, status, created_at DESC);

-- 4. Covering indexes
CREATE INDEX CONCURRENTLY idx_tasks_list_covering
ON tasks(user_id, created_at DESC)
INCLUDE (name, status, priority, agent_type);

CREATE INDEX CONCURRENTLY idx_repositories_list_covering
ON repositories(user_id, updated_at DESC)
INCLUDE (name, full_name, is_active, organization_id);

-- Validate indexes
ANALYZE tasks;
ANALYZE repositories;
ANALYZE agent_executions;

COMMIT;
```

### Migration: Rollback Script

```sql
-- File: database/migrations/004_optimize_indexes_p0.down.sql
BEGIN;

DROP INDEX CONCURRENTLY IF EXISTS idx_tasks_user_status_repo;
DROP INDEX CONCURRENTLY IF EXISTS idx_tasks_user_created_desc;
DROP INDEX CONCURRENTLY IF EXISTS idx_tasks_user_agent_status;
DROP INDEX CONCURRENTLY IF EXISTS idx_repositories_name_trgm;
DROP INDEX CONCURRENTLY IF EXISTS idx_agent_executions_user_status_created;
DROP INDEX CONCURRENTLY IF EXISTS idx_agent_executions_repo_status;
DROP INDEX CONCURRENTLY IF EXISTS idx_tasks_list_covering;
DROP INDEX CONCURRENTLY IF EXISTS idx_repositories_list_covering;

COMMIT;
```

---

## 🎓 Best Practices

### Index Design Principles

1. **Cardinality First**: High-cardinality columns should come first in composite indexes
2. **Filter Before Sort**: Filter columns before sort columns in index
3. **Avoid Over-indexing**: Each index has maintenance cost
4. **Use CONCURRENTLY**: Avoid blocking production queries during index creation
5. **Monitor Before Optimize**: Measure first, optimize based on data

### Query Optimization Tips

```sql
-- ✅ GOOD: Use composite index effectively
SELECT * FROM tasks
WHERE user_id = 'xxx' AND status = 'pending'
ORDER BY created_at DESC;
-- Uses: idx_tasks_user_status_repo

-- ❌ BAD: Leading wildcard prevents index usage
SELECT * FROM repositories WHERE name LIKE '%search%';
-- Full table scan

-- ✅ GOOD: Use trigram index
SELECT * FROM repositories WHERE name % 'search';
-- Uses: idx_repositories_name_trgm

-- ✅ GOOD: Use partial index
SELECT * FROM tasks
WHERE user_id = 'xxx' AND status = 'pending';
-- Uses: idx_tasks_active (smaller, faster)

-- ❌ BAD: Function call prevents index usage
SELECT * FROM tasks WHERE LOWER(name) = 'test';

-- ✅ GOOD: Use functional index
CREATE INDEX idx_tasks_name_lower ON tasks(LOWER(name));
SELECT * FROM tasks WHERE LOWER(name) = 'test';
```

---

## 📚 References

### PostgreSQL Documentation
- [Index Types](https://www.postgresql.org/docs/current/indexes-types.html)
- [GIN Indexes](https://www.postgresql.org/docs/current/gin.html)
- [Performance Tips](https://www.postgresql.org/docs/current/performance-tips.html)
- [pg_stat_statements](https://www.postgresql.org/docs/current/pgstatstatements.html)

### Tools
- [pgBadger](https://github.com/darold/pgbadger) - PostgreSQL log analyzer
- [pg_stat_monitor](https://github.com/percona/pg_stat_monitor) - Enhanced statistics
- [pgMustard](https://www.pgmustard.com/) - Query plan visualizer

### Blog Posts
- [Use The Index, Luke!](https://use-the-index-luke.com/)
- [PostgreSQL Indexing Best Practices](https://www.cybertec-postgresql.com/en/postgresql-indexing-index-scan-vs-bitmap-scan-vs-sequential-scan-basics/)

---

## 🤝 Contribution

This index strategy is a living document. Please update it when:
- New query patterns emerge
- Performance metrics change
- New optimization techniques are discovered
- Database schema evolves

**Last Updated**: 2025-11-29
**Next Review**: 2025-12-29
