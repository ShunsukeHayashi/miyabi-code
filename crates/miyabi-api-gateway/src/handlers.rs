//! HTTP handlers for API Gateway

use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use std::sync::Arc;
use tokio::sync::RwLock;
use uuid::Uuid;

use crate::{AppState, models::*};

type SharedState = Arc<RwLock<AppState>>;

/// Submit a new task
pub async fn submit_task(
    State(state): State<SharedState>,
    Json(request): Json<TaskRequest>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<ApiError>)> {
    let task = Task::new(request);
    let task_id = task.id;
    
    let mut state = state.write().await;
    state.queue.enqueue(task);
    
    Ok(Json(serde_json::json!({
        "task_id": task_id,
        "status": "pending",
        "message": "Task submitted successfully"
    })))
}

/// Get task status
pub async fn get_task_status(
    State(state): State<SharedState>,
    Path(task_id): Path<Uuid>,
) -> Result<Json<TaskStatusResponse>, (StatusCode, Json<ApiError>)> {
    let state = state.read().await;
    
    match state.queue.get(task_id) {
        Some(task) => Ok(Json(TaskStatusResponse {
            task_id: task.id,
            status: task.status.clone(),
            instruction: task.instruction.clone(),
            agent: task.agent.clone(),
            result: task.result.clone(),
            created_at: task.created_at,
            completed_at: task.completed_at,
        })),
        None => Err((
            StatusCode::NOT_FOUND,
            Json(ApiError {
                error: "Task not found".to_string(),
                code: "TASK_NOT_FOUND".to_string(),
                details: None,
            }),
        )),
    }
}

/// Cancel a task
pub async fn cancel_task(
    State(state): State<SharedState>,
    Path(task_id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<ApiError>)> {
    let mut state = state.write().await;
    
    if state.queue.cancel(task_id) {
        Ok(Json(serde_json::json!({
            "task_id": task_id,
            "status": "cancelled",
            "message": "Task cancelled successfully"
        })))
    } else {
        Err((
            StatusCode::NOT_FOUND,
            Json(ApiError {
                error: "Task not found or already completed".to_string(),
                code: "CANNOT_CANCEL".to_string(),
                details: None,
            }),
        ))
    }
}

/// Health check
pub async fn health_check() -> Json<serde_json::Value> {
    Json(serde_json::json!({
        "status": "healthy",
        "version": env!("CARGO_PKG_VERSION")
    }))
}

/// System status
pub async fn system_status(
    State(state): State<SharedState>,
) -> Json<SystemStatus> {
    let state = state.read().await;
    let (pending, active, _completed) = state.queue.stats();
    
    Json(SystemStatus {
        healthy: true,
        version: env!("CARGO_PKG_VERSION").to_string(),
        active_tasks: active,
        queued_tasks: pending,
        agents_available: vec![
            AgentInfo {
                id: "kaede".to_string(),
                name: "カエデ (CodeGen)".to_string(),
                status: AgentStatus::Available,
                current_task: None,
                capabilities: vec!["code_generation".to_string(), "refactoring".to_string()],
            },
            AgentInfo {
                id: "sakura".to_string(),
                name: "サクラ (Review)".to_string(),
                status: AgentStatus::Available,
                current_task: None,
                capabilities: vec!["code_review".to_string(), "testing".to_string()],
            },
        ],
    })
}

/// List available agents
pub async fn list_agents() -> Json<Vec<AgentInfo>> {
    Json(vec![
        AgentInfo {
            id: "kaede".to_string(),
            name: "カエデ (CodeGen)".to_string(),
            status: AgentStatus::Available,
            current_task: None,
            capabilities: vec!["code_generation".to_string(), "refactoring".to_string()],
        },
        AgentInfo {
            id: "sakura".to_string(),
            name: "サクラ (Review)".to_string(),
            status: AgentStatus::Available,
            current_task: None,
            capabilities: vec!["code_review".to_string(), "testing".to_string()],
        },
        AgentInfo {
            id: "tsubaki".to_string(),
            name: "ツバキ (PR)".to_string(),
            status: AgentStatus::Available,
            current_task: None,
            capabilities: vec!["pull_request".to_string(), "merge".to_string()],
        },
        AgentInfo {
            id: "botan".to_string(),
            name: "ボタン (Deploy)".to_string(),
            status: AgentStatus::Available,
            current_task: None,
            capabilities: vec!["deployment".to_string(), "infrastructure".to_string()],
        },
    ])
}

/// Assign task to specific agent
pub async fn assign_to_agent(
    State(_state): State<SharedState>,
    Path(agent_id): Path<String>,
    Json(request): Json<TaskRequest>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<ApiError>)> {
    // Validate agent exists
    let valid_agents = ["kaede", "sakura", "tsubaki", "botan", "shikirun", "mitsukeru"];
    
    if !valid_agents.contains(&agent_id.as_str()) {
        return Err((
            StatusCode::NOT_FOUND,
            Json(ApiError {
                error: format!("Agent '{}' not found", agent_id),
                code: "AGENT_NOT_FOUND".to_string(),
                details: Some(format!("Valid agents: {:?}", valid_agents)),
            }),
        ));
    }
    
    // Create task with assigned agent
    let mut task_request = request;
    task_request.agent = Some(agent_id.clone());
    
    let task = Task::new(task_request);
    let task_id = task.id;
    
    Ok(Json(serde_json::json!({
        "task_id": task_id,
        "agent": agent_id,
        "status": "assigned",
        "message": format!("Task assigned to agent '{}'", agent_id)
    })))
}
