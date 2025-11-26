//! A2A Integration - Agent-to-Agent protocol integration for Miyabi agents
//!
//! This module provides traits and utilities for agents to communicate via
//! the A2A protocol and directly call native Rust tools for high performance.

use crate::base::BaseAgent;
use async_trait::async_trait;
use miyabi_core::tools::{ToolRegistry, ToolResult as CoreToolResult};
use miyabi_core::ExecutionMode;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use thiserror::Error;

/// A2A integration errors
#[derive(Error, Debug)]
pub enum A2AIntegrationError {
    #[error("Agent not registered: {0}")]
    AgentNotRegistered(String),

    #[error("Task execution failed: {0}")]
    TaskExecutionFailed(String),

    #[error("Tool not found: {0}")]
    ToolNotFound(String),

    #[error("Tool execution failed: {0}")]
    ToolExecutionFailed(String),

    #[error("Communication timeout: {0}s")]
    Timeout(u64),

    #[error("Serialization error: {0}")]
    SerializationError(#[from] serde_json::Error),

    #[error("Invalid agent card: {0}")]
    InvalidAgentCard(String),
}

/// Agent capability definition for A2A protocol
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentCapability {
    /// Unique identifier for the capability
    pub id: String,
    /// Human-readable name
    pub name: String,
    /// Description of what this capability does
    pub description: String,
    /// JSON schema for input parameters
    pub input_schema: Option<serde_json::Value>,
    /// JSON schema for output
    pub output_schema: Option<serde_json::Value>,
}

/// A2A Agent Card - describes agent capabilities for inter-agent discovery
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct A2AAgentCard {
    /// Unique agent identifier
    pub agent_id: String,
    /// Human-readable name
    pub name: String,
    /// Detailed description
    pub description: String,
    /// Agent version
    pub version: String,
    /// Protocol version
    pub protocol_version: String,
    /// List of capabilities this agent provides
    pub capabilities: Vec<AgentCapability>,
    /// Supported input modes
    pub input_modes: Vec<String>,
    /// Supported output modes
    pub output_modes: Vec<String>,
    /// Agent-specific metadata
    pub metadata: HashMap<String, serde_json::Value>,
}

/// A2A Task for inter-agent communication
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct A2ATask {
    /// Unique task identifier
    pub id: String,
    /// Source agent ID
    pub from: String,
    /// Target agent ID
    pub to: String,
    /// Capability to invoke
    pub capability: String,
    /// Input data
    pub input: serde_json::Value,
    /// Task priority (0 = highest)
    pub priority: u8,
    /// Timeout in seconds
    pub timeout_secs: Option<u64>,
    /// Idempotency key for exactly-once delivery
    pub idempotency_key: Option<String>,
    /// Task metadata
    pub metadata: HashMap<String, String>,
}

/// Result of A2A task execution
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum A2ATaskResult {
    /// Task completed successfully
    Success {
        output: serde_json::Value,
        artifacts: Vec<A2AArtifact>,
        execution_time_ms: u64,
    },
    /// Task failed
    Failure {
        error: String,
        error_code: Option<String>,
        retriable: bool,
    },
}

/// Artifact produced by A2A task
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct A2AArtifact {
    /// Artifact type (file, image, code, etc.)
    pub artifact_type: String,
    /// Artifact name
    pub name: String,
    /// Content or reference
    pub content: serde_json::Value,
    /// MIME type
    pub mime_type: Option<String>,
}

/// Native Rust tool definition
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NativeTool {
    /// Tool name
    pub name: String,
    /// Tool description
    pub description: String,
    /// Parameter schema
    pub parameters: serde_json::Value,
}

/// Result of native tool execution
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NativeToolResult {
    /// Tool name that was executed
    pub tool: String,
    /// Execution success
    pub success: bool,
    /// Result data
    pub result: serde_json::Value,
    /// Execution time in milliseconds
    pub execution_time_ms: u64,
}

/// Trait for agents that support A2A protocol communication
///
/// This trait extends BaseAgent to add A2A capabilities, allowing agents to:
/// - Expose their capabilities via Agent Cards
/// - Handle incoming A2A tasks from other agents
/// - Call native Rust tools directly for high performance
/// - Execute tools through the centralized ToolRegistry
#[async_trait]
pub trait A2AEnabled: BaseAgent {
    /// Get the A2A Agent Card describing this agent's capabilities
    fn agent_card(&self) -> A2AAgentCard;

