-- Miyabi Source Database - Sample Data
-- Version: 1.0.0
-- Purpose: Realistic test data for ETL pipeline testing

-- ============================================================================
-- SAMPLE ISSUES
-- ============================================================================
INSERT INTO issues (id, number, title, description, priority, complexity, issue_type, repository, created_at, updated_at, closed_at) VALUES
(1, 1001, 'Implement user authentication system', 'Add JWT-based authentication with refresh tokens', 'P0', 'high', 'feature', 'miyabi-web-api', '2025-01-15 10:00:00', '2025-01-16 14:30:00', '2025-01-16 14:30:00'),
(2, 1002, 'Fix memory leak in agent coordinator', 'Memory usage increases over time in long-running processes', 'P0', 'critical', 'bug', 'miyabi-agents', '2025-01-15 11:20:00', '2025-01-16 16:45:00', '2025-01-16 16:45:00'),
(3, 1003, 'Add PostgreSQL connection pooling', 'Optimize database connections with connection pool', 'P1', 'medium', 'enhancement', 'miyabi-web-api', '2025-01-15 14:00:00', '2025-01-16 18:20:00', '2025-01-16 18:20:00'),
(4, 1004, 'Create data warehouse ETL pipeline', 'Design and implement ETL for analytics', 'P1', 'high', 'feature', 'miyabi-dw', '2025-01-16 09:00:00', '2025-01-17 12:00:00', NULL),
(5, 1005, 'Update dependencies to latest versions', 'Security patches and performance improvements', 'P2', 'low', 'maintenance', 'miyabi-core', '2025-01-16 10:30:00', '2025-01-17 15:00:00', NULL),
(6, 1006, 'Implement Grafana dashboards', 'Create monitoring dashboards for DORA metrics', 'P1', 'medium', 'feature', 'miyabi-monitoring', '2025-01-16 13:00:00', '2025-01-17 17:30:00', NULL),
(7, 1007, 'Fix race condition in worktree cleanup', 'Concurrent cleanup causes occasional failures', 'P0', 'medium', 'bug', 'miyabi-worktree', '2025-01-17 08:00:00', '2025-01-17 20:00:00', NULL),
(8, 1008, 'Add unit tests for CLI commands', 'Improve test coverage for miyabi CLI', 'P2', 'low', 'test', 'miyabi-cli', '2025-01-17 10:00:00', '2025-01-17 22:00:00', NULL),
(9, 1009, 'Document Agent API specifications', 'Create comprehensive API documentation', 'P2', 'trivial', 'documentation', 'miyabi-agents', '2025-01-17 14:00:00', NOW() - INTERVAL '2 hours', NULL),
(10, 1010, 'Optimize LLM token usage', 'Reduce costs by optimizing prompts', 'P1', 'medium', 'optimization', 'miyabi-agent-core', '2025-01-17 16:00:00', NOW() - INTERVAL '30 minutes', NULL);

-- ============================================================================
-- AGENT EXECUTION LOGS
-- ============================================================================
INSERT INTO agent_execution_logs (issue_id, agent_id, started_at, completed_at, execution_duration_ms, memory_usage_mb, cpu_usage_percent, llm_tokens_input, llm_tokens_output, llm_cost_usd, success) VALUES
-- Issue 1001: User Authentication
(1, 'CodeGen', '2025-01-15 10:05:00', '2025-01-15 11:30:00', 5100000, 512.5, 45.2, 8500, 12000, 0.2850, TRUE),
(1, 'Review', '2025-01-15 11:35:00', '2025-01-15 12:00:00', 1500000, 256.0, 25.5, 5000, 3000, 0.0920, TRUE),
(1, 'Deployment', '2025-01-16 14:00:00', '2025-01-16 14:30:00', 1800000, 128.0, 15.0, 2000, 1500, 0.0420, TRUE),

-- Issue 1002: Memory Leak Fix
(2, 'CodeGen', '2025-01-15 11:25:00', '2025-01-15 13:45:00', 8400000, 768.3, 55.8, 15000, 18000, 0.4500, TRUE),
(2, 'Review', '2025-01-15 13:50:00', '2025-01-15 14:30:00', 2400000, 384.2, 30.1, 7000, 4500, 0.1350, TRUE),
(2, 'Deployment', '2025-01-16 16:00:00', '2025-01-16 16:45:00', 2700000, 192.0, 20.5, 3000, 2000, 0.0600, TRUE),

-- Issue 1003: Connection Pooling
(3, 'CodeGen', '2025-01-15 14:10:00', '2025-01-15 16:00:00', 6600000, 640.0, 48.5, 10000, 14000, 0.3200, TRUE),
(3, 'Review', '2025-01-15 16:05:00', '2025-01-15 16:45:00', 2400000, 320.0, 28.0, 6000, 3500, 0.1100, TRUE),
(3, 'Deployment', '2025-01-16 18:00:00', '2025-01-16 18:20:00', 1200000, 150.0, 18.0, 2500, 1800, 0.0510, TRUE),

