use axum::{
    middleware::from_fn,
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

use handlers::line::{handle_webhook, AppState};
use middleware::line_signature::verify_line_signature;

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

    // Initialize LINE Bot state
    let line_channel_access_token = std::env::var("LINE_CHANNEL_ACCESS_TOKEN")
        .expect("LINE_CHANNEL_ACCESS_TOKEN must be set");
    let line_app_state = AppState::new(line_channel_access_token);

    tracing::info!("LINE Bot initialized with channel access token");

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
        // LINE Webhook (開発環境: 署名検証を一時無効化)
        // NOTE: 本番環境では .layer(from_fn(verify_line_signature)) を有効化すること
        .route("/api/line/webhook", post(handle_webhook))
        // .layer(from_fn(verify_line_signature))  // 開発時は無効化
        .with_state(line_app_state)
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
