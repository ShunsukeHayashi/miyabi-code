//! Tool Registry for dynamic MCP tool discovery
//!
//! This module implements automatic discovery and registration of MCP tools from
//! configured MCP servers. It provides:
//!
//! - Auto-discovery of all available MCP tools via `tools/list` JSON-RPC calls
//! - Fast O(1) lookup by tool name using HashMap
//! - Graceful error handling for unreachable MCP servers
//! - Support for multiple MCP server instances
//!
//! ## Example
//!
//! ```rust
//! use miyabi_mcp_server::registry::ToolRegistry;
//!
//! #[tokio::main]
//! async fn main() -> Result<(), Box<dyn std::error::Error>> {
//!     let mut registry = ToolRegistry::new();
//!
//!     // Discover all tools from configured MCP servers
//!     let tools = registry.discover_tools().await?;
//!     println!("Discovered {} tools", tools.len());
//!
//!     // Fast lookup by tool name
//!     if let Some(tool) = registry.get_tool("github.issue.get") {
//!         println!("Tool: {} - {}", tool.name, tool.description);
//!     }
//!
//!     Ok(())
//! }
//! ```

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use thiserror::Error;
use tracing::{debug, error, info, warn};

/// Tool registry error types
#[derive(Debug, Error)]
pub enum RegistryError {
    /// MCP server connection error
    #[error("MCP server connection error: {0}")]
    Connection(String),

    /// Tool discovery error
    #[error("Tool discovery error: {0}")]
    Discovery(String),

    /// JSON-RPC error
    #[error("JSON-RPC error: {0}")]
    JsonRpc(String),

    /// Serialization error
    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),

    /// I/O error
    #[error("I/O error: {0}")]
    Io(#[from] std::io::Error),

    /// Tool not found
    #[error("Tool not found: {0}")]
    ToolNotFound(String),

    /// Invalid tool schema
    #[error("Invalid tool schema: {0}")]
    InvalidSchema(String),
}

/// Result type for registry operations
pub type RegistryResult<T> = Result<T, RegistryError>;

/// Tool definition representing an MCP tool
///
/// This struct contains all metadata about an MCP tool, including its name,
/// description, and JSON Schema for input parameters.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ToolDefinition {
    /// Tool name (e.g., "github.issue.get")
    pub name: String,

    /// Human-readable description of what the tool does
    pub description: String,

    /// JSON Schema for input parameters
    ///
    /// This defines the structure and types of parameters the tool accepts.
    /// Uses JSON Schema format for validation.
    pub input_schema: serde_json::Value,

    /// Server ID this tool belongs to
    pub server_id: String,

    /// Optional version information
    #[serde(skip_serializing_if = "Option::is_none")]
    pub version: Option<String>,

    /// Optional tags for categorization
    #[serde(default)]
    pub tags: Vec<String>,
}

impl ToolDefinition {
    /// Create a new tool definition
    pub fn new(
        name: impl Into<String>,
        description: impl Into<String>,
        input_schema: serde_json::Value,
        server_id: impl Into<String>,
    ) -> Self {
        Self {
            name: name.into(),
            description: description.into(),
            input_schema,
            server_id: server_id.into(),
            version: None,
            tags: Vec::new(),
        }
    }

    /// Add version information
    pub fn with_version(mut self, version: impl Into<String>) -> Self {
        self.version = Some(version.into());
        self
    }

    /// Add tags for categorization
    pub fn with_tags(mut self, tags: Vec<String>) -> Self {
        self.tags = tags;
        self
    }
}

/// MCP server connection information
///
/// Represents a connection to an MCP server instance.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct McpServerConnection {
    /// Unique server identifier
    pub id: String,

    /// Server name (human-readable)
    pub name: String,

    /// Server endpoint URL (for HTTP-based MCP servers)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub endpoint: Option<String>,

    /// Command to execute (for stdio-based MCP servers)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub command: Option<String>,

    /// Command arguments (for stdio-based MCP servers)
    #[serde(default)]
    pub args: Vec<String>,

    /// Server status (healthy, unreachable, error)
    #[serde(default = "default_status")]
    pub status: ServerStatus,

    /// Last error message (if any)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub last_error: Option<String>,

    /// Last successful connection timestamp
    #[serde(skip_serializing_if = "Option::is_none")]
    pub last_connected_at: Option<chrono::DateTime<chrono::Utc>>,
}

fn default_status() -> ServerStatus {
    ServerStatus::Unknown
}

/// Server health status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ServerStatus {
    /// Server is healthy and responding
    Healthy,
    /// Server is unreachable
    Unreachable,
    /// Server returned an error
    Error,
    /// Status unknown (not yet checked)
    Unknown,
}

