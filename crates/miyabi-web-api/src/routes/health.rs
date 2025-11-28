//! Health check endpoint

use axum::{extract::State, http::StatusCode, Json};
use serde::Serialize;

use crate::AppState;

/// Database statistics
#[derive(Serialize, utoipa::ToSchema)]
pub struct DatabaseStats {
    /// Number of active connections
    pub active_connections: u32,
    /// Number of idle connections
    pub idle_connections: u32,
    /// Maximum allowed connections
    pub max_connections: u32,
    /// Database connection status
    pub status: String,
}

/// Health check response
#[derive(Serialize, utoipa::ToSchema)]
pub struct HealthResponse {
    status: String,
    version: String,
    database: Option<DatabaseStats>,
}

/// Health check endpoint
///
/// Returns 200 OK if the service is running
/// Includes database connection pool statistics
#[utoipa::path(
    get,
    path = "/api/v1/health",
    tag = "health",
    responses(
        (status = 200, description = "Service is healthy", body = HealthResponse)
    )
)]
pub async fn health_check(State(state): State<AppState>) -> (StatusCode, Json<HealthResponse>) {
    // Check database connection and gather statistics
    let database = match sqlx::query("SELECT 1").fetch_one(&state.db).await {
        Ok(_) => {
            let pool_options = state.db.options();
            let total_connections = state.db.size();
            let idle = state.db.num_idle() as u32;
            Some(DatabaseStats {
                active_connections: total_connections.saturating_sub(idle),
                idle_connections: idle,
                max_connections: pool_options.get_max_connections(),
                status: "connected".to_string(),
            })
        }
        Err(e) => {
            tracing::error!("Database health check failed: {}", e);
            Some(DatabaseStats {
                active_connections: 0,
                idle_connections: 0,
                max_connections: 0,
                status: format!("error: {}", e),
            })
        }
    };

    (
        StatusCode::OK,
        Json(HealthResponse {
            status: "ok".to_string(),
            version: env!("CARGO_PKG_VERSION").to_string(),
            database,
        }),
    )
}

// Tests require database connection - use integration tests instead
