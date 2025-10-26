//! Agent execution service
//!
//! This service handles agent execution lifecycle:
//! - Spawning agent processes asynchronously
//! - Streaming logs to database in real-time
//! - Tracking execution status
//! - Storing execution results

use crate::{
    error::{AppError, Result},
    events::EventBroadcaster,
    models::{ExecutionLog, ExecutionOptions},
};
use chrono::Utc;
use sqlx::PgPool;
use std::process::Stdio;
use tokio::{
    io::{AsyncBufReadExt, BufReader},
    process::Command,
};
use tracing::{error, info, warn};
use uuid::Uuid;

/// Agent executor service
pub struct AgentExecutor {
    pub(crate) db: PgPool,
    event_broadcaster: Option<EventBroadcaster>,
}

impl AgentExecutor {
    /// Create a new agent executor
    pub fn new(db: PgPool) -> Self {
        Self {
            db,
            event_broadcaster: None,
        }
    }

    /// Create a new agent executor with event broadcasting
    pub fn with_events(db: PgPool, event_broadcaster: EventBroadcaster) -> Self {
        Self {
            db,
            event_broadcaster: Some(event_broadcaster),
        }
    }

    /// Execute an agent asynchronously
    ///
    /// This function spawns a background task that:
    /// 1. Updates execution status to 'running'
    /// 2. Spawns the miyabi CLI process
    /// 3. Streams logs to database in real-time
    /// 4. Updates execution status on completion
    /// 5. Broadcasts events for real-time monitoring
    pub async fn execute_agent(
        &self,
        execution_id: Uuid,
        repository_id: Uuid,
        issue_number: i32,
        agent_type: String,
        options: Option<ExecutionOptions>,
    ) -> Result<()> {
        let db = self.db.clone();
        let event_broadcaster = self.event_broadcaster.clone();

        // Broadcast execution started event
        if let Some(ref broadcaster) = event_broadcaster {
            broadcaster.execution_started(
                execution_id,
                repository_id,
                issue_number,
                agent_type.clone(),
            );
        }

        // Spawn background task for agent execution
        tokio::spawn(async move {
            if let Err(e) = Self::run_agent_execution(
                db,
                execution_id,
                repository_id,
                issue_number,
                &agent_type,
                options,
                event_broadcaster,
            )
            .await
            {
                error!("Agent execution failed: {}", e);
            }
        });

        Ok(())
    }

