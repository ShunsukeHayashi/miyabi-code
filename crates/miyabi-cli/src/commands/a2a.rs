//! A2A (Agent-to-Agent) communication commands
//!
//! Provides CLI interface for creating, listing, and managing A2A tasks

use crate::error::{CliError, Result};
use clap::Subcommand;
use colored::Colorize;
use miyabi_a2a::{A2ATask, GitHubTaskStorage, TaskFilter, TaskStatus, TaskStorage, TaskType, TaskUpdate};

/// A2A subcommands
#[derive(Debug, Clone, Subcommand)]
pub enum A2ACommand {
    /// Create a new task
    Create {
        /// Task title
        #[arg(long)]
        title: String,

        /// Task description
        #[arg(short, long)]
        description: Option<String>,

        /// Task type (codegen, review, testing, deployment, documentation, analysis)
        #[arg(short = 't', long)]
        task_type: String,

        /// Context ID for grouping related tasks
        #[arg(short, long)]
        context: Option<String>,

        /// Priority (0-5, higher = more urgent)
        #[arg(short, long, default_value = "3")]
        priority: u8,
    },

    /// List tasks with optional filters
    List {
        /// Filter by status (submitted, working, completed, failed, cancelled)
        #[arg(short, long)]
        status: Option<String>,

        /// Filter by context ID
        #[arg(short, long)]
        context: Option<String>,

        /// Maximum number of results
        #[arg(short, long, default_value = "30")]
        limit: usize,
    },

    /// Get a specific task by ID
    Get {
        /// Task ID (GitHub Issue number)
        #[arg(short, long)]
        id: u64,
    },

    /// Update a task
    Update {
        /// Task ID (GitHub Issue number)
        #[arg(short, long)]
        id: u64,

        /// New status (submitted, working, completed, failed, cancelled)
        #[arg(short, long)]
        status: Option<String>,

        /// New description
        #[arg(short, long)]
        description: Option<String>,
    },

    /// Delete (close) a task
    Delete {
        /// Task ID (GitHub Issue number)
        #[arg(short, long)]
        id: u64,
    },
}

impl A2ACommand {
    pub async fn execute(&self) -> Result<()> {
        let storage = Self::create_storage()?;

        match self {
            A2ACommand::Create { title, description, task_type, context, priority } => {
                Self::cmd_create(&storage, title, description.as_deref(), task_type, context.as_deref(), *priority)
                    .await
            }
            A2ACommand::List { status, context, limit } => {
                Self::cmd_list(&storage, status.as_deref(), context.as_deref(), *limit).await
            }
            A2ACommand::Get { id } => Self::cmd_get(&storage, *id).await,
            A2ACommand::Update { id, status, description } => {
                Self::cmd_update(&storage, *id, status.as_deref(), description.as_deref()).await
            }
            A2ACommand::Delete { id } => Self::cmd_delete(&storage, *id).await,
        }
    }

    /// Create GitHubTaskStorage from environment
    fn create_storage() -> Result<GitHubTaskStorage> {
        let token = std::env::var("GITHUB_TOKEN")
            .map_err(|_| CliError::MissingEnvironmentVariable { var: "GITHUB_TOKEN".to_string() })?;

        // Get repository from GITHUB_REPOSITORY env var (format: "owner/repo")
        let repo = std::env::var("GITHUB_REPOSITORY")
            .map_err(|_| CliError::MissingEnvironmentVariable { var: "GITHUB_REPOSITORY".to_string() })?;

        let parts: Vec<&str> = repo.split('/').collect();
        if parts.len() != 2 {
            return Err(CliError::Config(format!("Invalid GITHUB_REPOSITORY format: {}. Expected: owner/repo", repo)));
        }

        let owner = parts[0].to_string();
        let repo_name = parts[1].to_string();

        GitHubTaskStorage::new(token, owner, repo_name)
            .map_err(|e| CliError::Config(format!("Failed to create storage: {}", e)))
    }

    /// Parse task type from string
    fn parse_task_type(s: &str) -> Result<TaskType> {
        match s.to_lowercase().as_str() {
            "codegen" | "code-generation" => Ok(TaskType::CodeGeneration),
            "review" | "code-review" => Ok(TaskType::CodeReview),
            "testing" | "test" => Ok(TaskType::Testing),
            "deployment" | "deploy" => Ok(TaskType::Deployment),
            "documentation" | "docs" => Ok(TaskType::Documentation),
            "analysis" | "analyze" => Ok(TaskType::Analysis),
            _ => Err(CliError::InvalidInput(format!(
                "Invalid task type: {}. Valid types: codegen, review, testing, deployment, documentation, analysis",
                s
            ))),
        }
    }

    /// Parse task status from string
    fn parse_task_status(s: &str) -> Result<TaskStatus> {
        match s.to_lowercase().as_str() {
            "submitted" | "pending" => Ok(TaskStatus::Submitted),
            "working" | "in-progress" => Ok(TaskStatus::Working),
            "completed" | "done" => Ok(TaskStatus::Completed),
            "failed" | "error" => Ok(TaskStatus::Failed),
            "cancelled" | "canceled" => Ok(TaskStatus::Cancelled),
            _ => Err(CliError::InvalidInput(format!(
                "Invalid task status: {}. Valid statuses: submitted, working, completed, failed, cancelled",
                s
            ))),
        }
    }

