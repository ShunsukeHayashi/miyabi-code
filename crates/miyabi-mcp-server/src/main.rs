//! MCP Server binary entry point

use clap::Parser;
use tracing_subscriber::{fmt, prelude::*, EnvFilter};

use miyabi_mcp_server::config::ServerArgs;
use miyabi_mcp_server::{McpServer, ServerConfig};

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

    tracing::info!("Miyabi MCP Server v{} starting...", env!("CARGO_PKG_VERSION"));
    tracing::info!("Transport: {:?}", config.transport);
    tracing::info!("Repository: {}/{}", config.repo_owner, config.repo_name);
    tracing::info!("Working Directory: {}", config.working_dir.display());

    // Create and run server with SessionManager enabled
    let server = McpServer::with_session_manager(config).await?;
    server.run().await?;

    Ok(())
}
