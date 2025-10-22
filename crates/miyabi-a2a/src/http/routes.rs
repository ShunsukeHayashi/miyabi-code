//! API route handlers

use axum::{
    extract::{Path, State},
    http::StatusCode as AxumStatusCode,
    response::IntoResponse,
    Json,
};
use serde::{Deserialize, Serialize};

use super::server::AppState;
use super::websocket::{DashboardUpdate, TaskCancelEvent, TaskRetryEvent};
use crate::storage::TaskUpdate;
use crate::task::TaskStatus;
use chrono::Utc;

// Type alias to avoid conflicts with reqwest::StatusCode
type StatusCode = AxumStatusCode;

/// Maximum number of retry attempts allowed for a failed task
const MAX_RETRY_COUNT: u32 = 3;

/// Base delay for exponential backoff (in seconds)
const BASE_RETRY_DELAY_SECS: u64 = 10;

/// Custom error response wrapper to avoid type ambiguity with reqwest::StatusCode
#[derive(Debug, Clone)]
pub struct ApiError(AxumStatusCode);

impl IntoResponse for ApiError {
    fn into_response(self) -> axum::response::Response {
        self.0.into_response()
    }
}

impl From<AxumStatusCode> for ApiError {
    fn from(status: AxumStatusCode) -> Self {
        ApiError(status)
    }
}

/// Structured error response for API endpoints
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ErrorResponse {
    /// HTTP status code
    pub status: u16,
    /// Machine-readable error code
    pub error_code: String,
    /// Human-readable error message
    pub message: String,
    /// Optional error details
    #[serde(skip_serializing_if = "Option::is_none")]
    pub details: Option<String>,
    /// Optional request ID for tracing
    #[serde(skip_serializing_if = "Option::is_none")]
    pub request_id: Option<String>,
    /// Timestamp when error occurred
    pub timestamp: chrono::DateTime<Utc>,
}

impl ErrorResponse {
    /// Create a new error response
    pub fn new(
        status: StatusCode,
        error_code: impl Into<String>,
        message: impl Into<String>,
    ) -> Self {
        Self {
            status: status.as_u16(),
            error_code: error_code.into(),
            message: message.into(),
            details: None,
            request_id: None,
            timestamp: Utc::now(),
        }
    }

    /// Add error details
    pub fn with_details(mut self, details: impl Into<String>) -> Self {
        self.details = Some(details.into());
        self
    }

    /// Add request ID for tracing
    pub fn with_request_id(mut self, request_id: impl Into<String>) -> Self {
        self.request_id = Some(request_id.into());
        self
    }
}

impl IntoResponse for ErrorResponse {
    fn into_response(self) -> axum::response::Response {
        let status = StatusCode::from_u16(self.status).unwrap_or(StatusCode::INTERNAL_SERVER_ERROR);
        (status, Json(self)).into_response()
    }
}

/// Agent data structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Agent {
    pub id: u32,
    pub name: String,
    pub role: String,
    pub category: AgentCategory,
    pub status: AgentStatus,
    pub tasks: u32,
    pub color: AgentColor,
    pub description: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum AgentCategory {
    Coding,
    Business,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum AgentStatus {
    Active,
    Working,
    Idle,
    Error,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum AgentColor {
    Leader,
    Executor,
    Analyst,
    Support,
}

/// System status structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemStatus {
    pub status: String,
    pub active_agents: u32,
    pub total_agents: u32,
    pub active_tasks: u32,
    pub queued_tasks: u32,
    pub task_throughput: f64,
    pub avg_completion_time: f64,
}

/// Timeline event structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimelineEvent {
    pub id: String,
    #[serde(rename = "type")]
    pub event_type: String,
    pub message: String,
    pub timestamp: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub task_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub agent_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub agent_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub agent_type: Option<String>,
}

/// Health check endpoint
pub async fn health_check() -> (StatusCode, &'static str) {
    (StatusCode::OK, "OK")
}

/// Get all agents endpoint
pub async fn get_agents() -> Json<Vec<Agent>> {
    // Fetch real data from GitHub API
    match crate::http::fetch_real_agents().await {
        Ok(agents) => Json(agents),
        Err(e) => {
            tracing::error!("Failed to fetch real agents: {}", e);
            // Return empty array on error
            Json(vec![])
        }
    }
}

