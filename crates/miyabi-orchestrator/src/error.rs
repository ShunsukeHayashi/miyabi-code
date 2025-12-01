//! Error types for miyabi-scheduler

use miyabi_types::error::{ErrorCode, UnifiedError};
use std::any::Any;
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
    ParseFailed { path: PathBuf, source: serde_json::Error },

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

    /// Command execution failed
    #[error("Command '{command}' failed: {stderr}")]
    CommandFailed { command: String, stderr: String },

    /// Invalid priority value
    #[error("Invalid priority value: {0} (must be 0-100)")]
    InvalidPriority(u8),
}

// ============================================================================
// UnifiedError Implementation
// ============================================================================

impl UnifiedError for SchedulerError {
    fn code(&self) -> ErrorCode {
        match self {
            Self::SpawnFailed(_) => ErrorCode::PROCESS_ERROR,
            Self::SessionNotFound(_) => ErrorCode::FILE_NOT_FOUND,
            Self::ParseFailed { .. } => ErrorCode::PARSE_ERROR,
            Self::Timeout(_) => ErrorCode::TIMEOUT_ERROR,
            Self::Io(e) => match e.kind() {
                io::ErrorKind::NotFound => ErrorCode::FILE_NOT_FOUND,
                io::ErrorKind::PermissionDenied => ErrorCode::PERMISSION_DENIED,
                _ => ErrorCode::IO_ERROR,
            },
            Self::InvalidConfig(_) => ErrorCode::INVALID_CONFIG,
            Self::ProcessFailed { .. } => ErrorCode::PROCESS_ERROR,
            Self::CommandFailed { .. } => ErrorCode::COMMAND_ERROR,
            Self::InvalidPriority(_) => ErrorCode::INVALID_INPUT,
        }
    }

    fn user_message(&self) -> String {
        match self {
            Self::SpawnFailed(e) => format!(
                "Failed to start Claude Code process: {}. Please ensure Claude Code is installed and accessible in your PATH.",
                e
            ),
            Self::SessionNotFound(session_id) => format!(
                "Session '{}' was not found. The session may have been terminated or never created.",
                session_id
            ),
            Self::Timeout(seconds) => format!(
                "Operation timed out after {} seconds. The operation may be taking longer than expected or the system may be overloaded.",
                seconds
            ),
            Self::ProcessFailed { code, stderr } => format!(
                "Process execution failed with exit code {}. Error output: {}",
                code, stderr
            ),
            Self::CommandFailed { command, stderr } => format!(
                "Command '{}' failed to execute. Error output: {}",
                command, stderr
            ),
            Self::InvalidConfig(msg) => format!(
                "Configuration error: {}. Please check your orchestrator configuration settings.",
                msg
            ),
            // Reuse existing thiserror messages for other variants
            _ => self.to_string(),
        }
    }

    fn context(&self) -> Option<&dyn Any> {
        match self {
            Self::SessionNotFound(session_id) => Some(session_id as &dyn Any),
            Self::ParseFailed { path, .. } => Some(path as &dyn Any),
            Self::Timeout(seconds) => Some(seconds as &dyn Any),
            Self::ProcessFailed { code, .. } => Some(code as &dyn Any),
            Self::CommandFailed { command, .. } => Some(command as &dyn Any),
            _ => None,
        }
    }
}

#[cfg(test)]
mod unified_error_tests {
    use super::*;

    #[test]
    fn test_scheduler_error_codes() {
        let error = SchedulerError::SpawnFailed(io::Error::other("test"));
        assert_eq!(error.code(), ErrorCode::PROCESS_ERROR);

        let error = SchedulerError::SessionNotFound("test-session".to_string());
        assert_eq!(error.code(), ErrorCode::FILE_NOT_FOUND);

        let error = SchedulerError::Timeout(30);
        assert_eq!(error.code(), ErrorCode::TIMEOUT_ERROR);

        let error = SchedulerError::ProcessFailed { code: 1, stderr: "error".to_string() };
        assert_eq!(error.code(), ErrorCode::PROCESS_ERROR);

        let error = SchedulerError::CommandFailed { command: "test".to_string(), stderr: "error".to_string() };
        assert_eq!(error.code(), ErrorCode::COMMAND_ERROR);
    }

    #[test]
    fn test_user_messages() {
        let error = SchedulerError::SessionNotFound("my-session".to_string());
        let msg = error.user_message();
        assert!(msg.contains("my-session"));
        assert!(msg.contains("not found"));

        let error = SchedulerError::Timeout(60);
        let msg = error.user_message();
        assert!(msg.contains("60 seconds"));
        assert!(msg.contains("timed out"));

        let error = SchedulerError::ProcessFailed { code: 127, stderr: "command not found".to_string() };
        let msg = error.user_message();
        assert!(msg.contains("127"));
        assert!(msg.contains("command not found"));
    }

    #[test]
    fn test_context_extraction() {
        let error = SchedulerError::SessionNotFound("test".to_string());
        assert!(error.context().is_some());

        let error = SchedulerError::Timeout(30);
        assert!(error.context().is_some());

        let error = SchedulerError::SpawnFailed(io::Error::other("test"));
        assert!(error.context().is_none());

        let error = SchedulerError::ProcessFailed { code: 1, stderr: "error".to_string() };
        assert!(error.context().is_some());

        let error = SchedulerError::CommandFailed { command: "test".to_string(), stderr: "error".to_string() };
        assert!(error.context().is_some());
    }
}
