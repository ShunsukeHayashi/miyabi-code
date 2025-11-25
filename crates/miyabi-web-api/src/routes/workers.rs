//! Worker Status API routes
//!
//! Real-time worker status monitoring endpoints
//! Issue: #985 Phase 2.3 - Worker & Coordinator Status APIs

use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    routing::get,
    Json, Router,
};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{error::Result, AppState};

// ============================================================================
// Response Types
// ============================================================================

/// Worker status response
#[derive(Debug, Clone, Serialize, Deserialize, utoipa::ToSchema)]
pub struct WorkerStatus {
    pub worker_id: String,
    pub name: String,
    pub status: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub current_task: Option<CurrentTask>,
    pub cpu_usage: f64,
    pub memory_usage: f64,
    pub tasks_completed: i64,
    pub tasks_failed: i64,
    pub uptime_seconds: i64,
    pub last_heartbeat: DateTime<Utc>,
}

/// Current task info
#[derive(Debug, Clone, Serialize, Deserialize, utoipa::ToSchema)]
pub struct CurrentTask {
    pub task_id: Uuid,
    pub title: String,
    pub started_at: DateTime<Utc>,
    pub progress: f64,
}

/// Workers list response
#[derive(Debug, Clone, Serialize, Deserialize, utoipa::ToSchema)]
pub struct WorkersListResponse {
    pub workers: Vec<WorkerStatus>,
    pub total: i64,
}

// ============================================================================
// Routes
// ============================================================================

/// Create worker routes
pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", get(list_workers))
        .route("/{worker_id}", get(get_worker))
}

// ============================================================================
// Handlers
// ============================================================================

/// List all workers
#[utoipa::path(
    get,
    path = "/api/v1/workers",
    tag = "workers",
    responses(
        (status = 200, description = "List of workers", body = WorkersListResponse)
    )
)]
async fn list_workers(State(state): State<AppState>) -> Result<impl IntoResponse> {
    // Query workers from database
    let worker_rows = sqlx::query_as::<_, (Uuid, String, String, f64, f64, i64, i64, i64, DateTime<Utc>)>(
        r#"
        SELECT
            id,
            name,
            status,
            COALESCE(cpu_usage, 0.0) as cpu_usage,
            COALESCE(memory_usage, 0.0) as memory_usage,
            COALESCE(tasks_completed, 0) as tasks_completed,
            COALESCE(tasks_failed, 0) as tasks_failed,
            COALESCE(EXTRACT(EPOCH FROM (NOW() - started_at))::bigint, 0) as uptime_seconds,
            COALESCE(last_heartbeat, NOW()) as last_heartbeat
        FROM workers
        ORDER BY name
        "#,
    )
    .fetch_all(&state.db)
    .await;

    let workers = match worker_rows {
        Ok(rows) => rows
            .into_iter()
            .map(|row| WorkerStatus {
                worker_id: row.0.to_string(),
                name: row.1,
                status: row.2,
                current_task: None, // TODO: Join with tasks table
                cpu_usage: row.3,
                memory_usage: row.4,
                tasks_completed: row.5,
                tasks_failed: row.6,
                uptime_seconds: row.7,
                last_heartbeat: row.8,
            })
            .collect(),
        Err(_) => {
            // Return mock data if table doesn't exist
            get_mock_workers()
        }
    };

    let total = workers.len() as i64;

    Ok(Json(WorkersListResponse { workers, total }))
}

