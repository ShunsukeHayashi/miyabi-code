//! Error types for LLM operations

use thiserror::Error;

/// Core LLM error type
#[derive(Debug, Error)]
pub enum LlmError {
    /// API error from provider
    #[error("API error: {0}")]
    ApiError(String),

    /// Invalid response from provider
    #[error("Invalid response: {0}")]
    InvalidResponse(String),

    /// Tool execution failed
    #[error("Tool execution failed: {0}")]
    ToolExecutionError(String),

    /// Configuration error
    #[error("Configuration error: {0}")]
    ConfigError(String),

    /// Invalid endpoint
    #[error("Invalid endpoint: {0}")]
    InvalidEndpoint(String),

    /// Parse error
    #[error("Parse error: {0}")]
    ParseError(String),

    /// Request timeout
    #[error("Request timeout after {0}ms")]
    Timeout(u64),

    /// All providers unavailable
    #[error("All providers unavailable")]
    AllProvidersUnavailable,

    /// Missing API key
    #[error("Missing API key for provider: {0}")]
    MissingApiKey(String),

    /// Network error (generic)
    #[error("Network error: {0}")]
    NetworkError(String),

    /// Serialization error (generic)
    #[error("Serialization error: {0}")]
    SerializationError(String),

    /// Unknown error
    #[error("Unknown error: {0}")]
    Unknown(String),
}

/// Result type for LLM operations
pub type Result<T> = std::result::Result<T, LlmError>;
