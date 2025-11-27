//! Task Management API routes
//!
//! CRUD operations for tasks with filtering and pagination
//! Issue: #970 Phase 2.1 - Task Management API
//! Issue: #1176 - RBAC Middleware Integration

use crate::{
    error::{AppError, Result},
    middleware::{AuthenticatedUser, require_permission},
    models::{CreateTaskRequest, Task, TaskQueryFilters, UpdateTaskRequest},
    AppState,
};
use axum::{
    extract::{Extension, Path, Query, State},
    http::StatusCode,
    middleware::from_fn,
    response::IntoResponse,
    routing::{delete, get, patch, post},
    Json, Router,
};
use serde::Serialize;
use uuid::Uuid;

// ============================================================================
// Response Types
// ============================================================================

#[derive(Debug, Serialize)]
pub struct TaskResponse {
    pub task: Task,
}

#[derive(Debug, Serialize)]
pub struct TasksListResponse {
    pub tasks: Vec<Task>,
    pub total: i64,
    pub page: i64,
    pub limit: i64,
}

#[derive(Debug, Serialize)]
pub struct TaskStatsResponse {
    pub total: i64,
    pub pending: i64,
    pub running: i64,
    pub completed: i64,
    pub failed: i64,
}

#[derive(Debug, Serialize)]
pub struct MessageResponse {
    pub message: String,
}

// ============================================================================
// Routes
// ============================================================================

/// Create task management routes with RBAC middleware
///
/// Permission mapping (Issue #1176):
/// Uses existing permission format: {resource}.{action}
/// - GET /tasks, GET /tasks/stats, GET /tasks/{id} -> tasks.read
/// - POST /tasks -> tasks.create
/// - PATCH /tasks/{id} -> tasks.update
/// - DELETE /tasks/{id} -> tasks.delete
/// - POST /tasks/{id}/start, complete, fail, cancel, retry -> tasks.update
pub fn routes() -> Router<AppState> {
    // Read-only routes
    let read_routes = Router::new()
        .route("/", get(list_tasks))
        .route("/stats", get(get_task_stats))
        .route("/{task_id}", get(get_task))
        .route_layer(from_fn(require_permission("tasks.read")));

    // Create routes
    let create_routes = Router::new()
        .route("/", post(create_task))
        .route_layer(from_fn(require_permission("tasks.create")));

    // Update routes (update, status changes)
    let update_routes = Router::new()
        .route("/{task_id}", patch(update_task))
        .route("/{task_id}/start", post(start_task))
        .route("/{task_id}/complete", post(complete_task))
        .route("/{task_id}/fail", post(fail_task))
        .route("/{task_id}/cancel", post(cancel_task))
        .route("/{task_id}/retry", post(retry_task))
        .route_layer(from_fn(require_permission("tasks.update")));

    // Delete routes
    let delete_routes = Router::new()
        .route("/{task_id}", delete(delete_task))
        .route_layer(from_fn(require_permission("tasks.delete")));

    // Merge all routes
    Router::new()
        .merge(read_routes)
        .merge(create_routes)
        .merge(update_routes)
        .merge(delete_routes)
}

// ============================================================================
// Handlers
// ============================================================================

/// List tasks with filtering and pagination
async fn list_tasks(
    State(state): State<AppState>,
    Extension(auth_user): Extension<AuthenticatedUser>,
    Query(filters): Query<TaskQueryFilters>,
) -> Result<impl IntoResponse> {
    let offset = (filters.page - 1) * filters.limit;

    // Build dynamic query based on filters
    let tasks = sqlx::query_as::<_, Task>(
        r#"
        SELECT * FROM tasks
        WHERE user_id = $1
          AND ($2::text IS NULL OR status = $2)
          AND ($3::text IS NULL OR priority = $3)
          AND ($4::uuid IS NULL OR repository_id = $4)
          AND ($5::text IS NULL OR agent_type = $5)
        ORDER BY
            CASE priority
                WHEN 'P0' THEN 1
                WHEN 'P1' THEN 2
                WHEN 'P2' THEN 3
                ELSE 4
            END,
            created_at DESC
        LIMIT $6 OFFSET $7
        "#,
    )
    .bind(auth_user.user_id)
    .bind(&filters.status)
    .bind(&filters.priority)
    .bind(filters.repository_id)
    .bind(&filters.agent_type)
    .bind(filters.limit)
    .bind(offset)
    .fetch_all(&state.db)
    .await
    .map_err(AppError::Database)?;

    // Get total count
    let total = sqlx::query_scalar::<_, i64>(
        r#"
        SELECT COUNT(*) FROM tasks
        WHERE user_id = $1
          AND ($2::text IS NULL OR status = $2)
          AND ($3::text IS NULL OR priority = $3)
          AND ($4::uuid IS NULL OR repository_id = $4)
          AND ($5::text IS NULL OR agent_type = $5)
        "#,
    )
    .bind(auth_user.user_id)
    .bind(&filters.status)
    .bind(&filters.priority)
    .bind(filters.repository_id)
    .bind(&filters.agent_type)
    .fetch_one(&state.db)
    .await
    .map_err(AppError::Database)?;

    Ok(Json(TasksListResponse {
        tasks,
        total,
        page: filters.page,
        limit: filters.limit,
    }))
}