/// Get system status endpoint
pub async fn get_system_status() -> Json<SystemStatus> {
    // Fetch real system status from GitHub API
    match crate::http::fetch_real_system_status().await {
        Ok(status) => Json(status),
        Err(e) => {
            tracing::error!("Failed to fetch real system status: {}", e);
            // Return default status on error
            Json(SystemStatus {
                status: "error".to_string(),
                active_agents: 0,
                total_agents: 21,
                active_tasks: 0,
                queued_tasks: 0,
                task_throughput: 0.0,
                avg_completion_time: 0.0,
            })
        }
    }
}

/// Get timeline events endpoint
pub async fn get_events() -> Json<Vec<TimelineEvent>> {
    // Fetch real events from GitHub API
    match crate::http::fetch_real_events().await {
        Ok(events) => Json(events),
        Err(e) => {
            tracing::error!("Failed to fetch real events: {}", e);
            // Return empty array on error
            Json(vec![])
        }
    }
}

/// DAG node structure for frontend
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DagNode {
    pub id: String,
    pub label: String,
    pub status: String, // "pending" | "working" | "completed" | "failed"
    pub agent: String,
    #[serde(rename = "agentType")]
    pub agent_type: String,
    // 🆕 Extended fields for full parameter mapping
    pub priority: String, // "P0" | "P1" | "P2" | "P3"
    #[serde(rename = "estimatedMinutes")]
    pub estimated_minutes: u32, // Estimated task duration
    pub description: String, // Task description (from issue body)
    pub module: String, // Module name (e.g., "Miyabi Agents", "Miyabi Core")
    pub layer: String, // Layer: "ui" | "logic" | "data" | "infra"
}

/// DAG edge structure for frontend
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DagEdge {
    pub from: String,
    pub to: String,
    #[serde(rename = "type")]
    pub edge_type: String, // "depends_on"
}

/// DAG data structure for frontend
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DagData {
    #[serde(rename = "workflowId")]
    pub workflow_id: String,
    pub nodes: Vec<DagNode>,
    pub edges: Vec<DagEdge>,
}

/// Get workflow DAG endpoint
pub async fn get_workflow_dag() -> Json<DagData> {
    // Fetch real DAG from GitHub API or internal state
    // Note: fetch_real_workflow_dag already has fallback to sample DAG built in
    match crate::http::fetch_real_workflow_dag().await {
        Ok(dag_data) => Json(dag_data),
        Err(e) => {
            tracing::error!("Failed to fetch workflow DAG: {}", e);
            // This should not happen since fetch_real_workflow_dag has internal fallback
            // But as a last resort, return sample DAG
            Json(crate::http::create_sample_dag_public())
        }
    }
}

// ===== Task Recovery Endpoints =====

/// Task retry request payload
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskRetryRequest {
    /// Optional reason for retry
    pub reason: Option<String>,
}

/// Task retry response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskRetryResponse {
    /// Task ID that was retried
    pub task_id: String,
    /// Current task status after retry
    pub status: String,
    /// Response message
    pub message: String,
    /// Number of retry attempts
    pub retry_count: u32,
}

/// Task cancel response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskCancelResponse {
    /// Task ID that was cancelled
    pub task_id: String,
    /// Current task status after cancellation
    pub status: String,
    /// Response message
    pub message: String,
}

