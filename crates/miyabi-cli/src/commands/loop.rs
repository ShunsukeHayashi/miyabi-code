//! Infinite Loop Command - Feedback loop orchestration

use crate::error::{CliError, Result};
use clap::Subcommand;
use colored::Colorize;
use miyabi_orchestrator::feedback::{InfiniteLoopOrchestrator, LoopConfig, LoopStatus};

/// Loop command for infinite feedback loop orchestration
#[derive(Debug, Subcommand)]
pub enum LoopCommand {
    /// Start infinite feedback loop for issues
    Start {
        /// Issue numbers to process (comma-separated)
        #[arg(long, value_delimiter = ',')]
        issues: Vec<u64>,

        /// Maximum iterations (None = infinite)
        #[arg(long)]
        max_iterations: Option<usize>,

        /// Convergence threshold (variance % for last N iterations)
        #[arg(long, default_value = "5.0")]
        convergence_threshold: f64,

        /// Minimum iterations before checking convergence
        #[arg(long, default_value = "3")]
        min_iterations_before_convergence: usize,

        /// Enable automatic goal refinement
        #[arg(long)]
        auto_refinement: bool,

        /// Timeout per iteration in milliseconds
        #[arg(long, default_value = "300000")]
        timeout_ms: u64,

        /// Maximum retry attempts on failure
        #[arg(long, default_value = "3")]
        max_retries: usize,

        /// Delay between iterations in milliseconds
        #[arg(long, default_value = "1000")]
        iteration_delay_ms: u64,
    },

    /// Get status of active loops
    Status {
        /// Goal ID to check status
        goal_id: Option<String>,
    },

    /// Cancel a running loop
    Cancel {
        /// Goal ID to cancel
        goal_id: String,
    },
}

impl LoopCommand {
    /// Execute loop command
    pub async fn execute(&self) -> Result<()> {
        match self {
            LoopCommand::Start {
                issues,
                max_iterations,
                convergence_threshold,
                min_iterations_before_convergence,
                auto_refinement,
                timeout_ms,
                max_retries,
                iteration_delay_ms,
            } => {
                let config = LoopConfig {
                    max_iterations: *max_iterations,
                    convergence_threshold: *convergence_threshold,
                    min_iterations_before_convergence: *min_iterations_before_convergence,
                    auto_refinement_enabled: *auto_refinement,
                    timeout_ms: *timeout_ms,
                    max_retries: *max_retries,
                    iteration_delay_ms: *iteration_delay_ms,
                };
                Self::execute_start(issues, config).await
            },
            LoopCommand::Status { goal_id } => Self::execute_status(goal_id.as_deref()).await,
            LoopCommand::Cancel { goal_id } => Self::execute_cancel(goal_id).await,
        }
    }

    async fn execute_start(issues: &[u64], config: LoopConfig) -> Result<()> {
        if issues.is_empty() {
            return Err(CliError::InvalidInput(
                "No issues specified. Use --issues=N,M,... to specify issues".to_string(),
            ));
        }

        println!(
            "{}",
            format!("🔄 Starting feedback loop for {} issue(s)...", issues.len()).cyan()
        );

        config
            .validate()
            .map_err(|e| CliError::InvalidInput(format!("Invalid loop configuration: {}", e)))?;

        let mut orchestrator = InfiniteLoopOrchestrator::new(config);

        for &issue_num in issues {
            let goal_id = format!("issue-{}", issue_num);

            println!(
                "{}",
                format!("  📋 Processing Issue #{}: {}", issue_num, goal_id).bright_blue()
            );

            match orchestrator.start_loop(&goal_id).await {
                Ok(feedback_loop) => {
                    let status_icon = match feedback_loop.status {
                        LoopStatus::Completed => "✅",
                        LoopStatus::MaxIterationsReached => "⏰",
                        LoopStatus::Failed => "❌",
                        LoopStatus::Cancelled => "🚫",
                        _ => "❓",
                    };

                    println!(
                        "{}",
                        format!(
                            "  {} Issue #{}: {} iterations, {:.2}s, status: {:?}",
                            status_icon,
                            issue_num,
                            feedback_loop.iterations,
                            feedback_loop.total_duration_ms as f64 / 1000.0,
                            feedback_loop.status
                        )
                        .green()
                    );

                    if !feedback_loop.convergence_metrics.is_empty() {
                        let final_score =
                            feedback_loop.convergence_metrics.last().copied().unwrap_or(0.0);
                        println!(
                            "{}",
                            format!("    Final quality score: {:.1}/100", final_score)
                                .bright_cyan()
                        );
                    }
                },
                Err(e) => {
                    println!("{}", format!("  ❌ Issue #{}: Failed - {}", issue_num, e).red());
                },
            }
        }

        println!("{}", "✨ Feedback loop execution completed".green());
        Ok(())
    }

    async fn execute_status(goal_id: Option<&str>) -> Result<()> {
        match goal_id {
            Some(id) => {
                println!("{}", format!("📊 Status for goal: {}", id).bright_cyan());
                // Note: Status retrieval requires orchestrator instance
                // For now, print placeholder message
                println!("{}", "⚠️  Status retrieval not yet implemented".yellow());
                println!(
                    "{}",
                    "💡 Tip: Use 'miyabi loop start --issues N' to start a new loop".bright_blue()
                );
            },
            None => {
                println!("{}", "📊 Active feedback loops:".bright_cyan());
                println!("{}", "⚠️  Status listing not yet implemented".yellow());
                println!(
                    "{}",
                    "💡 Tip: Specify a goal ID to check specific loop status".bright_blue()
                );
            },
        }
        Ok(())
    }

    async fn execute_cancel(goal_id: &str) -> Result<()> {
        println!("{}", format!("🚫 Cancelling loop for goal: {}", goal_id).yellow());
        // Note: Cancellation requires orchestrator instance
        // For now, print placeholder message
        println!("{}", "⚠️  Loop cancellation not yet implemented".yellow());
        println!(
            "{}",
            "💡 Tip: Use 'miyabi loop start --issues N' to start a new loop".bright_blue()
        );
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_loop_command_variants() {
        // Test Start variant
        let start_cmd = LoopCommand::Start {
            issues: vec![270, 271],
            max_iterations: Some(10),
            convergence_threshold: 5.0,
            min_iterations_before_convergence: 3,
            auto_refinement: true,
            timeout_ms: 300_000,
            max_retries: 3,
            iteration_delay_ms: 1000,
        };
        assert!(matches!(start_cmd, LoopCommand::Start { .. }));

        // Test Status variant
        let status_cmd = LoopCommand::Status {
            goal_id: Some("issue-270".to_string()),
        };
        assert!(matches!(status_cmd, LoopCommand::Status { .. }));

        // Test Cancel variant
        let cancel_cmd = LoopCommand::Cancel {
            goal_id: "issue-270".to_string(),
        };
        assert!(matches!(cancel_cmd, LoopCommand::Cancel { .. }));
    }

    #[tokio::test]
    async fn test_execute_start_no_issues() {
        let config = LoopConfig {
            max_iterations: Some(10),
            convergence_threshold: 5.0,
            min_iterations_before_convergence: 3,
            auto_refinement_enabled: true,
            timeout_ms: 300_000,
            max_retries: 3,
            iteration_delay_ms: 1000,
        };
        let result = LoopCommand::execute_start(&[], config).await;
        assert!(result.is_err());
        assert!(matches!(result.unwrap_err(), CliError::InvalidInput(_)));
    }
}