/// Get task statistics
async fn get_task_stats(
    State(state): State<AppState>,
    Extension(auth_user): Extension<AuthenticatedUser>,
) -> Result<impl IntoResponse> {
    let stats = sqlx::query_as::<_, (i64, i64, i64, i64, i64)>(
        r#"
        SELECT
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE status = 'pending') as pending,
            COUNT(*) FILTER (WHERE status = 'running') as running,
            COUNT(*) FILTER (WHERE status = 'completed') as completed,
            COUNT(*) FILTER (WHERE status = 'failed') as failed
        FROM tasks
        WHERE user_id = $1
        "#,
    )
    .bind(auth_user.user_id)
    .fetch_one(&state.db)
    .await
    .map_err(AppError::Database)?;

    Ok(Json(TaskStatsResponse {
        total: stats.0,
        pending: stats.1,
        running: stats.2,
        completed: stats.3,
        failed: stats.4,
    }))
}

/// Create a new task
async fn create_task(
    State(state): State<AppState>,
    Extension(auth_user): Extension<AuthenticatedUser>,
    Json(req): Json<CreateTaskRequest>,
) -> Result<impl IntoResponse> {
    let priority = req.priority.unwrap_or_else(|| "P2".to_string());

    let task = sqlx::query_as::<_, Task>(
        r#"
        INSERT INTO tasks (
            user_id, repository_id, name, description, priority, status,
            agent_type, issue_number, metadata
        )
        VALUES ($1, $2, $3, $4, $5, 'pending', $6, $7, $8)
        RETURNING *
        "#,
    )
    .bind(auth_user.user_id)
    .bind(req.repository_id)
    .bind(&req.name)
    .bind(&req.description)
    .bind(&priority)
    .bind(&req.agent_type)
    .bind(req.issue_number)
    .bind(&req.metadata)
    .fetch_one(&state.db)
    .await
    .map_err(AppError::Database)?;

    // Broadcast task creation event
    state
        .event_broadcaster
        .broadcast(crate::events::Event::TaskCreated {
            task_id: task.id.to_string(),
            name: task.name.clone(),
            priority: task.priority.clone(),
        });

    Ok((StatusCode::CREATED, Json(TaskResponse { task })))
}

/// Get a single task by ID
async fn get_task(
    State(state): State<AppState>,
    Extension(auth_user): Extension<AuthenticatedUser>,
    Path(task_id): Path<Uuid>,
) -> Result<impl IntoResponse> {
    let task = sqlx::query_as::<_, Task>("SELECT * FROM tasks WHERE id = $1 AND user_id = $2")
        .bind(task_id)
        .bind(auth_user.user_id)
        .fetch_optional(&state.db)
        .await
        .map_err(AppError::Database)?
        .ok_or_else(|| AppError::NotFound("Task not found".to_string()))?;

    Ok(Json(TaskResponse { task }))
}

/// Update a task
async fn update_task(
    State(state): State<AppState>,
    Extension(auth_user): Extension<AuthenticatedUser>,
    Path(task_id): Path<Uuid>,
    Json(req): Json<UpdateTaskRequest>,
) -> Result<impl IntoResponse> {
    let task = sqlx::query_as::<_, Task>(
        r#"
        UPDATE tasks
        SET name = COALESCE($3, name),
            description = COALESCE($4, description),
            priority = COALESCE($5, priority),
            status = COALESCE($6, status),
            metadata = COALESCE($7, metadata),
            updated_at = NOW()
        WHERE id = $1 AND user_id = $2
        RETURNING *
        "#,
    )
    .bind(task_id)
    .bind(auth_user.user_id)
    .bind(&req.name)
    .bind(&req.description)
    .bind(&req.priority)
    .bind(&req.status)
    .bind(&req.metadata)
    .fetch_optional(&state.db)
    .await
    .map_err(AppError::Database)?
    .ok_or_else(|| AppError::NotFound("Task not found".to_string()))?;

    // Broadcast task update event
    state
        .event_broadcaster
        .broadcast(crate::events::Event::TaskUpdated {
            task_id: task.id.to_string(),
            status: task.status.clone(),
        });

    Ok(Json(TaskResponse { task }))
}

/// Delete a task
async fn delete_task(
    State(state): State<AppState>,
    Extension(auth_user): Extension<AuthenticatedUser>,
    Path(task_id): Path<Uuid>,
) -> Result<impl IntoResponse> {
    let result = sqlx::query("DELETE FROM tasks WHERE id = $1 AND user_id = $2")
        .bind(task_id)
        .bind(auth_user.user_id)
        .execute(&state.db)
        .await
        .map_err(AppError::Database)?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Task not found".to_string()));
    }

    Ok(Json(MessageResponse {
        message: "Task deleted".to_string(),
    }))
}

