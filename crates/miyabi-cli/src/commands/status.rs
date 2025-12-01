//! Status command - Check project status

use crate::{error::Result, worktree::default_worktree_base_dir};
use colored::Colorize;
use std::path::{Path, PathBuf};

pub struct StatusCommand {
    pub watch: bool,
}

impl StatusCommand {
    pub fn new(watch: bool) -> Self {
        Self { watch }
    }

    pub async fn execute(&self) -> Result<()> {
        println!("{}", "📊 Project Status".cyan().bold());
        println!();

        // Check Miyabi installation
        self.check_miyabi_installation();

        // Check environment variables
        self.check_environment();

        // Check git repository status
        self.check_git_status()?;

        // Check worktrees
        self.check_worktrees().await;

        // Check recent activity
        self.check_recent_activity();

        if self.watch {
            println!();
            println!("{}", "  (Watch mode: Press Ctrl+C to exit)".dimmed());
            // TODO: Implement watch mode with auto-refresh
        }

        Ok(())
    }

    fn check_miyabi_installation(&self) {
        println!("{}", "Miyabi Installation:".bold());

        if Path::new(".miyabi.yml").exists() {
            println!("  ✅ Miyabi is installed");

            // Check directory structure
            let required_dirs = vec![".claude/agents", ".github/workflows", "logs", "reports"];

            for dir in required_dirs {
                if Path::new(dir).exists() {
                    println!("    ✓ {}", dir);
                } else {
                    println!("    {} {} (missing)", "⚠".yellow(), dir);
                }
            }
        } else {
            println!("  {} Miyabi is not installed", "❌".red());
            println!("    Run: miyabi install");
        }

        println!();
    }

    fn check_environment(&self) {
        println!("{}", "Environment:".bold());

        // Check GITHUB_TOKEN
        if std::env::var("GITHUB_TOKEN").is_ok() {
            println!("  ✅ GITHUB_TOKEN is set");
        } else {
            println!("  {} GITHUB_TOKEN is not set", "❌".red());
            println!("    Run: export GITHUB_TOKEN=ghp_xxx");
        }

        // Check DEVICE_IDENTIFIER (optional)
        if let Ok(device_id) = std::env::var("DEVICE_IDENTIFIER") {
            println!("  ✅ DEVICE_IDENTIFIER: {}", device_id);
        } else {
            println!("  {} DEVICE_IDENTIFIER not set (optional)", "ℹ".blue());
        }

        println!();
    }

    fn check_git_status(&self) -> Result<()> {
        use std::process::Command;

        println!("{}", "Git Repository:".bold());

        // Check if we're in a git repository
        let output = Command::new("git").args(["rev-parse", "--git-dir"]).output()?;

        if !output.status.success() {
            println!("  {} Not a git repository", "❌".red());
            println!();
            return Ok(());
        }

        println!("  ✅ Git repository detected");

        // Get current branch
        let output = Command::new("git").args(["branch", "--show-current"]).output()?;

        if output.status.success() {
            let branch = String::from_utf8_lossy(&output.stdout);
            println!("    Branch: {}", branch.trim());
        }

        // Get remote URL
        let output = Command::new("git").args(["remote", "get-url", "origin"]).output()?;

        if output.status.success() {
            let remote = String::from_utf8_lossy(&output.stdout);
            println!("    Remote: {}", remote.trim());
        }

        // Get uncommitted changes
        let output = Command::new("git").args(["status", "--short"]).output()?;

        if output.status.success() {
            let changes = String::from_utf8_lossy(&output.stdout);
            let change_count = changes.lines().count();

            if change_count > 0 {
                println!("    {} {} uncommitted change(s)", "⚠".yellow(), change_count);
            } else {
                println!("    ✓ Working directory clean");
            }
        }

        println!();
        Ok(())
    }

