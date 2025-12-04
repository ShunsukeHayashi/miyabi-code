//! MCP Claude Code Integration
//!
//! Provides MCP tools, resources, and prompts specifically designed for
//! Claude Code integration with Miyabi's agent orchestration system.

use serde::{Deserialize, Serialize};
use serde_json::json;

use crate::miyabi_adapter::MiyabiAgentType;
use crate::mcp_server::{McpTool, McpResource, McpPrompt, McpPromptArgument};

/// Claude Code MCP Server
pub struct ClaudeCodeMcpServer {
    /// Server name
    pub name: String,
    /// Server version
    pub version: String,
    /// Capabilities
    pub capabilities: ServerCapabilities,
}

/// Server capabilities
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServerCapabilities {
    pub tools: bool,
    pub resources: bool,
    pub prompts: bool,
    pub logging: bool,
}

impl Default for ServerCapabilities {
    fn default() -> Self {
        Self {
            tools: true,
            resources: true,
            prompts: true,
            logging: true,
        }
    }
}

impl ClaudeCodeMcpServer {
    /// Create new server
    pub fn new() -> Self {
        Self {
            name: "miyabi-agent-sdk".to_string(),
            version: "1.0.0".to_string(),
            capabilities: ServerCapabilities::default(),
        }
    }

    /// Get server info
    pub fn server_info(&self) -> serde_json::Value {
        json!({
            "name": self.name,
            "version": self.version,
            "protocolVersion": "2024-11-05",
            "capabilities": {
                "tools": { "listChanged": true },
                "resources": { "listChanged": true, "subscribe": true },
                "prompts": { "listChanged": true },
                "logging": {}
            }
        })
    }

    /// List all tools
    pub fn list_tools(&self) -> Vec<McpTool> {
        vec![
            // Agent Management Tools
            self.tool_agent_spawn(),
            self.tool_agent_stop(),
            self.tool_agent_status(),
            self.tool_agent_list(),
            self.tool_agent_execute(),
            self.tool_agent_logs(),
            // Workflow Tools
            self.tool_workflow_dev(),
            self.tool_workflow_business(),
            self.tool_workflow_custom(),
            // Checkpoint Tools
            self.tool_checkpoint_save(),
            self.tool_checkpoint_restore(),
            self.tool_checkpoint_list(),
            self.tool_checkpoint_diff(),
            // Communication Tools
            self.tool_broadcast(),
            self.tool_send_message(),
            // Sandbox Tools
            self.tool_sandbox_create(),
            self.tool_sandbox_status(),
        ]
    }

    fn tool_agent_spawn(&self) -> McpTool {
        McpTool {
            name: "miyabi_agent_spawn".to_string(),
            description: "Spawn a new Miyabi agent with specified configuration".to_string(),
            input_schema: json!({
                "type": "object",
                "properties": {
                    "agent_type": {
                        "type": "string",
                        "enum": MiyabiAgentType::all().iter().map(|a| a.name()).collect::<Vec<_>>(),
                        "description": "Type of agent to spawn"
                    },
                    "instance_name": { "type": "string", "description": "Unique name for this agent instance" },
                    "task": { "type": "string", "description": "Initial task description" },
                    "timeout_seconds": { "type": "integer", "default": 600 },
                    "sandbox_enabled": { "type": "boolean", "default": true }
                },
                "required": ["agent_type", "instance_name"]
            }),
        }
    }

    fn tool_agent_stop(&self) -> McpTool {
        McpTool {
            name: "miyabi_agent_stop".to_string(),
            description: "Stop a running agent".to_string(),
            input_schema: json!({
                "type": "object",
                "properties": {
                    "agent_id": { "type": "string", "format": "uuid" },
                    "force": { "type": "boolean", "default": false }
                },
                "required": ["agent_id"]
            }),
        }
    }

    fn tool_agent_status(&self) -> McpTool {
        McpTool {
            name: "miyabi_agent_status".to_string(),
            description: "Get status of a specific agent".to_string(),
            input_schema: json!({
                "type": "object",
                "properties": { "agent_id": { "type": "string", "format": "uuid" } },
                "required": ["agent_id"]
            }),
        }
    }

