//! Error types for MCP server

use miyabi_types::error::{ErrorCode, UnifiedError};
use std::any::Any;
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

    /// Knowledge management error
    #[error("Knowledge error: {0}")]
    Knowledge(String),

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

// ============================================================================
// UnifiedError Implementation
// ============================================================================

impl UnifiedError for ServerError {
    fn code(&self) -> ErrorCode {
        match self {
            Self::Agent(_) => ErrorCode::AGENT_ERROR,
            Self::GitHub(_) => ErrorCode::GITHUB_ERROR,
            Self::Knowledge(_) => ErrorCode::STORAGE_ERROR,
            Self::Config(_) => ErrorCode::CONFIG_ERROR,
            Self::Rpc(_) => ErrorCode::INTERNAL_ERROR,
            Self::Io(e) => match e.kind() {
                std::io::ErrorKind::NotFound => ErrorCode::FILE_NOT_FOUND,
                std::io::ErrorKind::PermissionDenied => ErrorCode::PERMISSION_DENIED,
                _ => ErrorCode::IO_ERROR,
            },
            Self::Serialization(_) => ErrorCode::PARSE_ERROR,
            Self::InvalidRequest(_) => ErrorCode::INVALID_INPUT,
            Self::MethodNotFound(_) => ErrorCode::FILE_NOT_FOUND,
            Self::Internal(_) => ErrorCode::INTERNAL_ERROR,
        }
    }

    fn user_message(&self) -> String {
        match self {
            Self::GitHub(msg) => format!("GitHub API error: {}. Please check your GitHub token and permissions.", msg),
            Self::Knowledge(msg) => {
                format!("Knowledge system error: {}. The knowledge base may be temporarily unavailable.", msg)
            }
            Self::Config(msg) => {
                format!("MCP server configuration error: {}. Please verify your server configuration.", msg)
            }
            Self::Rpc(msg) => {
                format!("JSON-RPC protocol error: {}. The request format may be invalid.", msg)
            }
            Self::InvalidRequest(msg) => {
                format!("Invalid request: {}. Please check your request parameters.", msg)
            }
            Self::MethodNotFound(method) => {
                format!("MCP method '{}' not found. Please check the method name and server capabilities.", method)
            }
            Self::Internal(msg) => {
                format!("Internal MCP server error: {}. Please try again or contact support.", msg)
            }
            // Reuse existing thiserror messages for other variants
            _ => self.to_string(),
        }
    }

    fn context(&self) -> Option<&dyn Any> {
        match self {
            Self::GitHub(msg) => Some(msg as &dyn Any),
            Self::Knowledge(msg) => Some(msg as &dyn Any),
            Self::Config(msg) => Some(msg as &dyn Any),
            Self::Rpc(msg) => Some(msg as &dyn Any),
            Self::InvalidRequest(msg) => Some(msg as &dyn Any),
            Self::MethodNotFound(method) => Some(method as &dyn Any),
            Self::Internal(msg) => Some(msg as &dyn Any),
            _ => None,
        }
    }
}

#[cfg(test)]
mod unified_error_tests {
    use super::*;

    #[test]
    fn test_server_error_codes() {
        let error = ServerError::GitHub("not found".to_string());
        assert_eq!(error.code(), ErrorCode::GITHUB_ERROR);

        let error = ServerError::Knowledge("connection failed".to_string());
        assert_eq!(error.code(), ErrorCode::STORAGE_ERROR);

        let error = ServerError::Config("missing key".to_string());
        assert_eq!(error.code(), ErrorCode::CONFIG_ERROR);

        let error = ServerError::InvalidRequest("bad params".to_string());
        assert_eq!(error.code(), ErrorCode::INVALID_INPUT);

        let error = ServerError::MethodNotFound("unknown_method".to_string());
        assert_eq!(error.code(), ErrorCode::FILE_NOT_FOUND);
    }

    #[test]
    fn test_user_messages() {
        let error = ServerError::GitHub("rate limit exceeded".to_string());
        let msg = error.user_message();
        assert!(msg.contains("GitHub API"));
        assert!(msg.contains("rate limit exceeded"));

        let error = ServerError::MethodNotFound("tools/list".to_string());
        let msg = error.user_message();
        assert!(msg.contains("tools/list"));
        assert!(msg.contains("not found"));

        let error = ServerError::InvalidRequest("missing parameter".to_string());
        let msg = error.user_message();
        assert!(msg.contains("Invalid request"));
        assert!(msg.contains("missing parameter"));
    }

    #[test]
    fn test_context_extraction() {
        let error = ServerError::GitHub("error".to_string());
        assert!(error.context().is_some());

        let error = ServerError::MethodNotFound("method".to_string());
        assert!(error.context().is_some());

        let error = ServerError::Io(std::io::Error::other("test"));
        assert!(error.context().is_none());
    }
}