/// Start a task (change status to running)
async fn start_task(
    State(state): State<AppState>,
    Extension(auth_user): Extension<AuthenticatedUser>,
    Path(task_id): Path<Uuid>,
) -> Result<impl IntoResponse> {
    let task = sqlx::query_as::<_, Task>(
        r#"
        UPDATE tasks
        SET status = 'running', started_at = NOW(), updated_at = NOW()
        WHERE id = $1 AND user_id = $2 AND status = 'pending'
        RETURNING *
        "#,
    )
    .bind(task_id)
    .bind(auth_user.user_id)
    .fetch_optional(&state.db)
    .await
    .map_err(AppError::Database)?
    .ok_or_else(|| AppError::Validation("Task not found or not in pending status".to_string()))?;

    state
        .event_broadcaster
        .broadcast(crate::events::Event::TaskUpdated {
            task_id: task.id.to_string(),
            status: "running".to_string(),
        });

    Ok(Json(TaskResponse { task }))
}

/// Complete a task
async fn complete_task(
    State(state): State<AppState>,
    Extension(auth_user): Extension<AuthenticatedUser>,
    Path(task_id): Path<Uuid>,
) -> Result<impl IntoResponse> {
    let task = sqlx::query_as::<_, Task>(
        r#"
        UPDATE tasks
        SET status = 'completed', completed_at = NOW(), updated_at = NOW()
        WHERE id = $1 AND user_id = $2 AND status = 'running'
        RETURNING *
        "#,
    )
    .bind(task_id)
    .bind(auth_user.user_id)
    .fetch_optional(&state.db)
    .await
    .map_err(AppError::Database)?
    .ok_or_else(|| AppError::Validation("Task not found or not in running status".to_string()))?;

    state
        .event_broadcaster
        .broadcast(crate::events::Event::TaskCompleted {
            task_id: task.id.to_string(),
            name: task.name.clone(),
        });

    Ok(Json(TaskResponse { task }))
}

/// Fail a task
async fn fail_task(
    State(state): State<AppState>,
    Extension(auth_user): Extension<AuthenticatedUser>,
    Path(task_id): Path<Uuid>,
) -> Result<impl IntoResponse> {
    let task = sqlx::query_as::<_, Task>(
        r#"
        UPDATE tasks
        SET status = 'failed', completed_at = NOW(), updated_at = NOW()
        WHERE id = $1 AND user_id = $2 AND status IN ('pending', 'running')
        RETURNING *
        "#,
    )
    .bind(task_id)
    .bind(auth_user.user_id)
    .fetch_optional(&state.db)
    .await
    .map_err(AppError::Database)?
    .ok_or_else(|| AppError::Validation("Task not found or already completed".to_string()))?;

    state
        .event_broadcaster
        .broadcast(crate::events::Event::TaskFailed {
            task_id: task.id.to_string(),
            error: "Task marked as failed".to_string(),
        });

    Ok(Json(TaskResponse { task }))
}

/// Cancel a task
async fn cancel_task(
    State(state): State<AppState>,
    Extension(auth_user): Extension<AuthenticatedUser>,
    Path(task_id): Path<Uuid>,
) -> Result<impl IntoResponse> {
    let task = sqlx::query_as::<_, Task>(
        r#"
        UPDATE tasks
        SET status = 'cancelled', updated_at = NOW()
        WHERE id = $1 AND user_id = $2 AND status IN ('pending', 'running')
        RETURNING *
        "#,
    )
    .bind(task_id)
    .bind(auth_user.user_id)
    .fetch_optional(&state.db)
    .await
    .map_err(AppError::Database)?
    .ok_or_else(|| AppError::Validation("Task not found or already completed".to_string()))?;

    state
        .event_broadcaster
        .broadcast(crate::events::Event::TaskUpdated {
            task_id: task.id.to_string(),
            status: "cancelled".to_string(),
        });

    Ok(Json(TaskResponse { task }))
}

/// Retry a failed task
async fn retry_task(
    State(state): State<AppState>,
    Extension(auth_user): Extension<AuthenticatedUser>,
    Path(task_id): Path<Uuid>,
) -> Result<impl IntoResponse> {
    let task = sqlx::query_as::<_, Task>(
        r#"
        UPDATE tasks
        SET status = 'pending',
            retry_count = retry_count + 1,
            started_at = NULL,
            completed_at = NULL,
            updated_at = NOW()
        WHERE id = $1 AND user_id = $2 AND status = 'failed' AND retry_count < max_retries
        RETURNING *
        "#,
    )
    .bind(task_id)
    .bind(auth_user.user_id)
    .fetch_optional(&state.db)
    .await
    .map_err(AppError::Database)?
    .ok_or_else(|| {
        AppError::Validation("Task not found, not failed, or max retries exceeded".to_string())
    })?;

    state
        .event_broadcaster
        .broadcast(crate::events::Event::TaskUpdated {
            task_id: task.id.to_string(),
            status: "pending".to_string(),
        });

    Ok(Json(TaskResponse { task }))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    #[ignore = "requires AppState initialization"]
    fn test_routes_creation() {
        let _routes: Router<AppState> = routes();
    }
}
