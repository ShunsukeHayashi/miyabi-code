//! Miyabi Session Sync - SSE MCP Server
//!
//! Claude Code セッション同期サーバー (A2A対応)
//! Server-Sent Events (SSE) で通信

use anyhow::Result;
use clap::Parser;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use tokio::sync::broadcast;
use tracing::{info, warn, error};

mod session;
mod sync;
mod transport;

use session::SessionManager;
use sync::SyncService;
use transport::SseTransport;

/// CLI Arguments
#[derive(Parser, Debug)]
#[command(name = "miyabi-session-sync")]
#[command(about = "Claude Code session synchronization MCP server")]
struct Args {
    /// SSE server port
    #[arg(short, long, default_value = "9876")]
    port: u16,

    /// Remote hosts (comma-separated)
    #[arg(short, long)]
    remotes: Option<String>,

    /// Claude projects directory
    #[arg(long)]
    projects_dir: Option<PathBuf>,

    /// Enable auto-sync
    #[arg(long)]
    auto_sync: bool,

    /// Sync interval in seconds
    #[arg(long, default_value = "300")]
    sync_interval: u64,
}

/// MCP Server Info
#[derive(Serialize)]
struct ServerInfo {
    name: String,
    version: String,
    protocol_version: String,
}

/// MCP Tool Definition
#[derive(Serialize, Clone)]
struct ToolDef {
    name: String,
    description: String,
    input_schema: serde_json::Value,
}

/// Session Sync MCP Server
pub struct SessionSyncServer {
    session_manager: SessionManager,
    sync_service: SyncService,
    sse_transport: SseTransport,
    tools: Vec<ToolDef>,
    event_tx: broadcast::Sender<String>,
}

impl SessionSyncServer {
    /// Create new server instance
    pub async fn new(args: Args) -> Result<Self> {
        let projects_dir = args.projects_dir.unwrap_or_else(|| {
            dirs::home_dir()
                .unwrap()
                .join(".claude")
                .join("projects")
        });

        let remotes: Vec<String> = args
            .remotes
            .map(|r| r.split(',').map(|s| s.trim().to_string()).collect())
            .unwrap_or_default();

        let session_manager = SessionManager::new(projects_dir)?;
        let sync_service = SyncService::new(remotes, args.auto_sync, args.sync_interval)?;
        let sse_transport = SseTransport::new(args.port);

        let (event_tx, _) = broadcast::channel(100);

        let tools = vec![
            ToolDef {
                name: "session.list".to_string(),
                description: "List all available sessions".to_string(),
                input_schema: serde_json::json!({
                    "type": "object",
                    "properties": {
                        "project": {
                            "type": "string",
                            "description": "Filter by project name"
                        },
                        "limit": {
                            "type": "integer",
                            "description": "Maximum number of sessions to return"
                        }
                    }
                }),
            },
            ToolDef {
                name: "session.get".to_string(),
                description: "Get session details by ID".to_string(),
                input_schema: serde_json::json!({
                    "type": "object",
                    "properties": {
                        "session_id": {
                            "type": "string",
                            "description": "Session UUID"
                        }
                    },
                    "required": ["session_id"]
                }),
            },
            ToolDef {
                name: "session.sync".to_string(),
                description: "Sync session from remote host".to_string(),
                input_schema: serde_json::json!({
                    "type": "object",
                    "properties": {
                        "remote": {
                            "type": "string",
                            "description": "Remote host name (e.g., mugen, majin, pixel)"
                        },
                        "session_id": {
                            "type": "string",
                            "description": "Session UUID to sync"
                        }
                    },
                    "required": ["remote"]
                }),
            },
            ToolDef {
                name: "session.push".to_string(),
                description: "Push local session to remote host".to_string(),
                input_schema: serde_json::json!({
                    "type": "object",
                    "properties": {
                        "remote": {
                            "type": "string",
                            "description": "Target remote host"
                        },
                        "session_id": {
                            "type": "string",
                            "description": "Session UUID to push"
                        }
                    },
                    "required": ["remote", "session_id"]
                }),
            },
            ToolDef {
                name: "session.search".to_string(),
                description: "Search sessions by content".to_string(),
                input_schema: serde_json::json!({
                    "type": "object",
                    "properties": {
                        "query": {
                            "type": "string",
                            "description": "Search query"
                        },
                        "project": {
                            "type": "string",
                            "description": "Filter by project"
                        }
                    },
                    "required": ["query"]
                }),
            },
            ToolDef {
                name: "session.handoff".to_string(),
                description: "Handoff session to another device".to_string(),
                input_schema: serde_json::json!({
                    "type": "object",
                    "properties": {
                        "session_id": {
                            "type": "string",
                            "description": "Session UUID"
                        },
                        "target": {
                            "type": "string",
                            "description": "Target device (e.g., pixel, mugen)"
                        },
                        "method": {
                            "type": "string",
                            "enum": ["ssh", "adb", "sync"],
                            "description": "Transfer method"
                        }
                    },
                    "required": ["session_id", "target"]
                }),
            },
        ];

        Ok(Self {
            session_manager,
            sync_service,
            sse_transport,
            tools,
            event_tx,
        })
    }

