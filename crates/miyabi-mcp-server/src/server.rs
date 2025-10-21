//! MCP Server implementation

use jsonrpc_core::{IoHandler, Params, Value};
use jsonrpc_stdio_server::ServerBuilder as StdioServerBuilder;
use std::sync::Arc;
use tokio::sync::RwLock;

use crate::config::{ServerConfig, TransportMode};
use crate::error::{Result, ServerError};
use crate::rpc::{AgentExecuteParams, IssueFetchParams, IssueListParams, RpcContext};

/// MCP Server
pub struct McpServer {
    config: ServerConfig,
    context: Arc<RwLock<RpcContext>>,
}

impl McpServer {
    /// Create new MCP server
    pub fn new(config: ServerConfig) -> Result<Self> {
        let context = RpcContext::new(config.clone())?;
        Ok(Self {
            config,
            context: Arc::new(RwLock::new(context)),
        })
    }

    /// Setup JSON-RPC handlers
    fn setup_handlers(&self) -> IoHandler {
        let mut io = IoHandler::new();
        let context = self.context.clone();

        // agent.coordinator.execute
        {
            let ctx = context.clone();
            io.add_method("agent.coordinator.execute", move |params: Params| {
                let ctx = ctx.clone();
                async move {
                    let params: AgentExecuteParams = params.parse()?;
                    let context = ctx.read().await;
                    let result = context
                        .execute_coordinator(params)
                        .await
                        .map_err(|e| jsonrpc_core::Error::invalid_params(e.to_string()))?;
                    Ok(serde_json::to_value(result).unwrap())
                }
            });
        }

        // github.issue.get
        {
            let ctx = context.clone();
            io.add_method("github.issue.get", move |params: Params| {
                let ctx = ctx.clone();
                async move {
                    let params: IssueFetchParams = params.parse()?;
                    let context = ctx.read().await;
                    let result = context
                        .fetch_issue(params)
                        .await
                        .map_err(|e| jsonrpc_core::Error::invalid_params(e.to_string()))?;
                    Ok(serde_json::to_value(result).unwrap())
                }
            });
        }

        // github.issue.list
        {
            let ctx = context.clone();
            io.add_method("github.issue.list", move |params: Params| {
                let ctx = ctx.clone();
                async move {
                    let params: IssueListParams = params.parse()?;
                    let context = ctx.read().await;
                    let result = context
                        .list_issues(params)
                        .await
                        .map_err(|e| jsonrpc_core::Error::invalid_params(e.to_string()))?;
                    Ok(serde_json::to_value(result).unwrap())
                }
            });
        }

        // server.health
        {
            let ctx = context.clone();
            io.add_method("server.health", move |_params: Params| {
                let ctx = ctx.clone();
                async move {
                    let context = ctx.read().await;
                    let result = context
                        .health_check()
                        .await
                        .map_err(|_e| jsonrpc_core::Error::internal_error())?;
                    Ok(serde_json::to_value(result).unwrap())
                }
            });
        }

        // server.version
        io.add_method("server.version", |_params: Params| async move {
            Ok(Value::String(env!("CARGO_PKG_VERSION").to_string()))
        });

        io
    }

    /// Run server
    pub async fn run(self) -> Result<()> {
        let io = self.setup_handlers();

        match self.config.transport {
            TransportMode::Stdio => {
                tracing::info!("Starting MCP server in stdio mode");
                self.run_stdio(io).await
            }
            TransportMode::Http => {
                #[cfg(feature = "http")]
                {
                    tracing::info!(
                        "Starting MCP server in HTTP mode on {}:{}",
                        self.config.http_host,
                        self.config.http_port
                    );
                    self.run_http(io).await
                }
                #[cfg(not(feature = "http"))]
                {
                    Err(ServerError::Config(
                        "HTTP transport requires 'http' feature to be enabled".to_string(),
                    ))
                }
            }
        }
    }

    /// Run stdio server
    async fn run_stdio(self, io: IoHandler) -> Result<()> {
        let server = StdioServerBuilder::new(io).build();

        tracing::info!("MCP server ready on stdio");

        // Wait for the server to complete
        server.await;

        Ok(())
    }

    /// Run HTTP server
    #[cfg(feature = "http")]
    async fn run_http(self, io: IoHandler) -> Result<()> {
        use jsonrpc_http_server::ServerBuilder as HttpServerBuilder;

        let addr = format!("{}:{}", self.config.http_host, self.config.http_port);
        let server = HttpServerBuilder::new(io)
            .start_http(&addr.parse().unwrap())
            .map_err(|e| ServerError::Internal(format!("Failed to start HTTP server: {}", e)))?;

        tracing::info!("MCP server listening on http://{}", addr);

        server.wait();

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::config::ServerConfig;
    use std::path::PathBuf;

    fn create_test_config() -> ServerConfig {
        ServerConfig {
            github_token: "test_token".to_string(),
            repo_owner: "test_owner".to_string(),
            repo_name: "test_repo".to_string(),
            anthropic_api_key: None,
            working_dir: PathBuf::from("."),
            device_identifier: None,
            transport: TransportMode::Stdio,
            http_host: "127.0.0.1".parse().unwrap(),
            http_port: 3030,
        }
    }

    #[tokio::test]
    async fn test_server_creation() {
        // Test that server creation succeeds with a config
        // (GitHub client creation is lazy and doesn't validate token at construction time)
        let config = create_test_config();
        let result = McpServer::new(config);
        // Server creation should succeed even with fake token
        // (validation happens when making actual API calls)
        assert!(result.is_ok());
    }

    #[test]
    fn test_config_transport_stdio() {
        let config = create_test_config();
        assert_eq!(config.transport, TransportMode::Stdio);
    }
}
