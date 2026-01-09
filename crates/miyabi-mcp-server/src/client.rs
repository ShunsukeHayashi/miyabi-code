//\! MCP Client for communicating with external MCP servers
//\!
//\! This module provides a client implementation for communicating with
//\! MCP (Model Context Protocol) servers via JSON-RPC 2.0 over stdio.

use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;
use std::process::Stdio;
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::Duration;
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader, BufWriter};
use tokio::process::{Child, ChildStdin, ChildStdout, Command};
use tokio::sync::Mutex;
use tokio::time::timeout;

use crate::registry::{RegistryError, RegistryResult};

/// Default timeout for JSON-RPC requests
const DEFAULT_TIMEOUT: Duration = Duration::from_secs(30);

/// JSON-RPC 2.0 Request
#[derive(Debug, Clone, Serialize)]
struct JsonRpcRequest {
    jsonrpc: &'static str,
    id: u64,
    method: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    params: Option<Value>,
}

/// JSON-RPC 2.0 Response
#[derive(Debug, Clone, Deserialize)]
struct JsonRpcResponse {
    #[allow(dead_code)]
    jsonrpc: String,
    id: u64,
    #[serde(default)]
    result: Option<Value>,
    #[serde(default)]
    error: Option<JsonRpcError>,
}

/// JSON-RPC 2.0 Error
#[derive(Debug, Clone, Deserialize)]
struct JsonRpcError {
    code: i64,
    message: String,
    #[serde(default)]
    #[allow(dead_code)]
    data: Option<Value>,
}

/// Tool definition from MCP server
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct McpToolDefinition {
    pub name: String,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(default)]
    pub input_schema: Option<Value>,
}

/// Tools list response
#[derive(Debug, Clone, Deserialize)]
struct ToolsListResult {
    tools: Vec<McpToolDefinition>,
}

/// Tool call result
#[derive(Debug, Clone, Deserialize)]
pub struct ToolCallResult {
    #[serde(default)]
    pub content: Vec<ToolCallContent>,
    #[serde(default)]
    pub is_error: bool,
}

/// Tool call content item
#[derive(Debug, Clone, Deserialize)]
pub struct ToolCallContent {
    #[serde(rename = "type")]
    pub content_type: String,
    #[serde(default)]
    pub text: Option<String>,
    #[serde(default)]
    pub data: Option<String>,
    #[serde(default)]
    pub mime_type: Option<String>,
}

/// MCP Client for stdio-based communication
pub struct McpClient {
    /// Child process handle (for cleanup)
    _child: Mutex<Child>,
    /// Buffered stdin writer
    stdin: Mutex<BufWriter<ChildStdin>>,
    /// Buffered stdout reader
    stdout: Mutex<BufReader<ChildStdout>>,
    /// Request ID counter
    request_id: AtomicU64,
    /// Server ID for logging
    server_id: String,
}

impl McpClient {
    /// Spawn a new MCP server process and create a client
    pub async fn spawn(
        server_id: &str,
        command: &str,
        args: &[String],
        env: Option<&HashMap<String, String>>,
    ) -> RegistryResult<Self> {
        tracing::debug!(
            server_id = server_id,
            command = command,
            "Spawning MCP server process"
        );

        let mut cmd = Command::new(command);
        cmd.args(args)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .kill_on_drop(true);

        if let Some(env_vars) = env {
            for (key, value) in env_vars {
                cmd.env(key, value);
            }
        }

        let mut child = cmd.spawn().map_err(|e| {
            RegistryError::Connection(format!(
                "Failed to spawn MCP server {}: {}",
                server_id, e
            ))
        })?;

        let stdin = child.stdin.take().ok_or_else(|| {
            RegistryError::Connection("Failed to get stdin handle".to_string())
        })?;
        
        let stdout = child.stdout.take().ok_or_else(|| {
            RegistryError::Connection("Failed to get stdout handle".to_string())
        })?;

        tracing::info!(
            server_id = server_id,
            pid = ?child.id(),
            "MCP server process spawned"
        );

        Ok(Self {
            _child: Mutex::new(child),
            stdin: Mutex::new(BufWriter::new(stdin)),
            stdout: Mutex::new(BufReader::new(stdout)),
            request_id: AtomicU64::new(1),
            server_id: server_id.to_string(),
        })
    }

