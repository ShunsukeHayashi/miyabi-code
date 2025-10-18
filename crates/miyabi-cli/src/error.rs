//! CLI error types

use thiserror::Error;

#[derive(Debug, Error)]
pub enum CliError {
    #[error("Invalid project name: {0}")]
    InvalidProjectName(String),

    #[error("Project directory already exists: {0}")]
    ProjectExists(String),

    #[error("Not in a git repository")]
    NotGitRepository,

    #[error("Invalid agent type: {0}")]
    InvalidAgentType(String),

    #[error("Issue number required for agent execution")]
    MissingIssueNumber,

    #[error("Git configuration error: {0}")]
    GitConfig(String),

    #[error("Invalid input: {0}")]
    InvalidInput(String),

    #[error("Execution error: {0}")]
    ExecutionError(String),

    #[error("Miyabi error: {0}")]
    Miyabi(#[from] miyabi_types::error::MiyabiError),

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("JSON error: {0}")]
    Json(#[from] serde_json::Error),

    #[error("Serialization error: {0}")]
    Serialization(String),
}

pub type Result<T> = std::result::Result<T, CliError>;
