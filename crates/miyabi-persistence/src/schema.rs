//! Database schema definitions for Miyabi persistence layer
//!
//! This module defines the SQLite schema for tracking 5-Worlds execution:
//! - execution_runs: Top-level execution tracking
//! - task_executions: Individual task executions
//! - world_executions: Per-world execution tracking
//! - checkpoints: Checkpoint data for recovery
//! - worktrees: Active worktree tracking

/// SQL schema for the Miyabi persistence layer
///
/// # Tables
///
/// ## execution_runs
/// Tracks overall execution runs for Issues
/// - id: Primary key
/// - issue_number: GitHub Issue number
/// - status: Running/Completed/Failed
/// - started_at: Start timestamp
/// - completed_at: Completion timestamp
/// - total_cost_usd: Total LLM cost
/// - winning_world_id: Winner WorldId
/// - final_score: Winner's score
///
/// ## task_executions
/// Tracks individual task executions within a run
/// - id: Primary key
/// - run_id: Foreign key to execution_runs
/// - task_name: Task identifier
/// - status: Running/Completed/Failed
/// - started_at/completed_at: Timestamps
///
/// ## world_executions
/// Tracks per-world execution details
/// - id: Primary key
/// - task_id: Foreign key to task_executions
/// - world_id: WorldId (Alpha/Beta/Gamma/Delta/Epsilon)
/// - worktree_path: Path to worktree
/// - branch_name: Git branch name
/// - status: Running/Completed/Failed
/// - evaluation_score: Final score (0-100)
/// - cost_usd: LLM cost for this world
///
/// ## checkpoints
/// Stores checkpoint data for crash recovery
/// - id: Primary key
/// - run_id: Foreign key to execution_runs
/// - checkpoint_type: Type of checkpoint
/// - world_id: Optional WorldId
/// - data: JSON checkpoint data
/// - created_at: Timestamp
///
/// ## worktrees
/// Tracks active worktrees for cleanup
/// - id: Primary key
/// - world_id: WorldId
/// - path: Worktree path
/// - branch: Git branch
/// - created_at: Creation timestamp
/// - last_accessed_at: Last access timestamp
/// - is_orphaned: Whether worktree is orphaned (no active execution)
pub const SCHEMA_SQL: &str = r#"
CREATE TABLE IF NOT EXISTS execution_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    issue_number INTEGER NOT NULL,
    status TEXT NOT NULL,
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    total_cost_usd REAL DEFAULT 0.0,
    winning_world_id TEXT,
    final_score REAL
);

CREATE TABLE IF NOT EXISTS task_executions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id INTEGER NOT NULL,
    task_name TEXT NOT NULL,
    status TEXT NOT NULL,
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    FOREIGN KEY (run_id) REFERENCES execution_runs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS world_executions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    world_id TEXT NOT NULL,
    worktree_path TEXT NOT NULL,
    branch_name TEXT NOT NULL,
    status TEXT NOT NULL,
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    evaluation_score REAL,
    cost_usd REAL DEFAULT 0.0,
    FOREIGN KEY (task_id) REFERENCES task_executions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS checkpoints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id INTEGER NOT NULL,
    checkpoint_type TEXT NOT NULL,
    world_id TEXT,
    data JSON NOT NULL,
    created_at TIMESTAMP NOT NULL,
    FOREIGN KEY (run_id) REFERENCES execution_runs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS worktrees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    world_id TEXT NOT NULL,
    path TEXT NOT NULL,
    branch TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    last_accessed_at TIMESTAMP NOT NULL,
    is_orphaned BOOLEAN DEFAULT 0
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_execution_runs_issue ON execution_runs(issue_number);
CREATE INDEX IF NOT EXISTS idx_execution_runs_status ON execution_runs(status);
CREATE INDEX IF NOT EXISTS idx_task_executions_run_id ON task_executions(run_id);
CREATE INDEX IF NOT EXISTS idx_world_executions_task_id ON world_executions(task_id);
CREATE INDEX IF NOT EXISTS idx_world_executions_world_id ON world_executions(world_id);
CREATE INDEX IF NOT EXISTS idx_checkpoints_run_id ON checkpoints(run_id);
CREATE INDEX IF NOT EXISTS idx_checkpoints_type ON checkpoints(checkpoint_type);
CREATE INDEX IF NOT EXISTS idx_worktrees_last_accessed ON worktrees(last_accessed_at);
CREATE INDEX IF NOT EXISTS idx_worktrees_orphaned ON worktrees(is_orphaned);
"#;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_schema_not_empty() {
        assert!(!SCHEMA_SQL.is_empty());
        assert!(SCHEMA_SQL.contains("CREATE TABLE IF NOT EXISTS execution_runs"));
        assert!(SCHEMA_SQL.contains("CREATE TABLE IF NOT EXISTS checkpoints"));
    }

    #[test]
    fn test_schema_has_indexes() {
        assert!(SCHEMA_SQL.contains("CREATE INDEX IF NOT EXISTS"));
        assert!(SCHEMA_SQL.contains("idx_checkpoints_run_id"));
    }

    #[test]
    fn test_schema_has_foreign_keys() {
        assert!(SCHEMA_SQL.contains("FOREIGN KEY"));
        assert!(SCHEMA_SQL.contains("ON DELETE CASCADE"));
    }
}
