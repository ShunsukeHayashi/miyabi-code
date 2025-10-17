//! Error types for Potpie integration

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
        matches!(
            self,
            PotpieError::ServiceUnavailable(_)
                | PotpieError::Timeout(_)
                | PotpieError::HttpError(_)
        )
    }

    /// Check if fallback to Git should be used
    pub fn should_fallback_to_git(&self) -> bool {
        matches!(
            self,
            PotpieError::ServiceUnavailable(_)
                | PotpieError::Timeout(_)
                | PotpieError::ConfigError(_)
        )
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
}
