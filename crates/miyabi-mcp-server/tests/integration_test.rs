//! Integration tests for ToolRegistryService
//!
//! These tests verify the end-to-end functionality of the unified
//! tool registry service, including discovery, caching, and execution.

use miyabi_mcp_server::{McpServerConnection, ServiceConfig, ToolDefinition, ToolRegistryService};
use serde_json::json;
use std::time::Duration;

/// Helper function to create a mock MCP server for testing
fn create_mock_server() -> McpServerConnection {
    McpServerConnection::stdio(
        "test-server",
        "Test MCP Server",
        "npx",
        vec!["-y".to_string(), "@modelcontextprotocol/server-github".to_string()],
    )
}

/// Helper function to create a test tool definition
fn create_test_tool(name: &str) -> ToolDefinition {
    ToolDefinition::new(
        name,
        format!("Test tool: {}", name),
        json!({
            "type": "object",
            "properties": {
                "param": {"type": "string"}
            },
            "required": ["param"]
        }),
        "test-server",
    )
}

#[tokio::test]
async fn test_service_initialization() {
    let servers = vec![create_mock_server()];
    let mut service = ToolRegistryService::with_servers(ServiceConfig::default(), servers);

    // Initialize should succeed
    let result = service.initialize().await;
    assert!(result.is_ok());

    // Stats should reflect initialization
    let stats = service.stats();
    assert!(stats.has_discovery);
}

#[tokio::test]
async fn test_tool_execution_flow() {
    let mut service = ToolRegistryService::new(ServiceConfig::default());

    // Register a test tool manually
    let tool = create_test_tool("test.execute");
    service.register_tool(tool);

    // First execution - should be cache miss
    let args = json!({"param": "value1"});
    let result1 = service.execute_tool("test.execute", args.clone()).await;
    assert!(result1.is_ok());

    // Second execution with same args - should be cache hit
    let result2 = service.execute_tool("test.execute", args).await;
    assert!(result2.is_ok());

    // Results should be identical (cached)
    assert_eq!(result1.unwrap(), result2.unwrap());

    // Verify stats show cache hit
    let stats = service.stats();
    assert_eq!(stats.cache_hits, 1);
    assert_eq!(stats.cache_misses, 1);
    assert!(stats.cache_hit_rate > 0.0);
}

#[tokio::test]
async fn test_cache_disabled_flow() {
    let config = ServiceConfig {
        cache_enabled: false,
        cache_capacity: 100,
        cache_ttl: Duration::from_secs(300),
        discovery_interval: Duration::from_secs(600),
    };

    let mut service = ToolRegistryService::new(config);

    // Register a test tool
    let tool = create_test_tool("test.nocache");
    service.register_tool(tool);

    // Execute twice with same args
    let args = json!({"param": "value1"});
    service.execute_tool("test.nocache", args.clone()).await.unwrap();
    service.execute_tool("test.nocache", args).await.unwrap();

    // Cache should be empty (disabled)
    let stats = service.stats();
    assert_eq!(stats.cache_size, 0);
    assert_eq!(stats.cache_hits, 0);
    assert_eq!(stats.cache_misses, 0);
}

#[tokio::test]
async fn test_multiple_tools() {
    let mut service = ToolRegistryService::new(ServiceConfig::default());

    // Register multiple tools
    for i in 1..=5 {
        let tool = create_test_tool(&format!("test.tool{}", i));
        service.register_tool(tool);
    }

    // Execute each tool
    for i in 1..=5 {
        let result = service
            .execute_tool(&format!("test.tool{}", i), json!({"param": format!("value{}", i)}))
            .await;
        assert!(result.is_ok());
    }

    // Verify all tools are available
    let tools = service.list_tools();
    assert_eq!(tools.len(), 5);

    // Verify execution counts
    let stats = service.stats();
    assert_eq!(stats.tool_execution_count, 5);
}

#[tokio::test]
async fn test_tool_not_found_error() {
    let mut service = ToolRegistryService::new(ServiceConfig::default());

    // Try to execute non-existent tool
    let result = service.execute_tool("nonexistent.tool", json!({})).await;

    // Should return error
    assert!(result.is_err());

    // Error should be ToolNotFound
    let err = result.unwrap_err();
    assert!(err.to_string().contains("Tool not found"));
}

#[tokio::test]
async fn test_cache_key_differentiation() {
    let mut service = ToolRegistryService::new(ServiceConfig::default());

    // Register a tool
    let tool = create_test_tool("test.params");
    service.register_tool(tool);

    // Execute with different parameters
    let result1 = service.execute_tool("test.params", json!({"param": "value1"})).await;
    let result2 = service.execute_tool("test.params", json!({"param": "value2"})).await;

    assert!(result1.is_ok());
    assert!(result2.is_ok());

    // Cache should have 2 entries (different keys)
    let stats = service.stats();
    assert_eq!(stats.cache_size, 2);
    assert_eq!(stats.cache_misses, 2);
}

#[tokio::test]
async fn test_service_refresh() {
    let servers = vec![create_mock_server()];
    let mut service = ToolRegistryService::with_servers(ServiceConfig::default(), servers);

    // Initial discovery
    service.initialize().await.unwrap();
    let stats1 = service.stats();

    // Refresh tools
    service.refresh_tools().await.unwrap();
    let stats2 = service.stats();

    // Both should show discovery completed
    assert!(stats1.has_discovery);
    assert!(stats2.has_discovery);
}

#[tokio::test]
async fn test_clear_cache_functionality() {
    let mut service = ToolRegistryService::new(ServiceConfig::default());

    // Register and execute a tool
    let tool = create_test_tool("test.clear");
    service.register_tool(tool);

    service
        .execute_tool("test.clear", json!({"param": "value"}))
        .await
        .unwrap();

    // Cache should have 1 entry
    assert_eq!(service.stats().cache_size, 1);

    // Clear cache
    service.clear_cache();

    // Cache should be empty
    assert_eq!(service.stats().cache_size, 0);
}

#[tokio::test]
async fn test_stats_accuracy() {
    let mut service = ToolRegistryService::new(ServiceConfig::default());

    // Register a tool
    let tool = create_test_tool("test.stats");
    service.register_tool(tool);

    // Execute multiple times
    for i in 1..=10 {
        let args = if i % 2 == 0 {
            json!({"param": "even"}) // Repeated - cache hit
        } else {
            json!({"param": format!("odd{}", i)}) // Unique - cache miss
        };

        service.execute_tool("test.stats", args).await.unwrap();
    }

    let stats = service.stats();

    // Verify execution count
    assert_eq!(stats.tool_execution_count, 10);

    // Verify cache behavior
    // First "even" is miss, subsequent 4 are hits = 4 hits
    // All "odd" are misses = 5 misses + 1 "even" miss = 6 misses
    assert_eq!(stats.cache_hits, 4);
    assert_eq!(stats.cache_misses, 6);

    // Hit rate should be 4/10 = 0.4
    assert!((stats.cache_hit_rate - 0.4).abs() < 0.01);
}
