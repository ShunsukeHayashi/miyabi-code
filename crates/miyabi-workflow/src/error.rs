//! Error types for workflow execution

use thiserror::Error;
use miyabi_types::error::{ErrorCode, UnifiedError};
use std::any::Any;

/// Result type for workflow operations
pub type Result<T> = std::result::Result<T, WorkflowError>;

/// Workflow execution errors
#[derive(Error, Debug)]
pub enum WorkflowError {
    /// Step execution failed
    #[error("Step '{step_id}' failed: {source}")]
    StepFailed {
        step_id: String,
        source: Box<dyn std::error::Error + Send + Sync>,
    },

    /// State persistence error
    #[error("State persistence error: {0}")]
    PersistenceError(#[from] sled::Error),

    /// Serialization error
    #[error("Serialization error: {0}")]
    SerializationError(#[from] serde_json::Error),

    /// IO error
    #[error("IO error: {0}")]
    IoError(#[from] std::io::Error),

    /// Workflow not found
    #[error("Workflow '{0}' not found")]
    WorkflowNotFound(String),

    /// Step not found
    #[error("Step '{0}' not found in workflow")]
    StepNotFound(String),

    /// Empty workflow (no steps defined)
    #[error("Workflow must have at least one step")]
    EmptyWorkflow,

    /// Circular dependency detected
    #[error("Circular dependency detected in workflow")]
    CircularDependency,

    /// Invalid workflow configuration
    #[error("Invalid workflow configuration: {0}")]
    InvalidConfiguration(String),

    /// Branch condition error
    #[error("Branch condition evaluation failed: {0}")]
    BranchConditionError(String),

    /// Parallel execution error
    #[error("Parallel execution failed: {0}")]
    ParallelExecutionError(String),

    /// Generic error
    #[error("Workflow error: {0}")]
    Other(String),
}

impl WorkflowError {
    /// Create a step failed error
    pub fn step_failed(
        step_id: impl Into<String>,
        error: impl std::error::Error + Send + Sync + 'static,
    ) -> Self {
        Self::StepFailed {
            step_id: step_id.into(),
            source: Box::new(error),
        }
    }
}

// ============================================================================
// UnifiedError Implementation
// ============================================================================

impl UnifiedError for WorkflowError {
    fn code(&self) -> ErrorCode {
        match self {
            Self::StepFailed { .. } => ErrorCode::STEP_ERROR,
            Self::PersistenceError(_) => ErrorCode::STORAGE_ERROR,
            Self::SerializationError(_) => ErrorCode::PARSE_ERROR,
            Self::IoError(e) => match e.kind() {
                std::io::ErrorKind::NotFound => ErrorCode::FILE_NOT_FOUND,
                std::io::ErrorKind::PermissionDenied => ErrorCode::PERMISSION_DENIED,
                _ => ErrorCode::IO_ERROR,
            },
            Self::WorkflowNotFound(_) => ErrorCode::FILE_NOT_FOUND,
            Self::StepNotFound(_) => ErrorCode::STEP_ERROR,
            Self::EmptyWorkflow => ErrorCode::VALIDATION_ERROR,
            Self::CircularDependency => ErrorCode::CIRCULAR_DEPENDENCY_ERROR,
            Self::InvalidConfiguration(_) => ErrorCode::INVALID_CONFIG,
            Self::BranchConditionError(_) => ErrorCode::WORKFLOW_ERROR,
            Self::ParallelExecutionError(_) => ErrorCode::WORKFLOW_ERROR,
            Self::Other(_) => ErrorCode::INTERNAL_ERROR,
        }
    }

    fn user_message(&self) -> String {
        match self {
            Self::StepFailed { step_id, .. } => format!(
                "Workflow step '{}' failed to execute. Please check the step configuration and review the logs for detailed error information.",
                step_id
            ),
            Self::CircularDependency => {
                "The workflow contains circular dependencies between steps. Please review the dependency graph and remove any cycles.".to_string()
            }
            Self::EmptyWorkflow => {
                "Cannot execute an empty workflow. Please add at least one step to the workflow definition.".to_string()
            }
            Self::WorkflowNotFound(name) => format!(
                "Workflow '{}' was not found. Please verify the workflow name and ensure it has been registered.",
                name
            ),
            Self::StepNotFound(step_id) => format!(
                "Step '{}' was not found in the workflow. Please check the step ID in your workflow definition.",
                step_id
            ),
            Self::ParallelExecutionError(msg) => format!(
                "Parallel execution failed: {}. Some steps in the parallel group encountered errors.",
                msg
            ),
            // Reuse existing thiserror messages for other variants
            _ => self.to_string(),
        }
    }

    fn context(&self) -> Option<&dyn Any> {
        match self {
            Self::StepFailed { step_id, .. } => Some(step_id as &dyn Any),
            Self::WorkflowNotFound(name) => Some(name as &dyn Any),
            Self::StepNotFound(step_id) => Some(step_id as &dyn Any),
            _ => None,
        }
    }
}

#[cfg(test)]
mod unified_error_tests {
    use super::*;

    #[test]
    fn test_workflow_error_codes() {
        let error = WorkflowError::CircularDependency;
        assert_eq!(error.code(), ErrorCode::CIRCULAR_DEPENDENCY_ERROR);

        let error = WorkflowError::EmptyWorkflow;
        assert_eq!(error.code(), ErrorCode::VALIDATION_ERROR);

        let error = WorkflowError::WorkflowNotFound("test".to_string());
        assert_eq!(error.code(), ErrorCode::FILE_NOT_FOUND);
    }

    #[test]
    fn test_user_messages() {
        let error = WorkflowError::StepFailed {
            step_id: "validate_input".to_string(),
            source: Box::new(std::io::Error::new(std::io::ErrorKind::Other, "test")),
        };
        let msg = error.user_message();
        assert!(msg.contains("validate_input"));
        assert!(msg.contains("check the step configuration"));

        let error = WorkflowError::CircularDependency;
        let msg = error.user_message();
        assert!(msg.contains("circular dependencies"));
    }

    #[test]
    fn test_context_extraction() {
        let error = WorkflowError::StepFailed {
            step_id: "process_data".to_string(),
            source: Box::new(std::io::Error::new(std::io::ErrorKind::Other, "test")),
        };
        assert!(error.context().is_some());

        let error = WorkflowError::EmptyWorkflow;
        assert!(error.context().is_none());
    }
}