    /// Send a JSON-RPC request and wait for response
    async fn request(&self, method: &str, params: Option<Value>) -> RegistryResult<Value> {
        let id = self.request_id.fetch_add(1, Ordering::SeqCst);
        
        let request = JsonRpcRequest {
            jsonrpc: "2.0",
            id,
            method: method.to_string(),
            params,
        };

        let request_json = serde_json::to_string(&request)?;

        tracing::debug!(
            server_id = self.server_id,
            method = method,
            id = id,
            "Sending JSON-RPC request"
        );

        // Write request to stdin
        {
            let mut stdin = self.stdin.lock().await;
            stdin.write_all(request_json.as_bytes()).await.map_err(|e| {
                RegistryError::Connection(format!("Failed to write to stdin: {}", e))
            })?;
            stdin.write_all(b"\n").await.map_err(|e| {
                RegistryError::Connection(format!("Failed to write newline: {}", e))
            })?;
            stdin.flush().await.map_err(|e| {
                RegistryError::Connection(format!("Failed to flush stdin: {}", e))
            })?;
        }

        // Read response from stdout
        let line = {
            let mut stdout = self.stdout.lock().await;
            let mut line = String::new();

            let read_result = timeout(DEFAULT_TIMEOUT, stdout.read_line(&mut line)).await;

            match read_result {
                Ok(Ok(0)) => {
                    return Err(RegistryError::Connection(
                        "Server closed connection".to_string(),
                    ));
                }
                Ok(Ok(_)) => line,
                Ok(Err(e)) => {
                    return Err(RegistryError::Connection(format!(
                        "Failed to read from stdout: {}",
                        e
                    )));
                }
                Err(_) => {
                    return Err(RegistryError::Connection(format!(
                        "Request to {} timed out after {:?}",
                        self.server_id, DEFAULT_TIMEOUT
                    )));
                }
            }
        };

        let response: JsonRpcResponse = serde_json::from_str(&line).map_err(|e| {
            RegistryError::JsonRpc(format!(
                "Failed to parse response: {} (raw: {})",
                e,
                line.trim()
            ))
        })?;

        if response.id  !=  id {
            return Err(RegistryError::JsonRpc(format!(
                "Response ID mismatch: expected {}, got {}",
                id, response.id
            )));
        }

        if let Some(error) = response.error {
            return Err(RegistryError::JsonRpc(format!(
                "JSON-RPC error {}: {}",
                error.code, error.message
            )));
        }

        response.result.ok_or_else(|| {
            RegistryError::JsonRpc("Response has neither result nor error".to_string())
        })
    }

    /// List available tools from the MCP server
    pub async fn list_tools(&self) -> RegistryResult<Vec<McpToolDefinition>> {
        tracing::debug!(server_id = self.server_id, "Requesting tools/list");

        let result = self.request("tools/list", None).await?;
        
        let tools_result: ToolsListResult = serde_json::from_value(result)?;

        tracing::info!(
            server_id = self.server_id,
            tool_count = tools_result.tools.len(),
            "Retrieved tools from MCP server"
        );

        Ok(tools_result.tools)
    }

    /// Call a tool on the MCP server
    pub async fn call_tool(&self, name: &str, arguments: Value) -> RegistryResult<ToolCallResult> {
        tracing::debug!(
            server_id = self.server_id,
            tool_name = name,
            "Calling tool"
        );

        let params = serde_json::json!({
            "name": name,
            "arguments": arguments
        });

        let result = self.request("tools/call", Some(params)).await?;
        
        let call_result: ToolCallResult = serde_json::from_value(result)?;

        if call_result.is_error {
            tracing::warn!(
                server_id = self.server_id,
                tool_name = name,
                "Tool call returned error"
            );
        }

        Ok(call_result)
    }

    /// Get the server ID
    pub fn server_id(&self) -> &str {
        &self.server_id
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_json_rpc_request_serialization() {
        let request = JsonRpcRequest {
            jsonrpc: "2.0",
            id: 1,
            method: "tools/list".to_string(),
            params: None,
        };
        
        let json = serde_json::to_string(&request).unwrap();
        assert!(json.contains("\"jsonrpc\":\"2.0\""));
        assert!(json.contains("\"method\":\"tools/list\""));
    }

    #[tokio::test]
    async fn test_json_rpc_response_parsing() {
        let json = r#"{"jsonrpc":"2.0","id":1,"result":{"tools":[]}}"#;
        let response: JsonRpcResponse = serde_json::from_str(json).unwrap();
        assert_eq!(response.id, 1);
        assert!(response.result.is_some());
        assert!(response.error.is_none());
    }

    #[tokio::test]
    async fn test_json_rpc_error_parsing() {
        let json = r#"{"jsonrpc":"2.0","id":1,"error":{"code":-32601,"message":"Method not found"}}"#;
        let response: JsonRpcResponse = serde_json::from_str(json).unwrap();
        assert_eq!(response.id, 1);
        assert!(response.result.is_none());
        assert!(response.error.is_some());
        let error = response.error.unwrap();
        assert_eq!(error.code, -32601);
    }
}
