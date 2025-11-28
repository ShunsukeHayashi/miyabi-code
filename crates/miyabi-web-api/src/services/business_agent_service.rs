//! Business Agent Persistence Service
//!
//! Issue: #1173 - Business Agent Database Persistence Integration
//!
//! This service handles persistence of business agent execution results,
//! analytics, and logs to the PostgreSQL database.

use crate::error::{AppError, Result};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;

/// Business agent execution record
#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct BusinessAgentExecution {
    pub id: Uuid,
    pub user_id: Option<Uuid>,
    pub repository_id: Option<Uuid>,
    pub agent_type: String,
    pub issue_number: Option<i32>,
    pub status: String,
    pub started_at: Option<DateTime<Utc>>,
    pub completed_at: Option<DateTime<Utc>>,
    pub error_message: Option<String>,
    pub result: Option<serde_json::Value>,
    pub quality_score: Option<i32>,
    pub pr_number: Option<i32>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Business agent analytics record
#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct BusinessAgentAnalytics {
    pub id: Uuid,
    pub execution_id: Uuid,
    pub agent_type: String,
    pub metrics: serde_json::Value,
    pub competitors_analyzed: Option<i32>,
    pub market_size_usd: Option<i64>,
    pub growth_rate_percent: Option<f64>,
    pub conversion_rate: Option<f64>,
    pub target_audience_size: Option<i32>,
    pub estimated_revenue_usd: Option<i64>,
    pub engagement_score: Option<i32>,
    pub reach_estimate: Option<i32>,
    pub roi_percent: Option<f64>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Request to create a new business agent execution
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateExecutionRequest {
    pub user_id: Option<Uuid>,
    pub repository_id: Option<Uuid>,
    pub agent_type: String,
    pub issue_number: Option<i32>,
}

/// Request to complete a business agent execution
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompleteExecutionRequest {
    pub status: String,
    pub result: Option<serde_json::Value>,
    pub error_message: Option<String>,
    pub quality_score: Option<i32>,
    pub pr_number: Option<i32>,
}

/// Analytics data to save
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalyticsData {
    pub metrics: serde_json::Value,
    pub competitors_analyzed: Option<i32>,
    pub market_size_usd: Option<i64>,
    pub growth_rate_percent: Option<f64>,
    pub conversion_rate: Option<f64>,
    pub target_audience_size: Option<i32>,
    pub estimated_revenue_usd: Option<i64>,
    pub engagement_score: Option<i32>,
    pub reach_estimate: Option<i32>,
    pub roi_percent: Option<f64>,
}

/// Business Agent Persistence Service
pub struct BusinessAgentService {
    db: PgPool,
}

impl BusinessAgentService {
    /// Create a new business agent service
    pub fn new(db: PgPool) -> Self {
        Self { db }
    }

    /// Create a new execution record (status: pending)
    pub async fn create_execution(
        &self,
        request: CreateExecutionRequest,
    ) -> Result<BusinessAgentExecution> {
        let execution = sqlx::query_as::<_, BusinessAgentExecution>(
            r#"
            INSERT INTO agent_executions (
                user_id, repository_id, agent_type, issue_number, status
            )
            VALUES ($1, $2, $3, $4, 'pending')
            RETURNING id, user_id, repository_id, agent_type, issue_number, status,
                      started_at, completed_at, error_message, result, quality_score, pr_number,
                      created_at, updated_at
            "#,
        )
        .bind(request.user_id)
        .bind(request.repository_id)
        .bind(&request.agent_type)
        .bind(request.issue_number)
        .fetch_one(&self.db)
        .await
        .map_err(AppError::Database)?;

        tracing::info!(
            "Created business agent execution: id={}, agent_type={}",
            execution.id,
            execution.agent_type
        );

        Ok(execution)
    }

    /// Start an execution (status: running)
    pub async fn start_execution(&self, execution_id: Uuid) -> Result<BusinessAgentExecution> {
        let execution = sqlx::query_as::<_, BusinessAgentExecution>(
            r#"
            UPDATE agent_executions
            SET status = 'running', started_at = NOW(), updated_at = NOW()
            WHERE id = $1
            RETURNING id, user_id, repository_id, agent_type, issue_number, status,
                      started_at, completed_at, error_message, result, quality_score, pr_number,
                      created_at, updated_at
            "#,
        )
        .bind(execution_id)
        .fetch_optional(&self.db)
        .await
        .map_err(AppError::Database)?
        .ok_or_else(|| AppError::NotFound(format!("Execution {} not found", execution_id)))?;

        tracing::info!(
            "Started business agent execution: id={}, agent_type={}",
            execution.id,
            execution.agent_type
        );

        Ok(execution)
    }

