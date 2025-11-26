//! A2A Bridge - MCP to A2A Gateway bridge
//!
//! This module bridges MCP tool calls to A2A-enabled Rust agents,
//! allowing Claude Code to invoke high-performance Rust tools directly.

use miyabi_a2a_gateway::A2AGateway;
use miyabi_agent_core::a2a_integration::{A2AEnabled, A2ATask, A2ATaskResult};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::info;

/// A2A Bridge for MCP integration
pub struct A2ABridge {
    /// A2A Gateway instance
    gateway: Arc<A2AGateway>,
    /// Registered agent handlers
    agent_handlers: RwLock<HashMap<String, Arc<dyn A2AEnabled + Send + Sync>>>,
}

/// Tool definition for MCP
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct A2AToolDefinition {
    pub name: String,
    pub description: String,
    pub input_schema: Value,
}

/// Tool execution result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct A2AToolResult {
    pub success: bool,
    pub output: Value,
    pub execution_time_ms: u64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

impl A2ABridge {
    /// Create a new A2A Bridge
    pub async fn new() -> Result<Self, Box<dyn std::error::Error + Send + Sync>> {
        let gateway = A2AGateway::new().await?;
        Ok(Self {
            gateway: Arc::new(gateway),
            agent_handlers: RwLock::new(HashMap::new()),
        })
    }

    /// Register an A2AEnabled agent handler
    pub async fn register_handler<A: A2AEnabled + Send + Sync + 'static>(
        &self,
        agent: A,
    ) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let card = agent.agent_card();
        let agent_name = card.name.clone();

        // Register with gateway
        let gateway_card = miyabi_a2a_gateway::agent_bootstrap::convert_agent_card(&card);
        self.gateway.register_agent(gateway_card).await?;

        // Store handler
        self.agent_handlers
            .write()
            .await
            .insert(agent_name.clone(), Arc::new(agent));

        info!("Registered A2A agent handler: {}", agent_name);
        Ok(())
    }

    /// Get all available A2A tools as MCP tool definitions
    pub async fn get_tool_definitions(&self) -> Vec<A2AToolDefinition> {
        let handlers = self.agent_handlers.read().await;
        let mut tools = Vec::new();

        for (name, handler) in handlers.iter() {
            let card = handler.agent_card();
            for capability in &card.capabilities {
                tools.push(A2AToolDefinition {
                    name: format!(
                        "a2a.{}.{}",
                        name.to_lowercase().replace(" ", "_"),
                        capability.id
                    ),
                    description: format!("{}: {}", card.name, capability.description),
                    input_schema: capability.input_schema.clone().unwrap_or(json!({
                        "type": "object",
                        "properties": {}
                    })),
                });
            }
        }

        tools
    }

    /// Execute an A2A tool
    pub async fn execute_tool(
        &self,
        tool_name: &str,
        input: Value,
    ) -> Result<A2AToolResult, Box<dyn std::error::Error + Send + Sync>> {
        let start = std::time::Instant::now();

        // Parse tool name: a2a.<agent>.<capability>
        let parts: Vec<&str> = tool_name.split('.').collect();
        if parts.len() != 3 || parts[0] != "a2a" {
            return Ok(A2AToolResult {
                success: false,
                output: json!(null),
                execution_time_ms: start.elapsed().as_millis() as u64,
                error: Some(format!("Invalid tool name format: {}", tool_name)),
            });
        }

        let agent_key = parts[1];
        let capability_id = parts[2];

        // Find agent handler
        let handlers = self.agent_handlers.read().await;
        let handler = handlers
            .iter()
            .find(|(name, _)| name.to_lowercase().replace(" ", "_") == agent_key)
            .map(|(_, h)| h.clone());

        let handler = match handler {
            Some(h) => h,
            None => {
                return Ok(A2AToolResult {
                    success: false,
                    output: json!(null),
                    execution_time_ms: start.elapsed().as_millis() as u64,
                    error: Some(format!("Agent not found: {}", agent_key)),
                });
            }
        };

        // Create A2A task
        let task = A2ATask {
            id: uuid::Uuid::new_v4().to_string(),
            from: "mcp_bridge".to_string(),
            to: agent_key.to_string(),
            capability: capability_id.to_string(),
            input,
            priority: 1,
            timeout_secs: Some(300),
            idempotency_key: None,
            metadata: HashMap::new(),
        };

        // Execute task
        match handler.handle_a2a_task(task).await {
            Ok(result) => match result {
                A2ATaskResult::Success {
                    output,
                    execution_time_ms,
                    ..
                } => Ok(A2AToolResult {
                    success: true,
                    output,
                    execution_time_ms,
                    error: None,
                }),
                A2ATaskResult::Failure { error, .. } => Ok(A2AToolResult {
                    success: false,
                    output: json!(null),
                    execution_time_ms: start.elapsed().as_millis() as u64,
                    error: Some(error),
                }),
            },
            Err(e) => Ok(A2AToolResult {
                success: false,
                output: json!(null),
                execution_time_ms: start.elapsed().as_millis() as u64,
                error: Some(e.to_string()),
            }),
        }
    }

    /// Get the underlying gateway
    pub fn gateway(&self) -> Arc<A2AGateway> {
        self.gateway.clone()
    }

    /// List all registered agents
    pub async fn list_agents(&self) -> Vec<String> {
        self.agent_handlers.read().await.keys().cloned().collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_bridge_creation() {
        let bridge = A2ABridge::new().await;
        assert!(bridge.is_ok());
    }

    #[tokio::test]
    async fn test_tool_name_parsing() {
        let bridge = A2ABridge::new().await.unwrap();
        let result = bridge.execute_tool("invalid", json!({})).await.unwrap();
        assert!(!result.success);
        assert!(result.error.is_some());
    }
}
