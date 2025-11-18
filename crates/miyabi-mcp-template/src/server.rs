//! MCP Server Implementation
//!
//! This module contains the actual MCP server implementation with tools.

use rmcp::{
    ErrorData as McpError,
    RoleServer,
    ServerHandler,
    handler::server::{
        router::tool::ToolRouter,
        wrapper::Parameters,
    },
    model::*,
    schemars,
    service::RequestContext,
    tool, tool_router, tool_handler,
};
use serde::Deserialize;

/// Example tool arguments schema
///
/// All tool arguments must derive:
/// - Debug: For logging
/// - Deserialize: For JSON parsing
/// - JsonSchema: For MCP schema generation
#[derive(Debug, Deserialize, schemars::JsonSchema)]
pub struct ExampleArgs {
    /// The name to greet
    pub name: String,
    /// Number of times to repeat the greeting (optional)
    #[serde(default)]
    pub count: Option<i32>,
}

/// Another example for a tool with no arguments
#[derive(Debug, Deserialize, schemars::JsonSchema)]
pub struct NoArgs {}

/// The main server struct
///
/// This struct holds the server state and tool router.
/// It must be Clone to work with the MCP framework.
#[derive(Clone)]
pub struct TemplateServer {
    tool_router: ToolRouter<TemplateServer>,
    // Add your server state here
    // Example:
    // database: Arc<Database>,
    // config: Arc<Config>,
}

/// Implement the tool router for the server
///
/// The #[tool_router] macro automatically generates the tool registration code.
#[tool_router]
impl TemplateServer {
    /// Create a new server instance
    pub fn new() -> Self {
        tracing::info!("Initializing TemplateServer");

        Self {
            tool_router: Self::tool_router(),
            // Initialize your state here
        }
    }

    /// Example tool: Greet a user
    ///
    /// The #[tool] macro:
    /// - Registers this method as an MCP tool
    /// - Generates JSON schema from the args type
    /// - Handles serialization/deserialization
    ///
    /// # Tool Naming
    /// - Method name becomes tool name (snake_case)
    /// - Use descriptive names (e.g., fetch_data, process_file)
    ///
    /// # Arguments
    /// - `&self`: Access to server state
    /// - `Parameters(args)`: Strongly-typed arguments wrapped in Parameters
    ///
    /// # Returns
    /// - `Ok(CallToolResult)`: Successful execution
    /// - `Err(McpError)`: Error occurred
    #[tool(description = "Greet a user by name with optional repetition")]
    async fn greet_user(
        &self,
        Parameters(args): Parameters<ExampleArgs>,
    ) -> Result<CallToolResult, McpError> {
        tracing::info!("greet_user called: {:?}", args);

        let count = args.count.unwrap_or(1);
        let mut greetings = Vec::new();

        for i in 0..count {
            let greeting = if i == 0 {
                format!("Hello, {}!", args.name)
            } else {
                format!("Hello again, {}! ({})", args.name, i + 1)
            };
            greetings.push(greeting);
        }

        let response = greetings.join("\n");

        // Return success with text content
        Ok(CallToolResult::success(vec![
            Content::text(response)
        ]))
    }

    /// Example tool: Get server info
    ///
    /// This tool takes no arguments
    #[tool(description = "Get server information and status")]
    async fn get_server_info(
        &self,
        Parameters(_args): Parameters<NoArgs>,
    ) -> Result<CallToolResult, McpError> {
        tracing::info!("get_server_info called");

        let info = serde_json::json!({
            "name": "Miyabi MCP Template Server",
            "version": env!("CARGO_PKG_VERSION"),
            "description": env!("CARGO_PKG_DESCRIPTION"),
            "status": "running",
            "features": ["stdio"],
        });

        Ok(CallToolResult::success(vec![
            Content::text(serde_json::to_string_pretty(&info).unwrap())
        ]))
    }

    /// Example tool: Echo input (useful for testing)
    #[tool(description = "Echo back the input for testing purposes")]
    async fn echo(
        &self,
        Parameters(args): Parameters<EchoArgs>,
    ) -> Result<CallToolResult, McpError> {
        tracing::info!("echo called: {:?}", args);

        Ok(CallToolResult::success(vec![
            Content::text(args.message)
        ]))
    }

    /// Example tool: Error demonstration
    ///
    /// Shows how to return errors from tools
    #[tool(description = "Demonstrate error handling (always fails)")]
    async fn fail_intentionally(
        &self,
        Parameters(_args): Parameters<NoArgs>,
    ) -> Result<CallToolResult, McpError> {
        tracing::error!("fail_intentionally called - returning error");

        // Return an error
        Err(McpError {
            code: rmcp::model::ErrorCode(-32000), // Custom error code
            message: "This tool is designed to fail for testing purposes".into(),
            data: Some(serde_json::json!({
                "error_type": "IntentionalError",
                "help": "This is expected behavior for testing"
            })),
        })
    }
}

/// Echo tool arguments
#[derive(Debug, Deserialize, schemars::JsonSchema)]
pub struct EchoArgs {
    /// The message to echo back
    pub message: String,
}

/// Implement ServerHandler to enable the server to work with MCP
///
/// The #[tool_handler] macro connects the tool_router to the ServerHandler trait
#[tool_handler]
impl ServerHandler for TemplateServer {
    /// Get server information and capabilities
    fn get_info(&self) -> ServerInfo {
        ServerInfo {
            protocol_version: ProtocolVersion::V_2024_11_05,
            capabilities: ServerCapabilities::builder()
                .enable_tools()  // Enable tool support
                .build(),
            server_info: Implementation::from_build_env(),
            instructions: Some(
                "Miyabi MCP Template Server. Tools: greet_user, get_server_info, echo, fail_intentionally."
                    .to_string(),
            ),
        }
    }

    /// Initialize the server
    async fn initialize(
        &self,
        _request: InitializeRequestParam,
        _context: RequestContext<RoleServer>,
    ) -> Result<InitializeResult, McpError> {
        tracing::info!("Server initialized");
        Ok(self.get_info())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_greet_user() {
        let server = TemplateServer::new();

        let args = ExampleArgs {
            name: "Alice".to_string(),
            count: Some(1),
        };

        let result = server.greet_user(Parameters(args)).await;
        assert!(result.is_ok());

        let result = result.unwrap();
        assert!(!result.is_error.unwrap_or(false));
        assert_eq!(result.content.len(), 1);
    }

    #[tokio::test]
    async fn test_echo() {
        let server = TemplateServer::new();

        let args = EchoArgs {
            message: "test message".to_string(),
        };

        let result = server.echo(Parameters(args)).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_intentional_failure() {
        let server = TemplateServer::new();

        let result = server.fail_intentionally(Parameters(NoArgs {})).await;
        assert!(result.is_err());
    }
}
