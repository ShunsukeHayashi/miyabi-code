//! Miyabi Historical API - Binary entry point
//!
//! This binary starts the Axum REST API server for historical AI chatbot

use axum::{routing::post, Router};
use miyabi_historical::api::{chat_handler, AppState};
use tower_http::{
    cors::{Any, CorsLayer},
    trace::TraceLayer,
};
use tracing::{error, info};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize tracing
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "miyabi_historical=info,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    info!("🚀 Starting Miyabi Historical API Server");

    // Create application state from environment
    let app_state = AppState::from_env().map_err(|e| {
        error!("Failed to initialize application state: {}", e);
        error!("Make sure ANTHROPIC_API_KEY environment variable is set");
        e
    })?;

    info!("✅ Application state initialized");

    // Configure CORS
    let cors = CorsLayer::new().allow_origin(Any).allow_methods(Any).allow_headers(Any);

    // Build router
    let app = Router::new()
        .route("/api/chat", post(chat_handler))
        .layer(cors)
        .layer(TraceLayer::new_for_http())
        .with_state(app_state);

    // Server configuration
    let port = std::env::var("PORT").ok().and_then(|p| p.parse().ok()).unwrap_or(3000);

    let addr = format!("0.0.0.0:{}", port);
    let listener = tokio::net::TcpListener::bind(&addr).await?;

    info!("🎯 Server listening on http://{}", addr);
    info!("📡 API endpoint: POST http://{}/api/chat", addr);
    info!("");
    info!("Available historical figures:");
    info!("  - oda_nobunaga (織田信長)");
    info!("  - sakamoto_ryoma (坂本龍馬)");
    info!("  - tokugawa_ieyasu (徳川家康)");
    info!("");
    info!("Example request:");
    info!(r#"  curl -X POST http://{}/api/chat \"#, addr);
    info!(r#"    -H "Content-Type: application/json" \"#);
    info!(
        r#"    -d '{{"figure": "oda_nobunaga", "message": "経営戦略について教えて", "user_id": "test_user"}}'"#
    );
    info!("");

    // Start server
    axum::serve(listener, app).await?;

    Ok(())
}
