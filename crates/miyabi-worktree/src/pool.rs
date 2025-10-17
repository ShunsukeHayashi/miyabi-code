//! Worktree execution pool for parallel task processing
//!
//! Provides high-level abstractions for executing multiple tasks in parallel worktrees

use crate::manager::{WorktreeInfo, WorktreeManager, WorktreeStatus};
use miyabi_types::error::Result;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::Mutex;
use tracing::{error, info, warn};

/// Configuration for worktree pool execution
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PoolConfig {
    /// Maximum number of concurrent worktrees
    pub max_concurrency: usize,
    /// Timeout for individual task execution (seconds)
    pub timeout_seconds: u64,
    /// Whether to fail fast on first error
    pub fail_fast: bool,
    /// Whether to cleanup worktrees after execution
    pub auto_cleanup: bool,
}

impl Default for PoolConfig {
    fn default() -> Self {
        Self {
            max_concurrency: 3,
            timeout_seconds: 1800, // 30 minutes
            fail_fast: false,
            auto_cleanup: true,
        }
    }
}

/// Task to be executed in a worktree
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorktreeTask {
    /// Issue number for the task
    pub issue_number: u64,
    /// Task description
    pub description: String,
    /// Optional agent type to execute
    pub agent_type: Option<String>,
    /// Additional metadata
    pub metadata: Option<serde_json::Value>,
}

