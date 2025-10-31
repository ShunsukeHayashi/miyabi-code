// Task history command - Display task execution history

use crate::error::Result;
use anyhow::{anyhow, Context};
use chrono::{DateTime, Utc};
use clap::Subcommand;
use colored::Colorize;
use miyabi_core::{TaskMetadata, TaskMetadataManager, TaskStatistics, TaskStatus};
use std::env;
use std::time::Duration;

#[derive(Debug, Subcommand)]
pub enum HistoryCommand {
    /// List all task history
    List {
        /// Limit number of results
        #[arg(short, long, default_value = "20")]
        limit: usize,

        /// Filter by status (pending, running, success, failed, cancelled)
        #[arg(long)]
        status: Option<String>,

        /// Filter by issue number
        #[arg(long)]
        issue: Option<u64>,

        /// Output in JSON format
        #[arg(long)]
        json: bool,
    },

    /// Show task statistics
    Stats {
        /// Output in JSON format
        #[arg(long)]
        json: bool,
    },

    /// Show details of a specific task
    Show {
        /// Task ID
        task_id: String,

        /// Output in JSON format
        #[arg(long)]
        json: bool,
    },

    /// Clean up old task metadata
    Clean {
        /// Delete all task metadata
        #[arg(long)]
        all: bool,

        /// Delete tasks older than N days
        #[arg(long)]
        older_than_days: Option<u64>,

        /// Dry run (show what would be deleted)
        #[arg(long)]
        dry_run: bool,
    },
}

impl HistoryCommand {
    pub async fn execute(&self) -> Result<()> {
        let current_dir = env::current_dir().context("Failed to get current directory")?;

        let manager = TaskMetadataManager::new(&current_dir)
            .context("Failed to initialize TaskMetadataManager")?;

        match self {
            HistoryCommand::List {
                limit,
                status,
                issue,
                json,
            } => {
                self.list_tasks(&manager, *limit, status.as_deref(), *issue, *json)
                    .await
            }
            HistoryCommand::Stats { json } => self.show_statistics(&manager, *json).await,
            HistoryCommand::Show { task_id, json } => {
                self.show_task_details(&manager, task_id, *json).await
            }
            HistoryCommand::Clean {
                all,
                older_than_days,
                dry_run,
            } => {
                self.clean_tasks(&manager, *all, *older_than_days, *dry_run)
                    .await
            }
        }
    }

    async fn list_tasks(
        &self,
        manager: &TaskMetadataManager,
        limit: usize,
        status_filter: Option<&str>,
        issue_filter: Option<u64>,
        json: bool,
    ) -> Result<()> {
        let mut tasks = manager.list_all().context("Failed to list tasks")?;

        // Apply filters
        if let Some(status_str) = status_filter {
            let status = parse_task_status(status_str)?;
            tasks.retain(|t| t.status == status);
        }

        if let Some(issue) = issue_filter {
            tasks.retain(|t| t.issue_number == Some(issue));
        }

        // Apply limit
        tasks.truncate(limit);

        if json {
            println!("{}", serde_json::to_string_pretty(&tasks)?);
        } else {
            self.print_task_list(&tasks);
        }

        Ok(())
    }

