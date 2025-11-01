//! ClickFunnels Server
//!
//! Axum-based API server with ClickFunnels proxy to bypass CORS

use std::net::SocketAddr;
use tracing::info;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize logging
    tracing_subscriber::fmt()
        .with_env_filter(
            std::env::var("RUST_LOG")
                .unwrap_or_else(|_| "clickfunnels_server=info,clickfunnels_api=info".to_string()),
        )
        .init();

    info!("Starting ClickFunnels Server...");

    // Load environment variables from .env file
    dotenvy::from_path("frontend/.env").ok();

    // Get ClickFunnels access token from environment
    let access_token = std::env::var("VITE_CLICKFUNNELS_ACCESS_TOKEN")
        .expect("VITE_CLICKFUNNELS_ACCESS_TOKEN must be set in environment or .env file");

    info!("Loaded ClickFunnels access token from environment");

    // Create API router with proxy routes
    let app = clickfunnels_api::create_api_router_with_proxy(access_token);

    // Bind to localhost:3000
    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    info!("Server listening on http://{}", addr);
    info!("ClickFunnels proxy available at http://{}/api/v1/proxy/clickfunnels/:endpoint", addr);

    // Start server
    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