/// Result of a worktree task execution
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskResult {
    /// Issue number
    pub issue_number: u64,
    /// Worktree ID
    pub worktree_id: String,
    /// Execution status
    pub status: TaskStatus,
    /// Execution duration in milliseconds
    pub duration_ms: u64,
    /// Error message if failed
    pub error: Option<String>,
    /// Output data
    pub output: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum TaskStatus {
    Success,
    Failed,
    Timeout,
    Cancelled,
}

/// Worktree execution pool
pub struct WorktreePool {
    manager: Arc<WorktreeManager>,
    config: PoolConfig,
    active_tasks: Arc<Mutex<HashMap<String, WorktreeTask>>>,
}

impl WorktreePool {
    /// Create a new worktree pool with automatic repository discovery
    ///
    /// # Arguments
    /// * `config` - Pool configuration
    ///
    /// # Examples
    ///
    /// ```no_run
    /// use miyabi_worktree::{WorktreePool, PoolConfig};
    ///
    /// # async fn example() -> miyabi_types::error::Result<()> {
    /// let config = PoolConfig::default();
    /// let pool = WorktreePool::new(config)?;
    /// # Ok(())
    /// # }
    /// ```
    pub fn new(config: PoolConfig) -> Result<Self> {
        let manager = Arc::new(WorktreeManager::new_with_discovery(
            Some(".worktrees"),
            config.max_concurrency,
        )?);

        Ok(Self {
            manager,
            config,
            active_tasks: Arc::new(Mutex::new(HashMap::new())),
        })
    }

    /// Create a worktree pool with explicit repository path
    pub fn new_with_path(
        repo_path: impl AsRef<std::path::Path>,
        worktree_base: impl AsRef<std::path::Path>,
        config: PoolConfig,
    ) -> Result<Self> {
        let manager = Arc::new(WorktreeManager::new(
            repo_path,
            worktree_base,
            config.max_concurrency,
        )?);

        Ok(Self {
            manager,
            config,
            active_tasks: Arc::new(Mutex::new(HashMap::new())),
        })
    }

    /// Execute multiple tasks in parallel worktrees
    ///
    /// # Arguments
    /// * `tasks` - Vector of tasks to execute
    /// * `executor` - Async function to execute in each worktree
    ///
    /// # Returns
    /// Pool execution result with individual task results
    pub async fn execute_parallel<F, Fut>(
        &self,
        tasks: Vec<WorktreeTask>,
        executor: F,
    ) -> PoolExecutionResult
    where
        F: Fn(WorktreeInfo, WorktreeTask) -> Fut + Send + Sync + Clone + 'static,
        Fut: std::future::Future<Output = Result<serde_json::Value>> + Send + 'static,
    {
        let start_time = std::time::Instant::now();
        let task_count = tasks.len();

        info!(
            "Starting parallel execution of {} tasks with max concurrency: {}",
            task_count, self.config.max_concurrency
        );

        // Use futures::stream with buffer_unordered to respect concurrency limit
        use futures::stream::{self, StreamExt};

        let manager = self.manager.clone();
        let active_tasks = self.active_tasks.clone();
        let timeout_seconds = self.config.timeout_seconds;
        let max_concurrency = self.config.max_concurrency;

        let results: Vec<TaskResult> = stream::iter(tasks)
            .map(|task| {
                let manager = manager.clone();
                let active_tasks = active_tasks.clone();
                let executor = executor.clone();

                async move {
                let task_start = std::time::Instant::now();

                // Create worktree (semaphore is acquired inside)
                let worktree_info = match manager.create_worktree(task.issue_number).await {
                    Ok(info) => {
                        // Track active task
                        {
                            let mut tasks = active_tasks.lock().await;
                            tasks.insert(info.id.clone(), task.clone());
                        }
                        info
                    }
                    Err(e) => {
                        error!(
                            "Failed to create worktree for issue #{}: {}",
                            task.issue_number, e
                        );
                        return TaskResult {
                            issue_number: task.issue_number,
                            worktree_id: String::new(),
                            status: TaskStatus::Failed,
                            duration_ms: task_start.elapsed().as_millis() as u64,
                            error: Some(e.to_string()),
                            output: None,
                        };
                    }
                };

                // Execute task with timeout
                let execution_result = tokio::time::timeout(
                    std::time::Duration::from_secs(timeout_seconds),
                    executor(worktree_info.clone(), task.clone()),
                )
                .await;

                // Process result
                let task_result = match execution_result {
                    Ok(Ok(output)) => {
                        info!(
                            "Task for issue #{} completed successfully",
                            task.issue_number
                        );
                        // Update worktree status
                        let _ = manager
                            .update_status(&worktree_info.id, WorktreeStatus::Completed)
                            .await;
                        TaskResult {
                            issue_number: task.issue_number,
                            worktree_id: worktree_info.id.clone(),
                            status: TaskStatus::Success,
                            duration_ms: task_start.elapsed().as_millis() as u64,
                            error: None,
                            output: Some(output),
                        }
                    }
                    Ok(Err(e)) => {
                        error!("Task for issue #{} failed: {}", task.issue_number, e);
                        let _ = manager
                            .update_status(&worktree_info.id, WorktreeStatus::Failed)
                            .await;
                        TaskResult {
                            issue_number: task.issue_number,
                            worktree_id: worktree_info.id.clone(),
                            status: TaskStatus::Failed,
                            duration_ms: task_start.elapsed().as_millis() as u64,
                            error: Some(e.to_string()),
                            output: None,
                        }
                    }
                    Err(_) => {
                        warn!(
                            "Task for issue #{} timed out after {} seconds",
                            task.issue_number, timeout_seconds
                        );
                        let _ = manager
                            .update_status(&worktree_info.id, WorktreeStatus::Failed)
                            .await;
                        TaskResult {
                            issue_number: task.issue_number,
                            worktree_id: worktree_info.id.clone(),
                            status: TaskStatus::Timeout,
                            duration_ms: task_start.elapsed().as_millis() as u64,
                            error: Some(format!("Timeout after {} seconds", timeout_seconds)),
                            output: None,
                        }
                    }
                };

                // Remove from active tasks
                {
                    let mut tasks = active_tasks.lock().await;
                    tasks.remove(&worktree_info.id);
                }

                task_result
                }
            })
            .buffer_unordered(max_concurrency)
            .collect()
            .await;

        let total_duration = start_time.elapsed().as_millis() as u64;

        // Calculate statistics
        let success_count = results
            .iter()
            .filter(|r| r.status == TaskStatus::Success)
            .count();
        let failed_count = results
            .iter()
            .filter(|r| r.status == TaskStatus::Failed)
            .count();
        let timeout_count = results
            .iter()
            .filter(|r| r.status == TaskStatus::Timeout)
            .count();

        info!(
            "Parallel execution completed: {} successful, {} failed, {} timed out, {}ms total",
            success_count, failed_count, timeout_count, total_duration
        );

        // Cleanup if configured
        if self.config.auto_cleanup {
            info!("Auto-cleanup enabled, removing worktrees");
            if let Err(e) = self.manager.cleanup_all().await {
                warn!("Cleanup failed: {}", e);
            }
        }

        PoolExecutionResult {
            total_tasks: task_count,
            results,
            total_duration_ms: total_duration,
            success_count,
            failed_count,
            timeout_count,
            cancelled_count: 0,
        }
    }

    /// Execute tasks with automatic worktree lifecycle management
    ///
    /// This is a simplified version that automatically creates, executes, and cleans up worktrees
    pub async fn execute_simple<F, Fut>(
        &self,
        issue_numbers: Vec<u64>,
        executor: F,
    ) -> PoolExecutionResult
    where
        F: Fn(PathBuf, u64) -> Fut + Send + Sync + Clone + 'static,
        Fut: std::future::Future<Output = Result<()>> + Send + 'static,
    {
        let tasks: Vec<WorktreeTask> = issue_numbers
            .into_iter()
            .map(|issue_number| WorktreeTask {
                issue_number,
                description: format!("Task for issue #{}", issue_number),
                agent_type: None,
                metadata: None,
            })
            .collect();

        self.execute_parallel(tasks, move |worktree_info, _task| {
            let executor = executor.clone();
            let worktree_path = worktree_info.path.clone();
            let issue_number = worktree_info.issue_number;

            async move {
                executor(worktree_path, issue_number).await?;
                Ok(serde_json::json!({"status": "completed"}))
            }
        })
        .await
    }

    /// Get current pool statistics
    pub async fn stats(&self) -> PoolStats {
        let worktree_stats = self.manager.stats().await;
        let active_tasks = self.active_tasks.lock().await;

        PoolStats {
            max_concurrency: self.config.max_concurrency,
            active_worktrees: worktree_stats.active,
            idle_worktrees: worktree_stats.idle,
            completed_worktrees: worktree_stats.completed,
            failed_worktrees: worktree_stats.failed,
            active_tasks: active_tasks.len(),
            available_slots: worktree_stats.available_slots,
        }
    }

    /// Get reference to underlying manager
    pub fn manager(&self) -> &Arc<WorktreeManager> {
        &self.manager
    }
}

/// Result of pool execution
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PoolExecutionResult {
    /// Total number of tasks
    pub total_tasks: usize,
    /// Individual task results
    pub results: Vec<TaskResult>,
    /// Total execution time in milliseconds
    pub total_duration_ms: u64,
    /// Number of successful tasks
    pub success_count: usize,
    /// Number of failed tasks
    pub failed_count: usize,
    /// Number of timed out tasks
    pub timeout_count: usize,
    /// Number of cancelled tasks
    pub cancelled_count: usize,
}

impl PoolExecutionResult {
    /// Check if all tasks were successful
    pub fn all_successful(&self) -> bool {
        self.success_count == self.total_tasks
    }

    /// Get success rate as percentage
    pub fn success_rate(&self) -> f64 {
        if self.total_tasks == 0 {
            0.0
        } else {
            (self.success_count as f64 / self.total_tasks as f64) * 100.0
        }
    }

    /// Get average task duration in milliseconds
    pub fn average_duration_ms(&self) -> f64 {
        if self.results.is_empty() {
            0.0
        } else {
            let total: u64 = self.results.iter().map(|r| r.duration_ms).sum();
            total as f64 / self.results.len() as f64
        }
    }
}

/// Pool statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PoolStats {
    /// Maximum concurrency setting
    pub max_concurrency: usize,
    /// Number of active worktrees
    pub active_worktrees: usize,
    /// Number of idle worktrees
    pub idle_worktrees: usize,
    /// Number of completed worktrees
    pub completed_worktrees: usize,
    /// Number of failed worktrees
    pub failed_worktrees: usize,
    /// Number of active tasks
    pub active_tasks: usize,
    /// Number of available slots
    pub available_slots: usize,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_pool_config_default() {
        let config = PoolConfig::default();
        assert_eq!(config.max_concurrency, 3);
        assert_eq!(config.timeout_seconds, 1800);
        assert!(!config.fail_fast);
        assert!(config.auto_cleanup);
    }

    #[test]
    fn test_worktree_task_creation() {
        let task = WorktreeTask {
            issue_number: 123,
            description: "Test task".to_string(),
            agent_type: Some("CodeGenAgent".to_string()),
            metadata: None,
        };

        assert_eq!(task.issue_number, 123);
        assert_eq!(task.description, "Test task");
        assert_eq!(task.agent_type, Some("CodeGenAgent".to_string()));
    }

    #[test]
    fn test_task_result_serialization() {
        let result = TaskResult {
            issue_number: 123,
            worktree_id: "test-id".to_string(),
            status: TaskStatus::Success,
            duration_ms: 5000,
            error: None,
            output: Some(serde_json::json!({"test": true})),
        };

        let json = serde_json::to_string(&result).unwrap();
        let deserialized: TaskResult = serde_json::from_str(&json).unwrap();

        assert_eq!(result.issue_number, deserialized.issue_number);
        assert_eq!(result.status, deserialized.status);
        assert_eq!(result.duration_ms, deserialized.duration_ms);
    }

    #[test]
    fn test_pool_execution_result_methods() {
        let result = PoolExecutionResult {
            total_tasks: 5,
            results: vec![
                TaskResult {
                    issue_number: 1,
                    worktree_id: "id1".to_string(),
                    status: TaskStatus::Success,
                    duration_ms: 1000,
                    error: None,
                    output: None,
                },
                TaskResult {
                    issue_number: 2,
                    worktree_id: "id2".to_string(),
                    status: TaskStatus::Success,
                    duration_ms: 2000,
                    error: None,
                    output: None,
                },
                TaskResult {
                    issue_number: 3,
                    worktree_id: "id3".to_string(),
                    status: TaskStatus::Failed,
                    duration_ms: 3000,
                    error: Some("Error".to_string()),
                    output: None,
                },
            ],
            total_duration_ms: 10000,
            success_count: 2,
            failed_count: 1,
            timeout_count: 0,
            cancelled_count: 2,
        };

        assert!(!result.all_successful());
        assert_eq!(result.success_rate(), 40.0);
        assert_eq!(result.average_duration_ms(), 2000.0);
    }

    #[test]
    fn test_task_status_equality() {
        assert_eq!(TaskStatus::Success, TaskStatus::Success);
        assert_ne!(TaskStatus::Success, TaskStatus::Failed);
        assert_ne!(TaskStatus::Failed, TaskStatus::Timeout);
    }
}