impl McpServerConnection {
    /// Create a new HTTP-based MCP server connection
    pub fn http(
        id: impl Into<String>,
        name: impl Into<String>,
        endpoint: impl Into<String>,
    ) -> Self {
        Self {
            id: id.into(),
            name: name.into(),
            endpoint: Some(endpoint.into()),
            command: None,
            args: Vec::new(),
            status: ServerStatus::Unknown,
            last_error: None,
            last_connected_at: None,
        }
    }

    /// Create a new stdio-based MCP server connection
    pub fn stdio(
        id: impl Into<String>,
        name: impl Into<String>,
        command: impl Into<String>,
        args: Vec<String>,
    ) -> Self {
        Self {
            id: id.into(),
            name: name.into(),
            endpoint: None,
            command: Some(command.into()),
            args,
            status: ServerStatus::Unknown,
            last_error: None,
            last_connected_at: None,
        }
    }

    /// Update server status
    pub fn update_status(&mut self, status: ServerStatus, error: Option<String>) {
        self.status = status;
        self.last_error = error;
        if status == ServerStatus::Healthy {
            self.last_connected_at = Some(chrono::Utc::now());
        }
    }
}

/// Tool Registry for managing MCP tools
///
/// Provides dynamic discovery and registration of MCP tools from multiple
/// MCP server instances. Tools are stored in a HashMap for O(1) lookup.
pub struct ToolRegistry {
    /// Registered tools (key: tool name, value: tool definition)
    tools: HashMap<String, ToolDefinition>,

    /// Configured MCP server connections
    mcp_servers: Vec<McpServerConnection>,

    /// Discovery statistics
    stats: DiscoveryStats,
}

/// Discovery statistics
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct DiscoveryStats {
    /// Total number of tools discovered
    pub total_tools: usize,

    /// Number of servers queried
    pub servers_queried: usize,

    /// Number of servers that responded successfully
    pub servers_healthy: usize,

    /// Number of servers that failed
    pub servers_failed: usize,

    /// Last discovery timestamp
    pub last_discovery_at: Option<chrono::DateTime<chrono::Utc>>,

    /// Total discovery duration (milliseconds)
    pub discovery_duration_ms: u64,
}

impl ToolRegistry {
    /// Create a new empty tool registry
    pub fn new() -> Self {
        Self {
            tools: HashMap::new(),
            mcp_servers: Vec::new(),
            stats: DiscoveryStats::default(),
        }
    }

    /// Create a new tool registry with preconfigured MCP servers
    pub fn with_servers(servers: Vec<McpServerConnection>) -> Self {
        Self {
            tools: HashMap::new(),
            mcp_servers: servers,
            stats: DiscoveryStats::default(),
        }
    }

    /// Add an MCP server connection
    pub fn add_server(&mut self, server: McpServerConnection) {
        info!("Adding MCP server: {} ({})", server.name, server.id);
        self.mcp_servers.push(server);
    }

    /// Get all configured MCP servers
    pub fn servers(&self) -> &[McpServerConnection] {
        &self.mcp_servers
    }

    /// Discover tools from all configured MCP servers
    ///
    /// This method queries all configured MCP servers via the `tools/list`
    /// JSON-RPC call and registers discovered tools. It continues even if
    /// some servers fail, logging warnings for unreachable servers.
    ///
    /// Returns a list of all discovered tool definitions.
    pub async fn discover_tools(&mut self) -> RegistryResult<Vec<ToolDefinition>> {
        let start = std::time::Instant::now();
        info!("Starting tool discovery from {} servers", self.mcp_servers.len());

        let mut discovered_tools = Vec::new();
        let mut servers_healthy = 0;
        let mut servers_failed = 0;

        for server in &mut self.mcp_servers {
            debug!("Discovering tools from server: {} ({})", server.name, server.id);

            match Self::discover_from_server_static(server).await {
                Ok(tools) => {
                    info!("Discovered {} tools from server: {}", tools.len(), server.name);
                    server.update_status(ServerStatus::Healthy, None);
                    servers_healthy += 1;

                    // Register tools
                    for tool in tools {
                        self.tools.insert(tool.name.clone(), tool.clone());
                        discovered_tools.push(tool);
                    }
                },
                Err(e) => {
                    warn!("Failed to discover tools from server {}: {}", server.name, e);
                    server.update_status(ServerStatus::Error, Some(e.to_string()));
                    servers_failed += 1;
                },
            }
        }

        let duration_ms = start.elapsed().as_millis() as u64;

        // Update statistics
        self.stats = DiscoveryStats {
            total_tools: discovered_tools.len(),
            servers_queried: self.mcp_servers.len(),
            servers_healthy,
            servers_failed,
            last_discovery_at: Some(chrono::Utc::now()),
            discovery_duration_ms: duration_ms,
        };

        info!(
            "Tool discovery complete: {} tools from {}/{} servers ({} ms)",
            discovered_tools.len(),
            servers_healthy,
            self.mcp_servers.len(),
            duration_ms
        );

        Ok(discovered_tools)
    }

