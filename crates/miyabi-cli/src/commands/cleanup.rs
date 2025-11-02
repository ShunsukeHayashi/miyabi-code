//! Worktree cleanup command

use crate::error::Result;
use colored::Colorize;
use miyabi_worktree::{
    WorktreeCleanupManager, WorktreeCleanupPolicy, WorktreeState, WorktreeStateManager,
    WorktreeStatusDetailed,
};
use std::{path::PathBuf, time::Duration};

pub struct CleanupCommand {
    /// Dry run (don't actually delete)
    pub dry_run: bool,
    /// Force cleanup of all worktrees (not just orphaned/stuck)
    pub force: bool,
    /// Clean all worktrees
    pub all: bool,
}

impl CleanupCommand {
    pub fn new(dry_run: bool, force: bool, all: bool) -> Self {
        Self {
            dry_run,
            force,
            all,
        }
    }

    pub async fn execute(&self) -> Result<()> {
        println!(
            "{}",
            format!(
                "🧹 Worktree Cleanup{}",
                if self.dry_run { " (DRY RUN)" } else { "" }
            )
            .cyan()
            .bold()
        );
        println!();

        let repo_path = std::env::current_dir()?;

        // Create state manager
        let state_manager = WorktreeStateManager::new(repo_path.clone())
            .map_err(|e| crate::error::CliError::ExecutionError(e.to_string()))?;

        // Create cleanup manager with policy
        let mut policy = WorktreeCleanupPolicy::default();

        // Adjust policy based on flags
        if self.force {
            policy.delete_orphaned_after = Duration::from_secs(0);
            policy.delete_idle_after = Duration::from_secs(0);
        }

        if self.all {
            policy.delete_on_completion = true;
            policy.max_worktrees = None;
        }

        let cleanup_manager = WorktreeCleanupManager::new(state_manager, policy);

        if self.dry_run {
            // In dry run mode, just show what would be cleaned
            self.dry_run_cleanup(repo_path.clone()).await?;
        } else {
            // Actually perform cleanup
            let report = cleanup_manager
                .run_cleanup()
                .await
                .map_err(|e| crate::error::CliError::ExecutionError(e.to_string()))?;

            // Display report
            self.display_report(&report);

            if self.all {
                let state_manager = WorktreeStateManager::new(repo_path)
                    .map_err(|e| crate::error::CliError::ExecutionError(e.to_string()))?;

                match state_manager.cleanup_all() {
                    Ok(additional) if additional > 0 => {
                        println!(
                            "  {} Additional worktrees removed during --all: {}",
                            "✓".green(),
                            additional
                        );
                        println!();
                    }
                    Ok(_) => {
                        // Nothing left to clean; still provide a hint when force/all requested
                        println!(
                            "  {} No remaining worktrees after initial cleanup",
                            "ℹ".blue()
                        );
                        println!();
                    }
                    Err(err) => {
                        println!(
                            "  {} Failed to remove some worktrees: {}",
                            "⚠️".yellow(),
                            err
                        );
                        println!();
                    }
                }
            }
        }

        Ok(())
    }

    async fn dry_run_cleanup(&self, repo_path: PathBuf) -> Result<()> {
        let state_manager = WorktreeStateManager::new(repo_path)
            .map_err(|e| crate::error::CliError::ExecutionError(e.to_string()))?;

        let worktrees = state_manager
            .scan_worktrees()
            .map_err(|e| crate::error::CliError::ExecutionError(e.to_string()))?;

        if worktrees.is_empty() {
            println!("  ✅ No worktrees found");
            return Ok(());
        }

        println!("  Found {} worktree(s):", worktrees.len());
        println!();

        let would_clean: Vec<_> = worktrees
            .iter()
            .filter(|wt| self.should_clean(wt))
            .collect();

        if would_clean.is_empty() {
            println!("  ✅ No worktrees would be cleaned");
            return Ok(());
        }

        println!("  Would clean {} worktree(s):", would_clean.len());
        println!();

        let mut total_disk_usage = 0u64;

        for wt in &would_clean {
            let status_str = format!("{}", wt.status);
            let disk_mb = wt.disk_usage / 1024 / 1024;
            total_disk_usage += wt.disk_usage;

            println!("  ⚠️  {} ({})", wt.path.display(), status_str.yellow());
            println!("      Branch: {}", wt.branch.dimmed());
            if let Some(issue) = wt.issue_number {
                println!("      Issue: #{}", issue);
            }
            println!("      Disk usage: {} MB", disk_mb);
            println!();
        }

        println!(
            "  {} Would free {} MB of disk space",
            "📊".cyan(),
            total_disk_usage / 1024 / 1024
        );
        println!();
        println!("  Run without --dry-run to actually clean them");
        println!();

        Ok(())
    }

    fn display_report(&self, report: &miyabi_worktree::CleanupReport) {
        println!();
        println!("{}", "📊 Cleanup Report".cyan().bold());
        println!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        println!();

        if report.total_cleaned() == 0 {
            println!("  ✅ No worktrees were cleaned");
        } else {
            println!(
                "  {} Orphaned worktrees cleaned: {}",
                "✓".green(),
                report.orphaned_cleaned
            );
            println!(
                "  {} Idle worktrees cleaned: {}",
                "✓".green(),
                report.idle_cleaned
            );
            println!(
                "  {} Stuck worktrees cleaned: {}",
                "✓".green(),
                report.stuck_cleaned
            );
            println!();
            println!(
                "  {} Total cleaned: {}",
                "📊".cyan(),
                report.total_cleaned()
            );
            println!(
                "  {} Disk space freed: {} MB",
                "💾".cyan(),
                report.freed_disk_space / 1024 / 1024
            );
        }

        if !report.errors.is_empty() {
            println!();
            println!("  {} Errors encountered:", "⚠️".yellow());
            for error in &report.errors {
                println!("    - {}", error.red());
            }
        }

        if !report.deleted_worktrees.is_empty() {
            println!();
            println!("  Deleted worktrees:");
            for path in &report.deleted_worktrees {
                println!("    - {}", path.display().to_string().dimmed());
            }
        }

        println!();
    }

    fn should_clean(&self, worktree: &WorktreeState) -> bool {
        match worktree.status {
            WorktreeStatusDetailed::Orphaned
            | WorktreeStatusDetailed::Stuck
            | WorktreeStatusDetailed::Corrupted => true,
            WorktreeStatusDetailed::Idle => self.force || self.all,
            WorktreeStatusDetailed::Active => self.all,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_cleanup_command_creation() {
        let cmd = CleanupCommand::new(true, false, false);
        assert!(cmd.dry_run);
        assert!(!cmd.force);
        assert!(!cmd.all);

        let cmd = CleanupCommand::new(false, true, true);
        assert!(!cmd.dry_run);
        assert!(cmd.force);
        assert!(cmd.all);
    }
}
