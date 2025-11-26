//! Worktree cleanup and maintenance
//!
//! Provides automatic cleanup of orphaned, idle, and stuck worktrees
//! based on configurable policies.

use crate::state::{WorktreeState, WorktreeStateManager, WorktreeStatusDetailed};
use miyabi_types::error::Result;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::time::Duration;

/// Worktree cleanup policy configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorktreeCleanupPolicy {
    /// Delete worktree immediately after task completion
    pub delete_on_completion: bool,
    /// Delete orphaned worktrees after this duration
    pub delete_orphaned_after: Duration,
    /// Delete idle worktrees after this duration
    pub delete_idle_after: Duration,
    /// Maximum number of worktrees to keep
    pub max_worktrees: Option<usize>,
}

impl Default for WorktreeCleanupPolicy {
    fn default() -> Self {
        Self {
            delete_on_completion: true,
            delete_orphaned_after: Duration::from_secs(86400), // 24 hours
            delete_idle_after: Duration::from_secs(604800),    // 7 days
            max_worktrees: Some(10),
        }
    }
}

/// Cleanup report with statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CleanupReport {
    /// Worktrees that were deleted
    pub deleted_worktrees: Vec<PathBuf>,
    /// Total disk space freed (bytes)
    pub freed_disk_space: u64,
    /// Errors encountered during cleanup
    pub errors: Vec<String>,
    /// Number of orphaned worktrees cleaned
    pub orphaned_cleaned: usize,
    /// Number of idle worktrees cleaned
    pub idle_cleaned: usize,
    /// Number of stuck worktrees cleaned
    pub stuck_cleaned: usize,
}

impl CleanupReport {
    /// Create a new empty cleanup report
    pub fn new() -> Self {
        Self {
            deleted_worktrees: Vec::new(),
            freed_disk_space: 0,
            errors: Vec::new(),
            orphaned_cleaned: 0,
            idle_cleaned: 0,
            stuck_cleaned: 0,
        }
    }

    /// Total number of worktrees cleaned
    pub fn total_cleaned(&self) -> usize {
        self.orphaned_cleaned + self.idle_cleaned + self.stuck_cleaned
    }
}

impl Default for CleanupReport {
    fn default() -> Self {
        Self::new()
    }
}

/// Worktree cleanup manager
pub struct WorktreeCleanupManager {
    state_manager: WorktreeStateManager,
    policy: WorktreeCleanupPolicy,
}

impl WorktreeCleanupManager {
    /// Create a new cleanup manager
    pub fn new(state_manager: WorktreeStateManager, policy: WorktreeCleanupPolicy) -> Self {
        Self {
            state_manager,
            policy,
        }
    }

    /// Create a cleanup manager with default policy
    pub fn with_defaults(state_manager: WorktreeStateManager) -> Self {
        Self::new(state_manager, WorktreeCleanupPolicy::default())
    }

