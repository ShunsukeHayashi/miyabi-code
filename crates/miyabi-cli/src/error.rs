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

    #[error("GitHub token not found. Set GITHUB_TOKEN environment variable")]
    MissingGitHubToken,

    #[error("Invalid agent type: {0}")]
    InvalidAgentType(String),

    #[error("Issue number required for agent execution")]
    MissingIssueNumber,

    #[error("Miyabi error: {0}")]
    Miyabi(#[from] miyabi_types::error::MiyabiError),

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("JSON error: {0}")]
    Json(#[from] serde_json::Error),
}

pub type Result<T> = std::result::Result<T, CliError>;
