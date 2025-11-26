//! Database persistence for Business Agents
//!
//! This module provides traits and utilities for persisting business agent
//! execution results, analysis data, and execution history to PostgreSQL.

use async_trait::async_trait;
use miyabi_types::error::MiyabiError;
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;

/// Agent execution result that can be persisted to database
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentExecutionResult {
    /// Unique execution ID
    pub execution_id: Option<Uuid>,

    /// Repository ID this execution belongs to
    pub repository_id: Uuid,

    /// GitHub issue number (if applicable)
    pub issue_number: Option<i32>,

    /// Agent type (e.g., "AIEntrepreneurAgent")
    pub agent_type: String,

    /// Execution status
    pub status: ExecutionStatus,

    /// When execution started
    pub started_at: Option<chrono::DateTime<chrono::Utc>>,

    /// When execution completed
    pub completed_at: Option<chrono::DateTime<chrono::Utc>>,

    /// Error message if execution failed
    pub error_message: Option<String>,

    /// Main result data (JSON)
    pub result: Option<serde_json::Value>,

    /// Quality score (0-100)
    pub quality_score: Option<i32>,

    /// PR number created (if applicable)
    pub pr_number: Option<i32>,

    /// Analysis metrics (business-specific data)
    pub analysis_metrics: Option<serde_json::Value>,
}

/// Execution status
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum ExecutionStatus {
    /// Execution is pending
    Pending,

    /// Execution is running
    Running,

    /// Execution completed successfully
    Completed,

    /// Execution failed
    Failed,
}

impl ExecutionStatus {
    /// Convert to string for database storage
    pub fn as_str(&self) -> &'static str {
        match self {
            ExecutionStatus::Pending => "pending",
            ExecutionStatus::Running => "running",
            ExecutionStatus::Completed => "completed",
            ExecutionStatus::Failed => "failed",
        }
    }
}

/// Trait for agents that can persist their execution results
#[async_trait]
pub trait PersistableAgent: Send + Sync {
    /// Get the agent type name
    fn agent_type(&self) -> &'static str;

    /// Save execution result to database
    ///
    /// # Arguments
    ///
    /// * `pool` - PostgreSQL connection pool
    /// * `result` - Execution result to save
    ///
    /// # Returns
    ///
    /// UUID of the created/updated execution record
    async fn save_execution(
        &self,
        pool: &PgPool,
        result: &AgentExecutionResult,
    ) -> Result<Uuid, MiyabiError> {
        if let Some(execution_id) = result.execution_id {
            // Update existing execution
            self.update_execution(pool, execution_id, result).await
        } else {
            // Create new execution
            self.create_execution(pool, result).await
        }
    }

    /// Create a new execution record
    async fn create_execution(
        &self,
        pool: &PgPool,
        result: &AgentExecutionResult,
    ) -> Result<Uuid, MiyabiError> {
        let record = sqlx::query!(
            r#"
            INSERT INTO agent_executions (
                repository_id,
                issue_number,
                agent_type,
                status,
                started_at,
                completed_at,
                error_message,
                result,
                quality_score,
                pr_number
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id
            "#,
            result.repository_id,
            result.issue_number,
            result.agent_type,
            result.status.as_str(),
            result.started_at,
            result.completed_at,
            result.error_message,
            result.result,
            result.quality_score,
            result.pr_number
        )
        .fetch_one(pool)
        .await
        .map_err(|e| MiyabiError::Database(format!("Failed to create execution: {}", e)))?;

        Ok(record.id)
    }

    /// Update an existing execution record
    async fn update_execution(
        &self,
        pool: &PgPool,
        execution_id: Uuid,
        result: &AgentExecutionResult,
    ) -> Result<Uuid, MiyabiError> {
        sqlx::query!(
            r#"
            UPDATE agent_executions
            SET status = $2,
                completed_at = $3,
                error_message = $4,
                result = $5,
                quality_score = $6,
                pr_number = $7,
                updated_at = NOW()
            WHERE id = $1
            "#,
            execution_id,
            result.status.as_str(),
            result.completed_at,
            result.error_message,
            result.result,
            result.quality_score,
            result.pr_number
        )
        .execute(pool)
        .await
        .map_err(|e| MiyabiError::Database(format!("Failed to update execution: {}", e)))?;

        Ok(execution_id)
    }

    /// Load execution history for this agent type
    ///
    /// # Arguments
    ///
    /// * `pool` - PostgreSQL connection pool
    /// * `repository_id` - Repository to filter by
    /// * `limit` - Maximum number of records to return
    ///
    /// # Returns
    ///
    /// List of execution results, most recent first
    async fn load_history(
        &self,
        pool: &PgPool,
        repository_id: Uuid,
        limit: i64,
    ) -> Result<Vec<AgentExecutionResult>, MiyabiError> {
        let records = sqlx::query!(
            r#"
            SELECT
                id,
                repository_id,
                issue_number,
                agent_type,
                status,
                started_at,
                completed_at,
                error_message,
                result,
                quality_score,
                pr_number
            FROM agent_executions
            WHERE agent_type = $1 AND repository_id = $2
            ORDER BY created_at DESC
            LIMIT $3
            "#,
            self.agent_type(),
            repository_id,
            limit
        )
        .fetch_all(pool)
        .await
        .map_err(|e| MiyabiError::Database(format!("Failed to load history: {}", e)))?;

        let results = records
            .into_iter()
            .map(|r| {
                let status = match r.status.as_str() {
                    "pending" => ExecutionStatus::Pending,
                    "running" => ExecutionStatus::Running,
                    "completed" => ExecutionStatus::Completed,
                    "failed" => ExecutionStatus::Failed,
                    _ => ExecutionStatus::Failed,
                };

                AgentExecutionResult {
                    execution_id: Some(r.id),
                    repository_id: r.repository_id,
                    issue_number: r.issue_number,
                    agent_type: r.agent_type,
                    status,
                    started_at: r.started_at,
                    completed_at: r.completed_at,
                    error_message: r.error_message,
                    result: r.result,
                    quality_score: r.quality_score,
                    pr_number: r.pr_number,
                    analysis_metrics: None,
                }
            })
            .collect();

        Ok(results)
    }

    /// Get the latest execution for this agent and repository
    async fn get_latest_execution(
        &self,
        pool: &PgPool,
        repository_id: Uuid,
    ) -> Result<Option<AgentExecutionResult>, MiyabiError> {
        let mut history = self.load_history(pool, repository_id, 1).await?;
        Ok(history.pop())
    }

    /// Save analysis metrics separately (for analytics agents)
    async fn save_analysis_metrics(
        &self,
        pool: &PgPool,
        execution_id: Uuid,
        metrics: serde_json::Value,
    ) -> Result<(), MiyabiError> {
        sqlx::query!(
            r#"
            UPDATE agent_executions
            SET result = jsonb_set(
                COALESCE(result, '{}'::jsonb),
                '{analysis_metrics}',
                $2::jsonb
            )
            WHERE id = $1
            "#,
            execution_id,
            metrics
        )
        .execute(pool)
        .await
        .map_err(|e| MiyabiError::Database(format!("Failed to save metrics: {}", e)))?;

        Ok(())
    }
}

/// Helper to create a new execution result builder
pub struct ExecutionResultBuilder {
    result: AgentExecutionResult,
}

impl ExecutionResultBuilder {
    /// Create a new builder
    pub fn new(repository_id: Uuid, agent_type: String) -> Self {
        Self {
            result: AgentExecutionResult {
                execution_id: None,
                repository_id,
                issue_number: None,
                agent_type,
                status: ExecutionStatus::Pending,
                started_at: None,
                completed_at: None,
                error_message: None,
                result: None,
                quality_score: None,
                pr_number: None,
                analysis_metrics: None,
            },
        }
    }

