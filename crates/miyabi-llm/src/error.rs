//! Error types for LLM operations

use thiserror::Error;

#[derive(Debug, Error)]
pub enum LlmError {
    #[error("HTTP request failed: {0}")]
    HttpError(#[from] reqwest::Error),

    #[error("JSON parsing failed: {0}")]
    JsonError(#[from] serde_json::Error),

    #[error("API error: {0}")]
    ApiError(String),

    #[error("Invalid response: {0}")]
    InvalidResponse(String),

    #[error("Tool execution failed: {0}")]
    ToolExecutionError(String),

    #[error("Configuration error: {0}")]
    ConfigError(String),

    #[error("IO error: {0}")]
    IoError(#[from] std::io::Error),

    #[error("Prompt error: {0}")]
    PromptError(#[from] crate::prompt::PromptError),

    #[error("Invalid endpoint: {0}")]
    InvalidEndpoint(String),

    #[error("Parse error: {0}")]
    ParseError(String),

    #[error("Request timeout after {0}ms")]
    Timeout(u64),

    #[error("All providers unavailable")]
    AllProvidersUnavailable,

    #[error("Unknown error: {0}")]
    Unknown(String),

    #[error("Missing API key")]
    MissingApiKey,
}

pub type Result<T> = std::result::Result<T, LlmError>;

// Backward compatibility alias for legacy code
pub use LlmError as LLMError;
