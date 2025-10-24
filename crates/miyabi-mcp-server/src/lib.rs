//! MCP (Model Context Protocol) Server for Miyabi
//!
//! This crate implements a JSON-RPC 2.0 server that exposes Miyabi's agent
//! execution capabilities via the Model Context Protocol. This enables
//! language-agnostic integration with Codex CLI and other MCP clients.
//!
//! ## Protocol
//!
//! The server implements JSON-RPC 2.0 over stdio or HTTP transport:
//!
//! - **stdio**: Standard input/output (default, suitable for CLI integration)
//! - **HTTP**: HTTP server on configurable port (suitable for remote access)
//!
//! ## Supported Methods
//!
//! ### Agent Execution
//!
//! - `agent.coordinator.execute` - Execute Coordinator Agent on an issue
//! - `agent.codegen.execute` - Execute CodeGen Agent
//! - `agent.review.execute` - Execute Review Agent
//! - `agent.deploy.execute` - Execute Deployment Agent
//! - `agent.pr.execute` - Execute PR Agent
//! - `agent.issue.execute` - Execute Issue Agent
//!
//! ### GitHub Operations
//!
//! - `github.issue.get` - Fetch issue by number
//! - `github.issue.list` - List open issues
//! - `github.pr.create` - Create pull request
//!
//! ### Knowledge Management
//!
//! - `knowledge.search` - Search knowledge base with vector similarity
//!
//! ### Health & Status
//!
//! - `server.health` - Check server health
//! - `server.version` - Get server version
//!
//! ## Example Client Request
//!
//! ```json
//! {
//!   "jsonrpc": "2.0",
//!   "id": 1,
//!   "method": "agent.coordinator.execute",
//!   "params": {
//!     "issue_number": 270
//!   }
//! }
//! ```
//!
//! ## Example Server Response
//!
//! ```json
//! {
//!   "jsonrpc": "2.0",
//!   "id": 1,
//!   "result": {
//!     "status": "success",
//!     "tasks_created": 5,
//!     "execution_time_ms": 1234,
//!     "agent_type": "coordinator"
//!   }
//! }
//! ```

pub mod cache;
pub mod config;
pub mod error;
pub mod metrics;
pub mod registry;
pub mod rpc;
pub mod server;
pub mod service;

pub use cache::{CacheKey, ToolResultCache};
pub use config::{ServerArgs, ServerConfig, TransportMode};
pub use error::{Result, ServerError};
pub use metrics::{ToolExecutionMetrics, ToolMetrics};
pub use registry::{
    DiscoveryStats, McpServerConnection, RegistryError, RegistryResult, ServerStatus,
    ToolDefinition, ToolRegistry,
};
pub use server::McpServer;
pub use service::{ServiceConfig, ServiceStats, ToolRegistryService};

// Re-export RPC types for convenience
pub use rpc::{
    AgentExecuteParams, AgentExecuteResult, HealthCheckResult, IssueFetchParams, IssueListParams,
    IssueResponse, KnowledgeMetadata, KnowledgeSearchParams, KnowledgeSearchResult,
};
