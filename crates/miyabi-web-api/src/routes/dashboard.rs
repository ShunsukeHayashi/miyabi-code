//! Dashboard route handlers

use crate::{
    error::Result,
    middleware::AuthenticatedUser,
    models::AgentExecution,
    AppState,
};
use axum::{
    extract::{Extension, State},
    Json,
};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

/// Dashboard summary statistics
#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct DashboardSummary {
    /// Total number of agent executions
    pub total_executions: i64,
    /// Number of running executions
    pub running_executions: i64,
    /// Number of completed executions
    pub completed_executions: i64,
    /// Number of failed executions
    pub failed_executions: i64,
    /// Number of pending executions
    pub pending_executions: i64,
    /// Total number of repositories
    pub total_repositories: i64,
    /// Total number of successful PRs created
    pub total_prs_created: i64,
}

/// Recent execution item
#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct RecentExecution {
    /// Execution details
    #[serde(flatten)]
    pub execution: AgentExecution,
    /// Repository owner
    pub repository_owner: String,
    /// Repository name
    pub repository_name: String,
}

/// Get dashboard summary
///
/// Returns aggregate statistics for user's agent executions and repositories
#[utoipa::path(
    get,
    path = "/api/v1/dashboard/summary",
    tag = "dashboard",
    responses(
        (status = 200, description = "Dashboard summary", body = DashboardSummary),
        (status = 401, description = "Unauthorized"),
        (status = 500, description = "Internal server error")
    )
)]
pub async fn get_dashboard_summary(
    Extension(auth_user): Extension<AuthenticatedUser>,
    State(state): State<AppState>,
) -> Result<Json<DashboardSummary>> {
    // Get execution counts by status
    #[derive(sqlx::FromRow)]
    struct StatusCounts {
        total: Option<i64>,
        running: Option<i64>,
        completed: Option<i64>,
        failed: Option<i64>,
        pending: Option<i64>,
        prs_created: Option<i64>,
    }

    let status_counts = sqlx::query_as::<_, StatusCounts>(
        r#"
        SELECT
            COUNT(*) as total,
            COUNT(CASE WHEN ae.status = 'running' THEN 1 END) as running,
            COUNT(CASE WHEN ae.status = 'completed' THEN 1 END) as completed,
            COUNT(CASE WHEN ae.status = 'failed' THEN 1 END) as failed,
            COUNT(CASE WHEN ae.status = 'pending' THEN 1 END) as pending,
            COUNT(CASE WHEN ae.pr_number IS NOT NULL THEN 1 END) as prs_created
        FROM agent_executions ae
        INNER JOIN repositories r ON ae.repository_id = r.id
        WHERE r.user_id = $1
        "#,
    )
    .bind(auth_user.user_id)
    .fetch_one(&state.db)
    .await?;

    // Get repository count
    #[derive(sqlx::FromRow)]
    struct RepoCount {
        count: Option<i64>,
    }

    let repo_count = sqlx::query_as::<_, RepoCount>(
        r#"
        SELECT COUNT(*) as count
        FROM repositories
        WHERE user_id = $1 AND is_active = true
        "#,
    )
    .bind(auth_user.user_id)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(DashboardSummary {
        total_executions: status_counts.total.unwrap_or(0),
        running_executions: status_counts.running.unwrap_or(0),
        completed_executions: status_counts.completed.unwrap_or(0),
        failed_executions: status_counts.failed.unwrap_or(0),
        pending_executions: status_counts.pending.unwrap_or(0),
        total_repositories: repo_count.count.unwrap_or(0),
        total_prs_created: status_counts.prs_created.unwrap_or(0),
    }))
}

/// Get recent executions
///
/// Returns the most recent agent executions with repository information
#[utoipa::path(
    get,
    path = "/api/v1/dashboard/recent",
    tag = "dashboard",
    responses(
        (status = 200, description = "Recent executions", body = Vec<RecentExecution>),
        (status = 401, description = "Unauthorized"),
        (status = 500, description = "Internal server error")
    )
)]
pub async fn get_recent_executions(
    Extension(auth_user): Extension<AuthenticatedUser>,
    State(state): State<AppState>,
) -> Result<Json<Vec<RecentExecution>>> {
    // Query recent executions with repository info
    #[derive(sqlx::FromRow)]
    struct ExecutionWithRepo {
        id: uuid::Uuid,
        repository_id: uuid::Uuid,
        issue_number: i32,
        agent_type: String,
        status: String,
        started_at: Option<chrono::DateTime<chrono::Utc>>,
        completed_at: Option<chrono::DateTime<chrono::Utc>>,
        result_summary: Option<serde_json::Value>,
        quality_score: Option<i32>,
        pr_number: Option<i32>,
        created_at: chrono::DateTime<chrono::Utc>,
        updated_at: chrono::DateTime<chrono::Utc>,
        repository_owner: String,
        repository_name: String,
    }

    let executions = sqlx::query_as::<_, ExecutionWithRepo>(
        r#"
        SELECT
            ae.id, ae.repository_id, ae.issue_number, ae.agent_type, ae.status,
            ae.started_at, ae.completed_at, ae.result_summary, ae.quality_score,
            ae.pr_number, ae.created_at, ae.updated_at,
            r.owner as repository_owner,
            r.name as repository_name
        FROM agent_executions ae
        INNER JOIN repositories r ON ae.repository_id = r.id
        WHERE r.user_id = $1
        ORDER BY ae.created_at DESC
        LIMIT 20
        "#,
    )
    .bind(auth_user.user_id)
    .fetch_all(&state.db)
    .await?;

    let recent_executions: Vec<RecentExecution> = executions
        .into_iter()
        .map(|record| RecentExecution {
            execution: AgentExecution {
                id: record.id,
                repository_id: record.repository_id,
                issue_number: record.issue_number,
                agent_type: record.agent_type,
                status: record.status,
                started_at: record.started_at,
                completed_at: record.completed_at,
                result_summary: record.result_summary,
                quality_score: record.quality_score,
                pr_number: record.pr_number,
                created_at: record.created_at,
                updated_at: record.updated_at,
            },
            repository_owner: record.repository_owner,
            repository_name: record.repository_name,
        })
        .collect();

    Ok(Json(recent_executions))
}