    fn tool_agent_list(&self) -> McpTool {
        McpTool {
            name: "miyabi_agent_list".to_string(),
            description: "List all running agents with their status".to_string(),
            input_schema: json!({
                "type": "object",
                "properties": {
                    "status_filter": { "type": "string", "enum": ["all", "running", "paused", "completed", "failed"], "default": "all" },
                    "category_filter": { "type": "string", "enum": ["all", "development", "business"], "default": "all" }
                }
            }),
        }
    }

    fn tool_agent_execute(&self) -> McpTool {
        McpTool {
            name: "miyabi_agent_execute".to_string(),
            description: "Execute a command or task on a running agent".to_string(),
            input_schema: json!({
                "type": "object",
                "properties": {
                    "agent_id": { "type": "string", "format": "uuid" },
                    "command": { "type": "string" },
                    "async": { "type": "boolean", "default": false }
                },
                "required": ["agent_id", "command"]
            }),
        }
    }

    fn tool_agent_logs(&self) -> McpTool {
        McpTool {
            name: "miyabi_agent_logs".to_string(),
            description: "Get recent logs from an agent".to_string(),
            input_schema: json!({
                "type": "object",
                "properties": {
                    "agent_id": { "type": "string", "format": "uuid" },
                    "lines": { "type": "integer", "default": 50 },
                    "level": { "type": "string", "enum": ["debug", "info", "warn", "error"], "default": "info" }
                },
                "required": ["agent_id"]
            }),
        }
    }

    fn tool_workflow_dev(&self) -> McpTool {
        McpTool {
            name: "miyabi_workflow_dev".to_string(),
            description: "Spawn the development workflow (7 agents: Coordinator, CodeGen, Review, Issue, PR, Deploy, Refresher)".to_string(),
            input_schema: json!({
                "type": "object",
                "properties": {
                    "project_name": { "type": "string" },
                    "repository": { "type": "string" },
                    "branch": { "type": "string", "default": "main" }
                },
                "required": ["project_name"]
            }),
        }
    }

    fn tool_workflow_business(&self) -> McpTool {
        McpTool {
            name: "miyabi_workflow_business".to_string(),
            description: "Spawn the business workflow (14 agents: AI Entrepreneur, Marketing, Sales, etc.)".to_string(),
            input_schema: json!({
                "type": "object",
                "properties": {
                    "project_name": { "type": "string" },
                    "focus_area": { "type": "string", "enum": ["full", "marketing", "sales", "product"], "default": "full" }
                },
                "required": ["project_name"]
            }),
        }
    }

    fn tool_workflow_custom(&self) -> McpTool {
        McpTool {
            name: "miyabi_workflow_custom".to_string(),
            description: "Create a custom workflow with selected agents".to_string(),
            input_schema: json!({
                "type": "object",
                "properties": {
                    "name": { "type": "string" },
                    "agents": { "type": "array", "items": { "type": "string" } },
                    "parallel": { "type": "boolean", "default": true }
                },
                "required": ["name", "agents"]
            }),
        }
    }

    fn tool_checkpoint_save(&self) -> McpTool {
        McpTool {
            name: "miyabi_checkpoint_save".to_string(),
            description: "Save a checkpoint of current agent state".to_string(),
            input_schema: json!({
                "type": "object",
                "properties": {
                    "agent_id": { "type": "string", "format": "uuid" },
                    "label": { "type": "string" },
                    "include_files": { "type": "boolean", "default": true }
                },
                "required": ["agent_id"]
            }),
        }
    }

    fn tool_checkpoint_restore(&self) -> McpTool {
        McpTool {
            name: "miyabi_checkpoint_restore".to_string(),
            description: "Restore agent state from a checkpoint".to_string(),
            input_schema: json!({
                "type": "object",
                "properties": {
                    "checkpoint_id": { "type": "string", "format": "uuid" },
                    "agent_id": { "type": "string", "format": "uuid" }
                },
                "required": ["checkpoint_id"]
            }),
        }
    }

