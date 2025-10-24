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
}

pub type Result<T> = std::result::Result<T, LlmError>;
