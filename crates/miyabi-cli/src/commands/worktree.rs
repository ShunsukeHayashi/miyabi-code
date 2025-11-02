//! Worktree management commands

use crate::{error::Result, worktree::default_worktree_base_dir};
use chrono::{Duration, Utc};
use clap::Subcommand;
use colored::{ColoredString, Colorize};
use miyabi_worktree::{WorktreeManager, WorktreeStateManager, WorktreeStatusDetailed};
use std::path::PathBuf;

pub struct WorktreeCommand {
    pub subcommand: WorktreeSubcommand,
}

#[derive(Subcommand, Clone)]
pub enum WorktreeSubcommand {
    /// List all worktrees
    List,
    /// Show detailed worktree status
    Status,
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
    /// Scan worktrees and filter by status
    Scan {
        /// Show only orphaned worktrees
        #[arg(long)]
        orphaned: bool,
        /// Show only stuck worktrees
        #[arg(long)]
        stuck: bool,
        /// Show only idle worktrees
        #[arg(long)]
        idle: bool,
        /// Show only active worktrees
        #[arg(long)]
        active: bool,
        /// Show only corrupted worktrees
        #[arg(long)]
        corrupted: bool,
        /// Output results as JSON
        #[arg(long)]
        json: bool,
    },
}

impl WorktreeCommand {
    pub fn new(subcommand: WorktreeSubcommand) -> Self {
        Self { subcommand }
    }

