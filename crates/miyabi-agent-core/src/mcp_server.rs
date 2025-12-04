//! MCP Server for Claude Agent SDK
//!
//! Model Context Protocol server enabling external tools (like Claude Code)
//! to interact with Miyabi's agent orchestration system.

use serde::{Deserialize, Serialize};

/// MCP Tool definition
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct McpTool {
    /// Tool name
    pub name: String,
    /// Tool description
    pub description: String,
    /// Input schema (JSON Schema)
    pub input_schema: serde_json::Value,
}

/// MCP Resource definition
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct McpResource {
    /// Resource URI
    pub uri: String,
    /// Resource name
    pub name: String,
    /// Resource description
    pub description: Option<String>,
    /// MIME type
    pub mime_type: Option<String>,
}

/// MCP Prompt definition
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct McpPrompt {
    /// Prompt name
    pub name: String,
    /// Prompt description
    pub description: Option<String>,
    /// Arguments
    pub arguments: Vec<McpPromptArgument>,
}

/// MCP Prompt argument
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct McpPromptArgument {
    /// Argument name
    pub name: String,
    /// Argument description
    pub description: Option<String>,
    /// Whether required
    pub required: bool,
}

/// Agent SDK MCP tools
pub struct AgentSdkMcpTools;

impl AgentSdkMcpTools {
    /// Get all available tools
    pub fn list_tools() -> Vec<McpTool> {
        vec![
            // Sandbox tools
            McpTool {
                name: "sandbox_create".to_string(),
                description: "Create a new sandbox environment for isolated agent execution".to_string(),
                input_schema: serde_json::json!({
                    "type": "object",
                    "properties": {
                        "name": {
                            "type": "string",
                            "description": "Name for the sandbox"
                        },
                        "permission_level": {
                            "type": "string",
                            "enum": ["unrestricted", "standard", "strict"],
                            "description": "Permission level for the sandbox"
                        },
                        "network_policy": {
                            "type": "string",
                            "enum": ["allow_all", "deny_all", "allow_list", "deny_list"],
                            "description": "Network access policy"
                        },
                        "working_dir": {
                            "type": "string",
                            "description": "Working directory path"
                        }
                    },
                    "required": ["name"]
                }),
            },
            McpTool {
                name: "sandbox_destroy".to_string(),
                description: "Destroy a sandbox environment and clean up resources".to_string(),
                input_schema: serde_json::json!({
                    "type": "object",
                    "properties": {
                        "sandbox_id": {
                            "type": "string",
                            "description": "ID of the sandbox to destroy"
                        }
                    },
                    "required": ["sandbox_id"]
                }),
            },
            // Checkpoint tools
            McpTool {
                name: "checkpoint_create".to_string(),
                description: "Create a checkpoint of the current agent state".to_string(),
                input_schema: serde_json::json!({
                    "type": "object",
                    "properties": {
                        "description": {
                            "type": "string",
                            "description": "Description of the checkpoint"
                        },
                        "tags": {
                            "type": "array",
                            "items": { "type": "string" },
                            "description": "Tags for categorization"
                        }
                    },
                    "required": ["description"]
                }),
            },
            McpTool {
                name: "checkpoint_restore".to_string(),
                description: "Restore agent state from a checkpoint".to_string(),
                input_schema: serde_json::json!({
                    "type": "object",
                    "properties": {
                        "checkpoint_id": {
                            "type": "string",
                            "description": "ID of the checkpoint to restore"
                        }
                    },
                    "required": ["checkpoint_id"]
                }),
            },
            McpTool {
                name: "checkpoint_list".to_string(),
                description: "List available checkpoints".to_string(),
                input_schema: serde_json::json!({
                    "type": "object",
                    "properties": {
                        "limit": {
                            "type": "integer",
                            "description": "Maximum number of checkpoints to return"
                        },
                        "tags": {
                            "type": "array",
                            "items": { "type": "string" },
                            "description": "Filter by tags"
                        }
                    }
                }),
            },
            // Subagent tools
            McpTool {
                name: "subagent_spawn".to_string(),
                description: "Spawn a new subagent for parallel task execution".to_string(),
                input_schema: serde_json::json!({
                    "type": "object",
                    "properties": {
                        "name": {
                            "type": "string",
                            "description": "Name for the subagent"
                        },
                        "agent_type": {
                            "type": "string",
                            "enum": ["codegen", "reviewer", "tester", "deployer", "coordinator", "researcher", "documenter", "custom"],
                            "description": "Type of agent to spawn"
                        },
                        "task": {
                            "type": "string",
                            "description": "Task description for the subagent"
                        },
                        "timeout_seconds": {
                            "type": "integer",
                            "description": "Maximum execution time in seconds"
                        }
                    },
                    "required": ["name", "agent_type", "task"]
                }),
            },
            McpTool {
                name: "subagent_status".to_string(),
                description: "Get status of a running subagent".to_string(),
                input_schema: serde_json::json!({
                    "type": "object",
                    "properties": {
                        "agent_id": {
                            "type": "string",
                            "description": "ID of the subagent"
                        }
                    },
                    "required": ["agent_id"]
                }),
            },
            McpTool {
                name: "subagent_stop".to_string(),
                description: "Stop a running subagent".to_string(),
                input_schema: serde_json::json!({
                    "type": "object",
                    "properties": {
                        "agent_id": {
                            "type": "string",
                            "description": "ID of the subagent to stop"
                        }
                    },
                    "required": ["agent_id"]
                }),
            },
            McpTool {
                name: "subagent_list".to_string(),
                description: "List all active subagents".to_string(),
                input_schema: serde_json::json!({
                    "type": "object",
                    "properties": {
                        "status_filter": {
                            "type": "string",
                            "enum": ["all", "running", "idle", "completed", "failed"],
                            "description": "Filter by status"
                        }
                    }
                }),
            },
            // Orchestration tools
            McpTool {
                name: "workflow_create".to_string(),
                description: "Create a multi-agent workflow with dependencies".to_string(),
                input_schema: serde_json::json!({
                    "type": "object",
                    "properties": {
                        "name": {
                            "type": "string",
                            "description": "Workflow name"
                        },
                        "stages": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "name": { "type": "string" },
                                    "agent_type": { "type": "string" },
                                    "task": { "type": "string" },
                                    "depends_on": {
                                        "type": "array",
                                        "items": { "type": "string" }
                                    }
                                },
                                "required": ["name", "agent_type", "task"]
                            },
                            "description": "Workflow stages"
                        }
                    },
                    "required": ["name", "stages"]
                }),
            },
            McpTool {
                name: "workflow_execute".to_string(),
                description: "Execute a defined workflow".to_string(),
                input_schema: serde_json::json!({
                    "type": "object",
                    "properties": {
                        "workflow_id": {
                            "type": "string",
                            "description": "ID of the workflow to execute"
                        },
                        "input": {
                            "type": "object",
                            "description": "Input data for the workflow"
                        }
                    },
                    "required": ["workflow_id"]
                }),
            },
            // Tmux integration tools
            McpTool {
                name: "tmux_spawn_agent".to_string(),
                description: "Spawn an agent in a tmux pane".to_string(),
                input_schema: serde_json::json!({
                    "type": "object",
                    "properties": {
                        "name": {
                            "type": "string",
                            "description": "Agent name"
                        },
                        "agent_type": {
                            "type": "string",
                            "description": "Type of agent"
                        },
                        "session": {
                            "type": "string",
                            "description": "Tmux session name"
                        }
                    },
                    "required": ["name", "agent_type"]
                }),
            },
            McpTool {
                name: "tmux_send_command".to_string(),
                description: "Send a command to an agent in tmux".to_string(),
                input_schema: serde_json::json!({
                    "type": "object",
                    "properties": {
                        "agent_id": {
                            "type": "string",
                            "description": "ID of the agent"
                        },
                        "command": {
                            "type": "string",
                            "description": "Command to send"
                        }
                    },
                    "required": ["agent_id", "command"]
                }),
            },
            McpTool {
                name: "tmux_capture_output".to_string(),
                description: "Capture output from an agent's tmux pane".to_string(),
                input_schema: serde_json::json!({
                    "type": "object",
                    "properties": {
                        "agent_id": {
                            "type": "string",
                            "description": "ID of the agent"
                        },
                        "lines": {
                            "type": "integer",
                            "description": "Number of lines to capture"
                        }
                    },
                    "required": ["agent_id"]
                }),
            },
            McpTool {
                name: "tmux_broadcast".to_string(),
                description: "Broadcast a message to all agents".to_string(),
                input_schema: serde_json::json!({
                    "type": "object",
                    "properties": {
                        "message": {
                            "type": "string",
                            "description": "Message to broadcast"
                        }
                    },
                    "required": ["message"]
                }),
            },
        ]
    }

    /// Get all available resources
    pub fn list_resources() -> Vec<McpResource> {
        vec![
            McpResource {
                uri: "agent://sandbox/list".to_string(),
                name: "Active Sandboxes".to_string(),
                description: Some("List of all active sandbox environments".to_string()),
                mime_type: Some("application/json".to_string()),
            },
            McpResource {
                uri: "agent://checkpoint/history".to_string(),
                name: "Checkpoint History".to_string(),
                description: Some("History of all checkpoints".to_string()),
                mime_type: Some("application/json".to_string()),
            },
            McpResource {
                uri: "agent://subagent/status".to_string(),
                name: "Subagent Status".to_string(),
                description: Some("Status of all subagents".to_string()),
                mime_type: Some("application/json".to_string()),
            },
            McpResource {
                uri: "agent://workflow/list".to_string(),
                name: "Available Workflows".to_string(),
                description: Some("List of defined workflows".to_string()),
                mime_type: Some("application/json".to_string()),
            },
            McpResource {
                uri: "agent://tmux/sessions".to_string(),
                name: "Tmux Sessions".to_string(),
                description: Some("Active tmux sessions and panes".to_string()),
                mime_type: Some("application/json".to_string()),
            },
            McpResource {
                uri: "agent://metrics".to_string(),
                name: "Agent Metrics".to_string(),
                description: Some("Performance and usage metrics".to_string()),
                mime_type: Some("application/json".to_string()),
            },
        ]
    }

    /// Get all available prompts
    pub fn list_prompts() -> Vec<McpPrompt> {
        vec![
            McpPrompt {
                name: "create_coding_workflow".to_string(),
                description: Some("Create a standard coding workflow with research, implement, review, test stages".to_string()),
                arguments: vec![
                    McpPromptArgument {
                        name: "task".to_string(),
                        description: Some("The coding task to complete".to_string()),
                        required: true,
                    },
                    McpPromptArgument {
                        name: "language".to_string(),
                        description: Some("Programming language".to_string()),
                        required: false,
                    },
                ],
            },
            McpPrompt {
                name: "parallel_research".to_string(),
                description: Some("Spawn multiple research agents for parallel investigation".to_string()),
                arguments: vec![
                    McpPromptArgument {
                        name: "topics".to_string(),
                        description: Some("Comma-separated list of topics to research".to_string()),
                        required: true,
                    },
                ],
            },
            McpPrompt {
                name: "safe_refactor".to_string(),
                description: Some("Refactor code with automatic checkpoints and rollback capability".to_string()),
                arguments: vec![
                    McpPromptArgument {
                        name: "target".to_string(),
                        description: Some("File or module to refactor".to_string()),
                        required: true,
                    },
                    McpPromptArgument {
                        name: "goal".to_string(),
                        description: Some("Refactoring goal".to_string()),
                        required: true,
                    },
                ],
            },
            McpPrompt {
                name: "deploy_pipeline".to_string(),
                description: Some("Create a deployment pipeline with build, test, deploy stages".to_string()),
                arguments: vec![
                    McpPromptArgument {
                        name: "environment".to_string(),
                        description: Some("Target environment (dev/staging/production)".to_string()),
                        required: true,
                    },
                ],
            },
        ]
    }
}

