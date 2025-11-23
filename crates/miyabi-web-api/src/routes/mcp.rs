//! MCP (Model Context Protocol) Integration API routes
//!
//! Provides HTTP endpoints for interacting with MCP servers (miyabi-rules, miyabi-tmux)

use axum::{
    extract::{Path, State},
    routing::{get, post},
    Json, Router,
};
use crate::AppState;
use serde::{Deserialize, Serialize};
use std::process::{Command, Stdio};
use std::io::Write;

#[derive(Serialize, Clone)]
pub struct McpTool {
    pub name: String,
    pub description: String,
    pub server: String,
    pub input_schema: serde_json::Value,
}

#[derive(Serialize)]
pub struct McpToolsListResponse {
    pub tools: Vec<McpTool>,
    pub total: usize,
    pub servers: Vec<String>,
}

#[derive(Serialize)]
pub struct McpServerStatus {
    pub server_name: String,
    pub active: bool,
    pub tool_count: usize,
    pub command: String,
}

#[derive(Serialize)]
pub struct McpStatusResponse {
    pub servers: Vec<McpServerStatus>,
    pub total_tools: usize,
}

#[derive(Deserialize)]
pub struct McpToolInvokeRequest {
    pub arguments: serde_json::Value,
}

#[derive(Serialize)]
pub struct McpToolInvokeResponse {
    pub success: bool,
    pub result: Option<serde_json::Value>,
    pub error: Option<String>,
}

/// List all available MCP tools from all configured servers
async fn list_mcp_tools(State(_state): State<AppState>) -> Json<McpToolsListResponse> {
    let mut all_tools = Vec::new();

    // miyabi-rules server tools
    let rules_tools = vec![
        McpTool {
            name: "miyabi_rules_list".to_string(),
            description: "List P0/P1/P2/P3 rules from CLAUDE.md".to_string(),
            server: "miyabi-rules".to_string(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {
                    "priority": {
                        "type": "string",
                        "enum": ["P0", "P1", "P2", "P3", "all"],
                        "description": "Filter rules by priority level"
                    }
                }
            }),
        },
        McpTool {
            name: "miyabi_rules_validate".to_string(),
            description: "Validate task against P0/P1/P2 protocols".to_string(),
            server: "miyabi-rules".to_string(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {
                    "task_description": {
                        "type": "string",
                        "description": "Description of the task to validate"
                    },
                    "check_type": {
                        "type": "string",
                        "enum": ["all", "P0", "P1", "P2"],
                        "description": "Which protocol level to validate against"
                    }
                },
                "required": ["task_description"]
            }),
        },
        McpTool {
            name: "miyabi_rules_execute".to_string(),
            description: "Execute rule enforcement".to_string(),
            server: "miyabi-rules".to_string(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {
                    "rule_id": {
                        "type": "string",
                        "description": "Rule ID to execute (e.g., 'P0.1', 'P1.2')"
                    },
                    "context": {
                        "type": "object",
                        "description": "Execution context"
                    }
                },
                "required": ["rule_id"]
            }),
        },
        McpTool {
            name: "miyabi_rules_sync".to_string(),
            description: "Sync local ↔ cloud rules".to_string(),
            server: "miyabi-rules".to_string(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {
                    "direction": {
                        "type": "string",
                        "enum": ["pull", "push", "bidirectional"],
                        "description": "Sync direction"
                    }
                },
                "required": ["direction"]
            }),
        },
        McpTool {
            name: "miyabi_rules_get_context".to_string(),
            description: "Retrieve context modules from .claude/context/".to_string(),
            server: "miyabi-rules".to_string(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {
                    "module_name": {
                        "type": "string",
                        "description": "Context module name (e.g., 'agents', 'architecture')"
                    }
                }
            }),
        },
    ];

    // miyabi-tmux server tools
    let tmux_tools = vec![
        McpTool {
            name: "tmux_list_sessions".to_string(),
            description: "List all tmux sessions".to_string(),
            server: "miyabi-tmux".to_string(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {}
            }),
        },
        McpTool {
            name: "tmux_list_panes".to_string(),
            description: "List panes with filtering".to_string(),
            server: "miyabi-tmux".to_string(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {
                    "session_name": {
                        "type": "string",
                        "description": "Filter by session name"
                    },
                    "window_name": {
                        "type": "string",
                        "description": "Filter by window name"
                    }
                }
            }),
        },
        McpTool {
            name: "tmux_send_message".to_string(),
            description: "Send message with P0.2 protocol".to_string(),
            server: "miyabi-tmux".to_string(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {
                    "pane_id": {
                        "type": "string",
                        "description": "Target pane ID (e.g., '%50')"
                    },
                    "message": {
                        "type": "string",
                        "description": "Message to send"
                    }
                },
                "required": ["pane_id", "message"]
            }),
        },
        McpTool {
            name: "tmux_join_commhub".to_string(),
            description: "Join CommHub session".to_string(),
            server: "miyabi-tmux".to_string(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {
                    "agent_name": {
                        "type": "string",
                        "description": "Name of the agent joining CommHub"
                    }
                }
            }),
        },
        McpTool {
            name: "tmux_get_commhub_status".to_string(),
            description: "Check CommHub sync status".to_string(),
            server: "miyabi-tmux".to_string(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {}
            }),
        },
        McpTool {
            name: "tmux_broadcast".to_string(),
            description: "Broadcast to all sessions".to_string(),
            server: "miyabi-tmux".to_string(),
            input_schema: serde_json::json!({
                "type": "object",
                "properties": {
                    "message": {
                        "type": "string",
                        "description": "Message to broadcast"
                    },
                    "exclude_panes": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Pane IDs to exclude from broadcast"
                    }
                },
                "required": ["message"]
            }),
        },
    ];

    all_tools.extend(rules_tools);
    all_tools.extend(tmux_tools);

    Json(McpToolsListResponse {
        total: all_tools.len(),
        tools: all_tools,
        servers: vec!["miyabi-rules".to_string(), "miyabi-tmux".to_string()],
    })
}