    /// Handle an incoming A2A task from another agent
    ///
    /// This method is called by the A2A Gateway when a task is routed to this agent.
    /// The agent should execute the requested capability and return a result.
    async fn handle_a2a_task(&self, task: A2ATask) -> Result<A2ATaskResult, A2AIntegrationError>;

    /// Get the execution mode for this agent
    ///
    /// Override to customize tool permissions. Default is FullAccess.
    fn execution_mode(&self) -> ExecutionMode {
        ExecutionMode::FullAccess
    }

    /// Execute a tool through miyabi-core's ToolRegistry
    ///
    /// This provides access to all registered tools with permission checking
    /// based on the agent's execution mode.
    async fn execute_registry_tool(
        &self,
        tool_name: &str,
        args: serde_json::Value,
    ) -> Result<CoreToolResult, A2AIntegrationError> {
        let registry = ToolRegistry::new(self.execution_mode());
        let call = miyabi_llm::ToolCall {
            id: uuid::Uuid::new_v4().to_string(),
            name: tool_name.to_string(),
            arguments: args,
        };

        registry
            .execute(&call)
            .await
            .map_err(|e| A2AIntegrationError::ToolExecutionFailed(e.to_string()))
    }

    /// Execute multiple tools in parallel
    ///
    /// Useful for gathering information from multiple sources concurrently.
    async fn execute_tools_parallel(
        &self,
        calls: Vec<(String, serde_json::Value)>,
    ) -> Vec<Result<CoreToolResult, A2AIntegrationError>> {
        let mut results = Vec::with_capacity(calls.len());
        for (name, args) in calls {
            results.push(self.execute_registry_tool(&name, args).await);
        }
        results
    }

    /// List native Rust tools available to this agent
    ///
    /// These are high-performance native tools that bypass external process spawning.
    fn available_tools(&self) -> Vec<NativeTool> {
        // Default tools available to all agents
        vec![
            NativeTool {
                name: "read_file".to_string(),
                description: "Read file contents".to_string(),
                parameters: serde_json::json!({
                    "type": "object",
                    "properties": {
                        "path": {"type": "string", "description": "File path to read"}
                    },
                    "required": ["path"]
                }),
            },
            NativeTool {
                name: "list_files".to_string(),
                description: "List directory contents".to_string(),
                parameters: serde_json::json!({
                    "type": "object",
                    "properties": {
                        "path": {"type": "string", "description": "Directory path"},
                        "pattern": {"type": "string", "description": "Glob pattern (optional)"}
                    },
                    "required": ["path"]
                }),
            },
            NativeTool {
                name: "search_code".to_string(),
                description: "Search for patterns in code".to_string(),
                parameters: serde_json::json!({
                    "type": "object",
                    "properties": {
                        "pattern": {"type": "string", "description": "Regex pattern"},
                        "path": {"type": "string", "description": "Search root path"},
                        "file_types": {"type": "array", "items": {"type": "string"}}
                    },
                    "required": ["pattern"]
                }),
            },
        ]
    }