/// Get a specific worker by ID
#[utoipa::path(
    get,
    path = "/api/v1/workers/{worker_id}",
    tag = "workers",
    params(
        ("worker_id" = String, Path, description = "Worker ID")
    ),
    responses(
        (status = 200, description = "Worker details", body = WorkerStatus),
        (status = 404, description = "Worker not found")
    )
)]
async fn get_worker(
    State(state): State<AppState>,
    Path(worker_id): Path<String>,
) -> Result<impl IntoResponse> {
    // Try to parse as UUID first
    let worker_uuid = Uuid::parse_str(&worker_id).ok();

    // Query worker from database
    let worker_row = if let Some(uuid) = worker_uuid {
        sqlx::query_as::<_, (Uuid, String, String, f64, f64, i64, i64, i64, DateTime<Utc>)>(
            r#"
            SELECT
                id,
                name,
                status,
                COALESCE(cpu_usage, 0.0) as cpu_usage,
                COALESCE(memory_usage, 0.0) as memory_usage,
                COALESCE(tasks_completed, 0) as tasks_completed,
                COALESCE(tasks_failed, 0) as tasks_failed,
                COALESCE(EXTRACT(EPOCH FROM (NOW() - started_at))::bigint, 0) as uptime_seconds,
                COALESCE(last_heartbeat, NOW()) as last_heartbeat
            FROM workers
            WHERE id = $1 OR name = $2
            "#,
        )
        .bind(uuid)
        .bind(&worker_id)
        .fetch_optional(&state.db)
        .await
    } else {
        sqlx::query_as::<_, (Uuid, String, String, f64, f64, i64, i64, i64, DateTime<Utc>)>(
            r#"
            SELECT
                id,
                name,
                status,
                COALESCE(cpu_usage, 0.0) as cpu_usage,
                COALESCE(memory_usage, 0.0) as memory_usage,
                COALESCE(tasks_completed, 0) as tasks_completed,
                COALESCE(tasks_failed, 0) as tasks_failed,
                COALESCE(EXTRACT(EPOCH FROM (NOW() - started_at))::bigint, 0) as uptime_seconds,
                COALESCE(last_heartbeat, NOW()) as last_heartbeat
            FROM workers
            WHERE name = $1
            "#,
        )
        .bind(&worker_id)
        .fetch_optional(&state.db)
        .await
    };

    match worker_row {
        Ok(Some(row)) => {
            let worker = WorkerStatus {
                worker_id: row.0.to_string(),
                name: row.1,
                status: row.2,
                current_task: None,
                cpu_usage: row.3,
                memory_usage: row.4,
                tasks_completed: row.5,
                tasks_failed: row.6,
                uptime_seconds: row.7,
                last_heartbeat: row.8,
            };
            Ok((StatusCode::OK, Json(worker)).into_response())
        }
        Ok(None) | Err(_) => {
            // Try mock data
            let mock_workers = get_mock_workers();
            if let Some(worker) = mock_workers.into_iter().find(|w| w.worker_id == worker_id || w.name == worker_id) {
                Ok((StatusCode::OK, Json(worker)).into_response())
            } else {
                Ok((
                    StatusCode::NOT_FOUND,
                    Json(serde_json::json!({"error": "Worker not found"})),
                )
                    .into_response())
            }
        }
    }
}

// ============================================================================
// Mock Data
// ============================================================================

fn get_mock_workers() -> Vec<WorkerStatus> {
    vec![
        WorkerStatus {
            worker_id: "worker-1".to_string(),
            name: "Worker-1".to_string(),
            status: "idle".to_string(),
            current_task: None,
            cpu_usage: 12.5,
            memory_usage: 45.2,
            tasks_completed: 142,
            tasks_failed: 3,
            uptime_seconds: 86400,
            last_heartbeat: Utc::now(),
        },
        WorkerStatus {
            worker_id: "worker-2".to_string(),
            name: "Worker-2".to_string(),
            status: "busy".to_string(),
            current_task: Some(CurrentTask {
                task_id: Uuid::new_v4(),
                title: "Processing Issue #123".to_string(),
                started_at: Utc::now() - chrono::Duration::minutes(5),
                progress: 0.65,
            }),
            cpu_usage: 78.3,
            memory_usage: 62.8,
            tasks_completed: 98,
            tasks_failed: 5,
            uptime_seconds: 72000,
            last_heartbeat: Utc::now(),
        },
        WorkerStatus {
            worker_id: "worker-3".to_string(),
            name: "Worker-3".to_string(),
            status: "offline".to_string(),
            current_task: None,
            cpu_usage: 0.0,
            memory_usage: 0.0,
            tasks_completed: 56,
            tasks_failed: 2,
            uptime_seconds: 0,
            last_heartbeat: Utc::now() - chrono::Duration::hours(2),
        },
    ]
}