    fn tool_checkpoint_list(&self) -> McpTool {
        McpTool {
            name: "miyabi_checkpoint_list".to_string(),
            description: "List available checkpoints".to_string(),
            input_schema: json!({
                "type": "object",
                "properties": {
                    "agent_id": { "type": "string", "format": "uuid" },
                    "limit": { "type": "integer", "default": 20 }
                }
            }),
        }
    }

    fn tool_checkpoint_diff(&self) -> McpTool {
        McpTool {
            name: "miyabi_checkpoint_diff".to_string(),
            description: "Compare two checkpoints and show differences".to_string(),
            input_schema: json!({
                "type": "object",
                "properties": {
                    "checkpoint_a": { "type": "string", "format": "uuid" },
                    "checkpoint_b": { "type": "string", "format": "uuid" }
                },
                "required": ["checkpoint_a", "checkpoint_b"]
            }),
        }
    }

    fn tool_broadcast(&self) -> McpTool {
        McpTool {
            name: "miyabi_broadcast".to_string(),
            description: "Broadcast a message to all running agents".to_string(),
            input_schema: json!({
                "type": "object",
                "properties": {
                    "message": { "type": "string" },
                    "category_filter": { "type": "string", "enum": ["all", "development", "business"], "default": "all" }
                },
                "required": ["message"]
            }),
        }
    }

    fn tool_send_message(&self) -> McpTool {
        McpTool {
            name: "miyabi_send_message".to_string(),
            description: "Send a message to a specific agent".to_string(),
            input_schema: json!({
                "type": "object",
                "properties": {
                    "agent_id": { "type": "string", "format": "uuid" },
                    "message": { "type": "string" },
                    "priority": { "type": "string", "enum": ["low", "normal", "high", "urgent"], "default": "normal" }
                },
                "required": ["agent_id", "message"]
            }),
        }
    }

    fn tool_sandbox_create(&self) -> McpTool {
        McpTool {
            name: "miyabi_sandbox_create".to_string(),
            description: "Create a new isolated sandbox environment".to_string(),
            input_schema: json!({
                "type": "object",
                "properties": {
                    "name": { "type": "string" },
                    "permission_level": { "type": "string", "enum": ["unrestricted", "standard", "strict"], "default": "standard" },
                    "network_policy": { "type": "string", "enum": ["allow_all", "allow_list", "deny_all"], "default": "allow_list" },
                    "allowed_hosts": { "type": "array", "items": { "type": "string" } },
                    "max_memory_mb": { "type": "integer", "default": 512 }
                },
                "required": ["name"]
            }),
        }
    }

    fn tool_sandbox_status(&self) -> McpTool {
        McpTool {
            name: "miyabi_sandbox_status".to_string(),
            description: "Get status and resource usage of a sandbox".to_string(),
            input_schema: json!({
                "type": "object",
                "properties": { "sandbox_id": { "type": "string", "format": "uuid" } },
                "required": ["sandbox_id"]
            }),
        }
    }

    /// List all resources
    pub fn list_resources(&self) -> Vec<McpResource> {
        vec![
            McpResource { uri: "miyabi://agents".to_string(), name: "Running Agents".to_string(), description: Some("List of all running Miyabi agents".to_string()), mime_type: Some("application/json".to_string()) },
            McpResource { uri: "miyabi://agents/{agent_id}".to_string(), name: "Agent Details".to_string(), description: Some("Detailed information about a specific agent".to_string()), mime_type: Some("application/json".to_string()) },
            McpResource { uri: "miyabi://agents/{agent_id}/logs".to_string(), name: "Agent Logs".to_string(), description: Some("Recent logs from an agent".to_string()), mime_type: Some("text/plain".to_string()) },
            McpResource { uri: "miyabi://checkpoints".to_string(), name: "Checkpoints".to_string(), description: Some("List of all saved checkpoints".to_string()), mime_type: Some("application/json".to_string()) },
            McpResource { uri: "miyabi://checkpoints/{checkpoint_id}".to_string(), name: "Checkpoint Details".to_string(), description: Some("Detailed checkpoint information".to_string()), mime_type: Some("application/json".to_string()) },
            McpResource { uri: "miyabi://sandboxes".to_string(), name: "Sandboxes".to_string(), description: Some("List of all active sandboxes".to_string()), mime_type: Some("application/json".to_string()) },
            McpResource { uri: "miyabi://workflows".to_string(), name: "Active Workflows".to_string(), description: Some("List of active agent workflows".to_string()), mime_type: Some("application/json".to_string()) },
            McpResource { uri: "miyabi://system/status".to_string(), name: "System Status".to_string(), description: Some("Overall system health and resource usage".to_string()), mime_type: Some("application/json".to_string()) },
        ]
    }

