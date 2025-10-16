//! Git worktree management for parallel agent execution
//!
//! Provides functionality to create, manage, and cleanup Git worktrees
//! for isolated parallel task execution

pub mod manager;
pub mod pool;

pub use manager::{WorktreeInfo, WorktreeManager, WorktreeStats, WorktreeStatus};
pub use pool::{
    PoolConfig, PoolExecutionResult, PoolStats, TaskResult, TaskStatus, WorktreePool, WorktreeTask,
};