    /// Handle tool call
    async fn handle_tool_call(
        &self,
        name: &str,
        args: serde_json::Value,
    ) -> Result<serde_json::Value> {
        match name {
            "session.list" => {
                let project = args.get("project").and_then(|v| v.as_str());
                let limit = args.get("limit").and_then(|v| v.as_u64()).unwrap_or(50) as usize;
                let sessions = self.session_manager.list_sessions(project, limit)?;
                Ok(serde_json::to_value(sessions)?)
            }
            "session.get" => {
                let session_id = args["session_id"].as_str().unwrap();
                let session = self.session_manager.get_session(session_id)?;
                Ok(serde_json::to_value(session)?)
            }
            "session.sync" => {
                let remote = args["remote"].as_str().unwrap();
                let session_id = args.get("session_id").and_then(|v| v.as_str());
                let result = self.sync_service.sync_from_remote(remote, session_id).await?;
                Ok(serde_json::to_value(result)?)
            }
            "session.push" => {
                let remote = args["remote"].as_str().unwrap();
                let session_id = args["session_id"].as_str().unwrap();
                let result = self.sync_service.push_to_remote(remote, session_id).await?;
                Ok(serde_json::to_value(result)?)
            }
            "session.search" => {
                let query = args["query"].as_str().unwrap();
                let project = args.get("project").and_then(|v| v.as_str());
                let results = self.session_manager.search_sessions(query, project)?;
                Ok(serde_json::to_value(results)?)
            }
            "session.handoff" => {
                let session_id = args["session_id"].as_str().unwrap();
                let target = args["target"].as_str().unwrap();
                let method = args.get("method").and_then(|v| v.as_str()).unwrap_or("ssh");
                let result = self.sync_service.handoff_session(session_id, target, method).await?;

                // Send SSE event for handoff
                let _ = self.event_tx.send(serde_json::json!({
                    "type": "session_handoff",
                    "session_id": session_id,
                    "target": target,
                    "status": "completed"
                }).to_string());

                Ok(serde_json::to_value(result)?)
            }
            _ => Err(anyhow::anyhow!("Unknown tool: {}", name)),
        }
    }

    /// Run SSE MCP Server
    pub async fn run(self) -> Result<()> {
        info!("Starting Session Sync MCP Server (SSE)");

        // Start SSE transport
        let event_rx = self.event_tx.subscribe();
        let tools = self.tools.clone();

        tokio::spawn(async move {
            if let Err(e) = self.sse_transport.run(tools, event_rx).await {
                error!("SSE transport error: {}", e);
            }
        });

        // Start auto-sync if enabled
        if self.sync_service.auto_sync_enabled() {
            let sync_service = self.sync_service.clone();
            let event_tx = self.event_tx.clone();

            tokio::spawn(async move {
                sync_service.run_auto_sync(event_tx).await;
            });
        }

        // Keep running
        tokio::signal::ctrl_c().await?;
        info!("Shutting down Session Sync MCP Server");

        Ok(())
    }
}

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_env_filter("miyabi_session_sync=info")
        .init();

    let args = Args::parse();
    let server = SessionSyncServer::new(args).await?;
    server.run().await
}