    fn print_task_list(&self, tasks: &[TaskMetadata]) {
        if tasks.is_empty() {
            println!("{}", "No tasks found.".yellow());
            return;
        }

        println!("\n{}", "Task Execution History".bold().cyan());
        println!("{}", "━".repeat(80).cyan());

        for (idx, task) in tasks.iter().enumerate() {
            let status_icon = match task.status {
                TaskStatus::Pending => "⏸️ ",
                TaskStatus::Running => "🔄",
                TaskStatus::Success => "✅",
                TaskStatus::Failed => "❌",
                TaskStatus::Cancelled => "⚠️ ",
            };

            let status_text = format!("{:?}", task.status);
            let status_colored = match task.status {
                TaskStatus::Success => status_text.green(),
                TaskStatus::Failed => status_text.red(),
                TaskStatus::Running => status_text.yellow(),
                TaskStatus::Cancelled => status_text.bright_black(),
                TaskStatus::Pending => status_text.white(),
            };

            let issue_str = task
                .issue_number
                .map(|n| format!("#{}", n))
                .unwrap_or_else(|| "-".to_string());

            let duration_str = task
                .duration_secs
                .map(|d| format_duration(Duration::from_secs(d)))
                .unwrap_or_else(|| "-".to_string());

            let agent_str = task.agent.as_deref().unwrap_or("-");

            println!(
                "{} {} {} | {} | {} | {} | {}",
                format!("{:>2}.", idx + 1).bright_black(),
                status_icon,
                status_colored,
                issue_str.bright_cyan(),
                task.title.bright_white(),
                agent_str.bright_yellow(),
                duration_str.bright_black(),
            );

            if task.status == TaskStatus::Failed {
                if let Some(error) = &task.error_message {
                    println!("      {}: {}", "Error".red(), error.red());
                }
            }
        }

        println!("{}", "━".repeat(80).cyan());
        println!(
            "{} Showing {} of {} task(s)",
            "ℹ️ ".bright_blue(),
            tasks.len(),
            tasks.len()
        );
    }

    async fn show_statistics(&self, manager: &TaskMetadataManager, json: bool) -> Result<()> {
        let stats = manager
            .get_statistics()
            .context("Failed to get task statistics")?;

        if json {
            println!("{}", serde_json::to_string_pretty(&stats)?);
        } else {
            self.print_statistics(&stats);
        }

        Ok(())
    }

    fn print_statistics(&self, stats: &TaskStatistics) {
        println!("\n{}", "Task Execution Statistics".bold().cyan());
        println!("{}", "━".repeat(60).cyan());

        println!("📊 {}: {}", "Total Tasks".bold(), stats.total);
        println!();

        println!("Status Breakdown:");
        println!("  ⏸️  {}: {}", "Pending", stats.pending);
        println!("  🔄 {}: {}", "Running", stats.running);
        println!(
            "  ✅ {}: {}",
            "Success".green(),
            stats.success.to_string().green()
        );
        println!(
            "  ❌ {}: {}",
            "Failed".red(),
            stats.failed.to_string().red()
        );
        println!("  ⚠️  {}: {}", "Cancelled", stats.cancelled);
        println!();

        if let Some(success_rate) = stats.success_rate {
            let rate_str = format!("{:.1}%", success_rate);
            let rate_colored = if success_rate >= 80.0 {
                rate_str.green()
            } else if success_rate >= 50.0 {
                rate_str.yellow()
            } else {
                rate_str.red()
            };

            println!("📈 {}: {}", "Success Rate".bold(), rate_colored);
        }

        if let Some(avg_duration) = stats.avg_duration_secs {
            println!(
                "⏱️  {}: {}",
                "Avg Duration".bold(),
                format_duration(Duration::from_secs(avg_duration))
            );
        }

        println!("{}", "━".repeat(60).cyan());
    }

    async fn show_task_details(
        &self,
        manager: &TaskMetadataManager,
        task_id: &str,
        json: bool,
    ) -> Result<()> {
        let task = manager
            .load(task_id)
            .context("Failed to load task metadata")?;

        if json {
            println!("{}", serde_json::to_string_pretty(&task)?);
        } else {
            self.print_task_details(&task);
        }

        Ok(())
    }

