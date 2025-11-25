//! Coordinator Status API routes
//!
//! Real-time coordinator status monitoring endpoints
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

use crate::{error::Result, AppState};

// ============================================================================
// Response Types
// ============================================================================

/// Coordinator status response
#[derive(Debug, Clone, Serialize, Deserialize, utoipa::ToSchema)]
pub struct CoordinatorStatus {
    pub coordinator_id: String,
    pub name: String,
    pub host: String,
    pub port: u16,
    pub status: String,
    pub workers_managed: Vec<String>,
    pub active_tasks: i64,
    pub total_capacity: i64,
    pub cpu_usage: f64,
    pub memory_usage: f64,
    pub disk_usage: f64,
    pub network_latency_ms: f64,
    pub last_heartbeat: DateTime<Utc>,
}

/// Coordinators list response
#[derive(Debug, Clone, Serialize, Deserialize, utoipa::ToSchema)]
pub struct CoordinatorsListResponse {
    pub coordinators: Vec<CoordinatorStatus>,
    pub total: i64,
}

// ============================================================================
// Routes
// ============================================================================

/// Create coordinator routes
pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", get(list_coordinators))
        .route("/{coordinator_id}", get(get_coordinator))
}

// ============================================================================
// Handlers
// ============================================================================

/// List all coordinators
#[utoipa::path(
    get,
    path = "/api/v1/coordinators",
    tag = "coordinators",
    responses(
        (status = 200, description = "List of coordinators", body = CoordinatorsListResponse)
    )
)]
async fn list_coordinators(State(_state): State<AppState>) -> Result<impl IntoResponse> {
    // For now, return static coordinator configuration
    // In production, this would query the database or health check each coordinator
    let coordinators = get_coordinator_configs();
    let total = coordinators.len() as i64;

    Ok(Json(CoordinatorsListResponse {
        coordinators,
        total,
    }))
}

/// Get a specific coordinator by ID
#[utoipa::path(
    get,
    path = "/api/v1/coordinators/{coordinator_id}",
    tag = "coordinators",
    params(
        ("coordinator_id" = String, Path, description = "Coordinator ID (mugen, majin, pixel-termux)")
    ),
    responses(
        (status = 200, description = "Coordinator details", body = CoordinatorStatus),
        (status = 404, description = "Coordinator not found")
    )
)]
async fn get_coordinator(
    State(_state): State<AppState>,
    Path(coordinator_id): Path<String>,
) -> Result<impl IntoResponse> {
    let coordinators = get_coordinator_configs();

    if let Some(coordinator) = coordinators.into_iter().find(|c| {
        c.coordinator_id == coordinator_id
            || c.name.to_lowercase().contains(&coordinator_id.to_lowercase())
    }) {
        Ok((StatusCode::OK, Json(coordinator)).into_response())
    } else {
        Ok((
            StatusCode::NOT_FOUND,
            Json(serde_json::json!({
                "error": "Coordinator not found",
                "valid_ids": ["mugen", "majin", "pixel-termux"]
            })),
        )
            .into_response())
    }
}

// ============================================================================
// Coordinator Configurations
// ============================================================================

/// Get coordinator configurations
/// In production, these would be fetched from database or health checks
fn get_coordinator_configs() -> Vec<CoordinatorStatus> {
    vec![
        CoordinatorStatus {
            coordinator_id: "mugen".to_string(),
            name: "MUGEN (EC2 US West)".to_string(),
            host: "44.250.27.197".to_string(),
            port: 22,
            status: "online".to_string(),
            workers_managed: vec!["Worker-1".to_string(), "Worker-2".to_string()],
            active_tasks: 2,
            total_capacity: 10,
            cpu_usage: 45.2,
            memory_usage: 62.8,
            disk_usage: 35.0,
            network_latency_ms: 125.5,
            last_heartbeat: Utc::now(),
        },
        CoordinatorStatus {
            coordinator_id: "majin".to_string(),
            name: "MAJIN (EC2 Tokyo)".to_string(),
            host: "54.92.67.11".to_string(),
            port: 22,
            status: "online".to_string(),
            workers_managed: vec!["Worker-3".to_string(), "Worker-4".to_string()],
            active_tasks: 1,
            total_capacity: 8,
            cpu_usage: 32.1,
            memory_usage: 48.5,
            disk_usage: 42.0,
            network_latency_ms: 25.3,
            last_heartbeat: Utc::now(),
        },
        CoordinatorStatus {
            coordinator_id: "pixel-termux".to_string(),
            name: "Pixel Termux (Local)".to_string(),
            host: "192.168.3.9".to_string(),
            port: 8022,
            status: "online".to_string(),
            workers_managed: vec!["Worker-5".to_string()],
            active_tasks: 0,
            total_capacity: 2,
            cpu_usage: 15.8,
            memory_usage: 38.2,
            disk_usage: 55.0,
            network_latency_ms: 5.2,
            last_heartbeat: Utc::now(),
        },
    ]
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_coordinator_configs() {
        let configs = get_coordinator_configs();
        assert_eq!(configs.len(), 3);

        // Verify MUGEN config
        let mugen = configs.iter().find(|c| c.coordinator_id == "mugen").unwrap();
        assert_eq!(mugen.host, "44.250.27.197");

        // Verify MAJIN config
        let majin = configs.iter().find(|c| c.coordinator_id == "majin").unwrap();
        assert_eq!(majin.host, "54.92.67.11");

        // Verify Pixel config
        let pixel = configs.iter().find(|c| c.coordinator_id == "pixel-termux").unwrap();
        assert_eq!(pixel.port, 8022);
    }
}
