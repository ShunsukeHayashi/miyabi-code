//! Error types for Claudable API client

use thiserror::Error;

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
}