    pub async fn execute(&self) -> Result<()> {
        match &self.subcommand {
            WorktreeSubcommand::List => self.list_worktrees().await,
            WorktreeSubcommand::Status => self.show_status().await,
            WorktreeSubcommand::Prune {
                older_than,
                dry_run,
            } => self.prune_worktrees(*older_than, *dry_run).await,
            WorktreeSubcommand::Remove { id } => self.remove_worktree(id).await,
            WorktreeSubcommand::Scan {
                orphaned,
                stuck,
                idle,
                active,
                corrupted,
                json,
            } => {
                self.scan_worktrees(*orphaned, *stuck, *idle, *active, *corrupted, *json)
                    .await
            }
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
        println!("{}", format!("🗑️  Removing worktree: {}", id).cyan().bold());
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

        println!(
            "  Issue #{}: {}",
            worktree.issue_number, worktree.branch_name
        );
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

    async fn show_status(&self) -> Result<()> {
        use miyabi_worktree::{WorktreeStateManager, WorktreeStatusDetailed};

        println!("{}", "📊 Worktree Status Report".cyan().bold());
        println!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        println!();

        let repo_path = std::env::current_dir()?;

        let state_manager = WorktreeStateManager::new(repo_path)
            .map_err(|e| crate::error::CliError::ExecutionError(e.to_string()))?;

        let worktrees = state_manager
            .scan_worktrees()
            .map_err(|e| crate::error::CliError::ExecutionError(e.to_string()))?;

        if worktrees.is_empty() {
            println!("  ✅ No worktrees found");
            println!();
            return Ok(());
        }

        // Group by status
        let active: Vec<_> = worktrees
            .iter()
            .filter(|w| w.status == WorktreeStatusDetailed::Active)
            .collect();
        let idle: Vec<_> = worktrees
            .iter()
            .filter(|w| w.status == WorktreeStatusDetailed::Idle)
            .collect();
        let stuck: Vec<_> = worktrees
            .iter()
            .filter(|w| w.status == WorktreeStatusDetailed::Stuck)
            .collect();
        let orphaned: Vec<_> = worktrees
            .iter()
            .filter(|w| w.status == WorktreeStatusDetailed::Orphaned)
            .collect();
        let corrupted: Vec<_> = worktrees
            .iter()
            .filter(|w| w.status == WorktreeStatusDetailed::Corrupted)
            .collect();

        let total_disk_usage: u64 = worktrees.iter().map(|w| w.disk_usage).sum();

        // Display Active worktrees
        if !active.is_empty() {
            println!("{} ({}):", "Active Worktrees".green().bold(), active.len());
            for wt in &active {
                let disk_mb = wt.disk_usage / 1024 / 1024;
                let issue_str = if let Some(issue) = wt.issue_number {
                    format!("#{}", issue)
                } else {
                    "N/A".to_string()
                };
                println!(
                    "  ✅ {} [{}] ({} MB)",
                    wt.path.display(),
                    issue_str,
                    disk_mb
                );
            }
            println!();
        }

        // Display Idle worktrees
        if !idle.is_empty() {
            println!("{} ({}):", "Idle Worktrees".yellow().bold(), idle.len());
            for wt in &idle {
                let disk_mb = wt.disk_usage / 1024 / 1024;
                let age = chrono::Utc::now().signed_duration_since(wt.last_accessed);
                let age_str = if age.num_days() > 0 {
                    format!("{}d ago", age.num_days())
                } else if age.num_hours() > 0 {
                    format!("{}h ago", age.num_hours())
                } else {
                    format!("{}m ago", age.num_minutes())
                };
                let issue_str = if let Some(issue) = wt.issue_number {
                    format!("#{}", issue)
                } else {
                    "N/A".to_string()
                };
                println!(
                    "  ⏸️  {} [{}] ({} MB)",
                    wt.path.display(),
                    issue_str,
                    disk_mb
                );
                println!("     Last accessed: {}", age_str.dimmed());
            }
            println!();
        }

        // Display Stuck worktrees
        if !stuck.is_empty() {
            println!("{} ({}):", "Stuck Worktrees".red().bold(), stuck.len());
            for wt in &stuck {
                let disk_mb = wt.disk_usage / 1024 / 1024;
                let age = chrono::Utc::now().signed_duration_since(wt.last_accessed);
                let age_str = format!("{}d ago", age.num_days());
                let issue_str = if let Some(issue) = wt.issue_number {
                    format!("#{}", issue)
                } else {
                    "N/A".to_string()
                };
                println!(
                    "  ⚠️  {} [{}] ({} MB)",
                    wt.path.display(),
                    issue_str,
                    disk_mb
                );
                println!("     No activity for: {}", age_str.red());
            }
            println!();
        }

        // Display Orphaned worktrees
        if !orphaned.is_empty() {
            println!(
                "{} ({}):",
                "Orphaned Worktrees".red().bold(),
                orphaned.len()
            );
            for wt in &orphaned {
                let disk_mb = wt.disk_usage / 1024 / 1024;
                let issue_str = if let Some(issue) = wt.issue_number {
                    format!("#{}", issue)
                } else {
                    "N/A".to_string()
                };
                println!(
                    "  ⚠️  {} [{}] ({} MB)",
                    wt.path.display(),
                    issue_str,
                    disk_mb
                );
                println!("     {}", "No corresponding task metadata".red());
            }
            println!();
        }

        // Display Corrupted worktrees
        if !corrupted.is_empty() {
            println!(
                "{} ({}):",
                "Corrupted Worktrees".red().bold(),
                corrupted.len()
            );
            for wt in &corrupted {
                let disk_mb = wt.disk_usage / 1024 / 1024;
                let issue_str = if let Some(issue) = wt.issue_number {
                    format!("#{}", issue)
                } else {
                    "N/A".to_string()
                };
                println!(
                    "  ❌ {} [{}] ({} MB)",
                    wt.path.display(),
                    issue_str,
                    disk_mb
                );
                println!("     {}", "Git errors or missing files".red());
            }
            println!();
        }

        // Summary
        println!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        println!(
            "Total: {} worktrees, {} MB",
            worktrees.len(),
            total_disk_usage / 1024 / 1024
        );
        println!();

        // Recommendations
        if !orphaned.is_empty() || !stuck.is_empty() || !corrupted.is_empty() {
            println!("{}", "Recommendations:".cyan().bold());
            if !orphaned.is_empty() {
                println!(
                    "  - Cleanup orphaned worktrees: {}",
                    "miyabi cleanup".yellow()
                );
            }
            if !stuck.is_empty() {
                println!(
                    "  - Review stuck worktrees: {}",
                    "miyabi worktree list".yellow()
                );
            }
            if !corrupted.is_empty() {
                println!(
                    "  - Remove corrupted worktrees: {}",
                    "miyabi cleanup --force".yellow()
                );
            }
            println!();
        }

        Ok(())
    }

    async fn scan_worktrees(
        &self,
        orphaned: bool,
        stuck: bool,
        idle: bool,
        active: bool,
        corrupted: bool,
        json: bool,
    ) -> Result<()> {
        println!("{}", "📡 Worktree Scan".cyan().bold());
        println!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        println!();

        let repo_path = std::env::current_dir()?;
        let state_manager = WorktreeStateManager::new(repo_path)
            .map_err(|e| crate::error::CliError::ExecutionError(e.to_string()))?;

        let mut worktrees = state_manager
            .scan_worktrees()
            .map_err(|e| crate::error::CliError::ExecutionError(e.to_string()))?;

        // Sort by most recent access
        worktrees.sort_by(|a, b| b.last_accessed.cmp(&a.last_accessed));

        let filters = [
            (orphaned, WorktreeStatusDetailed::Orphaned, "Orphaned"),
            (stuck, WorktreeStatusDetailed::Stuck, "Stuck"),
            (idle, WorktreeStatusDetailed::Idle, "Idle"),
            (active, WorktreeStatusDetailed::Active, "Active"),
            (corrupted, WorktreeStatusDetailed::Corrupted, "Corrupted"),
        ];

        let mut selected_statuses: Vec<WorktreeStatusDetailed> = filters
            .iter()
            .filter_map(|(flag, status, _)| if *flag { Some(*status) } else { None })
            .collect();

        let selected_labels: Vec<&str> = filters
            .iter()
            .filter_map(|(flag, _, label)| if *flag { Some(*label) } else { None })
            .collect();

        if selected_statuses.is_empty() {
            selected_statuses.extend([
                WorktreeStatusDetailed::Active,
                WorktreeStatusDetailed::Idle,
                WorktreeStatusDetailed::Stuck,
                WorktreeStatusDetailed::Orphaned,
                WorktreeStatusDetailed::Corrupted,
            ]);
            println!("  Filter: All statuses");
        } else {
            println!("  Filter: {}", selected_labels.join(", "));
        }

        println!();

        let filtered: Vec<_> = worktrees
            .into_iter()
            .filter(|state| selected_statuses.contains(&state.status))
            .collect();

        if json {
            let output = serde_json::to_string_pretty(&filtered)
                .map_err(|e| crate::error::CliError::ExecutionError(e.to_string()))?;
            println!("{}", output);
            println!();
            return Ok(());
        }

        if filtered.is_empty() {
            println!("  ✅ No worktrees match the selected filters");
            println!();
            return Ok(());
        }

        for (index, worktree) in filtered.iter().enumerate() {
            let icon = status_icon(worktree.status);
            let label = status_label(worktree.status);
            let disk_mb = worktree.disk_usage / 1024 / 1024;
            let last_access = format_relative_time(worktree.last_accessed);
            let issue = worktree
                .issue_number
                .map(|n| format!("#{}", n))
                .unwrap_or_else(|| "N/A".to_string());

            println!(
                "  {}. {} {} [{}]",
                index + 1,
                icon,
                worktree.path.display(),
                label
            );
            println!("     Issue: {} | Branch: {}", issue, worktree.branch);
            println!("     Last accessed: {} | Disk: {} MB", last_access, disk_mb);
            println!(
                "     Locked: {} | Changes: {}",
                bool_icon(worktree.is_locked),
                bool_icon(worktree.has_uncommitted_changes)
            );
            println!();
        }

        println!("  Total matching worktrees: {}", filtered.len());
        println!();

        Ok(())
    }
}

fn status_icon(status: WorktreeStatusDetailed) -> ColoredString {
    match status {
        WorktreeStatusDetailed::Active => "✅".green(),
        WorktreeStatusDetailed::Idle => "⏸️".yellow(),
        WorktreeStatusDetailed::Stuck => "⚠️".red(),
        WorktreeStatusDetailed::Orphaned => "⚠️".yellow(),
        WorktreeStatusDetailed::Corrupted => "❌".red(),
    }
}

fn status_label(status: WorktreeStatusDetailed) -> &'static str {
    match status {
        WorktreeStatusDetailed::Active => "Active",
        WorktreeStatusDetailed::Idle => "Idle",
        WorktreeStatusDetailed::Stuck => "Stuck",
        WorktreeStatusDetailed::Orphaned => "Orphaned",
        WorktreeStatusDetailed::Corrupted => "Corrupted",
    }
}

fn bool_icon(value: bool) -> ColoredString {
    if value {
        "Yes".green()
    } else {
        "No".dimmed()
    }
}

fn format_relative_time(timestamp: chrono::DateTime<chrono::Utc>) -> String {
    let now = chrono::Utc::now();
    let delta = now.signed_duration_since(timestamp);

    if delta.num_days() > 0 {
        format!("{}d ago", delta.num_days())
    } else if delta.num_hours() > 0 {
        format!("{}h ago", delta.num_hours())
    } else if delta.num_minutes() > 0 {
        format!("{}m ago", delta.num_minutes())
    } else {
        "just now".to_string()
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
            older_than: 7,
            dry_run: true,
        });
        assert!(matches!(cmd.subcommand, WorktreeSubcommand::Prune { .. }));

        let cmd = WorktreeCommand::new(WorktreeSubcommand::Scan {
            orphaned: true,
            stuck: false,
            idle: false,
            active: false,
            corrupted: false,
            json: false,
        });
        assert!(matches!(cmd.subcommand, WorktreeSubcommand::Scan { .. }));
    }

    #[test]
    fn test_format_relative_time_outputs() {
        let now = chrono::Utc::now();
        assert_eq!(format_relative_time(now), "just now");

        let five_minutes_ago = now - chrono::Duration::minutes(5);
        assert_eq!(format_relative_time(five_minutes_ago), "5m ago");

        let three_hours_ago = now - chrono::Duration::hours(3);
        assert_eq!(format_relative_time(three_hours_ago), "3h ago");

        let two_days_ago = now - chrono::Duration::days(2);
        assert_eq!(format_relative_time(two_days_ago), "2d ago");
    }
}
