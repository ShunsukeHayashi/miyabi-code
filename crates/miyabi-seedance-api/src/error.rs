//! Error types for Seedance API

use thiserror::Error;

/// Seedance API error types
#[derive(Debug, Error)]
pub enum SeedanceError {
    /// HTTP request failed
    #[error("HTTP request failed: {0}")]
    HttpError(#[from] reqwest::Error),

    /// API returned an error
    #[error("API error: {0}")]
    ApiError(String),

    /// Task creation failed
    #[error("Task creation failed: {0}")]
    TaskCreationFailed(String),

    /// Task polling timeout
    #[error("Task polling timeout after {0} seconds")]
    PollingTimeout(u64),

    /// Invalid task status
    #[error("Invalid task status: {0}")]
    InvalidTaskStatus(String),

    /// JSON serialization/deserialization error
    #[error("JSON error: {0}")]
    JsonError(#[from] serde_json::Error),

    /// Missing API key
    #[error("API key not provided")]
    MissingApiKey,

    /// Invalid API response
    #[error("Invalid API response: {0}")]
    InvalidResponse(String),
}

/// Result type for Seedance API operations
pub type Result<T> = std::result::Result<T, SeedanceError>;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_error_display() {
        let error = SeedanceError::ApiError("test error".to_string());
        assert_eq!(error.to_string(), "API error: test error");
    }

    #[test]
    fn test_missing_api_key() {
        let error = SeedanceError::MissingApiKey;
        assert_eq!(error.to_string(), "API key not provided");
    }

    #[test]
    fn test_polling_timeout() {
        let error = SeedanceError::PollingTimeout(300);
        assert_eq!(error.to_string(), "Task polling timeout after 300 seconds");
    }
}
