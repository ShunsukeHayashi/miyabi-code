//! ClickFunnels Server
//!
//! Axum-based API server with ClickFunnels proxy to bypass CORS

use clickfunnels_api::{create_api_router_with_proxy, AppState, ProxyState};
use clickfunnels_db::Database;
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

    // Load environment variables from .env files
    dotenvy::dotenv().ok();
    dotenvy::from_path("frontend/.env").ok();

    // Ensure JWT secret is configured for token operations
    std::env::var("JWT_SECRET").expect("JWT_SECRET must be set in environment or .env file");

    // Connect to PostgreSQL
    let database_url = std::env::var("DATABASE_URL")
        .expect("DATABASE_URL must be set in environment or .env file");
    let db = Database::new(&database_url).await?;

    // Ensure database schema is up-to-date
    db.run_migrations().await?;

    // Get ClickFunnels access token from environment
    let access_token = std::env::var("VITE_CLICKFUNNELS_ACCESS_TOKEN")
        .expect("VITE_CLICKFUNNELS_ACCESS_TOKEN must be set in environment or .env file");

    info!("Loaded ClickFunnels access token from environment");

    // Create API router with proxy routes
    let proxy_state = ProxyState::new(access_token);
    let app_state = AppState::with_proxy(db, proxy_state);
    let app = create_api_router_with_proxy().with_state(app_state);

    // Bind to localhost:3000
    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    info!("Server listening on http://{}", addr);
    info!(
        "ClickFunnels proxy available at http://{}/api/v1/proxy/clickfunnels/:endpoint",
        addr
    );

    // Start server
    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
