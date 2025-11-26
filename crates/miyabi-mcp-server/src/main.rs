//! MCP Server binary entry point

use clap::Parser;
use tracing_subscriber::{fmt, prelude::*, EnvFilter};

use miyabi_mcp_server::config::ServerArgs;
use miyabi_mcp_server::{initialize_all_agents, McpServer, ServerConfig};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Setup logging
    tracing_subscriber::registry()
        .with(fmt::layer())
        .with(EnvFilter::from_default_env().add_directive("miyabi_mcp_server=info".parse()?))
        .init();

    // Parse CLI arguments
    let args = ServerArgs::parse();

    // Create server configuration
    let config = ServerConfig::from_args(args)?;

    tracing::info!(
        "Miyabi MCP Server v{} starting...",
        env!("CARGO_PKG_VERSION")
    );
    tracing::info!("Transport: {:?}", config.transport);
    tracing::info!("Repository: {}/{}", config.repo_owner, config.repo_name);
    tracing::info!("Working Directory: {}", config.working_dir.display());

    // Create server with all features (SessionManager + A2A Bridge)
    let server = McpServer::with_all_features(config).await?;

    // Initialize all A2A-enabled agents
    if let Some(bridge) = server.a2a_bridge() {
        match initialize_all_agents(&bridge).await {
            Ok(count) => {
                tracing::info!("Registered {} A2A agents for Rust tool invocation", count);
            }
            Err(e) => {
                tracing::warn!("Failed to initialize some A2A agents: {}", e);
            }
        }
    }

    // Run the server
    server.run().await?;

    Ok(())
}
