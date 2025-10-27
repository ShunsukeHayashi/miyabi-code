//! Claude Code Executor - High-level interface for headless Claude Code execution
//!
//! This module provides a unified interface for executing Claude Code in headless mode
//! with the 5-Worlds Quality Assurance Strategy for parallel execution and result aggregation.
//!
//! # Architecture
//!
//! ```text
//! HeadlessOrchestrator (Phase 1-3)
//!   ↓
//! ClaudeCodeExecutor (Phase 4) ← YOU ARE HERE
//!   ↓
//! FiveWorldsExecutor + SessionManager
//!   ↓
//! 5x Parallel Worktrees
//! ```
//!
//! # Example
//!
//! ```no_run
//! use miyabi_orchestrator::claude_code_executor::{ClaudeCodeExecutor, ExecutorConfig};
//! use std::path::PathBuf;
//!
//! # #[tokio::main]
//! # async fn main() -> Result<(), Box<dyn std::error::Error>> {
//! let executor = ClaudeCodeExecutor::new(ExecutorConfig::default());
//!
//! // Execute agent run with 5-Worlds parallel execution
//! let result = executor.execute_agent_run(
//!     270, // Issue number
//!     PathBuf::from(".worktrees/issue-270"),
//! ).await?;
//!
//! println!("Success: {}", result.success);
//! println!("Confidence: {}%", result.confidence * 100.0);
//! # Ok(())
//! # }
//! ```

use crate::error::{Result, SchedulerError};
use crate::five_worlds_executor::{FiveWorldsExecutor, FiveWorldsExecutorConfig};
use crate::session::{SessionConfig, SessionManager, SessionStatus};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tracing::{debug, info, warn};

/// Executor configuration
#[derive(Debug, Clone)]
pub struct ExecutorConfig {
    /// Timeout for each task (seconds)
    pub timeout_secs: u64,
    /// Number of parallel worlds (default: 5)
    pub num_worlds: usize,
    /// Success threshold (0.0 - 1.0)
    pub success_threshold: f64,
    /// Base directory for logs
    pub log_dir: PathBuf,
}

impl Default for ExecutorConfig {
    fn default() -> Self {
        Self {
            timeout_secs: 600, // 10 minutes per task
            num_worlds: 5,
            success_threshold: 0.8, // 80% success required
            log_dir: PathBuf::from(".ai/logs/executor"),
        }
    }
}

/// Execution result with confidence scoring
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecutionResult {
    /// Overall success flag
    pub success: bool,
    /// Confidence score (0.0 - 1.0)
    pub confidence: f64,
    /// Number of successful worlds
    pub successful_worlds: usize,
    /// Total number of worlds
    pub total_worlds: usize,
    /// Aggregated message
    pub message: String,
    /// Individual world results
    pub world_results: Vec<WorldResult>,
}

/// Result from a single world
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorldResult {
    /// World ID (0-4)
    pub world_id: usize,
    /// Success flag
    pub success: bool,
    /// Message from the world
    pub message: String,
    /// Session ID
    pub session_id: String,
}

/// Claude Code Executor
///
/// Executes `claude code --headless` commands with 5-Worlds parallel execution.
pub struct ClaudeCodeExecutor {
    config: ExecutorConfig,
    session_manager: SessionManager,
    #[allow(dead_code)]
    five_worlds: FiveWorldsExecutor,
}

impl ClaudeCodeExecutor {
    /// Create a new executor
    pub fn new(config: ExecutorConfig) -> Self {
        let session_config = SessionConfig {
            timeout_secs: config.timeout_secs,
            log_dir: config.log_dir.join("sessions"),
        };

        let five_worlds_config = FiveWorldsExecutorConfig {
            worktrees_base: config.log_dir.join("worktrees"),
            repo_path: std::env::current_dir().unwrap_or_else(|_| PathBuf::from(".")),
            world_timeout: std::time::Duration::from_secs(config.timeout_secs),
            parallel_execution: true,
            enable_circuit_breaker: true,
            enable_dynamic_scaling: true,
            fallback_strategy: miyabi_core::error_policy::FallbackStrategy::default(),
        };

        Self {
            config,
            session_manager: SessionManager::new(session_config),
            five_worlds: FiveWorldsExecutor::new(five_worlds_config),
        }
    }