    /// Complete an execution (status: completed/failed)
    pub async fn complete_execution(
        &self,
        execution_id: Uuid,
        request: CompleteExecutionRequest,
    ) -> Result<BusinessAgentExecution> {
        let execution = sqlx::query_as::<_, BusinessAgentExecution>(
            r#"
            UPDATE agent_executions
            SET status = $2,
                completed_at = NOW(),
                result = $3,
                error_message = $4,
                quality_score = $5,
                pr_number = $6,
                updated_at = NOW()
            WHERE id = $1
            RETURNING id, user_id, repository_id, agent_type, issue_number, status,
                      started_at, completed_at, error_message, result, quality_score, pr_number,
                      created_at, updated_at
            "#,
        )
        .bind(execution_id)
        .bind(&request.status)
        .bind(&request.result)
        .bind(&request.error_message)
        .bind(request.quality_score)
        .bind(request.pr_number)
        .fetch_optional(&self.db)
        .await
        .map_err(AppError::Database)?
        .ok_or_else(|| AppError::NotFound(format!("Execution {} not found", execution_id)))?;

        tracing::info!(
            "Completed business agent execution: id={}, status={}",
            execution.id,
            execution.status
        );

        Ok(execution)
    }

    /// Save analytics data for an execution
    pub async fn save_analytics(
        &self,
        execution_id: Uuid,
        agent_type: &str,
        analytics: AnalyticsData,
    ) -> Result<BusinessAgentAnalytics> {
        let record = sqlx::query_as::<_, BusinessAgentAnalytics>(
            r#"
            INSERT INTO business_agent_analytics (
                execution_id, agent_type, metrics,
                competitors_analyzed, market_size_usd, growth_rate_percent,
                conversion_rate, target_audience_size, estimated_revenue_usd,
                engagement_score, reach_estimate, roi_percent
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *
            "#,
        )
        .bind(execution_id)
        .bind(agent_type)
        .bind(&analytics.metrics)
        .bind(analytics.competitors_analyzed)
        .bind(analytics.market_size_usd)
        .bind(analytics.growth_rate_percent)
        .bind(analytics.conversion_rate)
        .bind(analytics.target_audience_size)
        .bind(analytics.estimated_revenue_usd)
        .bind(analytics.engagement_score)
        .bind(analytics.reach_estimate)
        .bind(analytics.roi_percent)
        .fetch_one(&self.db)
        .await
        .map_err(AppError::Database)?;

        tracing::info!(
            "Saved business agent analytics: execution_id={}, agent_type={}",
            execution_id,
            agent_type
        );

        Ok(record)
    }

    /// Log a message for an execution
    pub async fn log_message(
        &self,
        execution_id: Uuid,
        log_level: &str,
        message: &str,
        metadata: Option<serde_json::Value>,
    ) -> Result<()> {
        sqlx::query(
            r#"
            INSERT INTO agent_execution_logs (execution_id, log_level, message, metadata)
            VALUES ($1, $2, $3, $4)
            "#,
        )
        .bind(execution_id)
        .bind(log_level)
        .bind(message)
        .bind(metadata)
        .execute(&self.db)
        .await
        .map_err(AppError::Database)?;

        Ok(())
    }

    /// Get execution by ID
    pub async fn get_execution(&self, execution_id: Uuid) -> Result<BusinessAgentExecution> {
        let execution = sqlx::query_as::<_, BusinessAgentExecution>(
            r#"
            SELECT id, user_id, repository_id, agent_type, issue_number, status,
                   started_at, completed_at, error_message, result, quality_score, pr_number,
                   created_at, updated_at
            FROM agent_executions
            WHERE id = $1
            "#,
        )
        .bind(execution_id)
        .fetch_optional(&self.db)
        .await
        .map_err(AppError::Database)?
        .ok_or_else(|| AppError::NotFound(format!("Execution {} not found", execution_id)))?;

        Ok(execution)
    }

    /// List executions by user ID
    pub async fn list_executions_by_user(
        &self,
        user_id: Uuid,
        limit: i64,
        offset: i64,
    ) -> Result<Vec<BusinessAgentExecution>> {
        let executions = sqlx::query_as::<_, BusinessAgentExecution>(
            r#"
            SELECT id, user_id, repository_id, agent_type, issue_number, status,
                   started_at, completed_at, error_message, result, quality_score, pr_number,
                   created_at, updated_at
            FROM agent_executions
            WHERE user_id = $1
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
            "#,
        )
        .bind(user_id)
        .bind(limit)
        .bind(offset)
        .fetch_all(&self.db)
        .await
        .map_err(AppError::Database)?;

        Ok(executions)
    }

    /// List executions by agent type
    pub async fn list_executions_by_agent_type(
        &self,
        agent_type: &str,
        limit: i64,
        offset: i64,
    ) -> Result<Vec<BusinessAgentExecution>> {
        let executions = sqlx::query_as::<_, BusinessAgentExecution>(
            r#"
            SELECT id, user_id, repository_id, agent_type, issue_number, status,
                   started_at, completed_at, error_message, result, quality_score, pr_number,
                   created_at, updated_at
            FROM agent_executions
            WHERE agent_type = $1
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
            "#,
        )
        .bind(agent_type)
        .bind(limit)
        .bind(offset)
        .fetch_all(&self.db)
        .await
        .map_err(AppError::Database)?;

        Ok(executions)
    }

    /// Get analytics for an execution
    pub async fn get_analytics(
        &self,
        execution_id: Uuid,
    ) -> Result<Option<BusinessAgentAnalytics>> {
        let analytics = sqlx::query_as::<_, BusinessAgentAnalytics>(
            r#"
            SELECT *
            FROM business_agent_analytics
            WHERE execution_id = $1
            "#,
        )
        .bind(execution_id)
        .fetch_optional(&self.db)
        .await
        .map_err(AppError::Database)?;

        Ok(analytics)
    }

    /// Get execution summary by agent type (for dashboard)
    pub async fn get_execution_summary_by_agent_type(&self) -> Result<Vec<AgentTypeSummary>> {
        let summaries = sqlx::query_as::<_, AgentTypeSummary>(
            r#"
            SELECT
                agent_type,
                COUNT(*) as total_executions,
                COUNT(*) FILTER (WHERE status = 'completed') as completed,
                COUNT(*) FILTER (WHERE status = 'failed') as failed,
                AVG(quality_score) FILTER (WHERE quality_score IS NOT NULL) as avg_quality_score,
                AVG(EXTRACT(EPOCH FROM (completed_at - started_at)))
                    FILTER (WHERE completed_at IS NOT NULL AND started_at IS NOT NULL) as avg_duration_seconds
            FROM agent_executions
            GROUP BY agent_type
            ORDER BY total_executions DESC
            "#,
        )
        .fetch_all(&self.db)
        .await
        .map_err(AppError::Database)?;

        Ok(summaries)
    }
}

/// Summary statistics by agent type
#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct AgentTypeSummary {
    pub agent_type: String,
    pub total_executions: i64,
    pub completed: i64,
    pub failed: i64,
    pub avg_quality_score: Option<f64>,
    pub avg_duration_seconds: Option<f64>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_execution_request() {
        let request = CreateExecutionRequest {
            user_id: Some(Uuid::new_v4()),
            repository_id: Some(Uuid::new_v4()),
            agent_type: "MarketResearchAgent".to_string(),
            issue_number: Some(123),
        };

        assert_eq!(request.agent_type, "MarketResearchAgent");
        assert!(request.user_id.is_some());
    }

    #[test]
    fn test_complete_execution_request() {
        let request = CompleteExecutionRequest {
            status: "completed".to_string(),
            result: Some(serde_json::json!({"success": true})),
            error_message: None,
            quality_score: Some(95),
            pr_number: None,
        };

        assert_eq!(request.status, "completed");
        assert_eq!(request.quality_score, Some(95));
    }

    #[test]
    fn test_analytics_data() {
        let analytics = AnalyticsData {
            metrics: serde_json::json!({"test": true}),
            competitors_analyzed: Some(10),
            market_size_usd: Some(1_000_000),
            growth_rate_percent: Some(15.5),
            conversion_rate: None,
            target_audience_size: None,
            estimated_revenue_usd: None,
            engagement_score: None,
            reach_estimate: None,
            roi_percent: None,
        };

        assert_eq!(analytics.competitors_analyzed, Some(10));
        assert_eq!(analytics.market_size_usd, Some(1_000_000));
    }
}
