//! SSE Transport Layer
//!
//! Server-Sent Events (SSE) によるMCPトランスポート

use anyhow::Result;
use axum::{
    extract::State,
    response::{
        sse::{Event, KeepAlive, Sse},
        IntoResponse,
    },
    routing::{get, post},
    Json, Router,
};
use futures::stream::Stream;
use serde::{Deserialize, Serialize};
use std::convert::Infallible;
use std::sync::Arc;
use tokio::sync::{broadcast, RwLock};
use tower_http::cors::{Any, CorsLayer};
use tracing::{info, error};

/// SSE Transport
pub struct SseTransport {
    port: u16,
}

/// Application state
#[derive(Clone)]
struct AppState {
    tools: Vec<ToolDef>,
    event_tx: broadcast::Sender<String>,
}

/// Tool definition (imported from main.rs)
#[derive(Serialize, Clone)]
struct ToolDef {
    name: String,
    description: String,
    input_schema: serde_json::Value,
}

/// MCP Request
#[derive(Deserialize)]
struct McpRequest {
    jsonrpc: String,
    id: serde_json::Value,
    method: String,
    params: Option<serde_json::Value>,
}

/// MCP Response
#[derive(Serialize)]
struct McpResponse {
    jsonrpc: String,
    id: serde_json::Value,
    result: Option<serde_json::Value>,
    error: Option<McpError>,
}

/// MCP Error
#[derive(Serialize)]
struct McpError {
    code: i32,
    message: String,
}

impl SseTransport {
    /// Create new SSE transport
    pub fn new(port: u16) -> Self {
        Self { port }
    }

    /// Run SSE server
    pub async fn run(
        self,
        tools: Vec<super::ToolDef>,
        event_rx: broadcast::Receiver<String>,
    ) -> Result<()> {
        // Convert tools
        let tools: Vec<ToolDef> = tools
            .into_iter()
            .map(|t| ToolDef {
                name: t.name,
                description: t.description,
                input_schema: t.input_schema,
            })
            .collect();

        let (event_tx, _) = broadcast::channel(100);

        let state = AppState {
            tools,
            event_tx: event_tx.clone(),
        };

        // Build router
        let app = Router::new()
            .route("/sse", get(sse_handler))
            .route("/mcp", post(mcp_handler))
            .route("/health", get(health_handler))
            .route("/tools", get(list_tools))
            .with_state(state)
            .layer(
                CorsLayer::new()
                    .allow_origin(Any)
                    .allow_methods(Any)
                    .allow_headers(Any),
            );

        // Bind and serve
        let addr = format!("0.0.0.0:{}", self.port);
        info!("SSE MCP Server listening on {}", addr);

        let listener = tokio::net::TcpListener::bind(&addr).await?;
        axum::serve(listener, app).await?;

        Ok(())
    }
}

/// SSE event stream handler
async fn sse_handler(
    State(state): State<AppState>,
) -> Sse<impl Stream<Item = Result<Event, Infallible>>> {
    let mut rx = state.event_tx.subscribe();

    let stream = async_stream::stream! {
        // Send initial connection event
        yield Ok(Event::default()
            .event("connected")
            .data("Session Sync MCP Server connected"));

        // Stream events
        loop {
            match rx.recv().await {
                Ok(data) => {
                    yield Ok(Event::default()
                        .event("message")
                        .data(data));
                }
                Err(broadcast::error::RecvError::Lagged(n)) => {
                    yield Ok(Event::default()
                        .event("warning")
                        .data(format!("Lagged {} messages", n)));
                }
                Err(broadcast::error::RecvError::Closed) => {
                    break;
                }
            }
        }
    };

    Sse::new(stream).keep_alive(KeepAlive::default())
}

/// MCP JSON-RPC handler
async fn mcp_handler(
    State(state): State<AppState>,
    Json(request): Json<McpRequest>,
) -> impl IntoResponse {
    let response = match request.method.as_str() {
        "initialize" => McpResponse {
            jsonrpc: "2.0".to_string(),
            id: request.id,
            result: Some(serde_json::json!({
                "protocolVersion": "2024-11-05",
                "capabilities": {
                    "tools": {},
                    "streaming": true
                },
                "serverInfo": {
                    "name": "miyabi-session-sync",
                    "version": "0.1.0"
                }
            })),
            error: None,
        },

        "tools/list" => McpResponse {
            jsonrpc: "2.0".to_string(),
            id: request.id,
            result: Some(serde_json::json!({
                "tools": state.tools
            })),
            error: None,
        },

        "tools/call" => {
            // Extract tool name and arguments
            let params = request.params.unwrap_or_default();
            let tool_name = params
                .get("name")
                .and_then(|v| v.as_str())
                .unwrap_or("");
            let _arguments = params.get("arguments").cloned().unwrap_or_default();

            // TODO: Actually call the tool via SessionSyncServer
            // For now, return a placeholder response
            McpResponse {
                jsonrpc: "2.0".to_string(),
                id: request.id,
                result: Some(serde_json::json!({
                    "content": [{
                        "type": "text",
                        "text": format!("Tool '{}' called (placeholder response)", tool_name)
                    }]
                })),
                error: None,
            }
        }

        _ => McpResponse {
            jsonrpc: "2.0".to_string(),
            id: request.id,
            result: None,
            error: Some(McpError {
                code: -32601,
                message: format!("Method not found: {}", request.method),
            }),
        },
    };

    Json(response)
}

/// Health check handler
async fn health_handler() -> impl IntoResponse {
    Json(serde_json::json!({
        "status": "ok",
        "service": "miyabi-session-sync",
        "version": "0.1.0"
    }))
}

/// List available tools
async fn list_tools(State(state): State<AppState>) -> impl IntoResponse {
    Json(serde_json::json!({
        "tools": state.tools
    }))
}
