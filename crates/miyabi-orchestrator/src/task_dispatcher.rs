//! Task Dispatcher - Dispatches tasks from queue to GitHub Actions workers
//!
//! This module provides:
//! - Load balancing check (concurrent execution limit)
//! - GitHub Actions workflow_dispatch triggering
//! - Self-hosted runner assignment
//! - Dispatch result tracking

use crate::error::{Result, SchedulerError};
use crate::task_queue::{QueuedTask, TaskQueue};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Dispatcher configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DispatcherConfig {
    /// GitHub repository (owner/repo)
    pub repository: String,
    /// GitHub token for API access
    pub github_token: String,
    /// Workflow filename
    pub workflow_file: String,
    /// Maximum concurrent dispatches per minute
    pub rate_limit: usize,
}

impl Default for DispatcherConfig {
    fn default() -> Self {
        Self {
            repository: "customer-cloud/miyabi-private".to_string(),
            github_token: std::env::var("GITHUB_TOKEN").unwrap_or_default(),
            workflow_file: "task-execute.yml".to_string(),
            rate_limit: 10,
        }
    }
}

/// Dispatch result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DispatchResult {
    pub issue_number: u64,
    pub workflow_run_id: Option<u64>,
    pub dispatched_at: chrono::DateTime<chrono::Utc>,
    pub success: bool,
    pub error_message: Option<String>,
}

/// Task Dispatcher
pub struct TaskDispatcher {
    config: DispatcherConfig,
    dispatch_count: usize,
    dispatch_history: HashMap<u64, DispatchResult>,
}

impl TaskDispatcher {
    /// Create new task dispatcher
    pub fn new(config: DispatcherConfig) -> Self {
        Self {
            config,
            dispatch_count: 0,
            dispatch_history: HashMap::new(),
        }
    }

    /// Dispatch next task from queue
    pub async fn dispatch_next(&mut self, queue: &mut TaskQueue) -> Result<Option<DispatchResult>> {
        // Check rate limit
        if self.dispatch_count >= self.config.rate_limit {
            return Ok(None);
        }

        // Dequeue next task
        let task = match queue.dequeue() {
            Some(t) => t,
            None => return Ok(None),
        };

        // Dispatch to GitHub Actions
        let result = self.dispatch_task(&task).await?;

        // Update dispatch count
        self.dispatch_count += 1;

        // Store in history
        self.dispatch_history
            .insert(task.issue.number, result.clone());

        Ok(Some(result))
    }

    /// Dispatch a specific task to GitHub Actions
    async fn dispatch_task(&self, task: &QueuedTask) -> Result<DispatchResult> {
        let issue_number = task.issue.number;

        // Extract priority label
        let priority = task
            .issue
            .labels
            .iter()
            .find(|l| l.starts_with("P") || l.contains("priority"))
            .map(|l| l.as_str())
            .unwrap_or("P2-Medium");

        // Generate worktree name
        let worktree_name = format!("issue-{}", issue_number);

        // Calculate max runtime based on priority
        let max_runtime = match priority {
            s if s.contains("P0") => 180, // 3 hours for critical
            s if s.contains("P1") => 120, // 2 hours for high
            s if s.contains("P2") => 90,  // 1.5 hours for medium
            _ => 60,                      // 1 hour for low
        };

        // Build workflow dispatch payload
        let payload = WorkflowDispatchPayload {
            ref_field: "main".to_string(),
            inputs: WorkflowInputs {
                issue_number: issue_number.to_string(),
                priority: priority.to_string(),
                worktree_name,
                max_runtime,
            },
        };

        // Dispatch via GitHub API
        let result = self.dispatch_workflow(&payload).await;

        match result {
            Ok(run_id) => Ok(DispatchResult {
                issue_number,
                workflow_run_id: Some(run_id),
                dispatched_at: chrono::Utc::now(),
                success: true,
                error_message: None,
            }),
            Err(e) => Ok(DispatchResult {
                issue_number,
                workflow_run_id: None,
                dispatched_at: chrono::Utc::now(),
                success: false,
                error_message: Some(e.to_string()),
            }),
        }
    }

