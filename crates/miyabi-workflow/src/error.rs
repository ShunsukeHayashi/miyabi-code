//! Error types for workflow execution

use thiserror::Error;

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
