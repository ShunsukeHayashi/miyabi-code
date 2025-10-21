//! Error types for A2A protocol

use thiserror::Error;

/// Result type alias for A2A operations
pub type A2AResult<T> = Result<T, A2AError>;

/// Errors that can occur during A2A operations
#[derive(Debug, Error)]
pub enum A2AError {
    /// Task not found
    #[error("Task not found: {0}")]
    TaskNotFound(String),

    /// Invalid request parameters
    #[error("Invalid request: {0}")]
    InvalidRequest(String),

    /// Internal server error
    #[error("Internal error: {0}")]
    InternalError(String),

    /// Storage error
    #[error("Storage error: {0}")]
    StorageError(#[from] crate::storage::StorageError),

    /// Serialization/deserialization error
    #[error("Serialization error: {0}")]
    SerdeError(#[from] serde_json::Error),

    /// HTTP client error
    #[error("HTTP error: {0}")]
    HttpError(String),

    /// Authentication error
    #[error("Authentication failed: {0}")]
    AuthenticationFailed(String),

    /// Unauthorized access
    #[error("Unauthorized")]
    Unauthorized,

    /// Task already in terminal state
    #[error("Task already in terminal state")]
    TaskAlreadyTerminal,

    /// Webhook delivery failure
    #[error("Webhook delivery failed: {0}")]
    WebhookDeliveryFailed(String),
}

// Convert from reqwest::Error
impl From<reqwest::Error> for A2AError {
    fn from(err: reqwest::Error) -> Self {
        A2AError::HttpError(err.to_string())
    }
}
