//! Error types for Business API

use thiserror::Error;

pub type Result<T> = std::result::Result<T, BusinessApiError>;

#[derive(Debug, Error)]
pub enum BusinessApiError {
    #[error("Database error: {0}")]
    Database(String),

    #[error("Not found: {0}")]
    NotFound(String),

    #[error("Invalid input: {0}")]
    InvalidInput(String),

    #[error("Agent execution failed: {0}")]
    AgentFailed(String),

    #[error("Payment failed: {0}")]
    PaymentFailed(String),

    #[error(transparent)]
    Other(#[from] anyhow::Error),
}
