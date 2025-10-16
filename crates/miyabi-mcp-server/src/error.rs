//! Error types for MCP server

use thiserror::Error;

/// Result type for MCP server operations
pub type Result<T> = std::result::Result<T, ServerError>;

/// MCP server error types
#[derive(Debug, Error)]
pub enum ServerError {
    /// Miyabi agent error
    #[error("Agent error: {0}")]
    Agent(#[from] miyabi_types::MiyabiError),

    /// GitHub API error
    #[error("GitHub error: {0}")]
    GitHub(String),

    /// Configuration error
    #[error("Configuration error: {0}")]
    Config(String),

    /// JSON-RPC error
    #[error("RPC error: {0}")]
    Rpc(String),

    /// I/O error
    #[error("I/O error: {0}")]
    Io(#[from] std::io::Error),

    /// Serialization error
    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),

    /// Invalid request
    #[error("Invalid request: {0}")]
    InvalidRequest(String),

    /// Method not found
    #[error("Method not found: {0}")]
    MethodNotFound(String),

    /// Internal server error
    #[error("Internal server error: {0}")]
    Internal(String),
}

impl From<String> for ServerError {
    fn from(s: String) -> Self {
        ServerError::Internal(s)
    }
}

impl From<&str> for ServerError {
    fn from(s: &str) -> Self {
        ServerError::Internal(s.to_string())
    }
}
