//! MCP Server implementation

use jsonrpc_core::{IoHandler, Params, Value};
use jsonrpc_stdio_server::ServerBuilder as StdioServerBuilder;
use std::sync::Arc;
use tokio::sync::RwLock;

use crate::config::{ServerConfig, TransportMode};
use crate::error::{Result, ServerError};
use crate::rpc::{
    AgentExecuteParams, IssueFetchParams, IssueListParams, KnowledgeSearchParams, RpcContext,
};
use crate::session_handler::SessionHandler;
use crate::session_rpc::{
    SessionGetParams, SessionHandoffParams, SessionLineageParams, SessionListParams,
    SessionMonitorParams, SessionSpawnParams, SessionTerminateParams,
};

/// MCP Server
pub struct McpServer {
    config: ServerConfig,
    context: Arc<RwLock<RpcContext>>,
    session_handler: Option<Arc<SessionHandler>>,
}

impl McpServer {
    /// Create new MCP server
    pub fn new(config: ServerConfig) -> Result<Self> {
        let context = RpcContext::new(config.clone())?;
        Ok(Self {
            config,
            context: Arc::new(RwLock::new(context)),
            session_handler: None,
        })
    }

    /// Create new MCP server with session management enabled
    pub async fn with_session_manager(config: ServerConfig) -> Result<Self> {
        let context = RpcContext::new(config.clone())?;

        // Initialize SessionHandler
        let sessions_dir = config.working_dir.join(".ai/sessions");
        let session_handler = SessionHandler::new(sessions_dir.to_str().unwrap()).await?;

        tracing::info!(
            "SessionManager initialized: {}",
            sessions_dir.display()
        );

        Ok(Self {
            config,
            context: Arc::new(RwLock::new(context)),
            session_handler: Some(Arc::new(session_handler)),
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

        // knowledge.search
        {
            let ctx = context.clone();
            io.add_method("knowledge.search", move |params: Params| {
                let ctx = ctx.clone();
                async move {
                    let params: KnowledgeSearchParams = params.parse()?;
                    let context = ctx.read().await;
                    let result = context
                        .search_knowledge(params)
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

        // Session management methods (if SessionHandler is available)
        if let Some(session_handler) = &self.session_handler {
            let handler = session_handler.clone();

            // session.spawn
            {
                let h = handler.clone();
                io.add_method("session.spawn", move |params: Params| {
                    let h = h.clone();
                    async move {
                        let params: SessionSpawnParams = params.parse()?;
                        let result = h
                            .spawn_session(params)
                            .await
                            .map_err(|e| jsonrpc_core::Error::invalid_params(e.to_string()))?;
                        Ok(serde_json::to_value(result).unwrap())
                    }
                });
            }

            // session.handoff
            {
                let h = handler.clone();
                io.add_method("session.handoff", move |params: Params| {
                    let h = h.clone();
                    async move {
                        let params: SessionHandoffParams = params.parse()?;
                        let result = h
                            .handoff_session(params)
                            .await
                            .map_err(|e| jsonrpc_core::Error::invalid_params(e.to_string()))?;
                        Ok(serde_json::to_value(result).unwrap())
                    }
                });
            }

            // session.monitor
            {
                let h = handler.clone();
                io.add_method("session.monitor", move |params: Params| {
                    let h = h.clone();
                    async move {
                        let params: SessionMonitorParams = params.parse()?;
                        let result = h
                            .monitor_session(params)
                            .await
                            .map_err(|e| jsonrpc_core::Error::invalid_params(e.to_string()))?;
                        Ok(serde_json::to_value(result).unwrap())
                    }
                });
            }

            // session.terminate
            {
                let h = handler.clone();
                io.add_method("session.terminate", move |params: Params| {
                    let h = h.clone();
                    async move {
                        let params: SessionTerminateParams = params.parse()?;
                        let result = h
                            .terminate_session(params)
                            .await
                            .map_err(|e| jsonrpc_core::Error::invalid_params(e.to_string()))?;
                        Ok(serde_json::to_value(result).unwrap())
                    }
                });
            }

            // session.list
            {
                let h = handler.clone();
                io.add_method("session.list", move |params: Params| {
                    let h = h.clone();
                    async move {
                        let params: SessionListParams = params.parse()?;
                        let result = h
                            .list_sessions(params)
                            .await
                            .map_err(|e| jsonrpc_core::Error::invalid_params(e.to_string()))?;
                        Ok(serde_json::to_value(result).unwrap())
                    }
                });
            }

            // session.get
            {
                let h = handler.clone();
                io.add_method("session.get", move |params: Params| {
                    let h = h.clone();
                    async move {
                        let params: SessionGetParams = params.parse()?;
                        let result = h
                            .get_session(params)
                            .await
                            .map_err(|e| jsonrpc_core::Error::invalid_params(e.to_string()))?;
                        Ok(serde_json::to_value(result).unwrap())
                    }
                });
            }

            // session.stats
            {
                let h = handler.clone();
                io.add_method("session.stats", move |_params: Params| {
                    let h = h.clone();
                    async move {
                        let result = h
                            .get_stats()
                            .await
                            .map_err(|e| jsonrpc_core::Error::invalid_params(e.to_string()))?;
                        Ok(serde_json::to_value(result).unwrap())
                    }
                });
            }

            // session.lineage
            {
                let h = handler.clone();
                io.add_method("session.lineage", move |params: Params| {
                    let h = h.clone();
                    async move {
                        let params: SessionLineageParams = params.parse()?;
                        let result = h
                            .get_lineage(params)
                            .await
                            .map_err(|e| jsonrpc_core::Error::invalid_params(e.to_string()))?;
                        Ok(serde_json::to_value(result).unwrap())
                    }
                });
            }

            tracing::info!("Session management RPC methods registered (8 methods)");
        } else {
            tracing::info!("Session management disabled (use with_session_manager() to enable)");
        }

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
