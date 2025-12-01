#!/usr/bin/env rust
//! Miyabi MCP Server Template
//!
//! This is a template for creating new MCP servers in the Miyabi ecosystem.
//! Replace all instances of "template" with your actual server name.
//!
//! # Quick Start
//!
//! ```bash
//! # Copy this template
//! cp -r crates/miyabi-mcp-template crates/miyabi-mcp-<your-server>
//!
//! # Update Cargo.toml name and description
//! # Update this file with your server logic
//! # Implement your tools in src/server.rs
//!
//! # Build and test
//! cargo build -p miyabi-mcp-<your-server>
//! cargo test -p miyabi-mcp-<your-server>
//!
//! # Test with MCP Inspector
//! npx @modelcontextprotocol/inspector
//! ```

use anyhow::Result;
use rmcp::{transport::stdio, ServiceExt};
use tracing_subscriber::{fmt, EnvFilter};

mod server;
use server::TemplateServer;

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize logging to stderr (MCP uses stdio for protocol)
    fmt()
        .with_env_filter(EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info")))
        .with_writer(std::io::stderr)
        .with_ansi(false)
        .init();

    tracing::info!("Starting Miyabi MCP Template Server");
    tracing::info!("Replace 'template' with your actual server name");

    // Create server instance
    let server = TemplateServer::new();

    // Connect with stdio transport
    let service = server.serve(stdio()).await?;

    tracing::info!("Server initialized successfully");
    tracing::info!("Waiting for MCP client connections...");

    // Wait for shutdown
    service.waiting().await?;

    tracing::info!("Server shutting down");
    Ok(())
}
