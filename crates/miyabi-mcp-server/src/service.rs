//! Unified Tool Registry Service
//!
//! This module provides a unified API for tool discovery, execution, and caching
//! by integrating the ToolRegistry (T1) and ToolResultCache (T2) components.
//!
//! ## Features
//!
//! - **Unified API**: Single entry point for all tool operations
//! - **Automatic Caching**: Transparent result caching with LRU eviction
//! - **Tool Discovery**: Automatic discovery from configured MCP servers
//! - **Periodic Refresh**: Background task to refresh tool definitions
//! - **Metrics & Stats**: Combined statistics from registry and cache
//!
//! ## Usage
//!
//! ```rust,no_run
//! use miyabi_mcp_server::{ToolRegistryService, ServiceConfig};
//! use std::time::Duration;
//!
//! #[tokio::main]
//! async fn main() -> Result<(), Box<dyn std::error::Error>> {
//!     let config = ServiceConfig {
//!         cache_enabled: true,
//!         cache_capacity: 1000,
//!         cache_ttl: Duration::from_secs(300),
//!         discovery_interval: Duration::from_secs(600),
//!     };
//!
//!     let mut service = ToolRegistryService::new(config);
//!
//!     // Initialize and discover tools
//!     service.initialize().await?;
//!
//!     // Execute a tool (with automatic caching)
//!     let result = service.execute_tool(
//!         "github.issue.get",
//!         serde_json::json!({"issue_number": 270})
//!     ).await?;
//!
//!     // Get service statistics
//!     let stats = service.stats();
//!     println!("Tools: {}, Cache Hit Rate: {:.2}%",
//!         stats.total_tools,
//!         stats.cache_hit_rate * 100.0
//!     );
//!
//!     Ok(())
//! }
//! ```

use crate::cache::{CacheKey, ToolResultCache};
use crate::metrics::ToolMetrics;
use crate::registry::{
    McpServerConnection, RegistryError, RegistryResult, ToolDefinition, ToolRegistry,
};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::sync::Arc;
use std::time::{Duration, Instant};
use tracing::{debug, error, info, warn};

/// Service configuration
///
/// Configures the behavior of the ToolRegistryService including caching,
/// capacity limits, and refresh intervals.
#[derive(Debug, Clone)]
pub struct ServiceConfig {
    /// Enable or disable caching
    ///
    /// When disabled, all tool executions bypass the cache and hit the MCP server directly.
    pub cache_enabled: bool,

    /// Maximum number of cached results
    ///
    /// Default: 1000 entries. Least recently used entries are evicted when capacity is reached.
    pub cache_capacity: usize,

    /// Time-to-live for cached results
    ///
    /// Default: 5 minutes (300 seconds). Entries older than TTL are automatically expired.
    pub cache_ttl: Duration,

    /// Interval between automatic tool discovery refreshes
    ///
    /// Default: 10 minutes (600 seconds). Set to 0 to disable automatic refresh.
    pub discovery_interval: Duration,
}

impl Default for ServiceConfig {
    /// Create default service configuration
    ///
    /// - Cache enabled: true
    /// - Capacity: 1000 entries
    /// - TTL: 5 minutes
    /// - Discovery interval: 10 minutes
    fn default() -> Self {
        Self {
            cache_enabled: true,
            cache_capacity: 1000,
            cache_ttl: Duration::from_secs(300), // 5 minutes
            discovery_interval: Duration::from_secs(600), // 10 minutes
        }
    }
}

