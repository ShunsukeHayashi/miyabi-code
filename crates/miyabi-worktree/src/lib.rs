//! Git worktree management for parallel agent execution
//!
//! ```text
//!     ___  ____   _   _ ____  ____  ____  ___
//!    |___  ||  ) (|_| | |__| ||__  |__   |___
//!    |   | ||    | | | |  | ||  | |     |___
//!         WORKTREE MANAGER v2.0
//! ```
//!
//! モジュール構成（新アーキテクチャ）：
//! - 🔧 `git`: Git操作（低レベル）
//! - ⚡ `concurrency`: 並列実行制御
//! - 📊 `telemetry`: テレメトリ・監視
//! - 🎯 `manager`: 高レベルWorktree管理
//! - 🏊 `pool`: Worktree並列実行プール

pub mod cleanup;
pub mod concurrency;
pub mod five_worlds;
pub mod git;
pub mod manager;
pub mod paths;
pub mod pool;
pub mod state;
pub mod telemetry;

// 新モジュールのエクスポート
pub use cleanup::{CleanupReport, WorktreeCleanupManager, WorktreeCleanupPolicy};
pub use concurrency::{ConcurrencyController, ConcurrencyStats};
pub use five_worlds::{FiveWorldsManager, WorldStatistics, WorldWorktreeHandle};
pub use git::{GitError, GitWorktreeOps};
pub use paths::{normalize_path, WorktreePaths};
pub use state::{WorktreeState, WorktreeStateManager, WorktreeStatusDetailed};
pub use telemetry::{TelemetryCollector, TelemetryStats, WorktreeEvent};

// 既存モジュールのエクスポート
pub use manager::{WorktreeInfo, WorktreeManager, WorktreeStats, WorktreeStatus};
pub use pool::{
    PoolConfig, PoolExecutionResult, PoolStats, TaskResult, TaskStatus, WorktreePool, WorktreeTask,
};
