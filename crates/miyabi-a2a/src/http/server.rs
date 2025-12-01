//! HTTP server implementation using Axum

use axum::{
    http::{header, HeaderValue, Method},
    routing::{get, post},
    Router,
};
use std::net::SocketAddr;
use std::sync::Arc;
use tower_http::cors::CorsLayer;

use super::routes::{
    cancel_task, get_agents, get_events, get_system_status, get_workflow_dag, health_check, retry_task,
};
use super::websocket::{broadcast_updates, ws_handler, WsState};
use crate::storage::TaskStorage;

/// Application state shared across all handlers
#[derive(Clone)]
pub struct AppState {
    /// WebSocket state for real-time updates
    pub ws_state: Arc<WsState>,
    /// Task storage backend (using trait object for dynamic dispatch)
    pub storage: Arc<dyn TaskStorage>,
}

/// HTTP server configuration
#[derive(Debug, Clone)]
pub struct HttpServerConfig {
    /// Host
    pub host: String,
    pub port: u16,
}

impl Default for HttpServerConfig {
    fn default() -> Self {
        Self { host: "127.0.0.1".to_string(), port: 3001 }
    }
}

/// Start the HTTP REST API server with task storage
pub async fn start_http_server(config: HttpServerConfig, storage: Arc<dyn TaskStorage>) -> anyhow::Result<()> {
    // Create WebSocket state
    let ws_state = Arc::new(WsState::new());

    // Create application state
    let app_state = AppState { ws_state: ws_state.clone(), storage };

    // Spawn background task to broadcast updates
    let ws_state_clone = ws_state.clone();
    tokio::spawn(async move {
        broadcast_updates(ws_state_clone).await;
    });

    // CORS configuration for frontend
    let cors = CorsLayer::new()
        .allow_origin("http://localhost:5173".parse::<HeaderValue>()?)
        .allow_methods([Method::GET, Method::POST])
        .allow_headers([header::CONTENT_TYPE]);

    // Build router with routes
    let app = Router::new()
        .route("/health", get(health_check))
        .route("/api/agents", get(get_agents))
        .route("/api/system", get(get_system_status))
        .route("/api/events", get(get_events))
        .route("/api/workflow/dag", get(get_workflow_dag))
        // Task recovery endpoints
        .route("/api/tasks/:id/retry", post(retry_task))
        .route("/api/tasks/:id/cancel", post(cancel_task))
        // WebSocket endpoint
        .route("/ws", get(ws_handler))
        .with_state(app_state)
        .layer(cors);

    // Bind to address
    let addr = format!("{}:{}", config.host, config.port).parse::<SocketAddr>()?;

    tracing::info!("🚀 Miyabi Dashboard API server listening on http://{}", addr);
    tracing::info!("📡 WebSocket endpoint available at ws://{}/ws", addr);

    // Start server
    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