/// MCP Server configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct McpServerConfig {
    /// Server name
    pub name: String,
    /// Server version
    pub version: String,
    /// Transport type
    pub transport: McpTransport,
    /// Enabled capabilities
    pub capabilities: McpCapabilities,
}

/// MCP Transport configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum McpTransport {
    /// Standard input/output
    Stdio,
    /// HTTP/SSE
    Http { host: String, port: u16 },
    /// WebSocket
    WebSocket { host: String, port: u16 },
}

/// MCP Capabilities
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct McpCapabilities {
    /// Tools support
    pub tools: bool,
    /// Resources support
    pub resources: bool,
    /// Prompts support
    pub prompts: bool,
    /// Sampling support
    pub sampling: bool,
    /// Logging support
    pub logging: bool,
}

impl Default for McpCapabilities {
    fn default() -> Self {
        Self {
            tools: true,
            resources: true,
            prompts: true,
            sampling: false,
            logging: true,
        }
    }
}

impl Default for McpServerConfig {
    fn default() -> Self {
        Self {
            name: "miyabi-agent-sdk".to_string(),
            version: "0.1.0".to_string(),
            transport: McpTransport::Stdio,
            capabilities: McpCapabilities::default(),
        }
    }
}

/// Tool execution result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolResult {
    /// Success status
    pub success: bool,
    /// Result content
    pub content: serde_json::Value,
    /// Error message if failed
    pub error: Option<String>,
}

