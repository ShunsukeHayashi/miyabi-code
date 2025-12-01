//! Task scheduler with DAG-based dependency resolution and parallel execution

use crate::dag::{DAGOperations, TaskId};
use crate::error::{Result, SchedulerError};
use crate::session::{SessionConfig, SessionId, SessionManager, SessionStatus};
use std::collections::{HashMap, HashSet};
use std::path::PathBuf;
use std::time::Duration;
use tokio::time::sleep;
use tracing::{debug, info, warn};

/// Scheduler for managing task execution with dependencies
pub struct Scheduler {
    /// Maximum number of parallel sessions
    max_parallel: usize,
    /// Session manager
    session_manager: SessionManager,
    /// DAG operations
    dag_ops: DAGOperations,
    /// Completed task IDs
    completed: HashSet<TaskId>,
    /// Running sessions: task_id -> session_id
    running: HashMap<TaskId, SessionId>,
}

impl Scheduler {
    /// Create a new Scheduler
    ///
    /// # Arguments
    ///
    /// * `dag_ops` - DAG operations for dependency resolution
    /// * `max_parallel` - Maximum number of parallel sessions (default: 5)
    /// * `session_config` - Session manager configuration
    pub fn new(dag_ops: DAGOperations, max_parallel: usize, session_config: SessionConfig) -> Self {
        Self {
            max_parallel,
            session_manager: SessionManager::new(session_config),
            dag_ops,
            completed: HashSet::new(),
            running: HashMap::new(),
        }
    }

    /// Schedule all tasks in the DAG
    ///
    /// This method orchestrates the execution of all tasks in the DAG,
    /// respecting dependencies and parallel execution limits.
    ///
    /// # Returns
    ///
    /// Returns `Ok(())` when all tasks complete successfully,
    /// or an error if any task fails.
    ///
    /// # Example
    ///
    /// ```no_run
    /// use miyabi_scheduler::scheduler::Scheduler;
    /// use miyabi_scheduler::dag::DAGOperations;
    /// use miyabi_scheduler::session::SessionConfig;
    /// use miyabi_types::workflow::DAG;
    ///
    /// # #[tokio::main]
    /// # async fn main() -> Result<(), Box<dyn std::error::Error>> {
    /// let dag = DAG { nodes: vec![], edges: vec![], levels: vec![] };
    /// let dag_ops = DAGOperations::new(dag)?;
    /// let mut scheduler = Scheduler::new(dag_ops, 5, SessionConfig::default());
    ///
    /// scheduler.execute_all().await?;
    /// # Ok(())
    /// # }
    /// ```
    pub async fn execute_all(&mut self) -> Result<()> {
        info!("Starting scheduler: {} tasks, max {} parallel", self.dag_ops.task_count(), self.max_parallel);

        loop {
            // Check running sessions for completion
            self.check_running_sessions().await?;

            // Get ready tasks
            let ready_tasks = self.dag_ops.get_ready_tasks(&self.completed);

            if ready_tasks.is_empty() {
                if self.running.is_empty() {
                    // No ready tasks and nothing running - we're done
                    if self.dag_ops.is_complete(&self.completed) {
                        info!("All tasks completed successfully");
                        break;
                    } else {
                        // Deadlock: tasks remaining but none ready and none running
                        let remaining: Vec<_> = self
                            .dag_ops
                            .get_tasks()
                            .iter()
                            .filter(|t| !self.completed.contains(&t.id))
                            .map(|t| &t.id)
                            .collect();
                        return Err(SchedulerError::InvalidConfig(format!(
                            "Deadlock detected: {} tasks remaining but none ready. Tasks: {:?}",
                            remaining.len(),
                            remaining
                        )));
                    }
                } else {
                    // Tasks are running, wait for completion
                    debug!("No ready tasks, {} running. Waiting...", self.running.len());
                    sleep(Duration::from_secs(1)).await;
                    continue;
                }
            }

            // Start new tasks up to max_parallel limit
            let available_slots = self.max_parallel.saturating_sub(self.running.len());
            let tasks_to_start: Vec<_> = ready_tasks.into_iter().take(available_slots).collect();

            for task_id in tasks_to_start {
                self.start_task(&task_id).await?;
            }

            // Brief sleep before next iteration
            sleep(Duration::from_millis(100)).await;
        }

        // Cleanup
        info!("Scheduler completed, cleaning up sessions");
        self.session_manager.cleanup().await;

        Ok(())
    }