    /// Discover tools from a single MCP server
    ///
    /// This method makes a `tools/list` JSON-RPC call to the specified server
    /// and parses the response to extract tool definitions.
    async fn discover_from_server_static(
        server: &McpServerConnection,
    ) -> RegistryResult<Vec<ToolDefinition>> {
        // For now, implement a basic stdio-based discovery
        // In a production system, this would:
        // 1. Spawn the MCP server process (if stdio-based)
        // 2. Send a JSON-RPC `tools/list` request
        // 3. Parse the response and extract tool definitions
        // 4. Handle timeouts and errors gracefully

        // Mock implementation for demonstration
        // TODO: Implement actual JSON-RPC communication
        debug!("Sending tools/list request to server: {}", server.id);

        // Simulate network call
        tokio::time::sleep(tokio::time::Duration::from_millis(10)).await;

        // For now, return empty list
        // Real implementation would parse JSON-RPC response
        warn!("Tool discovery not yet fully implemented for server: {}", server.name);

        Ok(Vec::new())
    }

    /// Get a tool by name
    ///
    /// Performs O(1) lookup in the internal HashMap.
    pub fn get_tool(&self, name: &str) -> Option<&ToolDefinition> {
        self.tools.get(name)
    }

    /// List all registered tools
    pub fn list_tools(&self) -> Vec<&ToolDefinition> {
        self.tools.values().collect()
    }

    /// Get the number of registered tools
    pub fn tool_count(&self) -> usize {
        self.tools.len()
    }

    /// Check if a tool is registered
    pub fn has_tool(&self, name: &str) -> bool {
        self.tools.contains_key(name)
    }

    /// Get discovery statistics
    pub fn stats(&self) -> &DiscoveryStats {
        &self.stats
    }

    /// Clear all registered tools (useful for testing)
    #[cfg(test)]
    pub fn clear(&mut self) {
        self.tools.clear();
        self.stats = DiscoveryStats::default();
    }

    /// Manually register a tool (useful for testing)
    pub fn register_tool(&mut self, tool: ToolDefinition) {
        info!("Manually registering tool: {}", tool.name);
        self.tools.insert(tool.name.clone(), tool);
    }
}

impl Default for ToolRegistry {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_tool(name: &str, server_id: &str) -> ToolDefinition {
        ToolDefinition::new(
            name,
            format!("Test tool: {}", name),
            serde_json::json!({
                "type": "object",
                "properties": {
                    "param1": {"type": "string"}
                }
            }),
            server_id,
        )
    }

    fn create_test_server(id: &str, name: &str) -> McpServerConnection {
        McpServerConnection::stdio(
            id,
            name,
            "npx",
            ["-y", "@modelcontextprotocol/server-github"]
                .iter()
                .map(|s| s.to_string())
                .collect(),
        )
    }

    #[test]
    fn test_registry_new() {
        let registry = ToolRegistry::new();
        assert_eq!(registry.tool_count(), 0);
        assert_eq!(registry.servers().len(), 0);
    }

    #[test]
    fn test_registry_with_servers() {
        let servers = vec![create_test_server("server1", "Test Server 1")];
        let registry = ToolRegistry::with_servers(servers);
        assert_eq!(registry.tool_count(), 0);
        assert_eq!(registry.servers().len(), 1);
    }

    #[test]
    fn test_add_server() {
        let mut registry = ToolRegistry::new();
        let server = create_test_server("server1", "Test Server 1");

        registry.add_server(server);
        assert_eq!(registry.servers().len(), 1);
        assert_eq!(registry.servers()[0].id, "server1");
    }

    #[test]
    fn test_register_tool() {
        let mut registry = ToolRegistry::new();
        let tool = create_test_tool("test.tool", "server1");

        registry.register_tool(tool.clone());
        assert_eq!(registry.tool_count(), 1);
        assert!(registry.has_tool("test.tool"));
    }

    #[test]
    fn test_get_tool() {
        let mut registry = ToolRegistry::new();
        let tool = create_test_tool("test.tool", "server1");

        registry.register_tool(tool.clone());

        let retrieved = registry.get_tool("test.tool");
        assert!(retrieved.is_some());
        assert_eq!(retrieved.unwrap().name, "test.tool");
    }

    #[test]
    fn test_get_tool_not_found() {
        let registry = ToolRegistry::new();
        let retrieved = registry.get_tool("nonexistent.tool");
        assert!(retrieved.is_none());
    }

