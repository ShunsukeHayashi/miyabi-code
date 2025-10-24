use axum::{
    routing::{get, post},
    Router,
    Json,
};
use serde::{Deserialize, Serialize};
use std::net::SocketAddr;
use std::sync::Arc;
use tower_http::cors::{CorsLayer, Any};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod routes;
mod services;
mod models;
mod auth;
mod websocket;

/// Application state
#[derive(Clone)]
pub struct AppState {
    pub ws_state: Arc<websocket::WsState>,
}

#[derive(Serialize)]
struct HealthResponse {
    status: String,
    version: String,
}

async fn health_check() -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "ok".to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
    })
}

#[tokio::main]
async fn main() {
    // Initialize tracing
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "miyabi_web_api=debug,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Load environment variables
    dotenvy::dotenv().ok();

    // Create WebSocket state
    let ws_state = Arc::new(websocket::WsState::new());

    // Start event simulator
    websocket::start_event_simulator(Arc::clone(&ws_state));

    // Build CORS layer
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    // Build router
    let app = Router::new()
        .route("/health", get(health_check))
        .route("/ws", get({
            let ws_state = Arc::clone(&ws_state);
            move |ws| websocket::ws_handler(ws, ws_state)
        }))
        .nest("/api", routes::api_routes())
        .layer(cors);

    // Start server
    let addr = SocketAddr::from(([127, 0, 0, 1], 4000));
    tracing::info!("🌸 Miyabi Web API listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr)
        .await
        .expect("Failed to bind address");

    axum::serve(listener, app)
        .await
        .expect("Failed to start server");
}
