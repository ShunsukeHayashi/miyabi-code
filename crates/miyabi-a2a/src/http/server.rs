//! HTTP server implementation using Axum

use axum::{
    http::{header, HeaderValue, Method},
    routing::get,
    Router,
};
use std::net::SocketAddr;
use std::sync::Arc;
use tower_http::cors::CorsLayer;

use super::routes::{get_agents, get_system_status, health_check};
use super::websocket::{ws_handler, WsState, broadcast_updates};

/// HTTP server configuration
#[derive(Debug, Clone)]
pub struct HttpServerConfig {
    pub host: String,
    pub port: u16,
}

impl Default for HttpServerConfig {
    fn default() -> Self {
        Self {
            host: "127.0.0.1".to_string(),
            port: 3001,
        }
    }
}

/// Start the HTTP REST API server
pub async fn start_http_server(config: HttpServerConfig) -> anyhow::Result<()> {
    // Create WebSocket state
    let ws_state = Arc::new(WsState::new());

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
        .route("/ws", get(ws_handler))
        .with_state(ws_state)
        .layer(cors);

    // Bind to address
    let addr = format!("{}:{}", config.host, config.port)
        .parse::<SocketAddr>()?;

    tracing::info!("🚀 Miyabi Dashboard API server listening on http://{}", addr);
    tracing::info!("📡 WebSocket endpoint available at ws://{}/ws", addr);

    // Start server
    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