-- Issue 1004: Data Warehouse (In Progress)
(4, 'CodeGen', '2025-01-16 09:15:00', '2025-01-16 12:30:00', 11700000, 1024.0, 62.5, 20000, 25000, 0.6000, TRUE),
(4, 'Review', '2025-01-16 12:40:00', '2025-01-17 11:00:00', NULL, 450.0, 35.0, 9000, NULL, NULL, FALSE),

-- Issue 1005: Dependency Updates (In Progress)
(5, 'CodeGen', '2025-01-16 10:45:00', '2025-01-16 13:00:00', 8100000, 512.0, 42.0, 12000, 15000, 0.3800, TRUE),

-- Issue 1006: Grafana Dashboards (In Progress)
(6, 'CodeGen', '2025-01-16 13:15:00', '2025-01-17 10:00:00', 71100000, 896.5, 58.3, 25000, 30000, 0.7500, TRUE),
(6, 'Review', '2025-01-17 10:10:00', NOW() - INTERVAL '30 minutes', NULL, 400.0, 32.5, 8000, NULL, NULL, FALSE),

-- Issue 1007: Race Condition Fix
(7, 'CodeGen', '2025-01-17 08:15:00', '2025-01-17 12:00:00', 13500000, 720.0, 50.5, 16000, 19000, 0.4800, TRUE),

-- Issue 1010: LLM Optimization (Just Started)
(10, 'CodeGen', NOW() - INTERVAL '25 minutes', NULL, NULL, 580.0, 45.0, 11000, NULL, NULL, FALSE);

-- ============================================================================
-- CODE GENERATION TASKS
-- ============================================================================
INSERT INTO code_gen_tasks (issue_id, total_files_generated, total_lines_generated, compilation_time_ms, clippy_warnings, fmt_issues) VALUES
(1, 15, 1250, 8500, 3, 0),
(2, 8, 650, 5200, 1, 0),
(3, 12, 980, 7100, 2, 1),
(4, 35, 2800, 15000, 5, 0),
(5, 45, 3500, 22000, 8, 2),
(6, 28, 2200, 12500, 4, 0),
(7, 10, 750, 6000, 2, 0);

-- ============================================================================
-- REVIEW RESULTS
-- ============================================================================
INSERT INTO review_results (issue_id, review_score, test_coverage_percent, security_issues_found, performance_issues_found) VALUES
(1, 0.92, 85.5, 0, 1),
(2, 0.95, 92.0, 1, 0),
(3, 0.88, 78.5, 0, 0),
(4, 0.90, 88.0, 0, 2),
(5, 0.82, 70.0, 2, 1),
(6, 0.87, 75.5, 0, 0);

-- ============================================================================
-- DEPLOYMENT PIPELINES
-- ============================================================================
INSERT INTO deployment_pipelines (issue_id, deployment_status, deployment_duration_seconds, infrastructure_cost_usd, environment, deployed_at) VALUES
(1, 'success', 450, 0.125, 'production', '2025-01-16 14:30:00'),
(2, 'success', 540, 0.150, 'production', '2025-01-16 16:45:00'),
(3, 'success', 380, 0.105, 'production', '2025-01-16 18:20:00'),
(4, 'running', NULL, NULL, 'staging', NULL),
(5, 'pending', NULL, NULL, 'development', NULL),
(6, 'failed', 120, 0.035, 'staging', '2025-01-17 17:00:00');

-- ============================================================================
-- COMMITS
-- ============================================================================
INSERT INTO commits (issue_id, commit_sha, pr_number, commit_message, author, committed_at) VALUES
(1, 'a1b2c3d4e5f6789012345678901234567890abcd', 101, 'feat: implement JWT authentication system', 'CodeGenAgent', '2025-01-15 11:30:00'),
(2, 'b2c3d4e5f6789012345678901234567890abcde1', 102, 'fix: resolve memory leak in agent coordinator', 'CodeGenAgent', '2025-01-15 13:45:00'),
(3, 'c3d4e5f6789012345678901234567890abcdef12', 103, 'feat: add PostgreSQL connection pooling', 'CodeGenAgent', '2025-01-15 16:00:00'),
(4, 'd4e5f6789012345678901234567890abcdef123', 104, 'feat: create data warehouse ETL pipeline', 'CodeGenAgent', '2025-01-16 12:30:00'),
(5, 'e5f6789012345678901234567890abcdef01234', 105, 'chore: update dependencies to latest versions', 'CodeGenAgent', '2025-01-16 13:00:00'),
(6, 'f6789012345678901234567890abcdef012345', 106, 'feat: implement Grafana dashboards', 'CodeGenAgent', '2025-01-17 10:00:00'),
(7, '0789012345678901234567890abcdef0123456', 107, 'fix: resolve race condition in worktree cleanup', 'CodeGenAgent', '2025-01-17 12:00:00');

