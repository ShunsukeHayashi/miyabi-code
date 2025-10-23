//! Worktree management commands

use crate::{error::Result, worktree::default_worktree_base_dir};
use chrono::{Duration, Utc};
use clap::Subcommand;
use colored::Colorize;
use miyabi_worktree::WorktreeManager;
use std::path::PathBuf;

pub struct WorktreeCommand {
    pub subcommand: WorktreeSubcommand,
}

#[derive(Subcommand, Clone)]
pub enum WorktreeSubcommand {
    /// List all worktrees
    List,
    /// Prune old worktrees
    Prune {
        /// Remove worktrees older than N days (default: 7)
        #[arg(long, default_value = "7")]
        older_than: u64,
        /// Dry run (don't actually remove)
        #[arg(long)]
        dry_run: bool,
    },
    /// Remove specific worktree by ID
    Remove {
        /// Worktree ID or issue number
        id: String,
    },
}

impl WorktreeCommand {
    pub fn new(subcommand: WorktreeSubcommand) -> Self {
        Self { subcommand }
    }

    pub async fn execute(&self) -> Result<()> {
        match &self.subcommand {
            WorktreeSubcommand::List => self.list_worktrees().await,
            WorktreeSubcommand::Prune {
                older_than,
                dry_run,
            } => self.prune_worktrees(*older_than, *dry_run).await,
            WorktreeSubcommand::Remove { id } => self.remove_worktree(id).await,
        }
    }

    async fn list_worktrees(&self) -> Result<()> {
        println!("{}", "📋 Worktree List".cyan().bold());
        println!();

        let base = std::env::var("MIYABI_WORKTREE_BASE_PATH")
            .map(PathBuf::from)
            .unwrap_or_else(|_| default_worktree_base_dir());

        let repo_path = std::env::current_dir()?;
        let manager = WorktreeManager::new(repo_path, base, 10)?;

        let worktrees = manager.list_worktrees().await;

        if worktrees.is_empty() {
            println!("  No active worktrees");
            return Ok(());
        }

        println!("  Found {} worktree(s):", worktrees.len());
        println!();

        for (i, wt) in worktrees.iter().enumerate() {
            let age = Utc::now().signed_duration_since(wt.created_at);
            let age_str = if age.num_days() > 0 {
                format!("{}d ago", age.num_days())
            } else if age.num_hours() > 0 {
                format!("{}h ago", age.num_hours())
            } else {
                format!("{}m ago", age.num_minutes())
            };

            let status_icon = match wt.status {
                miyabi_worktree::WorktreeStatus::Active => "▶".green(),
                miyabi_worktree::WorktreeStatus::Idle => "⏸".yellow(),
                miyabi_worktree::WorktreeStatus::Completed => "✓".green(),
                miyabi_worktree::WorktreeStatus::Failed => "✗".red(),
            };

            println!(
                "  {}. {} Issue #{} - {} ({})",
                i + 1,
                status_icon,
                wt.issue_number,
                wt.branch_name.dimmed(),
                age_str.dimmed()
            );
            println!("     Path: {}", wt.path.to_string_lossy());
            println!("     ID: {}", wt.id.dimmed());
        }

        println!();

        Ok(())
    }

