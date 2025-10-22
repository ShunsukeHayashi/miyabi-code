//! Health check endpoint

use axum::{http::StatusCode, Json};
use serde::Serialize;

/// Health check response
#[derive(Serialize)]
pub struct HealthResponse {
    status: String,
    version: String,
}

/// Health check endpoint
///
/// Returns 200 OK if the service is running
#[utoipa::path(
    get,
    path = "/api/v1/health",
    tag = "health",
    responses(
        (status = 200, description = "Service is healthy", body = HealthResponse)
    )
)]
pub async fn health_check() -> (StatusCode, Json<HealthResponse>) {
    (
        StatusCode::OK,
        Json(HealthResponse {
            status: "ok".to_string(),
            version: env!("CARGO_PKG_VERSION").to_string(),
        }),
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_health_check() {
        let (status, response) = health_check().await;
        assert_eq!(status, StatusCode::OK);
        assert_eq!(response.0.status, "ok");
    }
}
