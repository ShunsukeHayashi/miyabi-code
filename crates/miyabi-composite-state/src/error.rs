//! Error types for Composite State

use thiserror::Error;

pub type Result<T> = std::result::Result<T, CompositeStateError>;

#[derive(Debug, Error)]
pub enum CompositeStateError {
    #[error("State sync failed: {0}")]
    SyncFailed(String),

    #[error("Version conflict: {0}")]
    VersionConflict(String),

    #[error("Source unavailable: {0}")]
    SourceUnavailable(String),

    #[error(transparent)]
    Other(#[from] anyhow::Error),
}