    /// List all prompts
    pub fn list_prompts(&self) -> Vec<McpPrompt> {
        vec![
            McpPrompt {
                name: "miyabi_dev_setup".to_string(),
                description: Some("Set up a complete development environment with Miyabi agents".to_string()),
                arguments: vec![
                    McpPromptArgument { name: "project_name".to_string(), description: Some("Name of the project".to_string()), required: true },
                    McpPromptArgument { name: "repository".to_string(), description: Some("GitHub repository URL".to_string()), required: false },
                ],
            },
            McpPrompt {
                name: "miyabi_code_review".to_string(),
                description: Some("Start an AI-powered code review workflow".to_string()),
                arguments: vec![
                    McpPromptArgument { name: "pr_number".to_string(), description: Some("Pull request number".to_string()), required: true },
                    McpPromptArgument { name: "focus_areas".to_string(), description: Some("Specific areas to focus on".to_string()), required: false },
                ],
            },
            McpPrompt {
                name: "miyabi_issue_triage".to_string(),
                description: Some("Triage and categorize GitHub issues".to_string()),
                arguments: vec![
                    McpPromptArgument { name: "issue_numbers".to_string(), description: Some("Comma-separated issue numbers".to_string()), required: true },
                ],
            },
            McpPrompt {
                name: "miyabi_deploy_plan".to_string(),
                description: Some("Create a deployment plan with safety checks".to_string()),
                arguments: vec![
                    McpPromptArgument { name: "environment".to_string(), description: Some("Target environment".to_string()), required: true },
                    McpPromptArgument { name: "version".to_string(), description: Some("Version to deploy".to_string()), required: true },
                ],
            },
            McpPrompt {
                name: "miyabi_business_analysis".to_string(),
                description: Some("Run comprehensive business analysis with AI agents".to_string()),
                arguments: vec![
                    McpPromptArgument { name: "business_name".to_string(), description: Some("Name of the business".to_string()), required: true },
                    McpPromptArgument { name: "analysis_type".to_string(), description: Some("Type: market, competitor, swot, full".to_string()), required: false },
                ],
            },
        ]
    }
}

impl Default for ClaudeCodeMcpServer {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_server_creation() {
        let server = ClaudeCodeMcpServer::new();
        assert_eq!(server.name, "miyabi-agent-sdk");
        assert_eq!(server.version, "1.0.0");
    }

    #[test]
    fn test_server_info() {
        let server = ClaudeCodeMcpServer::new();
        let info = server.server_info();
        assert_eq!(info["name"], "miyabi-agent-sdk");
        assert!(info["capabilities"]["tools"]["listChanged"].as_bool().unwrap());
    }

    #[test]
    fn test_list_tools() {
        let server = ClaudeCodeMcpServer::new();
        let tools = server.list_tools();
        assert_eq!(tools.len(), 17);
        let tool_names: Vec<&str> = tools.iter().map(|t| t.name.as_str()).collect();
        assert!(tool_names.contains(&"miyabi_agent_spawn"));
        assert!(tool_names.contains(&"miyabi_workflow_dev"));
    }

    #[test]
    fn test_list_resources() {
        let server = ClaudeCodeMcpServer::new();
        let resources = server.list_resources();
        assert_eq!(resources.len(), 8);
    }

    #[test]
    fn test_list_prompts() {
        let server = ClaudeCodeMcpServer::new();
        let prompts = server.list_prompts();
        assert_eq!(prompts.len(), 5);
    }

    #[test]
    fn test_tool_schema_validity() {
        let server = ClaudeCodeMcpServer::new();
        let tools = server.list_tools();
        for tool in tools {
            assert!(tool.input_schema.is_object());
            assert!(tool.input_schema["type"] == "object");
        }
    }
}