    /// Set issue number
    pub fn issue_number(mut self, issue_number: i32) -> Self {
        self.result.issue_number = Some(issue_number);
        self
    }

    /// Set status
    pub fn status(mut self, status: ExecutionStatus) -> Self {
        self.result.status = status;
        self
    }

    /// Set started_at to now
    pub fn start_now(mut self) -> Self {
        self.result.started_at = Some(chrono::Utc::now());
        self
    }

    /// Set completed_at to now
    pub fn complete_now(mut self) -> Self {
        self.result.completed_at = Some(chrono::Utc::now());
        self
    }

    /// Set result data
    pub fn result(mut self, result: serde_json::Value) -> Self {
        self.result.result = Some(result);
        self
    }

    /// Set error message
    pub fn error(mut self, error: String) -> Self {
        self.result.error_message = Some(error);
        self
    }

    /// Set quality score
    pub fn quality_score(mut self, score: i32) -> Self {
        self.result.quality_score = Some(score);
        self
    }

    /// Set PR number
    pub fn pr_number(mut self, pr: i32) -> Self {
        self.result.pr_number = Some(pr);
        self
    }

    /// Set analysis metrics
    pub fn analysis_metrics(mut self, metrics: serde_json::Value) -> Self {
        self.result.analysis_metrics = Some(metrics);
        self
    }

    /// Build the execution result
    pub fn build(self) -> AgentExecutionResult {
        self.result
    }
}

/// Macro to implement PersistableAgent for business agents
///
/// This macro provides a default implementation that uses the default trait methods.
/// Each agent only needs to provide their agent_type name.
///
/// # Example
///
/// ```ignore
/// impl_persistable_agent!(AIEntrepreneurAgent, "AIEntrepreneurAgent");
/// ```
#[macro_export]
macro_rules! impl_persistable_agent {
    ($agent_type:ty, $agent_name:expr) => {
        #[async_trait::async_trait]
        impl $crate::persistence::PersistableAgent for $agent_type {
            fn agent_type(&self) -> &'static str {
                $agent_name
            }
        }
    };
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_execution_status_as_str() {
        assert_eq!(ExecutionStatus::Pending.as_str(), "pending");
        assert_eq!(ExecutionStatus::Running.as_str(), "running");
        assert_eq!(ExecutionStatus::Completed.as_str(), "completed");
        assert_eq!(ExecutionStatus::Failed.as_str(), "failed");
    }

    #[test]
    fn test_execution_result_builder() {
        let repo_id = Uuid::new_v4();
        let result = ExecutionResultBuilder::new(repo_id, "TestAgent".to_string())
            .issue_number(123)
            .status(ExecutionStatus::Running)
            .quality_score(95)
            .build();

        assert_eq!(result.repository_id, repo_id);
        assert_eq!(result.agent_type, "TestAgent");
        assert_eq!(result.issue_number, Some(123));
        assert_eq!(result.status, ExecutionStatus::Running);
        assert_eq!(result.quality_score, Some(95));
    }
}