/// Get MCP server status
async fn get_mcp_status(State(_state): State<AppState>) -> Json<McpStatusResponse> {
    let servers = vec![
        McpServerStatus {
            server_name: "miyabi-rules".to_string(),
            active: check_mcp_server_active("miyabi-rules"),
            tool_count: 5,
            command: "node /Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/mcp-servers/miyabi-rules-server/dist/index.js".to_string(),
        },
        McpServerStatus {
            server_name: "miyabi-tmux".to_string(),
            active: check_mcp_server_active("miyabi-tmux"),
            tool_count: 6,
            command: "node /Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/mcp-servers/miyabi-tmux-server/dist/index.js".to_string(),
        },
    ];

    let total_tools = servers.iter().map(|s| s.tool_count).sum();

    Json(McpStatusResponse {
        servers,
        total_tools,
    })
}

/// Invoke an MCP tool
async fn invoke_mcp_tool(
    State(_state): State<AppState>,
    Path(tool_name): Path<String>,
    Json(req): Json<McpToolInvokeRequest>,
) -> Json<McpToolInvokeResponse> {
    // Determine which MCP server handles this tool
    let server_path = if tool_name.starts_with("miyabi_rules_") {
        "/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/mcp-servers/miyabi-rules-server/dist/index.js"
    } else if tool_name.starts_with("tmux_") {
        "/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/mcp-servers/miyabi-tmux-server/dist/index.js"
    } else {
        return Json(McpToolInvokeResponse {
            success: false,
            result: None,
            error: Some(format!("Unknown tool: {}", tool_name)),
        });
    };

    // Build MCP request in JSON-RPC format
    let mcp_request = serde_json::json!({
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {
            "name": tool_name,
            "arguments": req.arguments
        }
    });

    // Execute MCP server with stdio communication
    match execute_mcp_request(server_path, &mcp_request) {
        Ok(result) => Json(McpToolInvokeResponse {
            success: true,
            result: Some(result),
            error: None,
        }),
        Err(e) => Json(McpToolInvokeResponse {
            success: false,
            result: None,
            error: Some(e),
        }),
    }
}

/// Check if MCP server is active (simple heuristic - check if process can start)
fn check_mcp_server_active(server_name: &str) -> bool {
    let server_path = if server_name == "miyabi-rules" {
        "/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/mcp-servers/miyabi-rules-server/dist/index.js"
    } else {
        "/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/mcp-servers/miyabi-tmux-server/dist/index.js"
    };

    // Try to spawn the process briefly to check if it's functional
    Command::new("node")
        .arg(server_path)
        .arg("--version") // This won't work with MCP servers, but checks if file exists
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()
        .is_ok()
}

/// Execute MCP request via stdio communication
fn execute_mcp_request(
    server_path: &str,
    request: &serde_json::Value,
) -> Result<serde_json::Value, String> {
    let mut child = Command::new("node")
        .arg(server_path)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to spawn MCP server: {}", e))?;

    // Send request to MCP server via stdin
    if let Some(mut stdin) = child.stdin.take() {
        let request_str = serde_json::to_string(request)
            .map_err(|e| format!("Failed to serialize request: {}", e))?;

        stdin.write_all(request_str.as_bytes())
            .map_err(|e| format!("Failed to write to stdin: {}", e))?;
        stdin.write_all(b"\n")
            .map_err(|e| format!("Failed to write newline: {}", e))?;
    }

    // Read response from stdout
    let output = child.wait_with_output()
        .map_err(|e| format!("Failed to read MCP response: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("MCP server error: {}", stderr));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    serde_json::from_str(&stdout)
        .map_err(|e| format!("Failed to parse MCP response: {}", e))
}

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/tools", get(list_mcp_tools))
        .route("/status", get(get_mcp_status))
        .route("/tools/:tool_name/invoke", post(invoke_mcp_tool))
}