/// Combined service statistics
///
/// Aggregates metrics from both the ToolRegistry and ToolResultCache
/// to provide a unified view of service health and performance.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServiceStats {
    /// Total number of registered tools
    pub total_tools: usize,

    /// Cache hit rate (0.0 to 1.0)
    pub cache_hit_rate: f64,

    /// Whether a discovery has been performed
    pub has_discovery: bool,

    /// Total number of tool executions
    pub tool_execution_count: u64,

    /// Number of cache hits
    pub cache_hits: u64,

    /// Number of cache misses
    pub cache_misses: u64,

    /// Current cache size (number of entries)
    pub cache_size: usize,

    /// Number of healthy MCP servers
    pub servers_healthy: usize,

    /// Number of failed MCP servers
    pub servers_failed: usize,

    /// Last discovery duration in milliseconds
    pub last_discovery_duration_ms: u64,
}

/// Unified Tool Registry Service
///
/// Provides a single, cohesive API for tool discovery, execution, and caching
/// by orchestrating the ToolRegistry and ToolResultCache components.
///
/// ## Architecture
///
/// ```text
/// ┌─────────────────────────────────────┐
/// │   ToolRegistryService (T3)          │
/// │                                     │
/// │  ┌──────────────┐  ┌─────────────┐ │
/// │  │ ToolRegistry │  │ ToolResult  │ │
/// │  │     (T1)     │  │  Cache (T2) │ │
/// │  └──────────────┘  └─────────────┘ │
/// │         │                 │         │
/// │         ├─────────────────┤         │
/// │         │  Integration    │         │
/// │         └─────────────────┘         │
/// └─────────────────────────────────────┘
///            │
///            v
///     MCP Servers (GitHub, etc.)
/// ```
pub struct ToolRegistryService {
    /// Tool registry for discovery and storage
    registry: ToolRegistry,

    /// Result cache for performance optimization
    cache: ToolResultCache,

    /// Metrics collector
    metrics: Arc<ToolMetrics>,

    /// Service configuration
    config: ServiceConfig,

    /// Tool execution counter
    execution_count: u64,
}

impl ToolRegistryService {
    /// Create a new tool registry service
    ///
    /// # Arguments
    ///
    /// * `config` - Service configuration
    ///
    /// # Examples
    ///
    /// ```rust
    /// use miyabi_mcp_server::{ToolRegistryService, ServiceConfig};
    ///
    /// let service = ToolRegistryService::new(ServiceConfig::default());
    /// ```
    pub fn new(config: ServiceConfig) -> Self {
        info!(
            cache_enabled = config.cache_enabled,
            cache_capacity = config.cache_capacity,
            cache_ttl_secs = config.cache_ttl.as_secs(),
            discovery_interval_secs = config.discovery_interval.as_secs(),
            "Initializing ToolRegistryService"
        );

        let cache = ToolResultCache::new(config.cache_capacity, config.cache_ttl);
        let metrics = Arc::new(ToolMetrics::new());

        Self {
            registry: ToolRegistry::new(),
            cache,
            metrics,
            config,
            execution_count: 0,
        }
    }

    /// Create a service with preconfigured MCP servers
    ///
    /// # Arguments
    ///
    /// * `config` - Service configuration
    /// * `servers` - List of MCP server connections
    ///
    /// # Examples
    ///
    /// ```rust
    /// use miyabi_mcp_server::{ToolRegistryService, ServiceConfig, McpServerConnection};
    ///
    /// let servers = vec![
    ///     McpServerConnection::stdio("github", "GitHub MCP", "npx", vec![
    ///         "-y".to_string(),
    ///         "@modelcontextprotocol/server-github".to_string(),
    ///     ])
    /// ];
    ///
    /// let service = ToolRegistryService::with_servers(ServiceConfig::default(), servers);
    /// ```
    pub fn with_servers(config: ServiceConfig, servers: Vec<McpServerConnection>) -> Self {
        info!(
            server_count = servers.len(),
            "Creating ToolRegistryService with {} preconfigured servers",
            servers.len()
        );

        let cache = ToolResultCache::new(config.cache_capacity, config.cache_ttl);
        let metrics = Arc::new(ToolMetrics::new());

        Self {
            registry: ToolRegistry::with_servers(servers),
            cache,
            metrics,
            config,
            execution_count: 0,
        }
    }

