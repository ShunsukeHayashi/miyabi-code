//! Workflow Service
//!
//! Manages agent workflow executions and orchestration
//! Issue: #983 Phase 2.1 - Service Layer Refactoring

use sqlx::PgPool;
use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use uuid::Uuid;

/// Workflow execution model
#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct WorkflowExecution {
    pub id: Uuid,
    pub workflow_id: Uuid,
    pub task_id: Option<Uuid>,
    pub name: String,
    pub status: String,
    pub agent_type: String,
    pub input: Option<serde_json::Value>,
    pub output: Option<serde_json::Value>,
    pub error: Option<String>,
    pub started_at: Option<DateTime<Utc>>,
    pub completed_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Workflow template model
#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct WorkflowTemplate {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub steps: serde_json::Value,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Request to start a workflow
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StartWorkflowRequest {
    pub workflow_id: Uuid,
    pub name: String,
    pub agent_type: String,
    pub task_id: Option<Uuid>,
    pub input: Option<serde_json::Value>,
}

/// Workflow execution status
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum WorkflowStatus {
    Pending,
    Running,
    Completed,
    Failed,
    Cancelled,
}

impl std::fmt::Display for WorkflowStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            WorkflowStatus::Pending => write!(f, "pending"),
            WorkflowStatus::Running => write!(f, "running"),
            WorkflowStatus::Completed => write!(f, "completed"),
            WorkflowStatus::Failed => write!(f, "failed"),
            WorkflowStatus::Cancelled => write!(f, "cancelled"),
        }
    }
}

/// Workflow execution filter
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct WorkflowFilter {
    pub workflow_id: Option<Uuid>,
    pub task_id: Option<Uuid>,
    pub status: Option<String>,
    pub agent_type: Option<String>,
    pub page: Option<i64>,
    pub limit: Option<i64>,
}

/// Workflow Service for managing workflow executions
#[derive(Clone)]
pub struct WorkflowService {
    db: PgPool,
}

impl WorkflowService {
    /// Create a new WorkflowService
    pub fn new(db: PgPool) -> Self {
        Self { db }
    }

    /// Start a new workflow execution
    pub async fn start(
        &self,
        user_id: Uuid,
        req: StartWorkflowRequest,
    ) -> Result<WorkflowExecution, sqlx::Error> {
        let execution = sqlx::query_as::<_, WorkflowExecution>(
            r#"
            INSERT INTO workflow_executions (
                workflow_id, task_id, name, status, agent_type, input, started_at
            )
            VALUES ($1, $2, $3, 'running', $4, $5, NOW())
            RETURNING *
            "#,
        )
        .bind(req.workflow_id)
        .bind(req.task_id)
        .bind(&req.name)
        .bind(&req.agent_type)
        .bind(&req.input)
        .fetch_one(&self.db)
        .await?;

        // Log the start event
        let _ = self.log_event(user_id, &execution, "workflow_started").await;

        Ok(execution)
    }

    /// Get a workflow execution by ID
    pub async fn get(&self, execution_id: Uuid) -> Result<Option<WorkflowExecution>, sqlx::Error> {
        let execution = sqlx::query_as::<_, WorkflowExecution>(
            "SELECT * FROM workflow_executions WHERE id = $1",
        )
        .bind(execution_id)
        .fetch_optional(&self.db)
        .await?;

        Ok(execution)
    }

    /// List workflow executions with filtering
    pub async fn list(&self, filter: WorkflowFilter) -> Result<Vec<WorkflowExecution>, sqlx::Error> {
        let page = filter.page.unwrap_or(1).max(1);
        let limit = filter.limit.unwrap_or(20).min(100);
        let offset = (page - 1) * limit;

        let executions = sqlx::query_as::<_, WorkflowExecution>(
            r#"
            SELECT * FROM workflow_executions
            WHERE ($1::uuid IS NULL OR workflow_id = $1)
              AND ($2::uuid IS NULL OR task_id = $2)
              AND ($3::text IS NULL OR status = $3)
              AND ($4::text IS NULL OR agent_type = $4)
            ORDER BY created_at DESC
            LIMIT $5 OFFSET $6
            "#,
        )
        .bind(filter.workflow_id)
        .bind(filter.task_id)
        .bind(&filter.status)
        .bind(&filter.agent_type)
        .bind(limit)
        .bind(offset)
        .fetch_all(&self.db)
        .await?;

        Ok(executions)
    }