    async fn prune_worktrees(&self, older_than_days: u64, dry_run: bool) -> Result<()> {
        println!(
            "{}",
            format!(
                "🧹 Pruning worktrees older than {} days{}",
                older_than_days,
                if dry_run { " (DRY RUN)" } else { "" }
            )
            .cyan()
            .bold()
        );
        println!();

        let base = std::env::var("MIYABI_WORKTREE_BASE_PATH")
            .map(PathBuf::from)
            .unwrap_or_else(|_| default_worktree_base_dir());

        let repo_path = std::env::current_dir()?;
        let manager = WorktreeManager::new(repo_path, base, 10)?;

        let worktrees = manager.list_worktrees().await;
        let cutoff_date = Utc::now() - Duration::days(older_than_days as i64);

        let old_worktrees: Vec<_> = worktrees
            .iter()
            .filter(|wt| wt.created_at < cutoff_date)
            .collect();

        if old_worktrees.is_empty() {
            println!("  ✅ No old worktrees found");
            return Ok(());
        }

        println!("  Found {} old worktree(s):", old_worktrees.len());
        println!();

        let mut removed_count = 0;
        let mut failed_count = 0;

        for wt in &old_worktrees {
            let age = Utc::now().signed_duration_since(wt.created_at);
            let age_days = age.num_days();

            println!(
                "  {} Issue #{} - {} ({}d old)",
                if dry_run { "Would remove" } else { "Removing" },
                wt.issue_number,
                wt.branch_name.dimmed(),
                age_days
            );
            println!("     Path: {}", wt.path.to_string_lossy());

            if !dry_run {
                match manager.remove_worktree(&wt.id).await {
                    Ok(_) => {
                        println!("     {} Removed successfully", "✓".green());
                        removed_count += 1;
                    }
                    Err(e) => {
                        println!("     {} Failed: {}", "✗".red(), e);
                        failed_count += 1;
                    }
                }
            }

            println!();
        }

        if dry_run {
            println!(
                "  {} Would remove {} worktree(s)",
                "ℹ".blue(),
                old_worktrees.len()
            );
            println!("  Run without --dry-run to actually remove them");
        } else {
            println!(
                "  {} Removed: {}, Failed: {}",
                "📊".cyan(),
                removed_count,
                failed_count
            );

            if removed_count > 0 {
                // Run git worktree prune
                println!();
                println!("  Running git worktree prune...");
                let output = tokio::process::Command::new("git")
                    .args(["worktree", "prune"])
                    .output()
                    .await?;

                if output.status.success() {
                    println!("  {} git worktree prune completed", "✓".green());
                } else {
                    let stderr = String::from_utf8_lossy(&output.stderr);
                    println!("  {} git worktree prune failed: {}", "✗".red(), stderr);
                }
            }
        }

        println!();

        Ok(())
    }

    async fn remove_worktree(&self, id: &str) -> Result<()> {
        println!(
            "{}",
            format!("🗑️  Removing worktree: {}", id).cyan().bold()
        );
        println!();

        let base = std::env::var("MIYABI_WORKTREE_BASE_PATH")
            .map(PathBuf::from)
            .unwrap_or_else(|_| default_worktree_base_dir());

        let repo_path = std::env::current_dir()?;
        let manager = WorktreeManager::new(repo_path, base, 10)?;

        // Try to find worktree by ID or issue number
        let worktrees = manager.list_worktrees().await;
        let worktree = worktrees
            .iter()
            .find(|wt| wt.id == id || wt.issue_number.to_string() == id)
            .ok_or_else(|| {
                crate::error::CliError::InvalidInput(format!("Worktree not found: {}", id))
            })?;

        println!("  Issue #{}: {}", worktree.issue_number, worktree.branch_name);
        println!("  Path: {}", worktree.path.to_string_lossy());
        println!();

        manager.remove_worktree(&worktree.id).await?;

        println!("  {} Worktree removed successfully", "✓".green());
        println!();

        // Run git worktree prune
        println!("  Running git worktree prune...");
        let output = tokio::process::Command::new("git")
            .args(["worktree", "prune"])
            .output()
            .await?;

        if output.status.success() {
            println!("  {} git worktree prune completed", "✓".green());
        } else {
            let stderr = String::from_utf8_lossy(&output.stderr);
            println!("  {} git worktree prune failed: {}", "✗".red(), stderr);
        }

        println!();

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_worktree_command_creation() {
        let cmd = WorktreeCommand::new(WorktreeSubcommand::List);
        assert!(matches!(cmd.subcommand, WorktreeSubcommand::List));

        let cmd = WorktreeCommand::new(WorktreeSubcommand::Prune {
            older_than_days: 7,
            dry_run: true,
        });
        assert!(matches!(cmd.subcommand, WorktreeSubcommand::Prune { .. }));
    }
}
