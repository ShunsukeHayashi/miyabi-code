//! Error types for AWS Agent

use thiserror::Error;

pub type Result<T> = std::result::Result<T, AwsAgentError>;

#[derive(Debug, Error)]
pub enum AwsAgentError {
    #[error("AWS SDK error: {0}")]
    AwsSdk(String),

    #[error("Resource not found: {0}")]
    ResourceNotFound(String),

    #[error("Invalid resource type: {0}")]
    InvalidResourceType(String),

    #[error("Operation failed: {0}")]
    OperationFailed(String),

    #[error("Authentication failed: {0}")]
    AuthenticationFailed(String),

    #[error(transparent)]
    Other(#[from] anyhow::Error),
}
