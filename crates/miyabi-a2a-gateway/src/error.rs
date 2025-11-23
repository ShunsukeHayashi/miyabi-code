//! Error types for A2A Gateway

use crate::types::{AgentId, TaskId};
use thiserror::Error;

#[derive(Error, Debug)]
pub enum Error {
    #[error("Agent not found: {0:?}")]
    AgentNotFound(AgentId),

    #[error("Task not found: {0:?}")]
    TaskNotFound(TaskId),

    #[error("Delivery failed: {0}")]
    DeliveryFailed(String),

    #[error("Acknowledgment timeout")]
    AcknowledgmentTimeout,

    #[error("Duplicate task with idempotency key: {0}")]
    DuplicateTask(String),

    #[error("Invalid capability: agent {0:?} does not support skill {1}")]
    InvalidCapability(AgentId, String),

    #[error("Task timeout after {0} seconds")]
    TaskTimeout(u64),

    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),

    #[error("Internal error: {0}")]
    Internal(String),

    #[error("Tool execution failed: {0}")]
    ToolExecutionFailed(String),
}
