//! Error types for miyabi-scheduler

use std::io;
use std::path::PathBuf;
use thiserror::Error;

/// Result type alias for scheduler operations
pub type Result<T> = std::result::Result<T, SchedulerError>;

/// Errors that can occur during scheduling operations
#[derive(Error, Debug)]
pub enum SchedulerError {
    /// Failed to spawn Claude Code process
    #[error("Failed to spawn Claude Code process: {0}")]
    SpawnFailed(#[source] io::Error),

    /// Session not found
    #[error("Session not found: {0}")]
    SessionNotFound(String),

    /// Failed to parse result
    #[error("Failed to parse result from {path}: {source}")]
    ParseFailed {
        path: PathBuf,
        source: serde_json::Error,
    },

    /// Session timeout
    #[error("Session timed out after {0} seconds")]
    Timeout(u64),

    /// IO error
    #[error("IO error: {0}")]
    Io(#[from] io::Error),

    /// Invalid configuration
    #[error("Invalid configuration: {0}")]
    InvalidConfig(String),

    /// Process execution failed
    #[error("Process execution failed with exit code {code}: {stderr}")]
    ProcessFailed { code: i32, stderr: String },
}