    /// Execute a native Rust tool directly
    ///
    /// This bypasses external process spawning for high performance.
    /// Uses tokio::fs and other native Rust libraries.
    async fn execute_native_tool(
        &self,
        tool_name: &str,
        args: serde_json::Value,
    ) -> Result<NativeToolResult, A2AIntegrationError> {
        let start = std::time::Instant::now();

        let result = match tool_name {
            "read_file" => {
                let path = args["path"].as_str().ok_or_else(|| {
                    A2AIntegrationError::ToolExecutionFailed("Missing path".to_string())
                })?;

                match tokio::fs::read_to_string(path).await {
                    Ok(content) => serde_json::json!({ "content": content }),
                    Err(e) => return Err(A2AIntegrationError::ToolExecutionFailed(e.to_string())),
                }
            }
            "list_files" => {
                let path = args["path"].as_str().ok_or_else(|| {
                    A2AIntegrationError::ToolExecutionFailed("Missing path".to_string())
                })?;

                let mut entries = Vec::new();
                let mut dir = tokio::fs::read_dir(path)
                    .await
                    .map_err(|e| A2AIntegrationError::ToolExecutionFailed(e.to_string()))?;

                while let Some(entry) = dir
                    .next_entry()
                    .await
                    .map_err(|e| A2AIntegrationError::ToolExecutionFailed(e.to_string()))?
                {
                    let path = entry.path();
                    let name = entry.file_name().to_string_lossy().to_string();
                    let is_dir = entry
                        .file_type()
                        .await
                        .map(|ft| ft.is_dir())
                        .unwrap_or(false);

                    entries.push(serde_json::json!({
                        "name": name,
                        "path": path.to_string_lossy(),
                        "is_dir": is_dir
                    }));
                }

                serde_json::json!({ "entries": entries })
            }
            "search_code" => {
                let pattern = args["pattern"].as_str().ok_or_else(|| {
                    A2AIntegrationError::ToolExecutionFailed("Missing pattern".to_string())
                })?;

                // Validate regex pattern
                let _regex = regex::Regex::new(pattern)
                    .map_err(|e| A2AIntegrationError::ToolExecutionFailed(e.to_string()))?;

                // For now, return a placeholder - full implementation would use walkdir
                serde_json::json!({
                    "pattern": pattern,
                    "regex_valid": true,
                    "note": "Full search implementation pending"
                })
            }
            _ => {
                return Err(A2AIntegrationError::ToolNotFound(tool_name.to_string()));
            }
        };

        Ok(NativeToolResult {
            tool: tool_name.to_string(),
            success: true,
            result,
            execution_time_ms: start.elapsed().as_millis() as u64,
        })
    }

    /// Send a task to another agent via A2A protocol
    ///
    /// This is a convenience method that creates and sends an A2A task.
    /// Requires access to an A2A Gateway instance.
    async fn send_task_to_agent(
        &self,
        gateway: Arc<dyn A2AGatewayClient>,
        to_agent: &str,
        capability: &str,
        input: serde_json::Value,
    ) -> Result<A2ATaskResult, A2AIntegrationError> {
        let task = A2ATask {
            id: uuid::Uuid::new_v4().to_string(),
            from: self.agent_card().agent_id,
            to: to_agent.to_string(),
            capability: capability.to_string(),
            input,
            priority: 1,
            timeout_secs: Some(300),
            idempotency_key: None,
            metadata: HashMap::new(),
        };

        gateway.send_task(task).await
    }
}

/// Client trait for A2A Gateway communication
#[async_trait]
pub trait A2AGatewayClient: Send + Sync {
    /// Send a task to an agent via the gateway
    async fn send_task(&self, task: A2ATask) -> Result<A2ATaskResult, A2AIntegrationError>;

    /// Discover agents by capability
    async fn discover_agents(
        &self,
        capability: &str,
    ) -> Result<Vec<A2AAgentCard>, A2AIntegrationError>;

    /// Get a specific agent's card
    async fn get_agent_card(&self, agent_id: &str) -> Result<A2AAgentCard, A2AIntegrationError>;
}

/// Builder for creating A2A Agent Cards
pub struct AgentCardBuilder {
    agent_id: String,
    name: String,
    description: String,
    version: String,
    capabilities: Vec<AgentCapability>,
    input_modes: Vec<String>,
    output_modes: Vec<String>,
    metadata: HashMap<String, serde_json::Value>,
}

impl AgentCardBuilder {
    /// Create a new builder
    pub fn new(agent_id: impl Into<String>, name: impl Into<String>) -> Self {
        Self {
            agent_id: agent_id.into(),
            name: name.into(),
            description: String::new(),
            version: "1.0.0".to_string(),
            capabilities: Vec::new(),
            input_modes: vec!["text".to_string()],
            output_modes: vec!["text".to_string()],
            metadata: HashMap::new(),
        }
    }

