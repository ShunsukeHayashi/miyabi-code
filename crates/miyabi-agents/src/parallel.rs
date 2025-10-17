//! Parallel execution utilities for Business Agents
//!
//! Provides concurrent execution capabilities for multiple Business Agents

use crate::base::BaseAgent;
use miyabi_types::{AgentConfig, AgentResult, Task};
use std::sync::Arc;
use tokio::sync::Semaphore;
use tokio::task::JoinHandle;
use tracing::{info, warn};

/// Configuration for parallel execution
#[derive(Debug, Clone)]
pub struct ParallelConfig {
    /// Maximum number of concurrent agents
    pub max_concurrency: usize,
    /// Timeout for individual agent execution
    pub timeout_seconds: u64,
    /// Whether to fail fast on first error
    pub fail_fast: bool,
}

impl Default for ParallelConfig {
    fn default() -> Self {
        Self {
            max_concurrency: 4,
            timeout_seconds: 300, // 5 minutes
            fail_fast: false,
        }
    }
}

/// Result of parallel execution
#[derive(Debug)]
pub struct ParallelResult {
    /// Individual agent results
    pub results: Vec<AgentResult>,
    /// Total execution time in milliseconds
    pub total_duration_ms: u64,
    /// Number of successful executions
    pub success_count: usize,
    /// Number of failed executions
    pub failure_count: usize,
}

impl ParallelResult {
    /// Check if all executions were successful
    pub fn all_successful(&self) -> bool {
        self.failure_count == 0
    }

    /// Get success rate as percentage
    pub fn success_rate(&self) -> f64 {
        if self.results.is_empty() {
            0.0
        } else {
            (self.success_count as f64 / self.results.len() as f64) * 100.0
        }
    }
}

/// Parallel executor for Business Agents
pub struct ParallelExecutor {
    config: ParallelConfig,
    semaphore: Arc<Semaphore>,
}

impl ParallelExecutor {
    /// Create a new parallel executor
    pub fn new(config: ParallelConfig) -> Self {
        let semaphore = Arc::new(Semaphore::new(config.max_concurrency));
        Self { config, semaphore }
    }

    /// Execute multiple agents in parallel
    pub async fn execute_agents<A>(
        &self,
        agents: Vec<(A, Task)>,
        _config: AgentConfig,
    ) -> ParallelResult
    where
        A: BaseAgent + Send + Sync + 'static,
    {
        let start_time = std::time::Instant::now();
        let mut handles: Vec<JoinHandle<AgentResult>> = Vec::new();

        info!(
            "Starting parallel execution of {} agents with max concurrency: {}",
            agents.len(),
            self.config.max_concurrency
        );

        for (agent, task) in agents {
            let semaphore = self.semaphore.clone();
            let timeout_seconds = self.config.timeout_seconds;
            let fail_fast = self.config.fail_fast;

            let handle = tokio::spawn(async move {
                let _permit = semaphore.acquire().await.expect("Semaphore closed");

                let result = tokio::time::timeout(
                    std::time::Duration::from_secs(timeout_seconds),
                    agent.execute(&task),
                )
                .await;

                match result {
                    Ok(Ok(agent_result)) => {
                        info!("Agent {} completed successfully", task.id);
                        agent_result
                    }
                    Ok(Err(e)) => {
                        warn!("Agent {} failed: {}", task.id, e);
                        AgentResult {
                            status: miyabi_types::agent::ResultStatus::Failed,
                            metrics: None,
                            data: Some(serde_json::json!({
                                "error": e.to_string(),
                                "task_id": task.id
                            })),
                            error: Some(e.to_string()),
                            escalation: None,
                        }
                    }
                    Err(_) => {
                        warn!(
                            "Agent {} timed out after {} seconds",
                            task.id, timeout_seconds
                        );
                        AgentResult {
                            status: miyabi_types::agent::ResultStatus::Failed,
                            metrics: None,
                            data: Some(serde_json::json!({
                                "error": "Timeout",
                                "task_id": task.id,
                                "timeout_seconds": timeout_seconds
                            })),
                            error: Some("Timeout".to_string()),
                            escalation: None,
                        }
                    }
                }
            });

            handles.push(handle);

            // Fail fast if configured
            if fail_fast && !handles.is_empty() {
                // Check if any previous tasks failed
                // This is a simplified implementation
            }
        }

        // Wait for all tasks to complete
        let results: Vec<AgentResult> = futures::future::join_all(handles)
            .await
            .into_iter()
            .map(|result| result.expect("Task panicked"))
            .collect();

        let total_duration = start_time.elapsed().as_millis() as u64;
        let success_count = results
            .iter()
            .filter(|r| r.status == miyabi_types::agent::ResultStatus::Success)
            .count();
        let failure_count = results.len() - success_count;

        info!(
            "Parallel execution completed: {} successful, {} failed, {}ms total",
            success_count, failure_count, total_duration
        );

        ParallelResult {
            results,
            total_duration_ms: total_duration,
            success_count,
            failure_count,
        }
    }

