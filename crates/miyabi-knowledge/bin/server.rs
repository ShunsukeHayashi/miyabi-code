//! Miyabi Knowledge Dashboard Server
//!
//! Web UI dashboard for knowledge base visualization, search, and statistics.

use miyabi_knowledge::{server::KnowledgeServer, KnowledgeConfig};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt, EnvFilter};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize logging
    tracing_subscriber::registry()
        .with(EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info")))
        .with(tracing_subscriber::fmt::layer())
        .init();

    tracing::info!("🚀 Starting Miyabi Knowledge Dashboard Server");

    // Load configuration
    let config = KnowledgeConfig::default();

    // Create server
    let server = KnowledgeServer::new(config).await?;

    // Start server on port 8080
    let port = std::env::var("PORT")
        .ok()
        .and_then(|p| p.parse().ok())
        .unwrap_or(8080);

    tracing::info!(
        "📊 Knowledge Dashboard starting on http://localhost:{}",
        port
    );
    tracing::info!("📡 API endpoints:");
    tracing::info!("  - GET /api/search?q=query");
    tracing::info!("  - GET /api/stats");
    tracing::info!("  - GET /api/agents");
    tracing::info!("  - GET /api/timeline");
    tracing::info!("  - WS  /ws");
    tracing::info!("  - GET /health");

    server.serve(port).await?;

    Ok(())
}