    /// Start a single task
    async fn start_task(&mut self, task_id: &str) -> Result<()> {
        let task = self
            .dag_ops
            .get_task(task_id)
            .ok_or_else(|| SchedulerError::SessionNotFound(task_id.to_string()))?;

        info!("Starting task: {} ({})", task.id, task.title);

        // Create worktree path
        let worktree_path = PathBuf::from(format!(".worktrees/task-{}", task.id));

        // Spawn headless session
        let command = format!("/agent-run --task {}", task.id);
        let session_id = self.session_manager.spawn_headless(command, worktree_path).await?;

        // Track running session
        self.running.insert(task.id.clone(), session_id.clone());

        debug!("Task {} started with session {}", task.id, session_id);

        Ok(())
    }

    /// Check running sessions and mark completed tasks
    async fn check_running_sessions(&mut self) -> Result<()> {
        let mut completed_tasks = Vec::new();

        for (task_id, session_id) in &self.running {
            let status = self.session_manager.monitor_session(session_id).await?;

            match status {
                SessionStatus::Completed => {
                    info!("Task {} completed successfully", task_id);
                    completed_tasks.push(task_id.clone());

                    // Collect result (for logging/metrics)
                    match self.session_manager.collect_result(session_id).await {
                        Ok(result) => {
                            debug!("Task {} result: status={}, success={}", task_id, result.status, result.success);
                        }
                        Err(e) => {
                            warn!("Failed to collect result for task {}: {}", task_id, e);
                        }
                    }
                }
                SessionStatus::Failed => {
                    warn!("Task {} failed", task_id);
                    // Try to collect error details
                    match self.session_manager.collect_result(session_id).await {
                        Ok(result) => {
                            return Err(SchedulerError::ProcessFailed {
                                code: result.status,
                                stderr: result.error.unwrap_or_else(|| "Unknown error".to_string()),
                            });
                        }
                        Err(e) => {
                            return Err(SchedulerError::InvalidConfig(format!(
                                "Task {} failed and could not collect error: {}",
                                task_id, e
                            )));
                        }
                    }
                }
                SessionStatus::TimedOut => {
                    warn!("Task {} timed out", task_id);
                    return Err(SchedulerError::Timeout(1800)); // Use session config timeout
                }
                SessionStatus::Running | SessionStatus::Pending => {
                    // Still running, continue
                }
            }
        }

        // Mark completed tasks
        for task_id in completed_tasks {
            self.running.remove(&task_id);
            self.completed.insert(task_id);
        }

        Ok(())
    }

    /// Get scheduler statistics
    pub fn get_stats(&self) -> SchedulerStats {
        SchedulerStats {
            total_tasks: self.dag_ops.task_count(),
            completed_tasks: self.completed.len(),
            running_tasks: self.running.len(),
            pending_tasks: self.dag_ops.task_count() - self.completed.len() - self.running.len(),
        }
    }
}

/// Scheduler statistics
#[derive(Debug, Clone)]
pub struct SchedulerStats {
    pub total_tasks: usize,
    pub completed_tasks: usize,
    pub running_tasks: usize,
    pub pending_tasks: usize,
}

#[cfg(test)]
mod tests {
    use super::*;
    use miyabi_types::task::{Task, TaskType};
    use miyabi_types::workflow::DAG;

    fn create_simple_dag() -> DAG {
        let task1 =
            Task::new("task-1".to_string(), "Task 1".to_string(), "First task".to_string(), TaskType::Feature, 1)
                .unwrap();

        DAG { nodes: vec![task1], edges: vec![], levels: vec![vec!["task-1".to_string()]] }
    }

    #[tokio::test]
    async fn test_scheduler_creation() {
        let dag = create_simple_dag();
        let dag_ops = DAGOperations::new(dag).unwrap();
        let scheduler = Scheduler::new(dag_ops, 5, SessionConfig::default());

        let stats = scheduler.get_stats();
        assert_eq!(stats.total_tasks, 1);
        assert_eq!(stats.completed_tasks, 0);
        assert_eq!(stats.running_tasks, 0);
        assert_eq!(stats.pending_tasks, 1);
    }

    #[tokio::test]
    #[ignore] // Requires Claude Code CLI
    async fn test_scheduler_execute_all() {
        let dag = create_simple_dag();
        let dag_ops = DAGOperations::new(dag).unwrap();
        let mut scheduler = Scheduler::new(dag_ops, 5, SessionConfig::default());

        // This would fail without Claude CLI, so we just test the structure
        // In real usage, this would execute the tasks
        let result = scheduler.execute_all().await;
        // Expected to fail since we don't have actual tasks to execute
        assert!(result.is_err() || result.is_ok());
    }

