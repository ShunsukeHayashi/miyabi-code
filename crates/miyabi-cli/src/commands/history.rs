// Task History Command
// Displays task execution history from .miyabi/tasks/*.json

use anyhow::{Context, Result};
use clap::{Args, Subcommand};
use colored::{Color, Colorize};
use miyabi_core::{TaskMetadataManager, TaskStatus};
use std::path::PathBuf;

/// Task history management
#[derive(Debug, Args)]
pub struct HistoryArgs {
    #[command(subcommand)]
    pub command: Option<HistoryCommand>,

    /// Show statistics instead of task list
    #[arg(long)]
    pub stats: bool,

    /// Output as JSON
    #[arg(long)]
    pub json: bool,

    /// Project root (defaults to current directory)
    #[arg(long)]
    pub project_root: Option<PathBuf>,
}

#[derive(Debug, Subcommand)]
pub enum HistoryCommand {
    /// List all tasks
    List {
        /// Filter by status (pending/running/completed/failed)
        #[arg(long)]
        status: Option<String>,

        /// Filter by agent name
        #[arg(long)]
        agent: Option<String>,

        /// Limit number of results
        #[arg(long, default_value = "20")]
        limit: usize,
    },

    /// Show details for a specific task
    Show {
        /// Task ID (e.g., "issue-270")
        task_id: String,
    },

    /// Delete task history
    Delete {
        /// Task ID to delete
        task_id: String,
    },

    /// Show task statistics
    Stats,
}

pub async fn execute(args: HistoryArgs) -> Result<()> {
    let project_root = args
        .project_root
        .unwrap_or_else(|| std::env::current_dir().unwrap());

    let manager = TaskMetadataManager::new(&project_root)
        .context("Failed to initialize task metadata manager")?;

    match args.command {
        Some(HistoryCommand::List {
            status,
            agent,
            limit,
        }) => list_tasks(&manager, status, agent, limit, args.json).await,
        Some(HistoryCommand::Show { task_id }) => show_task(&manager, &task_id, args.json).await,
        Some(HistoryCommand::Delete { task_id }) => delete_task(&manager, &task_id).await,
        Some(HistoryCommand::Stats) => show_statistics(&manager, args.json).await,
        None if args.stats => show_statistics(&manager, args.json).await,
        None => list_tasks(&manager, None, None, 20, args.json).await,
    }
}

async fn list_tasks(
    manager: &TaskMetadataManager,
    status_filter: Option<String>,
    agent_filter: Option<String>,
    limit: usize,
    json: bool,
) -> Result<()> {
    let mut tasks = manager.list_tasks()?;

    // Apply filters
    if let Some(status_str) = status_filter {
        let status = parse_status(&status_str)?;
        tasks.retain(|t| t.status == status);
    }

    if let Some(agent_name) = agent_filter {
        tasks.retain(|t| t.agent.as_deref() == Some(&agent_name));
    }

    // Limit results
    tasks.truncate(limit);

    if json {
        println!("{}", serde_json::to_string_pretty(&tasks)?);
        return Ok(());
    }

    // Display tasks
    if tasks.is_empty() {
        println!("{}", "No tasks found.".yellow());
        return Ok(());
    }

    println!("\n{}", "Task History".bold().underline());
    println!();

    for task in tasks {
        let status_icon = match task.status {
            TaskStatus::Pending => "⏸️ ".yellow(),
            TaskStatus::Running => "▶️ ".blue(),
            TaskStatus::Completed => "✅".green(),
            TaskStatus::Failed => "❌".red(),
            TaskStatus::Paused => "⏸️ ".yellow(),
        };

        let title = if task.title.len() > 60 {
            format!("{}...", &task.title[..57])
        } else {
            task.title.clone()
        };

        println!(
            "{} {} {} {}",
            status_icon,
            task.id.bold(),
            title,
            task.agent
                .as_ref()
                .map(|a| format!("[{}]", a).dimmed().to_string())
                .unwrap_or_default()
        );

        println!(
            "   Created: {} | Duration: {}",
            task.created_at.format("%Y-%m-%d %H:%M:%S").to_string().dimmed(),
            task.duration
                .map(|d| format_duration(d))
                .unwrap_or_else(|| "-".to_string())
                .dimmed()
        );

        if let Some(error) = &task.error_message {
            println!("   {}: {}", "Error".red().bold(), error.red());
        }

        println!();
    }

    Ok(())
}

