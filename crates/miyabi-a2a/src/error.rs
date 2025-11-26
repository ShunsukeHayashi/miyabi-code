//! Error types for A2A protocol

use miyabi_types::error::{ErrorCode, UnifiedError};
use std::any::Any;
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

// ============================================================================
// UnifiedError Implementation
// ============================================================================

impl UnifiedError for A2AError {
    fn code(&self) -> ErrorCode {
        match self {
            Self::TaskNotFound(_) => ErrorCode::FILE_NOT_FOUND,
            Self::InvalidRequest(_) => ErrorCode::INVALID_INPUT,
            Self::InternalError(_) => ErrorCode::INTERNAL_ERROR,
            Self::StorageError(_) => ErrorCode::STORAGE_ERROR,
            Self::SerdeError(_) => ErrorCode::PARSE_ERROR,
            Self::HttpError(_) => ErrorCode::HTTP_ERROR,
            Self::AuthenticationFailed(_) => ErrorCode::AUTH_ERROR,
            Self::Unauthorized => ErrorCode::AUTH_ERROR,
            Self::TaskAlreadyTerminal => ErrorCode::UNEXPECTED_STATE,
            Self::WebhookDeliveryFailed(_) => ErrorCode::HTTP_ERROR,
        }
    }

    fn user_message(&self) -> String {
        match self {
            Self::TaskNotFound(task_id) => format!(
                "Task '{}' not found. The task may have been deleted or never existed.",
                task_id
            ),
            Self::InvalidRequest(msg) => {
                format!(
                    "Invalid A2A request: {}. Please check your request parameters.",
                    msg
                )
            }
            Self::InternalError(msg) => format!(
                "Internal A2A protocol error: {}. Please try again or contact support.",
                msg
            ),
            Self::HttpError(msg) => {
                format!(
                    "HTTP communication error: {}. Please check network connectivity.",
                    msg
                )
            }
            Self::AuthenticationFailed(msg) => {
                format!(
                    "A2A authentication failed: {}. Please verify your credentials.",
                    msg
                )
            }
            Self::Unauthorized => {
                "Unauthorized access to A2A task. Please check your permissions.".to_string()
            }
            Self::TaskAlreadyTerminal => {
                "Task is already in a terminal state and cannot be modified.".to_string()
            }
            Self::WebhookDeliveryFailed(msg) => format!(
                "Failed to deliver webhook notification: {}. The remote server may be unavailable.",
                msg
            ),
            // Reuse existing thiserror messages for other variants
            _ => self.to_string(),
        }
    }

    fn context(&self) -> Option<&dyn Any> {
        match self {
            Self::TaskNotFound(task_id) => Some(task_id as &dyn Any),
            Self::InvalidRequest(msg) => Some(msg as &dyn Any),
            Self::InternalError(msg) => Some(msg as &dyn Any),
            Self::HttpError(msg) => Some(msg as &dyn Any),
            Self::AuthenticationFailed(msg) => Some(msg as &dyn Any),
            Self::WebhookDeliveryFailed(msg) => Some(msg as &dyn Any),
            _ => None,
        }
    }
}

#[cfg(test)]
mod unified_error_tests {
    use super::*;

    #[test]
    fn test_a2a_error_codes() {
        let error = A2AError::TaskNotFound("task-123".to_string());
        assert_eq!(error.code(), ErrorCode::FILE_NOT_FOUND);

        let error = A2AError::InvalidRequest("bad params".to_string());
        assert_eq!(error.code(), ErrorCode::INVALID_INPUT);

        let error = A2AError::AuthenticationFailed("invalid token".to_string());
        assert_eq!(error.code(), ErrorCode::AUTH_ERROR);

        let error = A2AError::Unauthorized;
        assert_eq!(error.code(), ErrorCode::AUTH_ERROR);

        let error = A2AError::TaskAlreadyTerminal;
        assert_eq!(error.code(), ErrorCode::UNEXPECTED_STATE);
    }

    #[test]
    fn test_user_messages() {
        let error = A2AError::TaskNotFound("task-456".to_string());
        let msg = error.user_message();
        assert!(msg.contains("task-456"));
        assert!(msg.contains("not found"));

        let error = A2AError::Unauthorized;
        let msg = error.user_message();
        assert!(msg.contains("Unauthorized"));
        assert!(msg.contains("permissions"));

        let error = A2AError::WebhookDeliveryFailed("connection timeout".to_string());
        let msg = error.user_message();
        assert!(msg.contains("webhook"));
        assert!(msg.contains("connection timeout"));
    }

    #[test]
    fn test_context_extraction() {
        let error = A2AError::TaskNotFound("task".to_string());
        assert!(error.context().is_some());

        let error = A2AError::InvalidRequest("error".to_string());
        assert!(error.context().is_some());

        let error = A2AError::Unauthorized;
        assert!(error.context().is_none());

        let error = A2AError::TaskAlreadyTerminal;
        assert!(error.context().is_none());
    }
}