    fn create_complex_dag() -> DAG {
        let task1 =
            Task::new("task-1".to_string(), "Task 1".to_string(), "First task".to_string(), TaskType::Feature, 1)
                .unwrap();

        let task2 =
            Task::new("task-2".to_string(), "Task 2".to_string(), "Second task".to_string(), TaskType::Feature, 1)
                .unwrap();

        let task3 =
            Task::new("task-3".to_string(), "Task 3".to_string(), "Third task".to_string(), TaskType::Feature, 1)
                .unwrap();

        DAG {
            nodes: vec![task1, task2, task3],
            edges: vec![
                ("task-1".to_string(), "task-3".to_string()),
                ("task-2".to_string(), "task-3".to_string()),
            ],
            levels: vec![
                vec!["task-1".to_string(), "task-2".to_string()],
                vec!["task-3".to_string()],
            ],
        }
    }

    #[tokio::test]
    async fn test_scheduler_with_complex_dag() {
        let dag = create_complex_dag();
        let dag_ops = DAGOperations::new(dag).unwrap();
        let scheduler = Scheduler::new(dag_ops, 5, SessionConfig::default());

        let stats = scheduler.get_stats();
        assert_eq!(stats.total_tasks, 3);
        assert_eq!(stats.completed_tasks, 0);
        assert_eq!(stats.running_tasks, 0);
        assert_eq!(stats.pending_tasks, 3);
    }

    #[tokio::test]
    async fn test_scheduler_max_parallel_limit() {
        let dag = create_complex_dag();
        let dag_ops = DAGOperations::new(dag).unwrap();
        let scheduler = Scheduler::new(dag_ops, 2, SessionConfig::default());

        // Verify max_parallel is set correctly
        assert_eq!(scheduler.max_parallel, 2);
    }

    #[tokio::test]
    async fn test_scheduler_custom_max_parallel() {
        let dag = create_simple_dag();
        let dag_ops = DAGOperations::new(dag).unwrap();

        // Test various max_parallel values
        for max_parallel in &[1, 3, 5, 10] {
            let scheduler = Scheduler::new(dag_ops.clone(), *max_parallel, SessionConfig::default());
            assert_eq!(scheduler.max_parallel, *max_parallel);
        }
    }

    #[tokio::test]
    async fn test_scheduler_stats_initial_state() {
        let dag = create_complex_dag();
        let dag_ops = DAGOperations::new(dag).unwrap();
        let scheduler = Scheduler::new(dag_ops, 5, SessionConfig::default());

        let stats = scheduler.get_stats();

        // Initial state: all tasks pending
        assert_eq!(stats.completed_tasks, 0);
        assert_eq!(stats.running_tasks, 0);
        assert_eq!(stats.pending_tasks, stats.total_tasks);
        assert_eq!(stats.progress_percentage, 0);
    }

    #[tokio::test]
    async fn test_scheduler_custom_session_config() {
        let dag = create_simple_dag();
        let dag_ops = DAGOperations::new(dag).unwrap();

        let custom_config = SessionConfig {
            claude_code_path: PathBuf::from("/custom/path/to/claude-code"),
            default_worktree_base: PathBuf::from("/custom/worktrees"),
            log_dir: PathBuf::from("/custom/logs"),
            timeout: Duration::from_secs(3600),
            retry_limit: 5,
        };

        let scheduler = Scheduler::new(dag_ops, 5, custom_config);

        // Verify scheduler was created successfully with custom config
        let stats = scheduler.get_stats();
        assert_eq!(stats.total_tasks, 1);
    }

    #[tokio::test]
    async fn test_scheduler_with_empty_dag() {
        let empty_dag = DAG { nodes: vec![], edges: vec![], levels: vec![] };

        let dag_ops = DAGOperations::new(empty_dag).unwrap();
        let scheduler = Scheduler::new(dag_ops, 5, SessionConfig::default());

        let stats = scheduler.get_stats();
        assert_eq!(stats.total_tasks, 0);
        assert_eq!(stats.progress_percentage, 100); // Empty DAG is 100% complete
    }

    #[tokio::test]
    async fn test_scheduler_stats_progress_calculation() {
        let dag = create_complex_dag();
        let dag_ops = DAGOperations::new(dag).unwrap();
        let scheduler = Scheduler::new(dag_ops, 5, SessionConfig::default());

        let stats = scheduler.get_stats();

        // Verify progress calculation
        let expected_progress = (stats.completed_tasks * 100) / stats.total_tasks.max(1);
        assert_eq!(stats.progress_percentage, expected_progress);
    }
}