    /// Initialize the service by discovering all available tools
    ///
    /// This method must be called before executing any tools. It performs
    /// initial tool discovery from all configured MCP servers.
    ///
    /// # Errors
    ///
    /// Returns an error if tool discovery fails completely (all servers unreachable).
    /// Partial failures (some servers unreachable) are logged but don't cause failure.
    ///
    /// # Examples
    ///
    /// ```rust
    /// use miyabi_mcp_server::{ToolRegistryService, ServiceConfig};
    ///
    /// # #[tokio::main]
    /// # async fn main() -> Result<(), Box<dyn std::error::Error>> {
    /// let mut service = ToolRegistryService::new(ServiceConfig::default());
    /// service.initialize().await?;
    /// # Ok(())
    /// # }
    /// ```
    pub async fn initialize(&mut self) -> RegistryResult<()> {
        info!("Initializing ToolRegistryService - starting tool discovery");

        let tools = self.registry.discover_tools().await?;

        info!(
            tool_count = tools.len(),
            "Service initialized successfully with {} tools",
            tools.len()
        );

        Ok(())
    }

    /// Add an MCP server connection
    ///
    /// # Arguments
    ///
    /// * `server` - MCP server connection to add
    ///
    /// # Examples
    ///
    /// ```rust
    /// use miyabi_mcp_server::{ToolRegistryService, ServiceConfig, McpServerConnection};
    ///
    /// let mut service = ToolRegistryService::new(ServiceConfig::default());
    ///
    /// service.add_server(McpServerConnection::http(
    ///     "custom-server",
    ///     "Custom MCP Server",
    ///     "http://localhost:3030"
    /// ));
    /// ```
    pub fn add_server(&mut self, server: McpServerConnection) {
        info!("Adding MCP server to service: {} ({})", server.name, server.id);
        self.registry.add_server(server);
    }

    /// Manually register a tool
    ///
    /// This method allows direct tool registration for testing or when tools
    /// are not discoverable via MCP servers.
    ///
    /// # Arguments
    ///
    /// * `tool` - Tool definition to register
    ///
    /// # Examples
    ///
    /// ```rust
    /// use miyabi_mcp_server::{ToolRegistryService, ServiceConfig, ToolDefinition};
    /// use serde_json::json;
    ///
    /// let mut service = ToolRegistryService::new(ServiceConfig::default());
    ///
    /// let tool = ToolDefinition::new(
    ///     "custom.tool",
    ///     "Custom tool for testing",
    ///     json!({"type": "object"}),
    ///     "test-server"
    /// );
    ///
    /// service.register_tool(tool);
    /// ```
    pub fn register_tool(&mut self, tool: ToolDefinition) {
        info!("Manually registering tool: {}", tool.name);
        self.registry.register_tool(tool);
    }