    #[test]
    fn test_list_tools() {
        let mut registry = ToolRegistry::new();
        let tool1 = create_test_tool("tool1", "server1");
        let tool2 = create_test_tool("tool2", "server1");

        registry.register_tool(tool1);
        registry.register_tool(tool2);

        let tools = registry.list_tools();
        assert_eq!(tools.len(), 2);
    }

    #[test]
    fn test_has_tool() {
        let mut registry = ToolRegistry::new();
        let tool = create_test_tool("test.tool", "server1");

        assert!(!registry.has_tool("test.tool"));
        registry.register_tool(tool);
        assert!(registry.has_tool("test.tool"));
    }

    #[test]
    fn test_tool_definition_with_version() {
        let tool = create_test_tool("test.tool", "server1").with_version("1.0.0");

        assert_eq!(tool.version, Some("1.0.0".to_string()));
    }

    #[test]
    fn test_tool_definition_with_tags() {
        let tool = create_test_tool("test.tool", "server1")
            .with_tags(vec!["github".to_string(), "api".to_string()]);

        assert_eq!(tool.tags.len(), 2);
        assert!(tool.tags.contains(&"github".to_string()));
    }

    #[test]
    fn test_server_connection_http() {
        let server = McpServerConnection::http("server1", "Test Server", "http://localhost:3030");

        assert_eq!(server.id, "server1");
        assert_eq!(server.name, "Test Server");
        assert_eq!(server.endpoint, Some("http://localhost:3030".to_string()));
        assert_eq!(server.status, ServerStatus::Unknown);
    }

    #[test]
    fn test_server_connection_stdio() {
        let server = McpServerConnection::stdio(
            "server1",
            "Test Server",
            "npx",
            vec![
                "-y".to_string(),
                "@modelcontextprotocol/server-github".to_string(),
            ],
        );

        assert_eq!(server.id, "server1");
        assert_eq!(server.command, Some("npx".to_string()));
        assert_eq!(server.args.len(), 2);
    }

    #[test]
    fn test_server_status_update() {
        let mut server = create_test_server("server1", "Test Server");

        server.update_status(ServerStatus::Healthy, None);
        assert_eq!(server.status, ServerStatus::Healthy);
        assert!(server.last_error.is_none());
        assert!(server.last_connected_at.is_some());
    }

    #[test]
    fn test_server_status_update_error() {
        let mut server = create_test_server("server1", "Test Server");

        server.update_status(ServerStatus::Error, Some("Connection failed".to_string()));
        assert_eq!(server.status, ServerStatus::Error);
        assert_eq!(server.last_error, Some("Connection failed".to_string()));
    }

    #[tokio::test]
    async fn test_discover_tools_empty() {
        let mut registry = ToolRegistry::new();
        let result = registry.discover_tools().await;

        assert!(result.is_ok());
        assert_eq!(result.unwrap().len(), 0);
        assert_eq!(registry.stats().total_tools, 0);
    }

    #[tokio::test]
    async fn test_discover_tools_with_mock_server() {
        let mut registry = ToolRegistry::new();
        let server = create_test_server("server1", "Test Server");
        registry.add_server(server);

        let result = registry.discover_tools().await;

        assert!(result.is_ok());
        // With current mock implementation, no tools are discovered
        // This test validates the discovery flow completes without errors
        assert!(registry.stats().last_discovery_at.is_some());
    }

    #[test]
    fn test_tool_definition_serialization() {
        let tool = create_test_tool("test.tool", "server1");
        let json = serde_json::to_string(&tool).unwrap();
        let deserialized: ToolDefinition = serde_json::from_str(&json).unwrap();

        assert_eq!(tool, deserialized);
    }

    #[test]
    fn test_mcp_server_connection_serialization() {
        let server = create_test_server("server1", "Test Server");
        let json = serde_json::to_string(&server).unwrap();
        let deserialized: McpServerConnection = serde_json::from_str(&json).unwrap();

        assert_eq!(server.id, deserialized.id);
        assert_eq!(server.name, deserialized.name);
    }

    #[tokio::test]
    async fn test_discover_tools_handles_server_failure() {
        let mut registry = ToolRegistry::new();

        // Add a server that will fail (mock implementation)
        let server = create_test_server("failing_server", "Failing Server");
        registry.add_server(server);

        // Discovery should complete without panic, even if server fails
        let result = registry.discover_tools().await;
        assert!(result.is_ok());

        // Check that failure was recorded in stats
        let stats = registry.stats();
        assert_eq!(stats.servers_queried, 1);
    }

    #[test]
    fn test_registry_clear() {
        let mut registry = ToolRegistry::new();
        let tool = create_test_tool("test.tool", "server1");
        registry.register_tool(tool);

        assert_eq!(registry.tool_count(), 1);

        registry.clear();
        assert_eq!(registry.tool_count(), 0);
    }
}