    /// Run cleanup based on policy
    pub async fn run_cleanup(&self) -> Result<CleanupReport> {
        let mut report = CleanupReport::new();

        // Get all worktrees
        let worktrees = self.state_manager.scan_worktrees()?;

        tracing::info!(
            "Starting worktree cleanup scan (found {} worktrees)",
            worktrees.len()
        );

        // Clean up orphaned worktrees
        for worktree in worktrees.iter().filter(|w| {
            w.status == WorktreeStatusDetailed::Orphaned && self.should_clean_orphaned(w)
        }) {
            match self.cleanup_single(&mut report, worktree, "orphaned").await {
                Ok(_) => report.orphaned_cleaned += 1,
                Err(e) => report.errors.push(format!(
                    "Failed to clean orphaned worktree {}: {}",
                    worktree.path.display(),
                    e
                )),
            }
        }

        // Clean up idle worktrees
        for worktree in worktrees
            .iter()
            .filter(|w| w.status == WorktreeStatusDetailed::Idle && self.should_clean_idle(w))
        {
            match self.cleanup_single(&mut report, worktree, "idle").await {
                Ok(_) => report.idle_cleaned += 1,
                Err(e) => report.errors.push(format!(
                    "Failed to clean idle worktree {}: {}",
                    worktree.path.display(),
                    e
                )),
            }
        }

        // Clean up stuck worktrees
        for worktree in worktrees
            .iter()
            .filter(|w| w.status == WorktreeStatusDetailed::Stuck)
        {
            match self.cleanup_single(&mut report, worktree, "stuck").await {
                Ok(_) => report.stuck_cleaned += 1,
                Err(e) => report.errors.push(format!(
                    "Failed to clean stuck worktree {}: {}",
                    worktree.path.display(),
                    e
                )),
            }
        }

        // Enforce max_worktrees limit
        if let Some(max) = self.policy.max_worktrees {
            let active_count = worktrees
                .iter()
                .filter(|w| w.status == WorktreeStatusDetailed::Active)
                .count();

            if active_count + report.total_cleaned() > max {
                // Clean oldest idle worktrees first
                let mut idle_worktrees: Vec<_> = worktrees
                    .iter()
                    .filter(|w| w.status == WorktreeStatusDetailed::Idle)
                    .collect();
                idle_worktrees.sort_by_key(|w| w.last_accessed);

                let to_remove = active_count + report.total_cleaned() - max;
                for worktree in idle_worktrees.iter().take(to_remove) {
                    match self.cleanup_single(&mut report, worktree, "excess").await {
                        Ok(_) => report.idle_cleaned += 1,
                        Err(e) => report.errors.push(format!(
                            "Failed to clean excess worktree {}: {}",
                            worktree.path.display(),
                            e
                        )),
                    }
                }
            }
        }

        tracing::info!(
            "Cleanup complete: {} worktrees cleaned, {} MB freed",
            report.total_cleaned(),
            report.freed_disk_space / 1024 / 1024
        );

        Ok(report)
    }

    /// Start periodic cleanup task
    pub async fn start_periodic_cleanup(&self, interval: Duration) {
        loop {
            tokio::time::sleep(interval).await;

            match self.run_cleanup().await {
                Ok(report) => {
                    if report.total_cleaned() > 0 {
                        tracing::info!(
                            "Periodic cleanup: {} worktrees cleaned",
                            report.total_cleaned()
                        );
                    }
                }
                Err(e) => {
                    tracing::error!("Periodic cleanup failed: {}", e);
                }
            }
        }
    }

    /// Clean up a single worktree
    async fn cleanup_single(
        &self,
        report: &mut CleanupReport,
        worktree: &WorktreeState,
        reason: &str,
    ) -> Result<()> {
        tracing::info!(
            "Cleaning up {} worktree: {} (issue: {:?})",
            reason,
            worktree.path.display(),
            worktree.issue_number
        );

        let disk_usage = worktree.disk_usage;

        self.state_manager.cleanup_worktree(&worktree.path)?;

        report.deleted_worktrees.push(worktree.path.clone());
        report.freed_disk_space += disk_usage;

        Ok(())
    }

    /// Check if orphaned worktree should be cleaned
    fn should_clean_orphaned(&self, worktree: &WorktreeState) -> bool {
        let age = chrono::Utc::now() - worktree.last_accessed;
        age.num_seconds() > self.policy.delete_orphaned_after.as_secs() as i64
    }

    /// Check if idle worktree should be cleaned
    fn should_clean_idle(&self, worktree: &WorktreeState) -> bool {
        let age = chrono::Utc::now() - worktree.last_accessed;
        age.num_seconds() > self.policy.delete_idle_after.as_secs() as i64
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[test]
    fn test_cleanup_policy_default() {
        let policy = WorktreeCleanupPolicy::default();
        assert!(policy.delete_on_completion);
        assert_eq!(policy.delete_orphaned_after.as_secs(), 86400); // 24h
        assert_eq!(policy.delete_idle_after.as_secs(), 604800); // 7 days
        assert_eq!(policy.max_worktrees, Some(10));
    }

    #[test]
    fn test_cleanup_report_new() {
        let report = CleanupReport::new();
        assert_eq!(report.total_cleaned(), 0);
        assert_eq!(report.freed_disk_space, 0);
        assert!(report.errors.is_empty());
    }

    #[test]
    fn test_cleanup_manager_creation() {
        let temp_dir = TempDir::new().unwrap();
        let state_manager = WorktreeStateManager::new(temp_dir.path().to_path_buf()).unwrap();
        let _manager = WorktreeCleanupManager::with_defaults(state_manager);
    }
}