/// Retry a failed task
///
/// # Arguments
/// * `task_id` - The ID of the task to retry
/// * `payload` - Optional retry reason
///
/// # Returns
/// * `TaskRetryResponse` with task status and retry count
///
/// # Errors
/// * `400 Bad Request` - Invalid task ID format
/// * `404 Not Found` - Task does not exist
/// * `409 Conflict` - Task is not in failed state
/// * `429 Too Many Requests` - Retry limit exceeded (max: 3 attempts)
/// * `500 Internal Server Error` - Storage operation failed
pub async fn retry_task(
    State(state): State<AppState>,
    Path(task_id): Path<String>,
    Json(payload): Json<TaskRetryRequest>,
) -> Result<Json<TaskRetryResponse>, ErrorResponse> {
    tracing::info!("Retrying task: {} (reason: {:?})", task_id, payload.reason);

    // 1. Parse task_id as u64
    let id = task_id.parse::<u64>().map_err(|e| {
        tracing::error!("Invalid task ID format: {} - {}", task_id, e);
        ErrorResponse::new(
            StatusCode::BAD_REQUEST,
            "INVALID_TASK_ID",
            "Invalid task ID format",
        )
        .with_details(format!(
            "Task ID '{}' must be a valid integer: {}",
            task_id, e
        ))
    })?;

    // 2. Get task from storage
    let task = state.storage.get_task(id).await.map_err(|e| {
        tracing::error!("Failed to fetch task {}: {}", id, e);
        ErrorResponse::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            "STORAGE_ERROR",
            "Failed to retrieve task from storage",
        )
        .with_details(format!("Storage error for task {}: {}", id, e))
    })?;

    // 3. Check if task exists
    let mut task = task.ok_or_else(|| {
        tracing::warn!("Task {} not found", id);
        ErrorResponse::new(
            StatusCode::NOT_FOUND,
            "TASK_NOT_FOUND",
            format!("Task {} does not exist", id),
        )
    })?;

    // 4. Check if task is in failed state
    if task.status != TaskStatus::Failed {
        tracing::warn!(
            "Task {} is not in failed state (current: {:?})",
            id,
            task.status
        );
        return Err(ErrorResponse::new(
            StatusCode::CONFLICT,
            "INVALID_TASK_STATE",
            "Task must be in failed state to retry",
        )
        .with_details(format!("Current task status: {:?}", task.status)));
    }

    // 5. Check retry count limit
    if task.retry_count >= MAX_RETRY_COUNT {
        tracing::warn!(
            "Task {} has reached max retry limit ({}/{})",
            id,
            task.retry_count,
            MAX_RETRY_COUNT
        );
        return Err(ErrorResponse::new(
            StatusCode::TOO_MANY_REQUESTS,
            "MAX_RETRIES_EXCEEDED",
            format!(
                "Maximum retry limit of {} attempts reached",
                MAX_RETRY_COUNT
            ),
        )
        .with_details(format!(
            "Current retry count: {}/{}",
            task.retry_count, MAX_RETRY_COUNT
        )));
    }

    // 6. Increment retry_count
    task.retry_count += 1;

    // 7. Prepare retry reason (clone for WebSocket event later)
    let retry_reason = payload.reason.clone();
    let description = payload.reason.or(Some(format!(
        "Retry attempt {} - Previous failure",
        task.retry_count
    )));

    // 8. Update task status to Submitted for retry
    let update = TaskUpdate {
        status: Some(TaskStatus::Submitted),
        description,
        agent: None,
        priority: None,
        retry_count: Some(task.retry_count),
    };

    state.storage.update_task(id, update).await.map_err(|e| {
        tracing::error!("Failed to update task {}: {}", id, e);
        ErrorResponse::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            "STORAGE_UPDATE_ERROR",
            "Failed to update task status",
        )
        .with_details(format!("Storage update error for task {}: {}", id, e))
    })?;

    // 9. Calculate exponential backoff delay: base_delay * 2^retry_count
    let delay_secs = BASE_RETRY_DELAY_SECS * 2u64.pow(task.retry_count - 1); // retry_count is already incremented
    let next_retry_at = Utc::now() + chrono::Duration::seconds(delay_secs as i64);

    // 10. Broadcast retry event via WebSocket
    let retry_event = DashboardUpdate::TaskRetry {
        event: TaskRetryEvent {
            task_id: task_id.clone(),
            retry_count: task.retry_count,
            reason: retry_reason,
            next_retry_at: Some(next_retry_at),
            timestamp: Utc::now(),
        },
    };

    if let Err(e) = state.ws_state.tx.send(retry_event) {
        // Log error but don't fail the request - WebSocket broadcasting is not critical
        tracing::warn!("Failed to broadcast retry event for task {}: {}", id, e);
    }

    tracing::info!(
        "Task {} queued for retry (attempt {}, next retry at {})",
        id,
        task.retry_count,
        next_retry_at
    );

    Ok(Json(TaskRetryResponse {
        task_id: task_id.clone(),
        status: "submitted".to_string(),
        message: format!("Task {} has been queued for retry", task_id),
        retry_count: task.retry_count,
    }))
}