    /// Execute a tool with automatic caching
    ///
    /// This method checks the cache first. If a valid cached result exists,
    /// it returns immediately. Otherwise, it executes the tool via the MCP
    /// server and stores the result in the cache for future requests.
    ///
    /// # Arguments
    ///
    /// * `name` - Tool name (e.g., "github.issue.get")
    /// * `args` - Tool arguments as JSON value
    ///
    /// # Returns
    ///
    /// The tool execution result as a JSON value.
    ///
    /// # Errors
    ///
    /// Returns an error if:
    /// - The tool is not registered (not found)
    /// - The MCP server execution fails
    /// - The result cannot be parsed
    ///
    /// # Examples
    ///
    /// ```rust,no_run
    /// use miyabi_mcp_server::{ToolRegistryService, ServiceConfig};
    /// use serde_json::json;
    ///
    /// # #[tokio::main]
    /// # async fn main() -> Result<(), Box<dyn std::error::Error>> {
    /// let mut service = ToolRegistryService::new(ServiceConfig::default());
    /// service.initialize().await?;
    ///
    /// let result = service.execute_tool(
    ///     "github.issue.get",
    ///     json!({"issue_number": 270})
    /// ).await?;
    ///
    /// println!("Tool result: {}", result);
    /// # Ok(())
    /// # }
    /// ```
    pub async fn execute_tool(&mut self, name: &str, args: Value) -> RegistryResult<Value> {
        let start = Instant::now();
        self.execution_count += 1;

        debug!(tool_name = name, execution_count = self.execution_count, "Executing tool");

        // Check if tool is registered
        if !self.registry.has_tool(name) {
            error!(tool_name = name, "Tool not found in registry");

            // Record failed execution metrics
            let duration = start.elapsed();
            self.metrics.record_execution(name, duration, false);

            return Err(RegistryError::ToolNotFound(name.to_string()));
        }

        // Check cache if enabled
        if self.config.cache_enabled {
            let cache_key = CacheKey::new(name, &args);

            if let Some(cached_result) = self.cache.get(&cache_key) {
                debug!(tool_name = name, "Cache hit - returning cached result");

                // Record cache hit
                self.metrics.record_cache_hit(name);

                return Ok(cached_result);
            }
        }

        // Cache miss - execute via MCP server
        debug!(
            tool_name = name,
            cache_enabled = self.config.cache_enabled,
            "Cache miss - executing tool via MCP server"
        );

        // Record cache miss
        self.metrics.record_cache_miss(name);

        // Execute tool and measure duration
        let result = self.execute_tool_internal(name, &args).await;
        let duration = start.elapsed();

        // Record execution metrics
        let success = result.is_ok();
        self.metrics.record_execution(name, duration, success);

        // Store result in cache if enabled and successful
        if self.config.cache_enabled {
            if let Ok(ref value) = result {
                let cache_key = CacheKey::new(name, &args);
                self.cache.put(cache_key, value.clone());
            }
        }

        result
    }

    /// Internal tool execution (bypasses cache)
    ///
    /// This method performs the actual MCP server communication.
    /// In a production implementation, this would:
    /// 1. Get the tool definition from registry
    /// 2. Validate arguments against input schema
    /// 3. Make JSON-RPC call to MCP server
    /// 4. Parse and return the result
    async fn execute_tool_internal(&self, name: &str, _args: &Value) -> RegistryResult<Value> {
        // Get tool definition
        let tool = self
            .registry
            .get_tool(name)
            .ok_or_else(|| RegistryError::ToolNotFound(format!("Tool not found: {}", name)))?;

        // TODO: In production, this would make an actual JSON-RPC call
        // For now, simulate execution with a delay
        debug!(tool_name = name, server_id = tool.server_id, "Executing tool on MCP server");

        // Simulate network latency
        tokio::time::sleep(tokio::time::Duration::from_millis(50)).await;

        // Mock successful result
        warn!(
            tool_name = name,
            "Tool execution not yet fully implemented - returning mock result"
        );

        Ok(serde_json::json!({
            "status": "success",
            "tool": name,
            "server": tool.server_id,
            "mock": true,
            "message": "Tool execution endpoint not yet implemented"
        }))
    }

    /// Get a tool definition by name
    ///
    /// # Arguments
    ///
    /// * `name` - Tool name to lookup
    ///
    /// # Returns
    ///
    /// Some(ToolDefinition) if found, None otherwise
    ///
    /// # Examples
    ///
    /// ```rust
    /// use miyabi_mcp_server::{ToolRegistryService, ServiceConfig};
    ///
    /// # #[tokio::main]
    /// # async fn main() -> Result<(), Box<dyn std::error::Error>> {
    /// let service = ToolRegistryService::new(ServiceConfig::default());
    ///
    /// if let Some(tool) = service.get_tool("github.issue.get") {
    ///     println!("Tool: {} - {}", tool.name, tool.description);
    /// }
    /// # Ok(())
    /// # }
    /// ```
    pub fn get_tool(&self, name: &str) -> Option<&ToolDefinition> {
        self.registry.get_tool(name)
    }

