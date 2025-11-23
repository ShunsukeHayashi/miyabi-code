//! Error types for session manager

use miyabi_types::error::{ErrorCode, UnifiedError};
use std::any::Any;
use thiserror::Error;
use uuid::Uuid;

/// Session manager error types
#[derive(Error, Debug)]
pub enum SessionError {
    #[error("Session not found: {0}")]
    NotFound(Uuid),

    #[error("Session already exists: {0}")]
    AlreadyExists(Uuid),

    #[error("Failed to spawn process: {0}")]
    SpawnFailed(#[from] std::io::Error),

    #[error("Storage error: {0}")]
    StorageError(String),

    #[error("Invalid session state: {0}")]
    InvalidState(String),

    #[error("Other error: {0}")]
    Other(#[from] anyhow::Error),
}

pub type Result<T> = std::result::Result<T, SessionError>;

// ============================================================================
// UnifiedError Implementation
// ============================================================================

impl UnifiedError for SessionError {
    fn code(&self) -> ErrorCode {
        match self {
            Self::NotFound(_) => ErrorCode::FILE_NOT_FOUND,
            Self::AlreadyExists(_) => ErrorCode::VALIDATION_ERROR,
            Self::SpawnFailed(e) => match e.kind() {
                std::io::ErrorKind::NotFound => ErrorCode::FILE_NOT_FOUND,
                std::io::ErrorKind::PermissionDenied => ErrorCode::PERMISSION_DENIED,
                _ => ErrorCode::PROCESS_ERROR,
            },
            Self::StorageError(_) => ErrorCode::STORAGE_ERROR,
            Self::InvalidState(_) => ErrorCode::UNEXPECTED_STATE,
            Self::Other(_) => ErrorCode::INTERNAL_ERROR,
        }
    }

    fn user_message(&self) -> String {
        match self {
            Self::NotFound(uuid) => format!(
                "Session '{}' was not found. The session may have been terminated or never created.",
                uuid
            ),
            Self::AlreadyExists(uuid) => format!(
                "Session '{}' already exists. Please use a different session ID or terminate the existing session first.",
                uuid
            ),
            Self::SpawnFailed(e) => format!(
                "Failed to spawn session process: {}. Please ensure you have necessary permissions and system resources.",
                e
            ),
            Self::StorageError(msg) => format!(
                "Session storage error: {}. Please check your storage configuration and available disk space.",
                msg
            ),
            Self::InvalidState(msg) => format!(
                "Invalid session state: {}. The session may be in an unexpected state.",
                msg
            ),
            // Reuse existing thiserror messages for other variants
            _ => self.to_string(),
        }
    }

    fn context(&self) -> Option<&dyn Any> {
        match self {
            Self::NotFound(uuid) => Some(uuid as &dyn Any),
            Self::AlreadyExists(uuid) => Some(uuid as &dyn Any),
            Self::StorageError(msg) => Some(msg as &dyn Any),
            Self::InvalidState(msg) => Some(msg as &dyn Any),
            _ => None,
        }
    }
}

#[cfg(test)]
mod unified_error_tests {
    use super::*;

    #[test]
    fn test_session_error_codes() {
        let uuid = Uuid::new_v4();
        let error = SessionError::NotFound(uuid);
        assert_eq!(error.code(), ErrorCode::FILE_NOT_FOUND);

        let error = SessionError::AlreadyExists(uuid);
        assert_eq!(error.code(), ErrorCode::VALIDATION_ERROR);

        let error = SessionError::SpawnFailed(std::io::Error::other("test"));
        assert_eq!(error.code(), ErrorCode::PROCESS_ERROR);

        let error = SessionError::StorageError("test".to_string());
        assert_eq!(error.code(), ErrorCode::STORAGE_ERROR);

        let error = SessionError::InvalidState("test".to_string());
        assert_eq!(error.code(), ErrorCode::UNEXPECTED_STATE);
    }

    #[test]
    fn test_user_messages() {
        let uuid = Uuid::new_v4();
        let error = SessionError::NotFound(uuid);
        let msg = error.user_message();
        assert!(msg.contains(&uuid.to_string()));
        assert!(msg.contains("not found"));

        let error = SessionError::AlreadyExists(uuid);
        let msg = error.user_message();
        assert!(msg.contains(&uuid.to_string()));
        assert!(msg.contains("already exists"));

        let error = SessionError::StorageError("disk full".to_string());
        let msg = error.user_message();
        assert!(msg.contains("disk full"));
        assert!(msg.contains("storage"));
    }

    #[test]
    fn test_context_extraction() {
        let uuid = Uuid::new_v4();
        let error = SessionError::NotFound(uuid);
        assert!(error.context().is_some());

        let error = SessionError::AlreadyExists(uuid);
        assert!(error.context().is_some());

        let error = SessionError::StorageError("error".to_string());
        assert!(error.context().is_some());

        let error = SessionError::SpawnFailed(std::io::Error::other("test"));
        assert!(error.context().is_none());
    }
}
