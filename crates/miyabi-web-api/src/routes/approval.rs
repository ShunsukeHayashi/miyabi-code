//! Approval API routes

use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        Path, Query, State,
    },
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use miyabi_approval::{ApprovalGate, ApprovalState, ApprovalStatus, ApprovalStore};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::time::{interval, Duration};

/// Shared application state
#[derive(Clone)]
pub struct AppState {
    pub approval_store: Arc<ApprovalStore>,
}

/// List approvals query parameters
#[derive(Debug, Deserialize)]
pub struct ListApprovalsQuery {
    /// Filter by status (pending, approved, rejected, timed_out)
    pub status: Option<String>,
    /// Filter by workflow ID
    pub workflow_id: Option<String>,
    /// Filter by approver
    pub approver: Option<String>,
}

/// Approval response for API
#[derive(Debug, Serialize)]
pub struct ApprovalApiResponse {
    pub approval_id: String,
    pub workflow_id: String,
    pub gate_id: String,
    pub required_approvers: Vec<String>,
    pub responses: Vec<ApprovalResponseApi>,
    pub status: String,
    pub timeout_seconds: u64,
    pub created_at: String,
    pub completed_at: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct ApprovalResponseApi {
    pub approver: String,
    pub approved: bool,
    pub comment: Option<String>,
    pub responded_at: String,
}

impl From<ApprovalState> for ApprovalApiResponse {
    fn from(state: ApprovalState) -> Self {
        Self {
            approval_id: state.approval_id,
            workflow_id: state.workflow_id,
            gate_id: state.gate_id,
            required_approvers: state.required_approvers,
            responses: state
                .responses
                .into_iter()
                .map(|(approver, response)| ApprovalResponseApi {
                    approver,
                    approved: response.approved,
                    comment: response.comment,
                    responded_at: response.responded_at.to_rfc3339(),
                })
                .collect(),
            status: format!("{:?}", state.status),
            timeout_seconds: state.timeout_seconds,
            created_at: state.created_at.to_rfc3339(),
            completed_at: state.completed_at.map(|dt| dt.to_rfc3339()),
        }
    }
}

/// Approve request body
#[derive(Debug, Deserialize)]
pub struct ApproveRequest {
    pub approver: String,
    pub comment: Option<String>,
}

/// Reject request body
#[derive(Debug, Deserialize)]
pub struct RejectRequest {
    pub approver: String,
    pub reason: Option<String>,
}

/// GET /api/approvals - List pending approvals
pub async fn list_approvals(
    State(state): State<AppState>,
    Query(query): Query<ListApprovalsQuery>,
) -> Result<Json<Vec<ApprovalApiResponse>>, StatusCode> {
    let approvals = if let Some(status_str) = query.status {
        let status = match status_str.as_str() {
            "pending" => ApprovalStatus::Pending,
            "approved" => ApprovalStatus::Approved,
            "rejected" => ApprovalStatus::Rejected,
            "timed_out" => ApprovalStatus::TimedOut,
            _ => return Err(StatusCode::BAD_REQUEST),
        };

        state
            .approval_store
            .list_by_status(status)
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    } else if let Some(workflow_id) = query.workflow_id {
        state
            .approval_store
            .list_by_workflow(&workflow_id)
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    } else if let Some(approver) = query.approver {
        state
            .approval_store
            .list_pending_for_approver(&approver)
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    } else {
        state
            .approval_store
            .list_pending()
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    };

    let response: Vec<ApprovalApiResponse> = approvals.into_iter().map(Into::into).collect();
    Ok(Json(response))
}

/// GET /api/approval/:id - Get approval details
pub async fn get_approval(
    State(state): State<AppState>,
    Path(approval_id): Path<String>,
) -> Result<Json<ApprovalApiResponse>, StatusCode> {
    let approval = state
        .approval_store
        .load(&approval_id)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(StatusCode::NOT_FOUND)?;

    Ok(Json(approval.into()))
}

/// POST /api/approval/:id/approve - Approve workflow
pub async fn approve_workflow(
    State(state): State<AppState>,
    Path(approval_id): Path<String>,
    Json(request): Json<ApproveRequest>,
) -> Result<Json<ApprovalApiResponse>, StatusCode> {
    // Load approval state
    let approval_state = state
        .approval_store
        .load(&approval_id)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(StatusCode::NOT_FOUND)?;

    // Recreate gate
    let gate = ApprovalGate::new(&approval_state.gate_id)
        .required_approvers(approval_state.required_approvers.clone())
        .timeout_seconds(approval_state.timeout_seconds)
        .build()
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // Approve
    let updated_state = gate
        .approve(&approval_id, &request.approver, request.comment)
        .await
        .map_err(|e| {
            tracing::error!("Failed to approve: {}", e);
            StatusCode::BAD_REQUEST
        })?;

    Ok(Json(updated_state.into()))
}

/// POST /api/approval/:id/reject - Reject workflow
pub async fn reject_workflow(
    State(state): State<AppState>,
    Path(approval_id): Path<String>,
    Json(request): Json<RejectRequest>,
) -> Result<Json<ApprovalApiResponse>, StatusCode> {
    // Load approval state
    let approval_state = state
        .approval_store
        .load(&approval_id)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(StatusCode::NOT_FOUND)?;

    // Recreate gate
    let gate = ApprovalGate::new(&approval_state.gate_id)
        .required_approvers(approval_state.required_approvers.clone())
        .timeout_seconds(approval_state.timeout_seconds)
        .build()
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // Reject
    let updated_state = gate
        .reject(&approval_id, &request.approver, request.reason)
        .await
        .map_err(|e| {
            tracing::error!("Failed to reject: {}", e);
            StatusCode::BAD_REQUEST
        })?;

    Ok(Json(updated_state.into()))
}

/// WebSocket message types for approval updates
#[derive(Debug, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum ApprovalWsMessage {
    /// Approval state update
    ApprovalUpdate {
        approval_id: String,
        status: String,
        approval_count: usize,
        required_count: usize,
    },
    /// Approval completed
    ApprovalCompleted { approval_id: String, status: String },
    /// Error message
    Error { message: String },
}

