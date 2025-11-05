//! Error types for approval system

use thiserror::Error;

/// Result type for approval operations
pub type Result<T> = std::result::Result<T, ApprovalError>;

/// Errors that can occur during approval operations
#[derive(Error, Debug)]
pub enum ApprovalError {
    /// Approval not found
    #[error("Approval not found: {0}")]
    NotFound(String),

    /// Approval already completed (approved or rejected)
    #[error("Approval already completed with status: {0}")]
    AlreadyCompleted(String),

    /// Approval has timed out
    #[error("Approval timed out after {0} seconds")]
    TimedOut(u64),

    /// Approver not authorized
    #[error("Approver '{0}' not authorized for this approval")]
    NotAuthorized(String),

    /// Approver already responded
    #[error("Approver '{0}' has already responded")]
    AlreadyResponded(String),

    /// Insufficient approvals
    #[error("Insufficient approvals: {received}/{required} required")]
    InsufficientApprovals { received: usize, required: usize },

    /// Workflow error
    #[error("Workflow error: {0}")]
    Workflow(#[from] miyabi_workflow::WorkflowError),

    /// Serialization error
    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),

    /// Storage error
    #[error("Storage error: {0}")]
    Storage(#[from] sled::Error),

    /// I/O error
    #[error("I/O error: {0}")]
    Io(#[from] std::io::Error),

    /// Other error
    #[error("Other error: {0}")]
    Other(String),
}
