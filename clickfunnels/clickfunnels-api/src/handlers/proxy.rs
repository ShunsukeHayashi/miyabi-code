//! ClickFunnels API Proxy Handlers
//!
//! Proxies requests to the ClickFunnels API to bypass CORS restrictions

use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::Value;
use std::sync::Arc;

/// Shared HTTP client for proxy requests
#[derive(Clone)]
pub struct ProxyState {
    client: reqwest::Client,
    base_url: String,
    access_token: String,
}

impl ProxyState {
    pub fn new(access_token: String) -> Self {
        Self {
            client: reqwest::Client::new(),
            // Use accounts.myclickfunnels.com for team/workspace discovery
            base_url: "https://accounts.myclickfunnels.com/api/v2".to_string(),
            access_token,
        }
    }
}

/// Proxy GET requests to ClickFunnels API
///
/// # Arguments
/// * `endpoint` - The ClickFunnels API endpoint (e.g., "teams", "workspaces")
/// * `query_params` - Optional query parameters
/// * `state` - Shared proxy state with HTTP client and credentials
pub async fn proxy_get(
    Path(endpoint): Path<String>,
    Query(query_params): Query<std::collections::HashMap<String, String>>,
    State(state): State<Arc<ProxyState>>,
) -> Result<Json<Value>, ProxyError> {
    let url = format!("{}/{}", state.base_url, endpoint);
    let auth_header = format!("Bearer {}", state.access_token);

    tracing::info!("Proxying GET request to: {}", url);
    tracing::debug!("Query params: {:?}", query_params);
    tracing::debug!("Access token (first 10 chars): {}...", &state.access_token[..10.min(state.access_token.len())]);
    tracing::debug!("Authorization header (first 20 chars): {}...", &auth_header[..20.min(auth_header.len())]);

    let response = state
        .client
        .get(&url)
        .header("Authorization", auth_header)
        .header("Content-Type", "application/json")
        .header("User-Agent", "ClickFunnels-Rust-Proxy/1.0")
        .query(&query_params)
        .send()
        .await
        .map_err(|e| {
            tracing::error!("Failed to send request to ClickFunnels API: {}", e);
            ProxyError::RequestFailed(e.to_string())
        })?;

    let status = response.status();
    tracing::info!("ClickFunnels API response status: {}", status);

    if !status.is_success() {
        let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
        tracing::error!("ClickFunnels API error ({}): {}", status, error_text);
        return Err(ProxyError::ApiError(status.as_u16(), error_text));
    }

    let data: Value = response.json().await.map_err(|e| {
        tracing::error!("Failed to parse ClickFunnels API response: {}", e);
        ProxyError::ParseError(e.to_string())
    })?;

    tracing::debug!("Successfully proxied response");
    Ok(Json(data))
}

/// Proxy POST requests to ClickFunnels API
pub async fn proxy_post(
    Path(endpoint): Path<String>,
    State(state): State<Arc<ProxyState>>,
    Json(body): Json<Value>,
) -> Result<Json<Value>, ProxyError> {
    let url = format!("{}/{}", state.base_url, endpoint);

    tracing::info!("Proxying POST request to: {}", url);

    let response = state
        .client
        .post(&url)
        .header("Authorization", format!("Bearer {}", state.access_token))
        .header("Content-Type", "application/json")
        .header("User-Agent", "ClickFunnels-Rust-Proxy/1.0")
        .json(&body)
        .send()
        .await
        .map_err(|e| {
            tracing::error!("Failed to send POST request to ClickFunnels API: {}", e);
            ProxyError::RequestFailed(e.to_string())
        })?;

    let status = response.status();
    tracing::info!("ClickFunnels API POST response status: {}", status);

    if !status.is_success() {
        let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
        tracing::error!("ClickFunnels API error ({}): {}", status, error_text);
        return Err(ProxyError::ApiError(status.as_u16(), error_text));
    }

    let data: Value = response.json().await.map_err(|e| {
        tracing::error!("Failed to parse ClickFunnels API response: {}", e);
        ProxyError::ParseError(e.to_string())
    })?;

    Ok(Json(data))
}

/// Proxy errors
#[derive(Debug, thiserror::Error)]
pub enum ProxyError {
    #[error("Failed to send request: {0}")]
    RequestFailed(String),

    #[error("API error ({0}): {1}")]
    ApiError(u16, String),

    #[error("Failed to parse response: {0}")]
    ParseError(String),
}

impl IntoResponse for ProxyError {
    fn into_response(self) -> Response {
        let (status, message) = match &self {
            ProxyError::RequestFailed(msg) => (StatusCode::BAD_GATEWAY, msg.clone()),
            ProxyError::ApiError(code, msg) => {
                (StatusCode::from_u16(*code).unwrap_or(StatusCode::INTERNAL_SERVER_ERROR), msg.clone())
            }
            ProxyError::ParseError(msg) => (StatusCode::INTERNAL_SERVER_ERROR, msg.clone()),
        };

        let body = serde_json::json!({
            "error": message,
            "details": self.to_string(),
        });

        (status, Json(body)).into_response()
    }
}
