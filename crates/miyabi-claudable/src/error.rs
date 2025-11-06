//! Error types for Claudable API client

use thiserror::Error;
use miyabi_types::error::{ErrorCode, UnifiedError};
use std::any::Any;

/// Claudable client error types
#[derive(Debug, Error)]
pub enum ClaudableError {
    /// HTTP request failed
    #[error("HTTP request failed: {0}")]
    HttpError(#[from] reqwest::Error),

    /// Claudable API returned an error response
    #[error("Claudable API error {0}: {1}")]
    ApiError(u16, String),

    /// Failed to parse response
    #[error("Invalid response format: {0}")]
    ParseError(String),

    /// IO error during file operations
    #[error("IO error: {0}")]
    IoError(#[from] std::io::Error),

    /// npm install failed
    #[error("npm install failed: {0}")]
    NpmInstallError(String),

    /// Next.js build failed
    #[error("Next.js build failed: {0}")]
    BuildError(String),

    /// Timeout waiting for response
    #[error("Request timeout after {0}ms")]
    Timeout(u64),

    /// Configuration error
    #[error("Configuration error: {0}")]
    ConfigError(String),
}

/// Result type alias for Claudable operations
pub type Result<T> = std::result::Result<T, ClaudableError>;

// ============================================================================
// UnifiedError Implementation
// ============================================================================

impl UnifiedError for ClaudableError {
    fn code(&self) -> ErrorCode {
        match self {
            Self::HttpError(_) => ErrorCode::HTTP_ERROR,
            Self::ApiError(_, _) => ErrorCode::HTTP_ERROR,
            Self::ParseError(_) => ErrorCode::PARSE_ERROR,
            Self::IoError(e) => match e.kind() {
                std::io::ErrorKind::NotFound => ErrorCode::FILE_NOT_FOUND,
                std::io::ErrorKind::PermissionDenied => ErrorCode::PERMISSION_DENIED,
                _ => ErrorCode::IO_ERROR,
            },
            Self::NpmInstallError(_) => ErrorCode::PROCESS_ERROR,
            Self::BuildError(_) => ErrorCode::PROCESS_ERROR,
            Self::Timeout(_) => ErrorCode::TIMEOUT_ERROR,
            Self::ConfigError(_) => ErrorCode::CONFIG_ERROR,
        }
    }

    fn user_message(&self) -> String {
        match self {
            Self::HttpError(e) => format!(
                "Failed to communicate with Claudable API: {}. Please check your network connection and try again.",
                e
            ),
            Self::ApiError(status, msg) => format!(
                "Claudable API returned error {}: {}. Please check the API documentation or contact support.",
                status, msg
            ),
            Self::Timeout(ms) => format!(
                "Request to Claudable timed out after {}ms. The service may be experiencing high load. Please try again.",
                ms
            ),
            Self::NpmInstallError(msg) => format!(
                "Failed to install npm dependencies: {}. Please ensure npm is installed and you have necessary permissions.",
                msg
            ),
            Self::BuildError(msg) => format!(
                "Next.js build failed: {}. Please check your configuration and dependencies.",
                msg
            ),
            Self::ConfigError(msg) => format!(
                "Configuration error: {}. Please verify your Claudable settings.",
                msg
            ),
            // Reuse existing thiserror messages for other variants
            _ => self.to_string(),
        }
    }

    fn context(&self) -> Option<&dyn Any> {
        match self {
            Self::ApiError(status, _) => Some(status as &dyn Any),
            Self::Timeout(ms) => Some(ms as &dyn Any),
            Self::NpmInstallError(msg) => Some(msg as &dyn Any),
            Self::BuildError(msg) => Some(msg as &dyn Any),
            _ => None,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_error_display() {
        let error = ClaudableError::ApiError(404, "Not Found".to_string());
        assert_eq!(error.to_string(), "Claudable API error 404: Not Found");
    }

    #[test]
    fn test_timeout_error() {
        let error = ClaudableError::Timeout(30000);
        assert_eq!(error.to_string(), "Request timeout after 30000ms");
    }

    #[test]
    fn test_npm_install_error() {
        let error = ClaudableError::NpmInstallError("EACCES: permission denied".to_string());
        assert!(error.to_string().contains("npm install failed"));
    }

    #[test]
    fn test_claudable_error_codes() {
        let error = ClaudableError::ApiError(404, "Not Found".to_string());
        assert_eq!(error.code(), ErrorCode::HTTP_ERROR);

        let error = ClaudableError::Timeout(30000);
        assert_eq!(error.code(), ErrorCode::TIMEOUT_ERROR);

        let error = ClaudableError::NpmInstallError("error".to_string());
        assert_eq!(error.code(), ErrorCode::PROCESS_ERROR);

        let error = ClaudableError::BuildError("error".to_string());
        assert_eq!(error.code(), ErrorCode::PROCESS_ERROR);
    }

    #[test]
    fn test_user_messages() {
        let error = ClaudableError::ApiError(500, "Internal Server Error".to_string());
        let msg = error.user_message();
        assert!(msg.contains("500"));
        assert!(msg.contains("Internal Server Error"));

        let error = ClaudableError::Timeout(5000);
        let msg = error.user_message();
        assert!(msg.contains("5000ms"));
        assert!(msg.contains("timed out"));

        let error = ClaudableError::NpmInstallError("EACCES".to_string());
        let msg = error.user_message();
        assert!(msg.contains("npm dependencies"));
        assert!(msg.contains("EACCES"));
    }

    #[test]
    fn test_context_extraction() {
        let error = ClaudableError::ApiError(404, "Not Found".to_string());
        assert!(error.context().is_some());

        let error = ClaudableError::Timeout(30000);
        assert!(error.context().is_some());

        let error = ClaudableError::NpmInstallError("error".to_string());
        assert!(error.context().is_some());

        let error = ClaudableError::ParseError("invalid JSON".to_string());
        assert!(error.context().is_none());
    }
}