    fn print_task_details(&self, task: &TaskMetadata) {
        println!("\n{}", "Task Details".bold().cyan());
        println!("{}", "━".repeat(60).cyan());

        println!("🆔 {}: {}", "Task ID".bold(), task.id);

        if let Some(issue) = task.issue_number {
            println!("🔖 {}: #{}", "Issue".bold(), issue);
        }

        println!("📝 {}: {}", "Title".bold(), task.title);

        let status_text = format!("{:?}", task.status);
        let status_colored = match task.status {
            TaskStatus::Success => status_text.green(),
            TaskStatus::Failed => status_text.red(),
            TaskStatus::Running => status_text.yellow(),
            TaskStatus::Cancelled => status_text.bright_black(),
            TaskStatus::Pending => status_text.white(),
        };
        println!("📊 {}: {}", "Status".bold(), status_colored);

        if let Some(agent) = &task.agent {
            println!("🤖 {}: {}", "Agent".bold(), agent);
        }

        if let Some(branch) = &task.branch_name {
            println!("🌿 {}: {}", "Branch".bold(), branch);
        }

        if let Some(worktree) = &task.worktree_path {
            println!("📁 {}: {}", "Worktree".bold(), worktree.display());
        }

        println!();
        println!("Timestamps:");
        println!("  ⏰ {}: {}", "Created", format_datetime(&task.created_at));

        if let Some(started) = &task.started_at {
            println!("  ▶️  {}: {}", "Started", format_datetime(started));
        }

        if let Some(completed) = &task.completed_at {
            println!("  ✓  {}: {}", "Completed", format_datetime(completed));
        }

        if let Some(duration) = task.duration_secs {
            println!(
                "  ⏱️  {}: {}",
                "Duration",
                format_duration(Duration::from_secs(duration))
            );
        }

        if let Some(error) = &task.error_message {
            println!();
            println!("{}: {}", "Error".red().bold(), error.red());
        }

        println!("{}", "━".repeat(60).cyan());
    }

    async fn clean_tasks(
        &self,
        manager: &TaskMetadataManager,
        all: bool,
        older_than_days: Option<u64>,
        dry_run: bool,
    ) -> Result<()> {
        let tasks = manager.list_all().context("Failed to list tasks")?;

        let tasks_to_delete: Vec<_> = if all {
            tasks
        } else if let Some(days) = older_than_days {
            let cutoff = Utc::now() - chrono::Duration::days(days as i64);
            tasks
                .into_iter()
                .filter(|t| t.created_at < cutoff)
                .collect()
        } else {
            println!("{}", "Please specify --all or --older-than-days".yellow());
            return Ok(());
        };

        if tasks_to_delete.is_empty() {
            println!("{}", "No tasks to delete.".green());
            return Ok(());
        }

        println!(
            "\n{} {} task(s) will be deleted:",
            if dry_run { "🔍 Dry run:" } else { "🗑️ " },
            tasks_to_delete.len()
        );

        for task in &tasks_to_delete {
            println!("  - {} ({})", task.id, task.title);
        }

        if dry_run {
            println!("\n{}", "Dry run complete. No tasks were deleted.".yellow());
            return Ok(());
        }

        // Delete tasks
        let mut deleted_count = 0;
        for task in &tasks_to_delete {
            if manager.delete(&task.id).is_ok() {
                deleted_count += 1;
            }
        }

        println!(
            "\n{} {} task(s) deleted successfully.",
            "✅".green(),
            deleted_count
        );

        Ok(())
    }
}

fn parse_task_status(status_str: &str) -> Result<TaskStatus> {
    match status_str.to_lowercase().as_str() {
        "pending" => Ok(TaskStatus::Pending),
        "running" => Ok(TaskStatus::Running),
        "success" => Ok(TaskStatus::Success),
        "failed" => Ok(TaskStatus::Failed),
        "cancelled" => Ok(TaskStatus::Cancelled),
        _ => Err(anyhow!("Invalid status: {}", status_str).into()),
    }
}

fn format_duration(duration: Duration) -> String {
    let secs = duration.as_secs();

    if secs < 60 {
        format!("{}s", secs)
    } else if secs < 3600 {
        format!("{}m {}s", secs / 60, secs % 60)
    } else {
        format!("{}h {}m", secs / 3600, (secs % 3600) / 60)
    }
}

fn format_datetime(dt: &DateTime<Utc>) -> String {
    dt.format("%Y-%m-%d %H:%M:%S UTC").to_string()
}
