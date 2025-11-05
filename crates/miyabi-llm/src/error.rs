//! Error types for LLM operations

use thiserror::Error;
use miyabi_types::error::{ErrorCode, UnifiedError};
use std::any::Any;

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

// ============================================================================
// UnifiedError Implementation
// ============================================================================

impl UnifiedError for LlmError {
    fn code(&self) -> ErrorCode {
        match self {
            Self::HttpError(_) => ErrorCode::HTTP_ERROR,
            Self::JsonError(_) => ErrorCode::PARSE_ERROR,
            Self::ApiError(_) => ErrorCode::HTTP_ERROR,
            Self::InvalidResponse(_) => ErrorCode::INVALID_FORMAT,
            Self::ToolExecutionError(_) => ErrorCode::TOOL_ERROR,
            Self::ConfigError(_) => ErrorCode::CONFIG_ERROR,
            Self::IoError(e) => match e.kind() {
                std::io::ErrorKind::NotFound => ErrorCode::FILE_NOT_FOUND,
                std::io::ErrorKind::PermissionDenied => ErrorCode::PERMISSION_DENIED,
                _ => ErrorCode::IO_ERROR,
            },
            Self::PromptError(_) => ErrorCode::VALIDATION_ERROR,
            Self::InvalidEndpoint(_) => ErrorCode::INVALID_CONFIG,
            Self::ParseError(_) => ErrorCode::PARSE_ERROR,
            Self::Timeout(_) => ErrorCode::TIMEOUT_ERROR,
            Self::AllProvidersUnavailable => ErrorCode::HTTP_ERROR,
            Self::Unknown(_) => ErrorCode::UNKNOWN_ERROR,
            Self::MissingApiKey => ErrorCode::AUTH_ERROR,
        }
    }

    fn user_message(&self) -> String {
        match self {
            Self::HttpError(e) => format!(
                "Failed to communicate with the LLM provider: {}. Please check your internet connection and try again.",
                e
            ),
            Self::AllProvidersUnavailable => {
                "All LLM providers are currently unavailable. Please check your API keys and provider status, then try again.".to_string()
            }
            Self::MissingApiKey => {
                "API key is missing. Please configure your LLM provider API key in the environment or configuration file.".to_string()
            }
            Self::Timeout(ms) => format!(
                "LLM request timed out after {}ms. The provider may be experiencing high load. Please try again.",
                ms
            ),
            Self::InvalidEndpoint(endpoint) => format!(
                "Invalid LLM endpoint: '{}'. Please check your provider configuration.",
                endpoint
            ),
            Self::ToolExecutionError(msg) => format!(
                "Tool execution failed: {}. Please review the tool implementation and inputs.",
                msg
            ),
            // Reuse existing thiserror messages for other variants
            _ => self.to_string(),
        }
    }

    fn context(&self) -> Option<&dyn Any> {
        match self {
            Self::InvalidEndpoint(endpoint) => Some(endpoint as &dyn Any),
            Self::Timeout(ms) => Some(ms as &dyn Any),
            _ => None,
        }
    }
}

#[cfg(test)]
mod unified_error_tests {
    use super::*;

    #[test]
    fn test_llm_error_codes() {
        let error = LlmError::MissingApiKey;
        assert_eq!(error.code(), ErrorCode::AUTH_ERROR);

        let error = LlmError::Timeout(30000);
        assert_eq!(error.code(), ErrorCode::TIMEOUT_ERROR);

        let error = LlmError::AllProvidersUnavailable;
        assert_eq!(error.code(), ErrorCode::HTTP_ERROR);
    }

    #[test]
    fn test_user_messages() {
        let error = LlmError::MissingApiKey;
        let msg = error.user_message();
        assert!(msg.contains("API key"));
        assert!(msg.contains("configure"));

        let error = LlmError::Timeout(5000);
        let msg = error.user_message();
        assert!(msg.contains("5000ms"));
        assert!(msg.contains("timed out"));
    }

    #[test]
    fn test_context_extraction() {
        let error = LlmError::InvalidEndpoint("https://invalid.api".to_string());
        assert!(error.context().is_some());

        let error = LlmError::Timeout(30000);
        assert!(error.context().is_some());

        let error = LlmError::MissingApiKey;
        assert!(error.context().is_none());
    }
}