    /// Call GitHub Actions workflow_dispatch API
    async fn dispatch_workflow(&self, payload: &WorkflowDispatchPayload) -> Result<u64> {
        let url = format!(
            "https://api.github.com/repos/{}/actions/workflows/{}/dispatches",
            self.config.repository, self.config.workflow_file
        );

        let client = reqwest::Client::new();
        let response = client
            .post(&url)
            .header("Accept", "application/vnd.github+json")
            .header(
                "Authorization",
                format!("Bearer {}", self.config.github_token),
            )
            .header("User-Agent", "Miyabi-Water-Spider-Orchestrator")
            .header("X-GitHub-Api-Version", "2022-11-28")
            .json(&payload)
            .send()
            .await
            .map_err(|e| SchedulerError::CommandFailed {
                command: "workflow_dispatch".to_string(),
                stderr: e.to_string(),
            })?;

        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_default();
            return Err(SchedulerError::CommandFailed {
                command: "workflow_dispatch".to_string(),
                stderr: format!("HTTP {}: {}", status, error_text),
            });
        }

        // GitHub Actions doesn't return the run ID immediately in the dispatch response
        // We would need to query the runs API to find it
        // For now, return 0 as a placeholder
        Ok(0)
    }

    /// Get dispatch statistics
    pub fn stats(&self) -> DispatcherStats {
        let successful = self.dispatch_history.values().filter(|r| r.success).count();
        let failed = self
            .dispatch_history
            .values()
            .filter(|r| !r.success)
            .count();

        DispatcherStats {
            total_dispatched: self.dispatch_count,
            successful,
            failed,
            rate_limit: self.config.rate_limit,
            remaining_capacity: self.config.rate_limit.saturating_sub(self.dispatch_count),
        }
    }

    /// Reset dispatch counter (call every minute)
    pub fn reset_counter(&mut self) {
        self.dispatch_count = 0;
    }

    /// Get dispatch result for an issue
    pub fn get_result(&self, issue_number: u64) -> Option<&DispatchResult> {
        self.dispatch_history.get(&issue_number)
    }
}

/// Workflow dispatch payload structure
#[derive(Debug, Clone, Serialize, Deserialize)]
struct WorkflowDispatchPayload {
    #[serde(rename = "ref")]
    ref_field: String,
    inputs: WorkflowInputs,
}

/// Workflow input parameters
#[derive(Debug, Clone, Serialize, Deserialize)]
struct WorkflowInputs {
    issue_number: String,
    priority: String,
    worktree_name: String,
    max_runtime: u32,
}

/// Dispatcher statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DispatcherStats {
    pub total_dispatched: usize,
    pub successful: usize,
    pub failed: usize,
    pub rate_limit: usize,
    pub remaining_capacity: usize,
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::priority::Issue;

    #[test]
    fn test_dispatcher_creation() {
        let config = DispatcherConfig::default();
        let dispatcher = TaskDispatcher::new(config);

        let stats = dispatcher.stats();
        assert_eq!(stats.total_dispatched, 0);
        assert_eq!(stats.remaining_capacity, 10);
    }

    #[test]
    fn test_rate_limit() {
        let config = DispatcherConfig {
            rate_limit: 2,
            ..Default::default()
        };
        let dispatcher = TaskDispatcher::new(config);

        assert_eq!(dispatcher.config.rate_limit, 2);
    }

    #[test]
    fn test_counter_reset() {
        let mut dispatcher = TaskDispatcher::new(DispatcherConfig::default());
        dispatcher.dispatch_count = 5;

        dispatcher.reset_counter();
        assert_eq!(dispatcher.dispatch_count, 0);
    }

    #[test]
    fn test_stats() {
        let mut dispatcher = TaskDispatcher::new(DispatcherConfig::default());

        // Simulate successful dispatch
        dispatcher.dispatch_history.insert(
            1,
            DispatchResult {
                issue_number: 1,
                workflow_run_id: Some(123),
                dispatched_at: chrono::Utc::now(),
                success: true,
                error_message: None,
            },
        );

        // Simulate failed dispatch
        dispatcher.dispatch_history.insert(
            2,
            DispatchResult {
                issue_number: 2,
                workflow_run_id: None,
                dispatched_at: chrono::Utc::now(),
                success: false,
                error_message: Some("Rate limit exceeded".to_string()),
            },
        );

        dispatcher.dispatch_count = 2;

        let stats = dispatcher.stats();
        assert_eq!(stats.total_dispatched, 2);
        assert_eq!(stats.successful, 1);
        assert_eq!(stats.failed, 1);
    }
}
