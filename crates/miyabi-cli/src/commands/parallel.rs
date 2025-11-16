//! Parallel command - Execute agents in parallel worktrees

use crate::{
    agents::AgentRegistry,
    config::ConfigLoader,
    error::{CliError, Result},
};
use colored::Colorize;
use miyabi_types::error::MiyabiError;
use miyabi_types::{AgentConfig, AgentType};
use miyabi_worktree::{PoolConfig, WorktreePool, WorktreeTask};
use serde_json::json;

pub struct ParallelCommand {
    pub issues: Vec<u64>,
    pub concurrency: usize,
}

impl ParallelCommand {
    pub fn new(issues: Vec<u64>, concurrency: usize) -> Self {
        Self {
            issues,
            concurrency,
        }
    }

    pub async fn execute(&self) -> Result<()> {
        println!(
            "{}",
            format!(
                "🚀 Starting parallel execution of {} issues with concurrency {}...",
                self.issues.len(),
                self.concurrency
            )
            .cyan()
            .bold()
        );
        println!();

        // Validate inputs
        if self.issues.is_empty() {
            return Err(CliError::InvalidInput("No issues provided".to_string()));
        }

        if self.concurrency == 0 {
            return Err(CliError::InvalidInput("Concurrency must be at least 1".to_string()));
        }

        // Load configuration
        let config = self.load_config()?;

        // Create worktree pool
        let pool_config = PoolConfig {
            max_concurrency: self.concurrency,
            timeout_seconds: 3600, // 1 hour per task
            fail_fast: false,
            auto_cleanup: true,
        };

        println!("  Pool Configuration:");
        println!("    Max concurrency: {}", pool_config.max_concurrency);
        println!("    Timeout: {}s per task", pool_config.timeout_seconds);
        println!("    Auto cleanup: {}", pool_config.auto_cleanup);
        println!();

        let pool =
            WorktreePool::new(pool_config, config.worktree_base_path.clone()).map_err(|e| {
                CliError::ExecutionError(format!("Failed to create worktree pool: {}", e))
            })?;

        let descriptor = AgentRegistry::global()
            .get(AgentType::CoordinatorAgent)
            .ok_or_else(|| CliError::AgentNotRegistered("CoordinatorAgent".to_string()))?;

        // Create tasks for each issue
        let tasks: Vec<WorktreeTask> = self
            .issues
            .iter()
            .map(|&issue_number| WorktreeTask {
                issue_number,
                description: format!("Process Issue #{}", issue_number),
                agent_type: Some("CoordinatorAgent".to_string()),
                metadata: None,
            })
            .collect();

        println!("  Tasks:");
        for task in &tasks {
            println!(
                "    {} Issue #{}: {}",
                "•".dimmed(),
                task.issue_number,
                task.description.dimmed()
            );
        }
        println!();

        // Execute in parallel
        println!("{}", "  Executing in parallel...".dimmed());
        println!();

        let start_time = std::time::Instant::now();

        let result = pool
            .execute_parallel(tasks, move |worktree_info, task| {
                let config = config.clone();
                let descriptor = descriptor;

                async move {
                    println!(
                        "    {} [Issue #{}] Starting in worktree {:?}",
                        "▶".green(),
                        task.issue_number,
                        worktree_info.path.file_name().unwrap_or_default()
                    );

                    let agent = descriptor.instantiate(&config);
                    let agent_task = descriptor
                        .build_issue_task(task.issue_number, None, true)
                        .ok_or_else(|| {
                            MiyabiError::Unknown(
                                "CoordinatorAgent missing default task template".to_string(),
                            )
                        })?;

                    let agent_result = agent
                        .execute(&agent_task)
                        .await
                        .map_err(|e| MiyabiError::Unknown(e.to_string()))?;

                    println!(
                        "    {} [Issue #{}] Completed with status: {:?}",
                        "✓".green().bold(),
                        task.issue_number,
                        agent_result.status
                    );

                    // Return result data
                    Ok(agent_result.data.unwrap_or_else(|| {
                        json!({
                            "status": "completed",
                            "issue": task.issue_number
                        })
                    }))
                }
            })
            .await;

        let elapsed = start_time.elapsed();

        println!();
        println!("{}", "═".repeat(80).dimmed());
        println!();
        println!("{}", "📊 Execution Results".cyan().bold());
        println!();
        println!("  Summary:");
        println!("    Total tasks: {}", result.total_tasks);
        println!("    {} Successful: {}", "✓".green().bold(), result.success_count);
        if result.failed_count > 0 {
            println!("    {} Failed: {}", "✗".red().bold(), result.failed_count);
        }
        if result.timeout_count > 0 {
            println!("    {} Timeout: {}", "⏱".yellow().bold(), result.timeout_count);
        }
        println!();

        println!("  Performance:");
        println!("    Wall time: {:.2}s", elapsed.as_secs_f64());
        println!("    Total duration: {:.2}s", result.total_duration_ms as f64 / 1000.0);
        println!("    Success rate: {:.1}%", result.success_rate());
        println!("    Average task duration: {:.2}s", result.average_duration_ms() / 1000.0);

        // Calculate speedup
        let sequential_time = result.average_duration_ms() * result.total_tasks as f64;
        let parallel_time = result.total_duration_ms as f64;
        let speedup = sequential_time / parallel_time;

        println!("    Estimated speedup: {:.2}x", speedup);
        println!();

        // Show individual results
        if result.results.len() <= 10 {
            println!("  Individual Results:");
            for task_result in &result.results {
                let status_icon = match task_result.status {
                    miyabi_worktree::TaskStatus::Success => "✓".green(),
                    miyabi_worktree::TaskStatus::Failed => "✗".red(),
                    miyabi_worktree::TaskStatus::Timeout => "⏱".yellow(),
                    miyabi_worktree::TaskStatus::Cancelled => "⊗".dimmed(),
                };

                println!(
                    "    {} Issue #{}: {} ({:.2}s)",
                    status_icon,
                    task_result.issue_number,
                    match task_result.status {
                        miyabi_worktree::TaskStatus::Success => "Success",
                        miyabi_worktree::TaskStatus::Failed => "Failed",
                        miyabi_worktree::TaskStatus::Timeout => "Timeout",
                        miyabi_worktree::TaskStatus::Cancelled => "Cancelled",
                    },
                    task_result.duration_ms as f64 / 1000.0
                );

                if let Some(error) = &task_result.error {
                    println!("      Error: {}", error.red());
                }
            }
            println!();
        }

        println!("{}", "═".repeat(80).dimmed());
        println!();

        // Exit with appropriate status
        if result.all_successful() {
            println!("{}", "✅ All tasks completed successfully!".green().bold());
            Ok(())
        } else {
            println!(
                "{}",
                format!(
                    "⚠️  {} of {} tasks failed",
                    result.failed_count + result.timeout_count,
                    result.total_tasks
                )
                .yellow()
                .bold()
            );
            Err(CliError::ExecutionError(format!(
                "{} tasks failed",
                result.failed_count + result.timeout_count
            )))
        }
    }

    fn load_config(&self) -> Result<AgentConfig> {
        ConfigLoader::global().load()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parallel_command_creation() {
        let cmd = ParallelCommand::new(vec![1, 2, 3], 2);
        assert_eq!(cmd.issues, vec![1, 2, 3]);
        assert_eq!(cmd.concurrency, 2);
    }

    #[test]
    fn test_parallel_command_validation() {
        let cmd = ParallelCommand::new(vec![], 2);
        // Empty issues should fail validation in execute()
        assert_eq!(cmd.issues.len(), 0);

        let cmd = ParallelCommand::new(vec![1, 2], 0);
        // Zero concurrency should fail validation in execute()
        assert_eq!(cmd.concurrency, 0);
    }
}
