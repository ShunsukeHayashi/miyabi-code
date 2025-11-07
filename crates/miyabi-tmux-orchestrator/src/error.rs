//! Error types for tmux orchestration

use thiserror::Error;

/// Tmux orchestration error types
#[derive(Debug, Error)]
pub enum TmuxError {
    /// Session creation failed
    #[error("Session creation failed: {0}")]
    SessionCreationFailed(String),

    /// Pane creation failed
    #[error("Pane creation failed: {0}")]
    PaneCreationFailed(String),

    /// Agent startup failed
    #[error("Agent startup failed: {0}")]
    AgentStartupFailed(String),

    /// Command execution failed
    #[error("Command execution failed: {0}")]
    CommandExecutionFailed(String),

    /// Pane not found
    #[error("Pane not found: {0}")]
    PaneNotFound(String),

    /// Session not found
    #[error("Session not found: {0}")]
    SessionNotFound(String),

    /// Invalid pane ID
    #[error("Invalid pane ID: {0}")]
    InvalidPaneId(String),

    /// IO error
    #[error("IO error: {0}")]
    IoError(#[from] std::io::Error),
}

/// Result type for tmux operations
pub type Result<T> = std::result::Result<T, TmuxError>;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_error_display() {
        let error = TmuxError::SessionCreationFailed("test session".to_string());
        assert_eq!(error.to_string(), "Session creation failed: test session");
    }

    #[test]
    fn test_pane_not_found() {
        let error = TmuxError::PaneNotFound("%1".to_string());
        assert_eq!(error.to_string(), "Pane not found: %1");
    }
}
