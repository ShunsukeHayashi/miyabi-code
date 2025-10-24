//! Agent execution route handlers

use crate::{
    error::{AppError, Result},
    middleware::AuthenticatedUser,
    models::{AgentExecution, ExecuteAgentRequest, ExecutionLog},
    services::AgentExecutor,
    AppState,
};
use axum::{
    extract::{Extension, Path, State},
    http::StatusCode,
    Json,
};
use uuid::Uuid;

/// Execute agent
///
/// Starts an agent execution for a GitHub issue
#[utoipa::path(
    post,
    path = "/api/v1/agents/execute",
    tag = "agents",
    request_body = ExecuteAgentRequest,
    responses(
        (status = 201, description = "Agent execution started", body = AgentExecution),
        (status = 400, description = "Invalid request"),
        (status = 401, description = "Unauthorized"),
        (status = 500, description = "Internal server error")
    )
)]
pub async fn execute_agent(
    Extension(auth_user): Extension<AuthenticatedUser>,
    State(state): State<AppState>,
    Json(request): Json<ExecuteAgentRequest>,
) -> Result<(StatusCode, Json<AgentExecution>)> {
    // Verify user has access to repository
    let _repository = sqlx::query(
        r#"
        SELECT id FROM repositories
        WHERE id = $1 AND user_id = $2
        "#,
    )
    .bind(request.repository_id)
    .bind(auth_user.user_id)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Repository not found".to_string()))?;

    // Create execution record with options
    let agent_type_str = request.agent_type.to_string();
    let options_json = request.options.as_ref().map(|opts| {
        serde_json::to_value(opts).unwrap_or(serde_json::json!({}))
    });

    let execution = sqlx::query_as::<_, AgentExecution>(
        r#"
        INSERT INTO agent_executions (user_id, repository_id, issue_number, agent_type, status, options)
        VALUES ($1, $2, $3, $4, 'pending', $5)
        RETURNING id, repository_id, issue_number, agent_type, status, started_at, completed_at,
                  result_summary, quality_score, pr_number, created_at, updated_at
        "#,
    )
    .bind(auth_user.user_id)
    .bind(request.repository_id)
    .bind(request.issue_number)
    .bind(&agent_type_str)
    .bind(options_json)
    .fetch_one(&state.db)
    .await?;

    // Trigger agent execution in background with event broadcasting
    let executor = AgentExecutor::with_events(state.db.clone(), state.event_broadcaster.clone());
    executor
        .execute_agent(
            execution.id,
            request.repository_id,
            request.issue_number,
            agent_type_str.clone(),
            request.options,
        )
        .await?;

    tracing::info!(
        "Agent execution started: id={}, repository={}, issue={}, agent={}",
        execution.id,
        request.repository_id,
        request.issue_number,
        request.agent_type
    );

    Ok((StatusCode::CREATED, Json(execution)))
}

/// List agent executions
///
/// Returns execution history for user's repositories
#[utoipa::path(
    get,
    path = "/api/v1/agents/executions",
    tag = "agents",
    responses(
        (status = 200, description = "List of executions", body = Vec<AgentExecution>),
        (status = 401, description = "Unauthorized"),
        (status = 500, description = "Internal server error")
    )
)]
pub async fn list_executions(
    Extension(auth_user): Extension<AuthenticatedUser>,
    State(state): State<AppState>,
) -> Result<Json<Vec<AgentExecution>>> {
    // Query executions for user's repositories
    let executions = sqlx::query_as::<_, AgentExecution>(
        r#"
        SELECT ae.id, ae.repository_id, ae.issue_number, ae.agent_type, ae.status,
               ae.started_at, ae.completed_at, ae.result_summary, ae.quality_score,
               ae.pr_number, ae.created_at, ae.updated_at
        FROM agent_executions ae
        INNER JOIN repositories r ON ae.repository_id = r.id
        WHERE r.user_id = $1
        ORDER BY ae.created_at DESC
        LIMIT 100
        "#,
    )
    .bind(auth_user.user_id)
    .fetch_all(&state.db)
    .await?;

    Ok(Json(executions))
}

/// Get agent execution by ID
///
/// Returns execution details and results
#[utoipa::path(
    get,
    path = "/api/v1/agents/executions/{id}",
    tag = "agents",
    params(
        ("id" = Uuid, Path, description = "Execution ID")
    ),
    responses(
        (status = 200, description = "Execution details", body = AgentExecution),
        (status = 401, description = "Unauthorized"),
        (status = 404, description = "Execution not found"),
        (status = 500, description = "Internal server error")
    )
)]
pub async fn get_execution(
    Extension(auth_user): Extension<AuthenticatedUser>,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<AgentExecution>> {
    // Query execution with user verification
    let execution = sqlx::query_as::<_, AgentExecution>(
        r#"
        SELECT ae.id, ae.repository_id, ae.issue_number, ae.agent_type, ae.status,
               ae.started_at, ae.completed_at, ae.result_summary, ae.quality_score,
               ae.pr_number, ae.created_at, ae.updated_at
        FROM agent_executions ae
        INNER JOIN repositories r ON ae.repository_id = r.id
        WHERE ae.id = $1 AND r.user_id = $2
        "#,
    )
    .bind(id)
    .bind(auth_user.user_id)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Execution not found".to_string()))?;

    Ok(Json(execution))
}

/// Get execution logs
///
/// Returns logs for a specific agent execution
#[utoipa::path(
    get,
    path = "/api/v1/agents/executions/{id}/logs",
    tag = "agents",
    params(
        ("id" = Uuid, Path, description = "Execution ID")
    ),
    responses(
        (status = 200, description = "Execution logs", body = Vec<ExecutionLog>),
        (status = 401, description = "Unauthorized"),
        (status = 404, description = "Execution not found"),
        (status = 500, description = "Internal server error")
    )
)]
pub async fn get_execution_logs(
    Extension(auth_user): Extension<AuthenticatedUser>,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<Vec<ExecutionLog>>> {
    // Verify user has access to execution
    let _execution = sqlx::query_as::<_, AgentExecution>(
        r#"
        SELECT ae.id, ae.repository_id, ae.issue_number, ae.agent_type, ae.status,
               ae.started_at, ae.completed_at, ae.result_summary, ae.quality_score,
               ae.pr_number, ae.created_at, ae.updated_at
        FROM agent_executions ae
        INNER JOIN repositories r ON ae.repository_id = r.id
        WHERE ae.id = $1 AND r.user_id = $2
        "#,
    )
    .bind(id)
    .bind(auth_user.user_id)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Execution not found".to_string()))?;

    // Get logs
    let executor = AgentExecutor::new(state.db.clone());
    let logs = executor.get_logs(id, Some(10000)).await?;

    Ok(Json(logs))
}