    /// Complete a workflow execution
    pub async fn complete(
        &self,
        execution_id: Uuid,
        output: Option<serde_json::Value>,
    ) -> Result<Option<WorkflowExecution>, sqlx::Error> {
        let execution = sqlx::query_as::<_, WorkflowExecution>(
            r#"
            UPDATE workflow_executions
            SET status = 'completed',
                output = $2,
                completed_at = NOW(),
                updated_at = NOW()
            WHERE id = $1 AND status = 'running'
            RETURNING *
            "#,
        )
        .bind(execution_id)
        .bind(&output)
        .fetch_optional(&self.db)
        .await?;

        Ok(execution)
    }

    /// Fail a workflow execution
    pub async fn fail(
        &self,
        execution_id: Uuid,
        error: &str,
    ) -> Result<Option<WorkflowExecution>, sqlx::Error> {
        let execution = sqlx::query_as::<_, WorkflowExecution>(
            r#"
            UPDATE workflow_executions
            SET status = 'failed',
                error = $2,
                completed_at = NOW(),
                updated_at = NOW()
            WHERE id = $1 AND status = 'running'
            RETURNING *
            "#,
        )
        .bind(execution_id)
        .bind(error)
        .fetch_optional(&self.db)
        .await?;

        Ok(execution)
    }

    /// Cancel a workflow execution
    pub async fn cancel(&self, execution_id: Uuid) -> Result<Option<WorkflowExecution>, sqlx::Error> {
        let execution = sqlx::query_as::<_, WorkflowExecution>(
            r#"
            UPDATE workflow_executions
            SET status = 'cancelled',
                completed_at = NOW(),
                updated_at = NOW()
            WHERE id = $1 AND status IN ('pending', 'running')
            RETURNING *
            "#,
        )
        .bind(execution_id)
        .fetch_optional(&self.db)
        .await?;

        Ok(execution)
    }

    /// Get running executions count
    pub async fn get_running_count(&self) -> Result<i64, sqlx::Error> {
        let count = sqlx::query_scalar::<_, i64>(
            "SELECT COUNT(*) FROM workflow_executions WHERE status = 'running'",
        )
        .fetch_one(&self.db)
        .await?;

        Ok(count)
    }

    /// Get workflow templates
    pub async fn list_templates(&self) -> Result<Vec<WorkflowTemplate>, sqlx::Error> {
        let templates = sqlx::query_as::<_, WorkflowTemplate>(
            "SELECT * FROM workflow_templates WHERE is_active = true ORDER BY name",
        )
        .fetch_all(&self.db)
        .await?;

        Ok(templates)
    }

    /// Log workflow event to activity log
    async fn log_event(
        &self,
        user_id: Uuid,
        execution: &WorkflowExecution,
        event_type: &str,
    ) -> Result<(), sqlx::Error> {
        let description = format!(
            "Workflow '{}' {}: {}",
            execution.name,
            event_type,
            execution.agent_type
        );

        let _ = sqlx::query(
            r#"
            INSERT INTO activity_log (user_id, activity_type, description, actor)
            VALUES ($1, $2, $3, $4)
            "#,
        )
        .bind(user_id)
        .bind(event_type)
        .bind(&description)
        .bind("system")
        .execute(&self.db)
        .await;

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_workflow_status_display() {
        assert_eq!(WorkflowStatus::Running.to_string(), "running");
        assert_eq!(WorkflowStatus::Completed.to_string(), "completed");
    }

    #[test]
    fn test_workflow_filter_default() {
        let filter = WorkflowFilter::default();
        assert!(filter.workflow_id.is_none());
        assert!(filter.status.is_none());
    }
}