-- ============================================================================
-- LABEL HISTORY
-- ============================================================================
INSERT INTO label_history (issue_id, label_name, applied_at, removed_at) VALUES
-- Issue 1001
(1, 'status:in-progress', '2025-01-15 10:00:00', '2025-01-15 11:30:00'),
(1, 'status:in-review', '2025-01-15 11:35:00', '2025-01-16 14:00:00'),
(1, 'status:completed', '2025-01-16 14:30:00', NULL),
(1, 'priority:p0', '2025-01-15 10:00:00', NULL),
(1, 'type:feature', '2025-01-15 10:00:00', NULL),
(1, 'complexity:high', '2025-01-15 10:00:00', NULL),

-- Issue 1002
(2, 'status:in-progress', '2025-01-15 11:20:00', '2025-01-15 13:45:00'),
(2, 'status:in-review', '2025-01-15 13:50:00', '2025-01-16 16:00:00'),
(2, 'status:completed', '2025-01-16 16:45:00', NULL),
(2, 'priority:p0', '2025-01-15 11:20:00', NULL),
(2, 'type:bug', '2025-01-15 11:20:00', NULL),
(2, 'complexity:critical', '2025-01-15 11:20:00', NULL),

-- Issue 1003
(3, 'status:in-progress', '2025-01-15 14:00:00', '2025-01-15 16:00:00'),
(3, 'status:in-review', '2025-01-15 16:05:00', '2025-01-16 18:00:00'),
(3, 'status:completed', '2025-01-16 18:20:00', NULL),
(3, 'priority:p1', '2025-01-15 14:00:00', NULL),
(3, 'type:enhancement', '2025-01-15 14:00:00', NULL),

-- Issue 1004
(4, 'status:in-progress', '2025-01-16 09:00:00', NULL),
(4, 'priority:p1', '2025-01-16 09:00:00', NULL),
(4, 'type:feature', '2025-01-16 09:00:00', NULL),
(4, 'complexity:high', '2025-01-16 09:00:00', NULL),

-- Issue 1005
(5, 'status:in-progress', '2025-01-16 10:30:00', NULL),
(5, 'priority:p2', '2025-01-16 10:30:00', NULL),
(5, 'type:maintenance', '2025-01-16 10:30:00', NULL),

-- Issue 1006
(6, 'status:in-progress', '2025-01-16 13:00:00', NULL),
(6, 'priority:p1', '2025-01-16 13:00:00', NULL),
(6, 'type:feature', '2025-01-16 13:00:00', NULL),

-- Issue 1007
(7, 'status:in-progress', '2025-01-17 08:00:00', NULL),
(7, 'priority:p0', '2025-01-17 08:00:00', NULL),
(7, 'type:bug', '2025-01-17 08:00:00', NULL);

-- ============================================================================
-- WORKTREE STATES
-- ============================================================================
INSERT INTO worktree_states (associated_issue_id, worktree_path, branch_name, status, created_at, cleaned_up_at) VALUES
(1, '.worktrees/issue-1001-auth-system', 'feature/issue-1001', 'merged', '2025-01-15 10:00:00', '2025-01-16 15:00:00'),
(2, '.worktrees/issue-1002-memory-leak', 'fix/issue-1002', 'merged', '2025-01-15 11:20:00', '2025-01-16 17:00:00'),
(3, '.worktrees/issue-1003-connection-pool', 'feature/issue-1003', 'merged', '2025-01-15 14:00:00', '2025-01-16 19:00:00'),
(4, '.worktrees/issue-1004-data-warehouse', 'feature/issue-1004', 'active', '2025-01-16 09:00:00', NULL),
(5, '.worktrees/issue-1005-dep-updates', 'chore/issue-1005', 'active', '2025-01-16 10:30:00', NULL),
(6, '.worktrees/issue-1006-grafana', 'feature/issue-1006', 'active', '2025-01-16 13:00:00', NULL),
(7, '.worktrees/issue-1007-race-condition', 'fix/issue-1007', 'active', '2025-01-17 08:00:00', NULL);

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- Sample data includes:
-- - 10 issues (3 completed, 7 in various stages of progress)
-- - 18 agent execution logs (mix of completed and in-progress)
-- - 7 code generation tasks
-- - 6 review results
-- - 6 deployment pipeline records (success, running, pending, failed)
-- - 7 commits
-- - 33 label history entries
-- - 7 worktree states (3 merged, 4 active)
