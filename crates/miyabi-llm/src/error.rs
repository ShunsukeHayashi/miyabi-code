//! Error types for LLM operations

use thiserror::Error;

/// Result type for LLM operations
pub type Result<T> = std::result::Result<T, LLMError>;

/// LLM operation errors
#[derive(Error, Debug)]
pub enum LLMError {
    /// HTTP request failed
    #[error("HTTP request failed: {0}")]
    HttpError(#[from] reqwest::Error),

    /// JSON serialization/deserialization failed
    #[error("JSON error: {0}")]
    JsonError(#[from] serde_json::Error),

    /// API key not provided
    #[error("API key required but not provided")]
    MissingApiKey,

    /// Invalid endpoint URL
    #[error("Invalid endpoint URL: {0}")]
    InvalidEndpoint(String),

    /// API returned an error
    #[error("API error: {0}")]
    ApiError(String),

    /// Response parsing failed
    #[error("Failed to parse response: {0}")]
    ParseError(String),

    /// Timeout waiting for response
    #[error("Request timeout after {0}ms")]
    Timeout(u64),

    /// Rate limit exceeded
    #[error("Rate limit exceeded: {0}")]
    RateLimitExceeded(String),

    /// Model not available
    #[error("Model not available: {0}")]
    ModelNotAvailable(String),

    /// Prompt template error
    #[error("Prompt error: {0}")]
    PromptError(String),

    /// Unknown error
    #[error("Unknown error: {0}")]
    Unknown(String),
}

impl From<crate::prompt::PromptError> for LLMError {
    fn from(err: crate::prompt::PromptError) -> Self {
        LLMError::PromptError(err.to_string())
    }
}

impl From<LLMError> for miyabi_types::error::MiyabiError {
    fn from(err: LLMError) -> Self {
        miyabi_types::error::MiyabiError::Unknown(err.to_string())
    }
}