/// GET /api/approval/:id/stream - WebSocket for real-time updates
pub async fn approval_stream(
    ws: WebSocketUpgrade,
    Path(approval_id): Path<String>,
    State(state): State<AppState>,
) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_approval_stream(socket, approval_id, state))
}

/// Handle WebSocket connection for approval updates
async fn handle_approval_stream(mut socket: WebSocket, approval_id: String, state: AppState) {
    let mut poll_interval = interval(Duration::from_secs(1));
    let mut last_state: Option<ApprovalState> = None;

    loop {
        tokio::select! {
            _ = poll_interval.tick() => {
                // Load current approval state
                match state.approval_store.load(&approval_id) {
                    Ok(Some(current_state)) => {
                        // Check if state has changed
                        let state_changed = match &last_state {
                            None => true,
                            Some(prev) => {
                                prev.status != current_state.status
                                    || prev.responses.len() != current_state.responses.len()
                            }
                        };

                        if state_changed {
                            // Send update message
                            let message = if current_state.is_completed() {
                                ApprovalWsMessage::ApprovalCompleted {
                                    approval_id: current_state.approval_id.clone(),
                                    status: format!("{:?}", current_state.status),
                                }
                            } else {
                                ApprovalWsMessage::ApprovalUpdate {
                                    approval_id: current_state.approval_id.clone(),
                                    status: format!("{:?}", current_state.status),
                                    approval_count: current_state.approval_count(),
                                    required_count: current_state.required_approvers.len(),
                                }
                            };

                            if let Ok(json) = serde_json::to_string(&message) {
                                if socket.send(Message::Text(json)).await.is_err() {
                                    break; // Client disconnected
                                }
                            }

                            // Stop polling if approval is completed
                            if current_state.is_completed() {
                                break;
                            }

                            last_state = Some(current_state);
                        }
                    }
                    Ok(None) => {
                        // Approval not found
                        let error_msg = ApprovalWsMessage::Error {
                            message: format!("Approval not found: {}", approval_id),
                        };
                        if let Ok(json) = serde_json::to_string(&error_msg) {
                            let _ = socket.send(Message::Text(json)).await;
                        }
                        break;
                    }
                    Err(e) => {
                        // Error loading approval
                        tracing::error!("Failed to load approval {}: {}", approval_id, e);
                        let error_msg = ApprovalWsMessage::Error {
                            message: format!("Internal server error: {}", e),
                        };
                        if let Ok(json) = serde_json::to_string(&error_msg) {
                            let _ = socket.send(Message::Text(json)).await;
                        }
                        break;
                    }
                }
            }
            Some(Ok(msg)) = socket.recv() => {
                match msg {
                    Message::Close(_) => break,
                    Message::Ping(data) => {
                        if socket.send(Message::Pong(data)).await.is_err() {
                            break;
                        }
                    }
                    _ => {}
                }
            }
        }
    }
}

/// Configure approval routes
pub fn routes() -> axum::Router<AppState> {
    use axum::routing::{get, post};

    axum::Router::new()
        .route("/", get(list_approvals))
        .route("/:id", get(get_approval))
        .route("/:id/approve", post(approve_workflow))
        .route("/:id/reject", post(reject_workflow))
        .route("/:id/stream", get(approval_stream))
}