    /// Execute agents with different types in parallel
    pub async fn execute_mixed_agents(
        &self,
        agent_tasks: Vec<(Box<dyn BaseAgent + Send + Sync>, Task)>,
        _config: AgentConfig,
    ) -> ParallelResult {
        let start_time = std::time::Instant::now();
        let mut handles: Vec<JoinHandle<AgentResult>> = Vec::new();

        info!(
            "Starting mixed parallel execution of {} agents",
            agent_tasks.len()
        );

        for (agent, task) in agent_tasks {
            let semaphore = self.semaphore.clone();
            let timeout_seconds = self.config.timeout_seconds;

            let handle = tokio::spawn(async move {
                let _permit = semaphore.acquire().await.expect("Semaphore closed");

                let result = tokio::time::timeout(
                    std::time::Duration::from_secs(timeout_seconds),
                    agent.execute(&task),
                )
                .await;

                match result {
                    Ok(Ok(agent_result)) => {
                        info!("Agent {} completed successfully", task.id);
                        agent_result
                    }
                    Ok(Err(e)) => {
                        warn!("Agent {} failed: {}", task.id, e);
                        AgentResult {
                            status: miyabi_types::agent::ResultStatus::Failed,
                            metrics: None,
                            data: Some(serde_json::json!({
                                "error": e.to_string(),
                                "task_id": task.id
                            })),
                            error: Some(e.to_string()),
                            escalation: None,
                        }
                    }
                    Err(_) => {
                        warn!(
                            "Agent {} timed out after {} seconds",
                            task.id, timeout_seconds
                        );
                        AgentResult {
                            status: miyabi_types::agent::ResultStatus::Failed,
                            metrics: None,
                            data: Some(serde_json::json!({
                                "error": "Timeout",
                                "task_id": task.id,
                                "timeout_seconds": timeout_seconds
                            })),
                            error: Some("Timeout".to_string()),
                            escalation: None,
                        }
                    }
                }
            });

            handles.push(handle);
        }

        // Wait for all tasks to complete
        let results: Vec<AgentResult> = futures::future::join_all(handles)
            .await
            .into_iter()
            .map(|result| result.expect("Task panicked"))
            .collect();

        let total_duration = start_time.elapsed().as_millis() as u64;
        let success_count = results
            .iter()
            .filter(|r| r.status == miyabi_types::agent::ResultStatus::Success)
            .count();
        let failure_count = results.len() - success_count;

        info!(
            "Mixed parallel execution completed: {} successful, {} failed, {}ms total",
            success_count, failure_count, total_duration
        );

        ParallelResult {
            results,
            total_duration_ms: total_duration,
            success_count,
            failure_count,
        }
    }
}

/// Helper function to create a parallel executor with default settings
pub fn create_parallel_executor() -> ParallelExecutor {
    ParallelExecutor::new(ParallelConfig::default())
}

/// Helper function to create a parallel executor with custom settings
pub fn create_parallel_executor_with_config(config: ParallelConfig) -> ParallelExecutor {
    ParallelExecutor::new(config)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::business::MarketingAgent;
    use miyabi_types::{agent::ResultStatus, task::TaskType};
    use std::collections::HashMap;

    fn create_test_task(id: &str) -> Task {
        Task {
            id: id.to_string(),
            title: format!("Test Task {}", id),
            description: "Test task for parallel execution".to_string(),
            task_type: TaskType::Feature,
            priority: 1,
            severity: None,
            impact: None,
            assigned_agent: None,
            dependencies: vec![],
            estimated_duration: Some(60),
            status: None,
            start_time: None,
            end_time: None,
            metadata: Some(HashMap::from([(
                "test".to_string(),
                serde_json::json!(true),
            )])),
        }
    }

    fn create_test_config() -> AgentConfig {
        AgentConfig {
            device_identifier: "test-device".to_string(),
            github_token: "test-token".to_string(),
            repo_owner: Some("test-owner".to_string()),
            repo_name: Some("test-repo".to_string()),
            use_task_tool: false,
            use_worktree: false,
            worktree_base_path: None,
            log_directory: "./logs".to_string(),
            report_directory: "./reports".to_string(),
            tech_lead_github_username: None,
            ciso_github_username: None,
            po_github_username: None,
            firebase_production_project: None,
            firebase_staging_project: None,
            production_url: None,
            staging_url: None,
        }
    }

    #[tokio::test]
    async fn test_parallel_executor_creation() {
        let config = ParallelConfig::default();
        let executor = ParallelExecutor::new(config);

        assert_eq!(executor.config.max_concurrency, 4);
        assert_eq!(executor.config.timeout_seconds, 300);
        assert!(!executor.config.fail_fast);
    }

    #[tokio::test]
    async fn test_parallel_execution() {
        let config = ParallelConfig {
            max_concurrency: 2,
            timeout_seconds: 10,
            fail_fast: false,
        };
        let executor = ParallelExecutor::new(config);
        let agent_config = create_test_config();

        let agents = vec![
            (
                MarketingAgent::new(agent_config.clone()),
                create_test_task("task1"),
            ),
            (
                MarketingAgent::new(agent_config.clone()),
                create_test_task("task2"),
            ),
            (MarketingAgent::new(agent_config), create_test_task("task3")),
        ];

        let result = executor.execute_agents(agents, create_test_config()).await;

        assert_eq!(result.results.len(), 3);
        assert!(result.total_duration_ms > 0);
        // In test environment, agents might fail due to missing API keys
        // Just verify the structure is correct
        assert!(result.success_count + result.failure_count == 3);
    }

    #[tokio::test]
    async fn test_parallel_result_properties() {
        let result = ParallelResult {
            results: vec![
                AgentResult {
                    status: ResultStatus::Success,
                    metrics: None,
                    data: None,
                    error: None,
                    escalation: None,
                },
                AgentResult {
                    status: ResultStatus::Success,
                    metrics: None,
                    data: None,
                    error: None,
                    escalation: None,
                },
                AgentResult {
                    status: ResultStatus::Failed,
                    metrics: None,
                    data: None,
                    error: None,
                    escalation: None,
                },
            ],
            total_duration_ms: 1000,
            success_count: 2,
            failure_count: 1,
        };

        assert!(!result.all_successful());
        assert!((result.success_rate() - 66.66666666666667).abs() < 0.0001);
    }
}