async fn show_task(manager: &TaskMetadataManager, task_id: &str, json: bool) -> Result<()> {
    let task = manager
        .load_task(task_id)?
        .context(format!("Task '{}' not found", task_id))?;

    if json {
        println!("{}", serde_json::to_string_pretty(&task)?);
        return Ok(());
    }

    // Display task details
    println!("\n{}", "Task Details".bold().underline());
    println!();

    println!("{}: {}", "ID".bold(), task.id);
    println!("{}: {}", "Title".bold(), task.title);
    println!(
        "{}: {}",
        "Status".bold(),
        format!("{:?}", task.status).color(status_color(task.status))
    );

    if let Some(issue_num) = task.issue_number {
        println!("{}: #{}", "Issue".bold(), issue_num);
    }

    if let Some(agent) = &task.agent {
        println!("{}: {}", "Agent".bold(), agent.cyan());
    }

    if let Some(branch) = &task.branch_name {
        println!("{}: {}", "Branch".bold(), branch.yellow());
    }

    if let Some(worktree) = &task.worktree_path {
        println!("{}: {}", "Worktree".bold(), worktree.display());
    }

    println!();
    println!("{}", "Timeline:".bold());
    println!("  Created:   {}", task.created_at.format("%Y-%m-%d %H:%M:%S"));

    if let Some(started) = task.started_at {
        println!("  Started:   {}", started.format("%Y-%m-%d %H:%M:%S"));
    }

    if let Some(completed) = task.completed_at {
        println!("  Completed: {}", completed.format("%Y-%m-%d %H:%M:%S"));
    }

    if let Some(duration) = task.duration {
        println!("  Duration:  {}", format_duration(duration));
    }

    if let Some(success) = task.success {
        println!();
        println!(
            "{}: {}",
            "Result".bold(),
            if success {
                "Success ✅".green()
            } else {
                "Failed ❌".red()
            }
        );
    }

    if let Some(error) = &task.error_message {
        println!();
        println!("{}", "Error Message:".red().bold());
        println!("{}", error.red());
    }

    println!();

    Ok(())
}

async fn delete_task(manager: &TaskMetadataManager, task_id: &str) -> Result<()> {
    manager
        .delete_task(task_id)
        .context(format!("Failed to delete task '{}'", task_id))?;

    println!("{} Task '{}' deleted", "✓".green(), task_id.bold());

    Ok(())
}

async fn show_statistics(manager: &TaskMetadataManager, json: bool) -> Result<()> {
    let stats = manager.get_statistics()?;

    if json {
        println!("{}", serde_json::to_string_pretty(&stats)?);
        return Ok(())
    }

    println!("\n{}", "Task Statistics".bold().underline());
    println!();

    println!("{}: {}", "Total Tasks".bold(), stats.total_tasks);
    println!(
        "{}:  {} {}",
        "Completed".bold(),
        stats.completed_tasks,
        format!(
            "({:.1}%)",
            stats.success_rate * 100.0
        )
        .dimmed()
    );
    println!("{}: {}", "Failed".bold(), stats.failed_tasks.to_string().red());
    println!("{}: {}", "Running".bold(), stats.running_tasks.to_string().blue());

    if let Some(avg_duration) = stats.avg_duration {
        println!();
        println!("{}: {}", "Avg Duration".bold(), format_duration(avg_duration));
    }

    println!();
    println!(
        "{}: {:.1}%",
        "Success Rate".bold(),
        (stats.success_rate * 100.0).to_string().green()
    );

    println!();

    Ok(())
}

fn parse_status(status_str: &str) -> Result<TaskStatus> {
    match status_str.to_lowercase().as_str() {
        "pending" => Ok(TaskStatus::Pending),
        "running" => Ok(TaskStatus::Running),
        "completed" => Ok(TaskStatus::Completed),
        "failed" => Ok(TaskStatus::Failed),
        "paused" => Ok(TaskStatus::Paused),
        _ => anyhow::bail!("Invalid status: {}", status_str),
    }
}

fn status_color(status: TaskStatus) -> Color {
    match status {
        TaskStatus::Completed => Color::Green,
        TaskStatus::Running => Color::Blue,
        TaskStatus::Failed => Color::Red,
        TaskStatus::Pending | TaskStatus::Paused => Color::Yellow,
    }
}

fn format_duration(duration: chrono::Duration) -> String {
    let seconds = duration.num_seconds();

    if seconds < 60 {
        format!("{}s", seconds)
    } else if seconds < 3600 {
        format!("{}m {}s", seconds / 60, seconds % 60)
    } else {
        format!("{}h {}m", seconds / 3600, (seconds % 3600) / 60)
    }
}