/// Cancel a running task
///
/// # Arguments
/// * `task_id` - The ID of the task to cancel
///
/// # Returns
/// * `TaskCancelResponse` with task status
///
/// # Errors
/// * `400 Bad Request` - Invalid task ID format
/// * `404 Not Found` - Task does not exist
/// * `409 Conflict` - Task is not in cancellable state (must be Submitted or Working)
/// * `500 Internal Server Error` - Storage operation failed
pub async fn cancel_task(
    State(state): State<AppState>,
    Path(task_id): Path<String>,
) -> Result<Json<TaskCancelResponse>, ErrorResponse> {
    tracing::info!("Cancelling task: {}", task_id);

    // 1. Parse task_id as u64
    let id = task_id.parse::<u64>().map_err(|e| {
        tracing::error!("Invalid task ID format: {} - {}", task_id, e);
        ErrorResponse::new(
            StatusCode::BAD_REQUEST,
            "INVALID_TASK_ID",
            "Invalid task ID format",
        )
        .with_details(format!(
            "Task ID '{}' must be a valid integer: {}",
            task_id, e
        ))
    })?;

    // 2. Get task from storage
    let task = state.storage.get_task(id).await.map_err(|e| {
        tracing::error!("Failed to fetch task {}: {}", id, e);
        ErrorResponse::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            "STORAGE_ERROR",
            "Failed to retrieve task from storage",
        )
        .with_details(format!("Storage error for task {}: {}", id, e))
    })?;

    // 3. Check if task exists
    let task = task.ok_or_else(|| {
        tracing::warn!("Task {} not found", id);
        ErrorResponse::new(
            StatusCode::NOT_FOUND,
            "TASK_NOT_FOUND",
            format!("Task {} does not exist", id),
        )
    })?;

    // 4. Check if task is cancellable (must be in Submitted or Working state)
    if task.status != TaskStatus::Submitted && task.status != TaskStatus::Working {
        tracing::warn!(
            "Task {} is not cancellable (current state: {:?})",
            id,
            task.status
        );
        return Err(ErrorResponse::new(
            StatusCode::CONFLICT,
            "INVALID_TASK_STATE",
            "Task must be in Submitted or Working state to cancel",
        )
        .with_details(format!(
            "Current task status: {:?}. Only Submitted or Working tasks can be cancelled.",
            task.status
        )));
    }

    // 5. Update task status to Cancelled
    let update = TaskUpdate {
        status: Some(TaskStatus::Cancelled),
        description: Some(format!("Task cancelled by user at {}", chrono::Utc::now())),
        agent: None,
        priority: None,
        retry_count: None,
    };

    state.storage.update_task(id, update).await.map_err(|e| {
        tracing::error!("Failed to update task {}: {}", id, e);
        ErrorResponse::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            "STORAGE_UPDATE_ERROR",
            "Failed to update task status",
        )
        .with_details(format!("Storage update error for task {}: {}", id, e))
    })?;

    // 6. Send cancellation signal to task executor (future enhancement)
    // TODO: Send cancellation signal to running agent via inter-process communication

    // 7. Broadcast cancellation event via WebSocket
    let cancel_event = DashboardUpdate::TaskCancel {
        event: TaskCancelEvent {
            task_id: task_id.clone(),
            reason: format!("Task cancelled by user at {}", Utc::now()),
            timestamp: Utc::now(),
        },
    };

    if let Err(e) = state.ws_state.tx.send(cancel_event) {
        // Log error but don't fail the request - WebSocket broadcasting is not critical
        tracing::warn!("Failed to broadcast cancel event for task {}: {}", id, e);
    }

    tracing::info!("Task {} has been cancelled", id);

    Ok(Json(TaskCancelResponse {
        task_id: task_id.clone(),
        status: "cancelled".to_string(),
        message: format!("Task {} has been cancelled", task_id),
    }))
}
