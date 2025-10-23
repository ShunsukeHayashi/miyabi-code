use axum::{
    routing::{get, post},
    Router,
};
use std::net::SocketAddr;
use tower_http::cors::{Any, CorsLayer};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod handlers;
mod middleware;
mod models;
mod services;

#[tokio::main]
async fn main() {
    // Initialize tracing
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "miyabi_web_api=info,tower_http=info".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Load environment variables
    dotenvy::dotenv().ok();

    // Build application router
    let app = Router::new()
        .route("/health", get(health_check))
        .route("/api/auth/github", get(handlers::auth::github_auth_redirect))
        .route(
            "/api/auth/github/callback",
            get(handlers::auth::github_auth_callback),
        )
        .route("/api/auth/me", get(handlers::auth::get_current_user))
        .route("/api/auth/logout", post(handlers::auth::logout))
        .route("/api/auth/mock", post(handlers::auth::mock_auth))
        .layer(
            CorsLayer::new()
                .allow_origin(Any)
                .allow_methods(Any)
                .allow_headers(Any),
        );

    // Start server
    let port = std::env::var("PORT")
        .ok()
        .and_then(|p| p.parse::<u16>().ok())
        .unwrap_or(8080);
    let addr = SocketAddr::from(([0, 0, 0, 0], port));

    let listener = tokio::net::TcpListener::bind(&addr)
        .await
        .unwrap();

    tracing::info!("Miyabi Web API listening on {}", addr);

    axum::serve(listener, app)
        .await
        .unwrap();
}

async fn health_check() -> &'static str {
    "OK"
}