    /// Execute agent run command with 5-Worlds parallel execution
    ///
    /// # Arguments
    ///
    /// * `issue_number` - GitHub Issue number
    /// * `base_worktree_path` - Base worktree path (e.g., `.worktrees/issue-270`)
    ///
    /// # Returns
    ///
    /// Returns `ExecutionResult` with aggregated results from all worlds
    ///
    /// # Behavior
    ///
    /// 1. Creates 5 parallel worktrees (issue-270-w0 to issue-270-w4)
    /// 2. Spawns `claude code --headless --execute-command "/agent-run --issue 270"` in each
    /// 3. Monitors execution with timeout
    /// 4. Aggregates results using 5-Worlds voting strategy
    /// 5. Returns success if ≥80% worlds succeed
    pub async fn execute_agent_run(
        &mut self,
        issue_number: u32,
        base_worktree_path: PathBuf,
    ) -> Result<ExecutionResult> {
        info!(
            "Starting 5-Worlds execution for Issue #{}",
            issue_number
        );

        let command = format!("/agent-run --issue {}", issue_number);
        let mut world_results = Vec::new();
        let mut session_ids = Vec::new();

        // Phase 1: Spawn all worlds in parallel
        for world_id in 0..self.config.num_worlds {
            let worktree_path = PathBuf::from(format!("{}-w{}", base_worktree_path.display(), world_id));

            debug!(
                "Spawning World {} at {}",
                world_id,
                worktree_path.display()
            );

            // Ensure worktree exists (should be created by Phase 3)
            if !worktree_path.exists() {
                return Err(SchedulerError::InvalidConfig(format!(
                    "Worktree not found: {}. Run Phase 3 first.",
                    worktree_path.display()
                )));
            }

            // Spawn session
            let session_id = self
                .session_manager
                .spawn_headless(command.clone(), worktree_path.clone())
                .await?;

            session_ids.push((world_id, session_id));
        }

        info!("All {} worlds spawned, waiting for completion...", self.config.num_worlds);

        // Phase 2: Wait for all worlds to complete
        for (world_id, session_id) in &session_ids {
            debug!("Waiting for World {} (session: {})", world_id, session_id);

            let status = self
                .session_manager
                .wait_for_completion(session_id)
                .await;

            let (success, message) = match status {
                Ok(SessionStatus::Completed) => {
                    // Collect result
                    match self.session_manager.collect_result(session_id).await {
                        Ok(result) => (result.success, result.message),
                        Err(e) => {
                            warn!("Failed to collect result from World {}: {}", world_id, e);
                            (false, format!("Failed to collect result: {}", e))
                        }
                    }
                }
                Ok(SessionStatus::Failed) => {
                    (false, format!("World {} execution failed", world_id))
                }
                Ok(SessionStatus::TimedOut) => {
                    (false, format!("World {} timed out after {} seconds", world_id, self.config.timeout_secs))
                }
                Err(e) => {
                    warn!("Error waiting for World {}: {}", world_id, e);
                    (false, format!("Error: {}", e))
                }
                Ok(status) => {
                    warn!("Unexpected status for World {}: {:?}", world_id, status);
                    (false, format!("Unexpected status: {:?}", status))
                }
            };

            world_results.push(WorldResult {
                world_id: *world_id,
                success,
                message,
                session_id: session_id.clone(),
            });
        }

        // Phase 3: Aggregate results
        let successful_worlds = world_results.iter().filter(|r| r.success).count();
        let confidence = successful_worlds as f64 / self.config.num_worlds as f64;
        let overall_success = confidence >= self.config.success_threshold;

        let message = if overall_success {
            format!(
                "5-Worlds execution succeeded: {}/{} worlds completed successfully ({}% confidence)",
                successful_worlds,
                self.config.num_worlds,
                (confidence * 100.0).round()
            )
        } else {
            format!(
                "5-Worlds execution failed: Only {}/{} worlds succeeded ({}% confidence, required: {}%)",
                successful_worlds,
                self.config.num_worlds,
                (confidence * 100.0).round(),
                (self.config.success_threshold * 100.0).round()
            )
        };

        info!("{}", message);

        // Cleanup sessions
        self.session_manager.cleanup().await;

        Ok(ExecutionResult {
            success: overall_success,
            confidence,
            successful_worlds,
            total_worlds: self.config.num_worlds,
            message,
            world_results,
        })
    }

    /// Get execution statistics
    pub async fn get_stats(&self) -> std::collections::HashMap<SessionStatus, usize> {
        self.session_manager.get_stats().await
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[tokio::test]
    async fn test_executor_creation() {
        let config = ExecutorConfig::default();
        let _executor = ClaudeCodeExecutor::new(config);
    }

    #[tokio::test]
    async fn test_executor_config_defaults() {
        let config = ExecutorConfig::default();
        assert_eq!(config.timeout_secs, 600);
        assert_eq!(config.num_worlds, 5);
        assert_eq!(config.success_threshold, 0.8);
    }

    #[tokio::test]
    async fn test_execution_result_confidence() {
        let result = ExecutionResult {
            success: true,
            confidence: 0.8,
            successful_worlds: 4,
            total_worlds: 5,
            message: "Test".to_string(),
            world_results: vec![],
        };

        assert!(result.success);
        assert_eq!(result.confidence, 0.8);
        assert_eq!(result.successful_worlds, 4);
    }

    #[tokio::test]
    #[ignore] // Requires actual worktrees and Claude Code CLI
    async fn test_execute_agent_run_missing_worktree() {
        let temp_dir = tempdir().unwrap();
        let config = ExecutorConfig {
            timeout_secs: 30,
            num_worlds: 5,
            success_threshold: 0.8,
            log_dir: temp_dir.path().to_path_buf(),
        };

        let mut executor = ClaudeCodeExecutor::new(config);

        let result = executor
            .execute_agent_run(999, PathBuf::from("/nonexistent/worktree"))
            .await;

        assert!(result.is_err());
        match result {
            Err(SchedulerError::InvalidConfig(msg)) => {
                assert!(msg.contains("Worktree not found"));
            }
            _ => panic!("Expected InvalidConfig error"),
        }
    }
}
