//! Workflow route handlers

use crate::{
    error::Result,
    models::{CreateWorkflowRequest, Workflow},
    AppState,
};
use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use uuid::Uuid;

/// Create workflow
///
/// Creates a new workflow for a repository
#[utoipa::path(
    post,
    path = "/api/v1/workflows",
    tag = "workflows",
    request_body = CreateWorkflowRequest,
    responses(
        (status = 201, description = "Workflow created", body = Workflow),
        (status = 400, description = "Invalid request"),
        (status = 401, description = "Unauthorized"),
        (status = 500, description = "Internal server error")
    )
)]
pub async fn create_workflow(
    State(state): State<AppState>,
    Json(request): Json<CreateWorkflowRequest>,
) -> Result<(StatusCode, Json<Workflow>)> {
    // Validate DAG definition structure
    if !request.dag_definition.is_object() {
        return Err(crate::error::AppError::Validation(
            "Invalid DAG definition: must be a JSON object".to_string(),
        ));
    }

    // Create workflow in database
    let workflow = sqlx::query_as::<_, Workflow>(
        r#"
        INSERT INTO workflows (repository_id, name, description, dag_definition, is_active)
        VALUES ($1, $2, $3, $4, true)
        RETURNING id, repository_id, name, description, dag_definition, is_active, created_at, updated_at
        "#,
    )
    .bind(request.repository_id)
    .bind(&request.name)
    .bind(request.description.as_ref())
    .bind(&request.dag_definition)
    .fetch_one(&state.db)
    .await?;

    tracing::info!(
        "Workflow created: id={}, name={}, repository={}",
        workflow.id,
        workflow.name,
        workflow.repository_id
    );

    Ok((StatusCode::CREATED, Json(workflow)))
}

/// List workflows
///
/// Returns all workflows for user repositories
#[utoipa::path(
    get,
    path = "/api/v1/workflows",
    tag = "workflows",
    responses(
        (status = 200, description = "List of workflows", body = Vec<Workflow>),
        (status = 401, description = "Unauthorized"),
        (status = 500, description = "Internal server error")
    )
)]
pub async fn list_workflows(State(state): State<AppState>) -> Result<Json<Vec<Workflow>>> {
    // Query all workflows (in future, filter by user repositories)
    let workflows = sqlx::query_as::<_, Workflow>(
        r#"
        SELECT id, repository_id, name, description, dag_definition, is_active, created_at, updated_at
        FROM workflows
        WHERE is_active = true
        ORDER BY created_at DESC
        LIMIT 100
        "#,
    )
    .fetch_all(&state.db)
    .await?;

    Ok(Json(workflows))
}

/// Get workflow by ID
///
/// Returns workflow details and DAG definition
#[utoipa::path(
    get,
    path = "/api/v1/workflows/{id}",
    tag = "workflows",
    params(
        ("id" = Uuid, Path, description = "Workflow ID")
    ),
    responses(
        (status = 200, description = "Workflow details", body = Workflow),
        (status = 401, description = "Unauthorized"),
        (status = 404, description = "Workflow not found"),
        (status = 500, description = "Internal server error")
    )
)]
pub async fn get_workflow(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<Workflow>> {
    // Query workflow from database
    let workflow = sqlx::query_as::<_, Workflow>(
        r#"
        SELECT id, repository_id, name, description, dag_definition, is_active, created_at, updated_at
        FROM workflows
        WHERE id = $1
        "#,
    )
    .bind(id)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| crate::error::AppError::NotFound("Workflow not found".to_string()))?;

    Ok(Json(workflow))
}
