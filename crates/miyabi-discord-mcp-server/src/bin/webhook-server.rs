//! GitHub Webhook Server - Receive GitHub events and notify Discord
//!
//! Usage:
//! ```
//! DISCORD_BOT_TOKEN=xxx \
//! PROGRESS_CHANNEL_ID=xxx \
//! GITHUB_WEBHOOK_SECRET=xxx \
//! cargo run --bin webhook-server
//! ```

use axum::{
    extract::State,
    http::{HeaderMap, StatusCode},
    response::IntoResponse,
    routing::post,
    Router,
};
use dotenvy::dotenv;
use hmac::{Hmac, Mac};
use miyabi_discord_mcp_server::ProgressReporter;
use serde::{Deserialize, Serialize};
use sha2::Sha256;
use std::{env, net::SocketAddr, sync::Arc};
use tower_http::trace::TraceLayer;
use tracing::{error, info, warn};
use twilight_http::Client as HttpClient;
use twilight_model::id::{marker::ChannelMarker, Id};

type HmacSha256 = Hmac<Sha256>;

/// Server state
#[derive(Clone)]
struct AppState {
    progress_reporter: Arc<ProgressReporter>,
    webhook_secret: String,
}

/// GitHub Issue payload (simplified)
#[derive(Debug, Deserialize, Serialize)]
struct IssuePayload {
    action: String,
    issue: Issue,
    repository: Repository,
}

#[derive(Debug, Deserialize, Serialize)]
struct Issue {
    number: u32,
    title: String,
    html_url: String,
    state: String,
}

#[derive(Debug, Deserialize, Serialize)]
struct Repository {
    full_name: String,
}

/// GitHub Pull Request payload (simplified)
#[derive(Debug, Deserialize, Serialize)]
struct PullRequestPayload {
    action: String,
    pull_request: PullRequest,
    repository: Repository,
}

#[derive(Debug, Deserialize, Serialize)]
struct PullRequest {
    number: u32,
    title: String,
    html_url: String,
    state: String,
    merged: Option<bool>,
}

/// Verify GitHub webhook signature
fn verify_signature(secret: &str, signature_header: &str, payload: &[u8]) -> Result<(), String> {
    // Parse signature header
    if !signature_header.starts_with("sha256=") {
        return Err("Invalid signature format".to_string());
    }

    let signature_hex = &signature_header[7..];
    let expected_signature =
        hex::decode(signature_hex).map_err(|e| format!("Failed to decode signature: {}", e))?;

    // Compute HMAC
    let mut mac = HmacSha256::new_from_slice(secret.as_bytes())
        .map_err(|e| format!("Failed to create HMAC: {}", e))?;
    mac.update(payload);

    // Verify
    mac.verify_slice(&expected_signature)
        .map_err(|_| "Signature verification failed".to_string())?;

    Ok(())
}

/// Handle GitHub webhook events
async fn handle_github_webhook(
    State(state): State<AppState>,
    headers: HeaderMap,
    body: String,
) -> impl IntoResponse {
    info!("Received GitHub webhook");

    // Get event type
    let event_type = headers
        .get("x-github-event")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("unknown");

    info!("Event type: {}", event_type);

    // Verify signature
    if let Some(signature) = headers
        .get("x-hub-signature-256")
        .and_then(|v| v.to_str().ok())
    {
        if let Err(e) = verify_signature(&state.webhook_secret, signature, body.as_bytes()) {
            error!("Signature verification failed: {}", e);
            return (StatusCode::UNAUTHORIZED, "Invalid signature").into_response();
        }
    } else {
        warn!("No signature provided (skipping verification for testing)");
    }

    // Process event
    match event_type {
        "issues" => {
            if let Ok(payload) = serde_json::from_str::<IssuePayload>(&body) {
                info!(
                    "Issue event: {} #{} - {}",
                    payload.action, payload.issue.number, payload.issue.title
                );

                // Notify Discord
                if let Err(e) = state
                    .progress_reporter
                    .report_github_issue(
                        &payload.action,
                        payload.issue.number,
                        &payload.issue.title,
                        &payload.issue.html_url,
                    )
                    .await
                {
                    error!("Failed to notify Discord: {}", e);
                }

                (StatusCode::OK, "Issue event processed").into_response()
            } else {
                error!("Failed to parse issue payload");
                (StatusCode::BAD_REQUEST, "Invalid payload").into_response()
            }
        }
        "pull_request" => {
            if let Ok(payload) = serde_json::from_str::<PullRequestPayload>(&body) {
                let action = if payload.pull_request.merged == Some(true) {
                    "merged"
                } else {
                    &payload.action
                };

                info!(
                    "PR event: {} #{} - {}",
                    action, payload.pull_request.number, payload.pull_request.title
                );

                // Notify Discord
                if let Err(e) = state
                    .progress_reporter
                    .report_github_pr(
                        action,
                        payload.pull_request.number,
                        &payload.pull_request.title,
                        &payload.pull_request.html_url,
                    )
                    .await
                {
                    error!("Failed to notify Discord: {}", e);
                }

                (StatusCode::OK, "PR event processed").into_response()
            } else {
                error!("Failed to parse PR payload");
                (StatusCode::BAD_REQUEST, "Invalid payload").into_response()
            }
        }
        "ping" => {
            info!("Ping event received");
            (StatusCode::OK, "pong").into_response()
        }
        _ => {
            warn!("Unhandled event type: {}", event_type);
            (StatusCode::OK, "Event ignored").into_response()
        }
    }
}

/// Health check endpoint
async fn health_check() -> impl IntoResponse {
    (StatusCode::OK, "OK")
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Load .env
    dotenv().ok();

    // Initialize logging
    tracing_subscriber::fmt()
        .with_env_filter(
            env::var("RUST_LOG")
                .unwrap_or_else(|_| "webhook_server=info,tower_http=info".to_string()),
        )
        .init();

    // Get configuration
    let discord_token = env::var("DISCORD_BOT_TOKEN").expect("DISCORD_BOT_TOKEN not found");
    let progress_channel_id: Id<ChannelMarker> = env::var("PROGRESS_CHANNEL_ID")
        .expect("PROGRESS_CHANNEL_ID not found")
        .parse()
        .expect("Invalid PROGRESS_CHANNEL_ID");
    let webhook_secret = env::var("GITHUB_WEBHOOK_SECRET").unwrap_or_else(|_| {
        warn!("GITHUB_WEBHOOK_SECRET not set, using default (INSECURE!)");
        "default_secret".to_string()
    });

    let port: u16 = env::var("PORT")
        .unwrap_or_else(|_| "3000".to_string())
        .parse()
        .expect("Invalid PORT");

    // Create HTTP client for Discord
    let http = Arc::new(HttpClient::new(discord_token));

    // Create progress reporter
    let progress_reporter = Arc::new(ProgressReporter::new(http, progress_channel_id));

    // Create app state
    let state = AppState {
        progress_reporter,
        webhook_secret,
    };

    // Build router
    let app = Router::new()
        .route("/webhook/github", post(handle_github_webhook))
        .route("/health", axum::routing::get(health_check))
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    // Start server
    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    info!("🚀 GitHub Webhook Server starting on {}", addr);
    info!(
        "📡 Webhook endpoint: http://{}:{}/webhook/github",
        addr.ip(),
        port
    );
    info!("❤️  Health check: http://{}:{}/health", addr.ip(), port);

    // Axum 0.7 API: use tokio::net::TcpListener instead of axum::Server
    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