    /// Create a new task
    async fn cmd_create(
        storage: &GitHubTaskStorage,
        title: &str,
        description: Option<&str>,
        task_type: &str,
        context: Option<&str>,
        priority: u8,
    ) -> Result<()> {
        let task_type = Self::parse_task_type(task_type)?;

        let task = A2ATask {
            id: 0, // Will be assigned by GitHub
            title: title.to_string(),
            description: description.unwrap_or("").to_string(),
            status: TaskStatus::Submitted,
            task_type: task_type.clone(),
            agent: None,
            context_id: context.map(|s| s.to_string()),
            priority,
            retry_count: 0,
            created_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
            issue_url: String::new(),
        };

        let task_id = storage
            .save_task(task)
            .await
            .map_err(|e| CliError::Execution(format!("Failed to create task: {}", e)))?;

        println!("{}", "✅ Task created successfully!".green().bold());
        println!("  {} {}", "Task ID:".cyan(), task_id.to_string().yellow().bold());
        println!("  {} {}", "Title:".cyan(), title);
        println!("  {} {:?}", "Type:".cyan(), &task_type);
        if let Some(ctx) = context {
            println!("  {} {}", "Context:".cyan(), ctx);
        }

        Ok(())
    }

    /// List tasks
    async fn cmd_list(
        storage: &GitHubTaskStorage,
        status: Option<&str>,
        context: Option<&str>,
        limit: usize,
    ) -> Result<()> {
        let status_filter = if let Some(s) = status {
            Some(Self::parse_task_status(s)?)
        } else {
            None
        };

        let filter = TaskFilter {
            status: status_filter,
            context_id: context.map(|s| s.to_string()),
            limit: Some(limit),
            ..Default::default()
        };

        let tasks = storage
            .list_tasks(filter)
            .await
            .map_err(|e| CliError::Execution(format!("Failed to list tasks: {}", e)))?;

        if tasks.is_empty() {
            println!("{}", "No tasks found".yellow());
            return Ok(());
        }

        println!("{}", format!("📋 Found {} tasks:", tasks.len()).cyan().bold());
        println!();

        for task in tasks {
            let status_str = format!("{:?}", task.status);
            let status_colored = match task.status {
                TaskStatus::Submitted => status_str.yellow(),
                TaskStatus::Working => status_str.blue(),
                TaskStatus::Completed => status_str.green(),
                TaskStatus::Failed => status_str.red(),
                TaskStatus::Cancelled => status_str.dimmed(),
            };

            println!("  {} {} {}", "ID:".cyan(), task.id.to_string().bold(), status_colored);
            println!("    {} {}", "Title:".dimmed(), task.title);
            println!("    {} {:?}", "Type:".dimmed(), task.task_type);
            if let Some(ctx) = task.context_id {
                println!("    {} {}", "Context:".dimmed(), ctx);
            }
            println!();
        }

        Ok(())
    }

    /// Get a specific task
    async fn cmd_get(storage: &GitHubTaskStorage, id: u64) -> Result<()> {
        let task = storage
            .get_task(id)
            .await
            .map_err(|e| CliError::Execution(format!("Failed to get task: {}", e)))?
            .ok_or_else(|| CliError::NotFound(format!("Task #{} not found", id)))?;

        println!("{}", format!("📋 Task #{}", id).cyan().bold());
        println!();
        println!("  {} {}", "Title:".cyan(), task.title.bold());
        println!("  {} {:?}", "Status:".cyan(), task.status);
        println!("  {} {:?}", "Type:".cyan(), task.task_type);
        if let Some(agent) = task.agent {
            println!("  {} {}", "Agent:".cyan(), agent);
        }
        if let Some(ctx) = task.context_id {
            println!("  {} {}", "Context:".cyan(), ctx);
        }
        println!("  {} {}", "Priority:".cyan(), task.priority);
        println!("  {} {}", "Retries:".cyan(), task.retry_count);
        println!();
        println!("  {} {}", "Created:".dimmed(), task.created_at);
        println!("  {} {}", "Updated:".dimmed(), task.updated_at);
        println!();
        println!("  {} {}", "URL:".dimmed(), task.issue_url);

        if !task.description.is_empty() {
            println!();
            println!("  {}:", "Description".cyan());
            for line in task.description.lines() {
                println!("    {}", line);
            }
        }

        Ok(())
    }

    /// Update a task
    async fn cmd_update(
        storage: &GitHubTaskStorage,
        id: u64,
        status: Option<&str>,
        description: Option<&str>,
    ) -> Result<()> {
        let status_update = if let Some(s) = status {
            Some(Self::parse_task_status(s)?)
        } else {
            None
        };

        let update = TaskUpdate {
            status: status_update,
            description: description.map(|s| s.to_string()),
            agent: None,
            priority: None,
            retry_count: None,
        };

        storage
            .update_task(id, update)
            .await
            .map_err(|e| CliError::Execution(format!("Failed to update task: {}", e)))?;

        println!("{}", "✅ Task updated successfully!".green().bold());
        println!("  {} {}", "Task ID:".cyan(), id.to_string().yellow().bold());
        if let Some(s) = status {
            println!("  {} {}", "New status:".cyan(), s);
        }

        Ok(())
    }

    /// Delete (close) a task
    async fn cmd_delete(storage: &GitHubTaskStorage, id: u64) -> Result<()> {
        storage
            .delete_task(id)
            .await
            .map_err(|e| CliError::Execution(format!("Failed to delete task: {}", e)))?;

        println!("{}", "✅ Task deleted (closed) successfully!".green().bold());
        println!("  {} {}", "Task ID:".cyan(), id.to_string().yellow().bold());

        Ok(())
    }
}
