//! Miyabi Dashboard API Server
//!
//! This binary starts the HTTP REST API server for the Miyabi dashboard.

use miyabi_a2a::{
    http::{start_http_server, HttpServerConfig},
    GitHubTaskStorage,
};
use std::sync::Arc;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_target(false)
        .with_thread_ids(false)
        .with_file(false)
        .with_line_number(false)
        .init();

    tracing::info!("🚀 Starting Miyabi Dashboard API Server...");

    // Get GitHub configuration from environment
    let github_token =
        std::env::var("GITHUB_TOKEN").expect("GITHUB_TOKEN environment variable is required");
    let github_owner =
        std::env::var("GITHUB_OWNER").unwrap_or_else(|_| "ShunsukeHayashi".to_string());
    let github_repo = std::env::var("GITHUB_REPO").unwrap_or_else(|_| "Miyabi".to_string());

    // Initialize task storage
    let storage = Arc::new(GitHubTaskStorage::new(github_token, github_owner, github_repo)?);

    // Server configuration
    let config = HttpServerConfig {
        host: std::env::var("HOST").unwrap_or_else(|_| "127.0.0.1".to_string()),
        port: std::env::var("PORT").ok().and_then(|p| p.parse().ok()).unwrap_or(3001),
    };

    // Start server
    start_http_server(config, storage).await?;

    Ok(())
}
