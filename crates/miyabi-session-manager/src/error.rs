//! Error types for session manager

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