    /// Run agent execution (internal)
    async fn run_agent_execution(
        db: PgPool,
        execution_id: Uuid,
        repository_id: Uuid,
        issue_number: i32,
        agent_type: &str,
        options: Option<ExecutionOptions>,
        event_broadcaster: Option<EventBroadcaster>,
    ) -> Result<()> {
        // Update status to running
        sqlx::query(
            r#"
            UPDATE agent_executions
            SET status = 'running', started_at = NOW()
            WHERE id = $1
            "#,
        )
        .bind(execution_id)
        .execute(&db)
        .await?;

        // Log execution start
        Self::log_message(
            &db,
            execution_id,
            "INFO",
            &format!(
                "Starting agent execution: agent={}, issue={}",
                agent_type, issue_number
            ),
            None,
        )
        .await?;

        // Get repository information
        let repo =
            sqlx::query_as::<_, (String,)>("SELECT full_name FROM repositories WHERE id = $1")
                .bind(repository_id)
                .fetch_optional(&db)
                .await?
                .ok_or_else(|| AppError::NotFound("Repository not found".to_string()))?;

        let repo_full_name = repo.0;

        // Build miyabi CLI command
        let mut cmd = Command::new("miyabi");
        cmd.arg("agent")
            .arg("run")
            .arg(agent_type)
            .arg("--issue")
            .arg(issue_number.to_string())
            .arg("--repository")
            .arg(&repo_full_name);

        // Add options if provided
        if let Some(opts) = options {
            if opts.use_worktree {
                cmd.arg("--worktree");
            }
            if opts.auto_pr {
                cmd.arg("--auto-pr");
            }
            if opts.slack_notify {
                cmd.arg("--slack-notify");
            }
        }

        // Spawn process with piped stdout/stderr
        cmd.stdout(Stdio::piped()).stderr(Stdio::piped());

        info!("Spawning agent process: {:?}", cmd);

        let mut child = cmd
            .spawn()
            .map_err(|e| AppError::Internal(format!("Failed to spawn agent process: {}", e)))?;

        // Stream stdout and stderr
        let stdout = child
            .stdout
            .take()
            .ok_or_else(|| AppError::Internal("Failed to capture stdout".to_string()))?;
        let stderr = child
            .stderr
            .take()
            .ok_or_else(|| AppError::Internal("Failed to capture stderr".to_string()))?;

        // Spawn tasks to read stdout and stderr
        let db_clone = db.clone();
        let stdout_task = tokio::spawn(async move {
            let reader = BufReader::new(stdout);
            let mut lines = reader.lines();

            while let Ok(Some(line)) = lines.next_line().await {
                let _ = Self::log_message(&db_clone, execution_id, "INFO", &line, None).await;
            }
        });

        let db_clone = db.clone();
        let stderr_task = tokio::spawn(async move {
            let reader = BufReader::new(stderr);
            let mut lines = reader.lines();

            while let Ok(Some(line)) = lines.next_line().await {
                let _ = Self::log_message(&db_clone, execution_id, "ERROR", &line, None).await;
            }
        });

        // Wait for process to complete
        let output = child
            .wait()
            .await
            .map_err(|e| AppError::Internal(format!("Failed to wait for agent process: {}", e)))?;

        // Wait for log streaming tasks to complete
        let _ = tokio::join!(stdout_task, stderr_task);

        // Update execution status based on exit code
        if output.success() {
            sqlx::query(
                r#"
                UPDATE agent_executions
                SET status = 'completed', completed_at = NOW()
                WHERE id = $1
                "#,
            )
            .bind(execution_id)
            .execute(&db)
            .await?;

            Self::log_message(
                &db,
                execution_id,
                "INFO",
                "Agent execution completed successfully",
                None,
            )
            .await?;

            // Broadcast completion event
            if let Some(ref broadcaster) = event_broadcaster {
                broadcaster.execution_completed(execution_id, None, None);
            }

            info!("Agent execution completed: id={}", execution_id);
        } else {
            let error_message = format!("Agent process exited with code: {:?}", output.code());

            sqlx::query(
                r#"
                UPDATE agent_executions
                SET status = 'failed', completed_at = NOW(), error_message = $2
                WHERE id = $1
                "#,
            )
            .bind(execution_id)
            .bind(&error_message)
            .execute(&db)
            .await?;

            // Broadcast failure event
            if let Some(ref broadcaster) = event_broadcaster {
                broadcaster.execution_failed(execution_id, error_message.clone());
            }

            Self::log_message(&db, execution_id, "ERROR", &error_message, None).await?;

            warn!(
                "Agent execution failed: id={}, error={}",
                execution_id, error_message
            );
        }

        Ok(())
    }

    /// Log a message to the database
    async fn log_message(
        db: &PgPool,
        execution_id: Uuid,
        log_level: &str,
        message: &str,
        metadata: Option<serde_json::Value>,
    ) -> Result<()> {
        sqlx::query(
            r#"
            INSERT INTO execution_logs (execution_id, log_level, message, metadata)
            VALUES ($1, $2, $3, $4)
            "#,
        )
        .bind(execution_id)
        .bind(log_level)
        .bind(message)
        .bind(metadata)
        .execute(db)
        .await?;

        Ok(())
    }

    /// Get execution logs
    pub async fn get_logs(
        &self,
        execution_id: Uuid,
        limit: Option<i64>,
    ) -> Result<Vec<ExecutionLog>> {
        let limit = limit.unwrap_or(1000);

        let logs = sqlx::query_as::<_, ExecutionLog>(
            r#"
            SELECT id, execution_id, log_level, message, timestamp, metadata
            FROM execution_logs
            WHERE execution_id = $1
            ORDER BY timestamp ASC
            LIMIT $2
            "#,
        )
        .bind(execution_id)
        .bind(limit)
        .fetch_all(&self.db)
        .await?;

        Ok(logs)
    }

    /// Get recent logs (for streaming)
    pub async fn get_logs_since(
        &self,
        execution_id: Uuid,
        since_timestamp: chrono::DateTime<Utc>,
    ) -> Result<Vec<ExecutionLog>> {
        let logs = sqlx::query_as::<_, ExecutionLog>(
            r#"
            SELECT id, execution_id, log_level, message, timestamp, metadata
            FROM execution_logs
            WHERE execution_id = $1 AND timestamp > $2
            ORDER BY timestamp ASC
            "#,
        )
        .bind(execution_id)
        .bind(since_timestamp)
        .fetch_all(&self.db)
        .await?;

        Ok(logs)
    }
}

#[cfg(test)]
mod tests {
    #[test]
    fn test_agent_executor_creation() {
        // This test requires a database connection
        // In a real scenario, use test containers or mock
    }
}
