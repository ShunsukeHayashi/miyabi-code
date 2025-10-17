//! Parallel command - Execute agents in parallel worktrees

use crate::error::{CliError, Result};
use colored::Colorize;
use miyabi_agents::base::BaseAgent;
use miyabi_agents::CoordinatorAgentWithLLM;
use miyabi_types::{AgentConfig, AgentType, Task};
use miyabi_worktree::{PoolConfig, WorktreePool, WorktreeTask};
use std::collections::HashMap;

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
            return Err(CliError::InvalidInput(
                "Concurrency must be at least 1".to_string(),
            ));
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

        let pool = WorktreePool::new(pool_config)
            .map_err(|e| CliError::ExecutionError(format!("Failed to create worktree pool: {}", e)))?;

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

                async move {
                    println!(
                        "    {} [Issue #{}] Starting in worktree {:?}",
                        "▶".green(),
                        task.issue_number,
                        worktree_info.path.file_name().unwrap_or_default()
                    );

                    // Create CoordinatorAgent with LLM
                    let agent = CoordinatorAgentWithLLM::new(config);

                    // Create coordinator task
                    let agent_task = Task {
                        id: format!("coordinator-issue-{}", task.issue_number),
                        title: format!("Coordinate Issue #{}", task.issue_number),
                        description: format!(
                            "Decompose Issue #{} into executable tasks",
                            task.issue_number
                        ),
                        task_type: miyabi_types::task::TaskType::Feature,
                        priority: 1,
                        severity: None,
                        impact: None,
                        assigned_agent: Some(AgentType::CoordinatorAgent),
                        dependencies: vec![],
                        estimated_duration: Some(5),
                        status: None,
                        start_time: None,
                        end_time: None,
                        metadata: Some(HashMap::from([(
                            "issue_number".to_string(),
                            serde_json::json!(task.issue_number),
                        )])),
                    };

                    // Execute agent
                    let agent_result = agent
                        .execute(&agent_task)
                        .await
                        .map_err(|e| miyabi_types::error::MiyabiError::Unknown(e.to_string()))?;

                    println!(
                        "    {} [Issue #{}] Completed with status: {:?}",
                        "✓".green().bold(),
                        task.issue_number,
                        agent_result.status
                    );

                    // Return result data
                    Ok(agent_result.data.unwrap_or_else(|| {
                        serde_json::json!({
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
        println!(
            "    {} Successful: {}",
            "✓".green().bold(),
            result.success_count
        );
        if result.failed_count > 0 {
            println!(
                "    {} Failed: {}",
                "✗".red().bold(),
                result.failed_count
            );
        }
        if result.timeout_count > 0 {
            println!(
                "    {} Timeout: {}",
                "⏱".yellow().bold(),
                result.timeout_count
            );
        }
        println!();

        println!("  Performance:");
        println!("    Wall time: {:.2}s", elapsed.as_secs_f64());
        println!("    Total duration: {:.2}s", result.total_duration_ms as f64 / 1000.0);
        println!(
            "    Success rate: {:.1}%",
            result.success_rate()
        );
        println!(
            "    Average task duration: {:.2}s",
            result.average_duration_ms() / 1000.0
        );

        // Calculate speedup
        let sequential_time = result.average_duration_ms() * result.total_tasks as f64;
        let parallel_time = result.total_duration_ms as f64;
        let speedup = sequential_time / parallel_time;

        println!(
            "    Estimated speedup: {:.2}x",
            speedup
        );
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
        // Get GitHub token
        let github_token = self.get_github_token()?;

        // Get device identifier
        let device_identifier = std::env::var("DEVICE_IDENTIFIER")
            .unwrap_or_else(|_| hostname::get().unwrap().to_string_lossy().to_string());

        // Parse repository owner and name from git remote
        let (repo_owner, repo_name) = self.parse_git_remote()?;

        Ok(AgentConfig {
            device_identifier,
            github_token,
            repo_owner: Some(repo_owner),
            repo_name: Some(repo_name),
            use_task_tool: false,
            use_worktree: true,
            worktree_base_path: Some(".worktrees".to_string()),
            log_directory: "./logs".to_string(),
            report_directory: "./reports".to_string(),
            tech_lead_github_username: None,
            ciso_github_username: None,
            po_github_username: None,
            firebase_production_project: None,
            firebase_staging_project: None,
            production_url: None,
            staging_url: None,
        })
    }

    fn get_github_token(&self) -> Result<String> {
        // Try environment variable first
        if let Ok(token) = std::env::var("GITHUB_TOKEN") {
            if !token.trim().is_empty() {
                return Ok(token.trim().to_string());
            }
        }

        // Try gh CLI
        if let Ok(output) = std::process::Command::new("gh")
            .args(["auth", "token"])
            .output()
        {
            if output.status.success() {
                let token = String::from_utf8_lossy(&output.stdout).trim().to_string();
                if !token.is_empty()
                    && (token.starts_with("ghp_")
                        || token.starts_with("gho_")
                        || token.starts_with("ghu_")
                        || token.starts_with("ghs_")
                        || token.starts_with("ghr_"))
                {
                    return Ok(token);
                }
            }
        }

        Err(CliError::GitConfig(
            "GitHub token not found. Set GITHUB_TOKEN or run 'gh auth login'".to_string(),
        ))
    }

    fn parse_git_remote(&self) -> Result<(String, String)> {
        let output = std::process::Command::new("git")
            .args(["remote", "get-url", "origin"])
            .output()
            .map_err(|e| CliError::GitConfig(format!("Failed to run git command: {}", e)))?;

        if !output.status.success() {
            return Err(CliError::GitConfig(
                "Failed to get git remote URL".to_string(),
            ));
        }

        let remote_url = String::from_utf8_lossy(&output.stdout).trim().to_string();

        // Parse HTTPS format
        if remote_url.starts_with("http") && remote_url.contains("github.com/") {
            let parts: Vec<&str> = remote_url
                .split("github.com/")
                .nth(1)
                .ok_or_else(|| CliError::GitConfig("Invalid GitHub URL".to_string()))?
                .trim_end_matches(".git")
                .split('/')
                .collect();

            if parts.len() >= 2 {
                return Ok((parts[0].to_string(), parts[1].to_string()));
            }
        }

        // Parse SSH format
        if remote_url.starts_with("git@github.com:") {
            let repo_part = remote_url
                .strip_prefix("git@github.com:")
                .ok_or_else(|| CliError::GitConfig("Invalid SSH URL".to_string()))?
                .trim_end_matches(".git");

            let parts: Vec<&str> = repo_part.split('/').collect();
            if parts.len() >= 2 {
                return Ok((parts[0].to_string(), parts[1].to_string()));
            }
        }

        Err(CliError::GitConfig(format!(
            "Could not parse GitHub owner/repo from: {}",
            remote_url
        )))
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