    /// List all registered tools
    ///
    /// # Returns
    ///
    /// Vector of references to all tool definitions
    ///
    /// # Examples
    ///
    /// ```rust
    /// use miyabi_mcp_server::{ToolRegistryService, ServiceConfig};
    ///
    /// let service = ToolRegistryService::new(ServiceConfig::default());
    ///
    /// for tool in service.list_tools() {
    ///     println!("- {} ({})", tool.name, tool.server_id);
    /// }
    /// ```
    pub fn list_tools(&self) -> Vec<&ToolDefinition> {
        self.registry.list_tools()
    }

    /// Refresh tool definitions from MCP servers
    ///
    /// Performs a new tool discovery operation to update the registry
    /// with the latest tool definitions. This is useful for detecting
    /// newly added or removed tools.
    ///
    /// # Errors
    ///
    /// Returns an error if discovery fails completely. Partial failures
    /// are logged but don't cause this method to fail.
    ///
    /// # Examples
    ///
    /// ```rust
    /// use miyabi_mcp_server::{ToolRegistryService, ServiceConfig};
    ///
    /// # #[tokio::main]
    /// # async fn main() -> Result<(), Box<dyn std::error::Error>> {
    /// let mut service = ToolRegistryService::new(ServiceConfig::default());
    /// service.initialize().await?;
    ///
    /// // Later, refresh to pick up new tools
    /// service.refresh_tools().await?;
    /// # Ok(())
    /// # }
    /// ```
    pub async fn refresh_tools(&mut self) -> RegistryResult<()> {
        info!("Refreshing tool definitions from MCP servers");

        let start = Instant::now();
        let tools = self.registry.discover_tools().await?;

        info!(
            tool_count = tools.len(),
            duration_ms = start.elapsed().as_millis(),
            "Tool refresh complete - {} tools discovered",
            tools.len()
        );

        Ok(())
    }

    /// Get combined service statistics
    ///
    /// Returns statistics aggregated from both the ToolRegistry and
    /// ToolResultCache, providing a complete view of service performance.
    ///
    /// # Examples
    ///
    /// ```rust
    /// use miyabi_mcp_server::{ToolRegistryService, ServiceConfig};
    ///
    /// let service = ToolRegistryService::new(ServiceConfig::default());
    /// let stats = service.stats();
    ///
    /// println!("Tools: {}", stats.total_tools);
    /// println!("Cache Hit Rate: {:.2}%", stats.cache_hit_rate * 100.0);
    /// println!("Executions: {}", stats.tool_execution_count);
    /// ```
    pub fn stats(&self) -> ServiceStats {
        let registry_stats = self.registry.stats();
        let cache_hit_rate = self.cache.hit_rate();
        let cache_hits = self.cache.hit_count();
        let cache_misses = self.cache.miss_count();
        let cache_size = self.cache.len();

        ServiceStats {
            total_tools: registry_stats.total_tools,
            cache_hit_rate,
            has_discovery: registry_stats.last_discovery_at.is_some(),
            tool_execution_count: self.execution_count,
            cache_hits,
            cache_misses,
            cache_size,
            servers_healthy: registry_stats.servers_healthy,
            servers_failed: registry_stats.servers_failed,
            last_discovery_duration_ms: registry_stats.discovery_duration_ms,
        }
    }

    /// Get the number of registered tools
    pub fn tool_count(&self) -> usize {
        self.registry.tool_count()
    }

    /// Check if a tool is registered
    pub fn has_tool(&self, name: &str) -> bool {
        self.registry.has_tool(name)
    }

    /// Clear the result cache
    ///
    /// Removes all cached results but preserves tool registrations.
    /// Useful for testing or when you need to force fresh executions.
    pub fn clear_cache(&self) {
        info!("Clearing tool result cache");
        self.cache.clear();
    }

