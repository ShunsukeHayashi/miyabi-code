//! Error types for Potpie integration

use miyabi_types::error::{ErrorCode, UnifiedError};
use std::any::Any;
use thiserror::Error;

/// Result type for Potpie operations
pub type Result<T> = std::result::Result<T, PotpieError>;

/// Error types for Potpie API operations
#[derive(Debug, Error)]
pub enum PotpieError {
    /// HTTP request failed
    #[error("HTTP request failed: {0}")]
    HttpError(#[from] reqwest::Error),

    /// API returned error response
    #[error("API error: {status} - {message}")]
    ApiError {
        /// HTTP status code
        status: u16,
        /// Error message
        message: String,
    },

    /// JSON serialization/deserialization failed
    #[error("JSON error: {0}")]
    JsonError(#[from] serde_json::Error),

    /// Invalid configuration
    #[error("Invalid configuration: {0}")]
    ConfigError(String),

    /// Potpie service unavailable (fallback to Git recommended)
    #[error("Potpie service unavailable: {0}")]
    ServiceUnavailable(String),

    /// Timeout during API call
    #[error("Request timeout after {0}s")]
    Timeout(u64),

    /// Authentication failed
    #[error("Authentication failed: {0}")]
    AuthError(String),

    /// Invalid response from API
    #[error("Invalid response: {0}")]
    InvalidResponse(String),
}

impl PotpieError {
    /// Check if error is retryable
    pub fn is_retryable(&self) -> bool {
        matches!(self, PotpieError::ServiceUnavailable(_) | PotpieError::Timeout(_) | PotpieError::HttpError(_))
    }

    /// Check if fallback to Git should be used
    pub fn should_fallback_to_git(&self) -> bool {
        matches!(self, PotpieError::ServiceUnavailable(_) | PotpieError::Timeout(_) | PotpieError::ConfigError(_))
    }
}

// ============================================================================
// UnifiedError Implementation
// ============================================================================

impl UnifiedError for PotpieError {
    fn code(&self) -> ErrorCode {
        match self {
            Self::HttpError(_) => ErrorCode::HTTP_ERROR,
            Self::ApiError { .. } => ErrorCode::HTTP_ERROR,
            Self::JsonError(_) => ErrorCode::PARSE_ERROR,
            Self::ConfigError(_) => ErrorCode::CONFIG_ERROR,
            Self::ServiceUnavailable(_) => ErrorCode::HTTP_ERROR,
            Self::Timeout(_) => ErrorCode::TIMEOUT_ERROR,
            Self::AuthError(_) => ErrorCode::AUTH_ERROR,
            Self::InvalidResponse(_) => ErrorCode::PARSE_ERROR,
        }
    }

    fn user_message(&self) -> String {
        match self {
            Self::ApiError { status, message } => format!(
                "Potpie API returned error {}: {}. Please check your API configuration or contact Potpie support.",
                status, message
            ),
            Self::ConfigError(msg) => format!(
                "Potpie configuration error: {}. Please verify your Potpie API key and settings.",
                msg
            ),
            Self::ServiceUnavailable(msg) => format!(
                "Potpie service is currently unavailable: {}. Consider using Git fallback or try again later.",
                msg
            ),
            Self::Timeout(seconds) => format!(
                "Potpie API request timed out after {}s. The service may be experiencing high load. Try again or use Git fallback.",
                seconds
            ),
            Self::AuthError(msg) => format!(
                "Potpie authentication failed: {}. Please check your API key and permissions.",
                msg
            ),
            Self::InvalidResponse(msg) => format!(
                "Received invalid response from Potpie API: {}. Please try again or report this issue.",
                msg
            ),
            // Reuse existing thiserror messages for other variants
            _ => self.to_string(),
        }
    }

    fn context(&self) -> Option<&dyn Any> {
        match self {
            Self::ApiError { status, .. } => Some(status as &dyn Any),
            Self::ConfigError(msg) => Some(msg as &dyn Any),
            Self::ServiceUnavailable(msg) => Some(msg as &dyn Any),
            Self::Timeout(seconds) => Some(seconds as &dyn Any),
            Self::AuthError(msg) => Some(msg as &dyn Any),
            Self::InvalidResponse(msg) => Some(msg as &dyn Any),
            _ => None,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_is_retryable() {
        assert!(PotpieError::ServiceUnavailable("test".to_string()).is_retryable());
        assert!(PotpieError::Timeout(30).is_retryable());
        assert!(!PotpieError::AuthError("test".to_string()).is_retryable());
    }

    #[test]
    fn test_should_fallback_to_git() {
        assert!(PotpieError::ServiceUnavailable("test".to_string()).should_fallback_to_git());
        assert!(PotpieError::Timeout(30).should_fallback_to_git());
        assert!(PotpieError::ConfigError("test".to_string()).should_fallback_to_git());
        assert!(!PotpieError::AuthError("test".to_string()).should_fallback_to_git());
    }

    #[test]
    fn test_potpie_error_codes() {
        let error = PotpieError::ApiError { status: 404, message: "Not Found".to_string() };
        assert_eq!(error.code(), ErrorCode::HTTP_ERROR);

        let error = PotpieError::Timeout(30);
        assert_eq!(error.code(), ErrorCode::TIMEOUT_ERROR);

        let error = PotpieError::AuthError("invalid key".to_string());
        assert_eq!(error.code(), ErrorCode::AUTH_ERROR);

        let error = PotpieError::ConfigError("missing key".to_string());
        assert_eq!(error.code(), ErrorCode::CONFIG_ERROR);
    }

    #[test]
    fn test_user_messages() {
        let error = PotpieError::ApiError { status: 500, message: "Internal Server Error".to_string() };
        let msg = error.user_message();
        assert!(msg.contains("500"));
        assert!(msg.contains("Internal Server Error"));

        let error = PotpieError::Timeout(60);
        let msg = error.user_message();
        assert!(msg.contains("60s"));
        assert!(msg.contains("timed out"));

        let error = PotpieError::ServiceUnavailable("maintenance".to_string());
        let msg = error.user_message();
        assert!(msg.contains("unavailable"));
        assert!(msg.contains("maintenance"));
    }

    #[test]
    fn test_context_extraction() {
        let error = PotpieError::ApiError { status: 404, message: "Not Found".to_string() };
        assert!(error.context().is_some());

        let error = PotpieError::Timeout(30);
        assert!(error.context().is_some());

        let error = PotpieError::AuthError("invalid".to_string());
        assert!(error.context().is_some());

        // Note: reqwest::Error cannot be constructed directly (private constructor)
        // HttpError context test is implicitly covered as it returns None from context()
    }
}