    async fn check_worktrees(&self) {
        use miyabi_worktree::WorktreeManager;
        use std::process::Command;

        println!("{}", "Worktrees:".bold());

        let base = std::env::var("MIYABI_WORKTREE_BASE_PATH")
            .map(PathBuf::from)
            .unwrap_or_else(|_| default_worktree_base_dir());
        println!("  Base directory: {}", base.to_string_lossy());
        println!();

        // Try to get detailed statistics from WorktreeManager
        let detailed_stats = async {
            // Get current directory for repo path
            let repo_path = std::env::current_dir().ok()?;

            // Try to create WorktreeManager
            WorktreeManager::new(repo_path.clone(), base.clone(), 10).ok()
        }
        .await;

        if let Some(manager) = detailed_stats {
            // Get statistics
            let stats = manager.stats().await;

            println!("  📊 Statistics:");
            println!("    Total worktrees: {}", stats.total);

            if stats.active > 0 {
                println!("    {} Active: {}", "▶".green(), stats.active);
            }
            if stats.idle > 0 {
                println!("    {} Idle: {}", "⏸".yellow(), stats.idle);
            }
            if stats.completed > 0 {
                println!("    {} Completed: {}", "✓".green(), stats.completed);
            }
            if stats.failed > 0 {
                println!("    {} Failed: {}", "✗".red(), stats.failed);
            }

            println!();
            println!("  🎛️  Concurrency:");
            println!("    Max concurrency: {}", stats.max_concurrency);
            println!("    Available slots: {}", stats.available_slots);
            println!();

            // List individual worktrees
            let worktrees = manager.list_worktrees().await;
            if !worktrees.is_empty() {
                println!("  📋 Active Worktrees:");
                for (i, wt) in worktrees.iter().enumerate() {
                    let status_icon = match wt.status {
                        miyabi_worktree::WorktreeStatus::Active => "▶".green(),
                        miyabi_worktree::WorktreeStatus::Idle => "⏸".yellow(),
                        miyabi_worktree::WorktreeStatus::Completed => "✓".green(),
                        miyabi_worktree::WorktreeStatus::Failed => "✗".red(),
                    };

                    println!("    {}. {} Issue #{} - {}", i + 1, status_icon, wt.issue_number, wt.branch_name.dimmed(),);
                    println!("       Path: {}", wt.path.to_string_lossy().dimmed());
                }
                println!();
            }

            // Get telemetry report
            let telemetry = manager.telemetry_report().await;
            if !telemetry.is_empty() && telemetry != "No events recorded" {
                println!("  📈 Telemetry:");
                for line in telemetry.lines().take(10) {
                    println!("    {}", line.dimmed());
                }
                println!();
            }
        } else {
            // Fallback to basic git worktree list
            println!("  Using git worktree list (basic mode):");
            println!();

            let output = Command::new("git").args(["worktree", "list"]).output();

            if let Ok(output) = output {
                if output.status.success() {
                    let worktrees = String::from_utf8_lossy(&output.stdout);
                    let worktree_lines: Vec<&str> = worktrees.lines().collect();

                    if worktree_lines.len() > 1 {
                        println!("    {} worktree(s) found", worktree_lines.len() - 1);
                        for (i, line) in worktree_lines.iter().skip(1).enumerate() {
                            println!("      {}. {}", i + 1, line);
                        }
                    } else {
                        println!("    No active worktrees");
                    }
                } else {
                    println!("    Unable to check worktrees");
                }
            }
            println!();
        }
    }

    fn check_recent_activity(&self) {
        println!("{}", "Recent Activity:".bold());

        // Check log files
        if Path::new("logs").exists() {
            if let Ok(entries) = std::fs::read_dir("logs") {
                let log_count = entries.count();
                println!("  {} log file(s) in logs/", log_count);
            }
        }

        // Check reports
        if Path::new("reports").exists() {
            if let Ok(entries) = std::fs::read_dir("reports") {
                let report_count = entries.count();
                println!("  {} report file(s) in reports/", report_count);
            }
        }

        // TODO: Check GitHub Issues/PRs via API

        println!();
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_status_command_creation() {
        let cmd = StatusCommand::new(false);
        assert!(!cmd.watch);

        let cmd = StatusCommand::new(true);
        assert!(cmd.watch);
    }
}