impl ToolResult {
    /// Create success result
    pub fn success(content: serde_json::Value) -> Self {
        Self {
            success: true,
            content,
            error: None,
        }
    }

    /// Create error result
    pub fn error(message: &str) -> Self {
        Self {
            success: false,
            content: serde_json::Value::Null,
            error: Some(message.to_string()),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_list_tools() {
        let tools = AgentSdkMcpTools::list_tools();
        assert!(!tools.is_empty());
        
        // Check for key tools
        let tool_names: Vec<&str> = tools.iter().map(|t| t.name.as_str()).collect();
        assert!(tool_names.contains(&"sandbox_create"));
        assert!(tool_names.contains(&"checkpoint_create"));
        assert!(tool_names.contains(&"subagent_spawn"));
        assert!(tool_names.contains(&"workflow_create"));
        assert!(tool_names.contains(&"tmux_spawn_agent"));
    }

    #[test]
    fn test_list_resources() {
        let resources = AgentSdkMcpTools::list_resources();
        assert!(!resources.is_empty());
        
        let uris: Vec<&str> = resources.iter().map(|r| r.uri.as_str()).collect();
        assert!(uris.contains(&"agent://sandbox/list"));
        assert!(uris.contains(&"agent://subagent/status"));
    }

    #[test]
    fn test_list_prompts() {
        let prompts = AgentSdkMcpTools::list_prompts();
        assert!(!prompts.is_empty());
        
        let names: Vec<&str> = prompts.iter().map(|p| p.name.as_str()).collect();
        assert!(names.contains(&"create_coding_workflow"));
        assert!(names.contains(&"parallel_research"));
    }

    #[test]
    fn test_tool_result() {
        let success = ToolResult::success(serde_json::json!({"id": "123"}));
        assert!(success.success);
        assert!(success.error.is_none());

        let error = ToolResult::error("Something went wrong");
        assert!(!error.success);
        assert!(error.error.is_some());
    }

    #[test]
    fn test_default_config() {
        let config = McpServerConfig::default();
        assert_eq!(config.name, "miyabi-agent-sdk");
        assert!(config.capabilities.tools);
        assert!(config.capabilities.resources);
    }
}