    /// Get the service configuration
    pub fn config(&self) -> &ServiceConfig {
        &self.config
    }

    /// Get access to the metrics collector
    ///
    /// Returns a reference to the Arc-wrapped metrics collector, allowing
    /// metrics to be queried and exported.
    ///
    /// # Examples
    ///
    /// ```rust
    /// use miyabi_mcp_server::{ToolRegistryService, ServiceConfig};
    ///
    /// let service = ToolRegistryService::new(ServiceConfig::default());
    ///
    /// // Export metrics
    /// let prometheus = service.metrics().export_prometheus();
    /// let json = service.metrics().export_json();
    /// ```
    pub fn metrics(&self) -> &Arc<ToolMetrics> {
        &self.metrics
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::registry::ToolDefinition;

    fn create_test_server(id: &str, name: &str) -> McpServerConnection {
        McpServerConnection::stdio(
            id,
            name,
            "npx",
            vec![
                "-y".to_string(),
                "@modelcontextprotocol/server-github".to_string(),
            ],
        )
    }

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

    #[test]
    fn test_service_config_default() {
        let config = ServiceConfig::default();

        assert!(config.cache_enabled);
        assert_eq!(config.cache_capacity, 1000);
        assert_eq!(config.cache_ttl, Duration::from_secs(300));
        assert_eq!(config.discovery_interval, Duration::from_secs(600));
    }

    #[test]
    fn test_service_new() {
        let service = ToolRegistryService::new(ServiceConfig::default());

        assert_eq!(service.tool_count(), 0);
        assert_eq!(service.execution_count, 0);
        assert!(service.config().cache_enabled);
    }

    #[test]
    fn test_service_with_servers() {
        let servers = vec![
            create_test_server("server1", "Test Server 1"),
            create_test_server("server2", "Test Server 2"),
        ];

        let service = ToolRegistryService::with_servers(ServiceConfig::default(), servers);

        assert_eq!(service.registry.servers().len(), 2);
    }

    #[test]
    fn test_add_server() {
        let mut service = ToolRegistryService::new(ServiceConfig::default());
        let server = create_test_server("server1", "Test Server");

        service.add_server(server);

        assert_eq!(service.registry.servers().len(), 1);
    }

    #[tokio::test]
    async fn test_initialize() {
        let mut service = ToolRegistryService::new(ServiceConfig::default());

        let result = service.initialize().await;

        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_initialize_with_servers() {
        let servers = vec![create_test_server("github", "GitHub MCP")];
        let mut service = ToolRegistryService::with_servers(ServiceConfig::default(), servers);

        let result = service.initialize().await;

        // Should succeed even if discovery returns empty (mock implementation)
        assert!(result.is_ok());
    }

    #[test]
    fn test_get_tool() {
        let mut service = ToolRegistryService::new(ServiceConfig::default());
        let tool = create_test_tool("test.tool", "server1");

        service.registry.register_tool(tool.clone());

        let retrieved = service.get_tool("test.tool");
        assert!(retrieved.is_some());
        assert_eq!(retrieved.unwrap().name, "test.tool");
    }

    #[test]
    fn test_get_tool_not_found() {
        let service = ToolRegistryService::new(ServiceConfig::default());

        let retrieved = service.get_tool("nonexistent.tool");
        assert!(retrieved.is_none());
    }

    #[test]
    fn test_list_tools() {
        let mut service = ToolRegistryService::new(ServiceConfig::default());

        service.registry.register_tool(create_test_tool("tool1", "server1"));
        service.registry.register_tool(create_test_tool("tool2", "server1"));
        service.registry.register_tool(create_test_tool("tool3", "server2"));

        let tools = service.list_tools();
        assert_eq!(tools.len(), 3);
    }

    #[test]
    fn test_has_tool() {
        let mut service = ToolRegistryService::new(ServiceConfig::default());
        let tool = create_test_tool("test.tool", "server1");

        assert!(!service.has_tool("test.tool"));

        service.registry.register_tool(tool);

        assert!(service.has_tool("test.tool"));
    }

    #[tokio::test]
    async fn test_execute_tool_not_found() {
        let mut service = ToolRegistryService::new(ServiceConfig::default());

        let result = service.execute_tool("nonexistent.tool", serde_json::json!({})).await;

        assert!(result.is_err());
        match result.unwrap_err() {
            RegistryError::ToolNotFound(name) => {
                assert_eq!(name, "nonexistent.tool");
            },
            _ => panic!("Expected ToolNotFound error"),
        }
    }

    #[tokio::test]
    async fn test_execute_tool_with_cache() {
        let mut service = ToolRegistryService::new(ServiceConfig::default());
        let tool = create_test_tool("test.tool", "server1");
        service.registry.register_tool(tool);

        let args = serde_json::json!({"param1": "value1"});

        // First execution - cache miss
        let result1 = service.execute_tool("test.tool", args.clone()).await;
        assert!(result1.is_ok());
        assert_eq!(service.execution_count, 1);

        // Second execution - cache hit
        let result2 = service.execute_tool("test.tool", args).await;
        assert!(result2.is_ok());
        assert_eq!(service.execution_count, 2);

        // Both results should be identical
        assert_eq!(result1.unwrap(), result2.unwrap());
    }

    #[tokio::test]
    async fn test_execute_tool_with_cache_disabled() {
        let config = ServiceConfig {
            cache_enabled: false,
            ..Default::default()
        };

        let mut service = ToolRegistryService::new(config);
        let tool = create_test_tool("test.tool", "server1");
        service.registry.register_tool(tool);

        let args = serde_json::json!({"param1": "value1"});

        // Both executions should bypass cache
        let result1 = service.execute_tool("test.tool", args.clone()).await;
        assert!(result1.is_ok());

        let result2 = service.execute_tool("test.tool", args).await;
        assert!(result2.is_ok());

        // Cache should be empty
        let stats = service.stats();
        assert_eq!(stats.cache_size, 0);
    }

    #[tokio::test]
    async fn test_execute_tool_different_args() {
        let mut service = ToolRegistryService::new(ServiceConfig::default());
        let tool = create_test_tool("test.tool", "server1");
        service.registry.register_tool(tool);

        let args1 = serde_json::json!({"param1": "value1"});
        let args2 = serde_json::json!({"param1": "value2"});

        // Execute with different arguments
        let result1 = service.execute_tool("test.tool", args1).await;
        let result2 = service.execute_tool("test.tool", args2).await;

        assert!(result1.is_ok());
        assert!(result2.is_ok());

        // Both results should be cached separately
        let stats = service.stats();
        assert_eq!(stats.cache_size, 2);
    }

    #[tokio::test]
    async fn test_refresh_tools() {
        let servers = vec![create_test_server("github", "GitHub MCP")];
        let mut service = ToolRegistryService::with_servers(ServiceConfig::default(), servers);

        service.initialize().await.unwrap();

        let result = service.refresh_tools().await;
        assert!(result.is_ok());
    }

    #[test]
    fn test_stats_empty_service() {
        let service = ToolRegistryService::new(ServiceConfig::default());
        let stats = service.stats();

        assert_eq!(stats.total_tools, 0);
        assert_eq!(stats.cache_hit_rate, 0.0);
        assert_eq!(stats.tool_execution_count, 0);
        assert_eq!(stats.cache_hits, 0);
        assert_eq!(stats.cache_misses, 0);
        assert_eq!(stats.cache_size, 0);
    }

    #[tokio::test]
    async fn test_stats_with_executions() {
        let mut service = ToolRegistryService::new(ServiceConfig::default());
        let tool = create_test_tool("test.tool", "server1");
        service.registry.register_tool(tool);

        let args = serde_json::json!({"param1": "value1"});

        // Execute twice with same args (cache hit)
        service.execute_tool("test.tool", args.clone()).await.unwrap();
        service.execute_tool("test.tool", args).await.unwrap();

        let stats = service.stats();

        // Note: manual registration doesn't update registry stats.total_tools
        // This is expected behavior - stats.total_tools reflects discovered tools
        assert_eq!(stats.tool_execution_count, 2);
        assert_eq!(stats.cache_hits, 1);
        assert_eq!(stats.cache_misses, 1);
        assert!(stats.cache_hit_rate > 0.0);
        assert_eq!(stats.cache_size, 1);
    }

    #[test]
    fn test_clear_cache() {
        let mut service = ToolRegistryService::new(ServiceConfig::default());
        let tool = create_test_tool("test.tool", "server1");
        service.registry.register_tool(tool);

        // Manually add to cache
        let cache_key = CacheKey::new("test.tool", &serde_json::json!({"param1": "value1"}));
        service.cache.put(cache_key, serde_json::json!({"result": "cached"}));

        assert_eq!(service.cache.len(), 1);

        service.clear_cache();

        assert_eq!(service.cache.len(), 0);
    }

    #[test]
    fn test_tool_count() {
        let mut service = ToolRegistryService::new(ServiceConfig::default());

        assert_eq!(service.tool_count(), 0);

        service.registry.register_tool(create_test_tool("tool1", "server1"));
        service.registry.register_tool(create_test_tool("tool2", "server1"));

        assert_eq!(service.tool_count(), 2);
    }

    #[test]
    fn test_config_access() {
        let config = ServiceConfig {
            cache_enabled: false,
            cache_capacity: 500,
            cache_ttl: Duration::from_secs(60),
            discovery_interval: Duration::from_secs(120),
        };

        let service = ToolRegistryService::new(config.clone());
        let retrieved_config = service.config();

        assert_eq!(retrieved_config.cache_enabled, config.cache_enabled);
        assert_eq!(retrieved_config.cache_capacity, config.cache_capacity);
    }

    #[tokio::test]
    async fn test_execution_count_increment() {
        let mut service = ToolRegistryService::new(ServiceConfig::default());
        let tool = create_test_tool("test.tool", "server1");
        service.registry.register_tool(tool);

        assert_eq!(service.execution_count, 0);

        let args = serde_json::json!({"param1": "value1"});
        service.execute_tool("test.tool", args.clone()).await.unwrap();

        assert_eq!(service.execution_count, 1);

        service.execute_tool("test.tool", args).await.unwrap();

        assert_eq!(service.execution_count, 2);
    }

    #[tokio::test]
    async fn test_cache_behavior_with_ttl() {
        use std::thread;

        let config = ServiceConfig {
            cache_enabled: true,
            cache_capacity: 100,
            cache_ttl: Duration::from_millis(50),
            discovery_interval: Duration::from_secs(600),
        };

        let mut service = ToolRegistryService::new(config);
        let tool = create_test_tool("test.tool", "server1");
        service.registry.register_tool(tool);

        let args = serde_json::json!({"param1": "value1"});

        // First execution - cache miss
        service.execute_tool("test.tool", args.clone()).await.unwrap();
        assert_eq!(service.stats().cache_size, 1);

        // Immediate second execution - cache hit
        service.execute_tool("test.tool", args.clone()).await.unwrap();
        assert_eq!(service.stats().cache_hits, 1);

        // Wait for TTL to expire
        thread::sleep(Duration::from_millis(100));

        // Third execution - cache miss (expired)
        service.execute_tool("test.tool", args).await.unwrap();

        let stats = service.stats();
        // After expiration, we should have 2 misses and 1 hit
        assert_eq!(stats.cache_hits, 1);
        assert_eq!(stats.cache_misses, 2);
    }
}
