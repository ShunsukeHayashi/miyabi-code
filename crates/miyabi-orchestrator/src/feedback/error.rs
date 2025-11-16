//! Error types for feedback loop operations

use thiserror::Error;

/// Result type for feedback loop operations
pub type LoopResult<T> = Result<T, LoopError>;

/// Errors that can occur during feedback loop execution
#[derive(Error, Debug)]
pub enum LoopError {
    /// Goal not found
    #[error("Goal not found: {0}")]
    GoalNotFound(String),

    /// Goal validation failed
    #[error("Goal validation failed: {0}")]
    GoalValidationFailed(String),

    /// Iteration execution failed
    #[error("Iteration {iteration} failed: {reason}")]
    IterationFailed { iteration: usize, reason: String },

    /// Maximum retries exceeded
    #[error("Maximum retries ({max_retries}) exceeded for iteration {iteration}")]
    MaxRetriesExceeded {
        iteration: usize,
        max_retries: usize,
    },

    /// Timeout occurred
    #[error("Iteration {iteration} timed out after {timeout_ms}ms")]
    Timeout { iteration: usize, timeout_ms: u64 },

    /// Convergence check failed
    #[error("Convergence check failed: {0}")]
    ConvergenceFailed(String),

    /// Configuration error
    #[error("Configuration error: {0}")]
    ConfigError(String),

    /// Agent execution error
    #[error("Agent execution error: {0}")]
    AgentError(String),

    /// IO error
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    /// Serialization error
    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),

    /// Other error
    #[error("Other error: {0}")]
    Other(String),
}

impl LoopError {
    /// Check if error is retryable
    pub fn is_retryable(&self) -> bool {
        matches!(
            self,
            LoopError::IterationFailed { .. }
                | LoopError::Timeout { .. }
                | LoopError::AgentError(_)
        )
    }

    /// Get error severity (0-100, higher = more severe)
    pub fn severity(&self) -> u8 {
        match self {
            LoopError::GoalNotFound(_) => 90,
            LoopError::ConfigError(_) => 90,
            LoopError::MaxRetriesExceeded { .. } => 80,
            LoopError::GoalValidationFailed(_) => 70,
            LoopError::IterationFailed { .. } => 50,
            LoopError::Timeout { .. } => 40,
            LoopError::ConvergenceFailed(_) => 30,
            LoopError::AgentError(_) => 50,
            LoopError::Io(_) => 60,
            LoopError::Serialization(_) => 60,
            LoopError::Other(_) => 50,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_error_retryable() {
        let error = LoopError::IterationFailed {
            iteration: 1,
            reason: "test".to_string(),
        };
        assert!(error.is_retryable());

        let error = LoopError::GoalNotFound("test".to_string());
        assert!(!error.is_retryable());
    }

    #[test]
    fn test_error_severity() {
        let error = LoopError::GoalNotFound("test".to_string());
        assert_eq!(error.severity(), 90);

        let error = LoopError::Timeout {
            iteration: 1,
            timeout_ms: 5000,
        };
        assert_eq!(error.severity(), 40);
    }

    #[test]
    fn test_error_display() {
        let error = LoopError::IterationFailed {
            iteration: 3,
            reason: "agent failed".to_string(),
        };
        assert_eq!(error.to_string(), "Iteration 3 failed: agent failed");

        let error = LoopError::MaxRetriesExceeded {
            iteration: 5,
            max_retries: 3,
        };
        assert_eq!(error.to_string(), "Maximum retries (3) exceeded for iteration 5");
    }
}