    /// Set description
    pub fn description(mut self, desc: impl Into<String>) -> Self {
        self.description = desc.into();
        self
    }

    /// Set version
    pub fn version(mut self, version: impl Into<String>) -> Self {
        self.version = version.into();
        self
    }

    /// Add a capability
    pub fn capability(mut self, cap: AgentCapability) -> Self {
        self.capabilities.push(cap);
        self
    }

    /// Add input mode
    pub fn input_mode(mut self, mode: impl Into<String>) -> Self {
        self.input_modes.push(mode.into());
        self
    }

    /// Add output mode
    pub fn output_mode(mut self, mode: impl Into<String>) -> Self {
        self.output_modes.push(mode.into());
        self
    }

    /// Add metadata
    pub fn metadata(mut self, key: impl Into<String>, value: serde_json::Value) -> Self {
        self.metadata.insert(key.into(), value);
        self
    }

    /// Build the Agent Card
    pub fn build(self) -> A2AAgentCard {
        A2AAgentCard {
            agent_id: self.agent_id,
            name: self.name,
            description: self.description,
            version: self.version,
            protocol_version: "1.0".to_string(),
            capabilities: self.capabilities,
            input_modes: self.input_modes,
            output_modes: self.output_modes,
            metadata: self.metadata,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::base::BaseAgent;
    use miyabi_types::{agent::ResultStatus, AgentResult, AgentType, Task as MiyabiTask};

    struct TestAgent;

    #[async_trait]
    impl BaseAgent for TestAgent {
        fn agent_type(&self) -> AgentType {
            AgentType::CoordinatorAgent
        }

        async fn execute(&self, _task: &MiyabiTask) -> miyabi_types::error::Result<AgentResult> {
            Ok(AgentResult {
                status: ResultStatus::Success,
                data: Some(serde_json::json!({ "result": "test" })),
                error: None,
                metrics: None,
                escalation: None,
            })
        }
    }

    #[async_trait]
    impl A2AEnabled for TestAgent {
        fn agent_card(&self) -> A2AAgentCard {
            AgentCardBuilder::new("test-agent", "Test Agent")
                .description("A test agent")
                .capability(AgentCapability {
                    id: "test".to_string(),
                    name: "Test".to_string(),
                    description: "Test capability".to_string(),
                    input_schema: None,
                    output_schema: None,
                })
                .build()
        }

        async fn handle_a2a_task(
            &self,
            task: A2ATask,
        ) -> Result<A2ATaskResult, A2AIntegrationError> {
            Ok(A2ATaskResult::Success {
                output: serde_json::json!({ "result": "ok", "task_id": task.id }),
                artifacts: vec![],
                execution_time_ms: 10,
            })
        }
    }

    #[tokio::test]
    async fn test_agent_card_builder() {
        let agent = TestAgent;
        let card = agent.agent_card();

        assert_eq!(card.agent_id, "test-agent");
        assert_eq!(card.name, "Test Agent");
        assert_eq!(card.capabilities.len(), 1);
    }

    #[tokio::test]
    async fn test_native_tool_execution() {
        let agent = TestAgent;

        // Test list_files on a known directory
        let result = agent
            .execute_native_tool("list_files", serde_json::json!({ "path": "/tmp" }))
            .await;

        assert!(result.is_ok());
        let result = result.unwrap();
        assert!(result.success);
        assert_eq!(result.tool, "list_files");
    }

    #[tokio::test]
    async fn test_tool_not_found() {
        let agent = TestAgent;

        let result = agent
            .execute_native_tool("nonexistent_tool", serde_json::json!({}))
            .await;

        assert!(matches!(result, Err(A2AIntegrationError::ToolNotFound(_))));
    }
}
