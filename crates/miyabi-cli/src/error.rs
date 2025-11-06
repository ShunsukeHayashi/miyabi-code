//! CLI error types

use thiserror::Error;
use miyabi_types::error::{ErrorCode, UnifiedError};
use std::any::Any;

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

    #[error("Agent {0} is not registered in the execution registry")]
    AgentNotRegistered(String),

    #[error("Agent task template missing: {0}")]
    AgentTaskTemplateMissing(String),

    #[error("Issue number required for agent execution")]
    MissingIssueNumber,

    #[error("Git configuration error: {0}")]
    GitConfig(String),

    #[error("Invalid input: {0}")]
    InvalidInput(String),

    #[error("Execution error: {0}")]
    ExecutionError(String),

    #[error("Configuration error: {0}")]
    Config(String),

    #[error("Missing environment variable: {var}")]
    MissingEnvironmentVariable { var: String },

    #[error("{0}")]
    NotFound(String),

    #[error("Execution error: {0}")]
    Execution(String),

    #[error("Miyabi error: {0}")]
    Miyabi(#[from] miyabi_types::error::MiyabiError),

    #[error("Knowledge management error: {0}")]
    Knowledge(#[from] miyabi_knowledge::error::KnowledgeError),

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("JSON error: {0}")]
    Json(#[from] serde_json::Error),

    #[error("Serialization error: {0}")]
    Serialization(String),

    #[error("Mode error: {0}")]
    Mode(#[from] miyabi_modes::error::ModeError),
}

pub type Result<T> = std::result::Result<T, CliError>;

// ============================================================================
// UnifiedError Implementation
// ============================================================================

impl UnifiedError for CliError {
    fn code(&self) -> ErrorCode {
        match self {
            Self::InvalidProjectName(_) => ErrorCode::VALIDATION_ERROR,
            Self::ProjectExists(_) => ErrorCode::VALIDATION_ERROR,
            Self::NotGitRepository => ErrorCode::GIT_ERROR,
            Self::InvalidAgentType(_) => ErrorCode::VALIDATION_ERROR,
            Self::AgentNotRegistered(_) => ErrorCode::AGENT_ERROR,
            Self::AgentTaskTemplateMissing(_) => ErrorCode::FILE_NOT_FOUND,
            Self::MissingIssueNumber => ErrorCode::VALIDATION_ERROR,
            Self::GitConfig(_) => ErrorCode::GIT_ERROR,
            Self::InvalidInput(_) => ErrorCode::INVALID_INPUT,
            Self::ExecutionError(_) => ErrorCode::PROCESS_ERROR,
            Self::Miyabi(e) => e.code(),
            Self::Knowledge(e) => e.code(),
            Self::Mode(e) => e.code(),
            Self::Io(e) => match e.kind() {
                std::io::ErrorKind::NotFound => ErrorCode::FILE_NOT_FOUND,
                std::io::ErrorKind::PermissionDenied => ErrorCode::PERMISSION_DENIED,
                _ => ErrorCode::IO_ERROR,
            },
            Self::Json(_) => ErrorCode::PARSE_ERROR,
            Self::Serialization(_) => ErrorCode::PARSE_ERROR,
        }
    }

    fn user_message(&self) -> String {
        match self {
            Self::InvalidProjectName(name) => format!(
                "Invalid project name '{}'. Project names must follow naming conventions.",
                name
            ),
            Self::ProjectExists(path) => format!(
                "Project directory '{}' already exists. Please choose a different name or remove the existing directory.",
                path
            ),
            Self::NotGitRepository => {
                "Not in a git repository. Please run this command from within a git repository.".to_string()
            }
            Self::InvalidAgentType(agent) => format!(
                "Invalid agent type '{}'. Please check available agent types.",
                agent
            ),
            Self::AgentNotRegistered(agent) => format!(
                "Agent '{}' is not registered. Please register the agent before execution.",
                agent
            ),
            Self::AgentTaskTemplateMissing(agent) => format!(
                "Task template for agent '{}' is missing. Please check agent configuration.",
                agent
            ),
            Self::MissingIssueNumber => {
                "Issue number is required for agent execution. Please provide an issue number.".to_string()
            }
            Self::GitConfig(msg) => format!(
                "Git configuration error: {}. Please check your git setup.",
                msg
            ),
            Self::InvalidInput(msg) => format!(
                "Invalid input: {}. Please check your command parameters.",
                msg
            ),
            Self::ExecutionError(msg) => format!(
                "Execution failed: {}. Please check the logs for more details.",
                msg
            ),
            Self::Serialization(msg) => format!(
                "Serialization error: {}. The data format may be invalid.",
                msg
            ),
            Self::Miyabi(e) => e.user_message(),
            Self::Knowledge(e) => e.user_message(),
            Self::Mode(e) => e.user_message(),
            // Reuse existing thiserror messages for other variants
            _ => self.to_string(),
        }
    }

    fn context(&self) -> Option<&dyn Any> {
        match self {
            Self::InvalidProjectName(name) => Some(name as &dyn Any),
            Self::ProjectExists(path) => Some(path as &dyn Any),
            Self::InvalidAgentType(agent) => Some(agent as &dyn Any),
            Self::AgentNotRegistered(agent) => Some(agent as &dyn Any),
            Self::AgentTaskTemplateMissing(agent) => Some(agent as &dyn Any),
            Self::GitConfig(msg) => Some(msg as &dyn Any),
            Self::InvalidInput(msg) => Some(msg as &dyn Any),
            Self::ExecutionError(msg) => Some(msg as &dyn Any),
            Self::Serialization(msg) => Some(msg as &dyn Any),
            Self::Miyabi(e) => e.context(),
            Self::Knowledge(e) => e.context(),
            Self::Mode(e) => e.context(),
            _ => None,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_invalid_project_name_error() {
        let error = CliError::InvalidProjectName("test-project".to_string());
        assert_eq!(error.to_string(), "Invalid project name: test-project");
    }

    #[test]
    fn test_project_exists_error() {
        let error = CliError::ProjectExists("my-project".to_string());
        assert_eq!(
            error.to_string(),
            "Project directory already exists: my-project"
        );
    }

    #[test]
    fn test_not_git_repository_error() {
        let error = CliError::NotGitRepository;
        assert_eq!(error.to_string(), "Not in a git repository");
    }

    #[test]
    fn test_invalid_agent_type_error() {
        let error = CliError::InvalidAgentType("unknown".to_string());
        assert_eq!(error.to_string(), "Invalid agent type: unknown");
    }

    #[test]
    fn test_missing_issue_number_error() {
        let error = CliError::MissingIssueNumber;
        assert_eq!(
            error.to_string(),
            "Issue number required for agent execution"
        );
    }

    #[test]
    fn test_git_config_error() {
        let error = CliError::GitConfig("remote not found".to_string());
        assert_eq!(
            error.to_string(),
            "Git configuration error: remote not found"
        );
    }

    #[test]
    fn test_invalid_input_error() {
        let error = CliError::InvalidInput("bad input".to_string());
        assert_eq!(error.to_string(), "Invalid input: bad input");
    }

    #[test]
    fn test_execution_error() {
        let error = CliError::ExecutionError("command failed".to_string());
        assert_eq!(error.to_string(), "Execution error: command failed");
    }

    #[test]
    fn test_serialization_error() {
        let error = CliError::Serialization("invalid JSON".to_string());
        assert_eq!(error.to_string(), "Serialization error: invalid JSON");
    }

    #[test]
    fn test_io_error_conversion() {
        let io_err = std::io::Error::new(std::io::ErrorKind::NotFound, "file not found");
        let cli_err: CliError = io_err.into();
        assert!(cli_err.to_string().contains("file not found"));
    }

    #[test]
    fn test_json_error_conversion() {
        let json_str = "{invalid json}";
        let json_err = serde_json::from_str::<serde_json::Value>(json_str).unwrap_err();
        let cli_err: CliError = json_err.into();
        assert!(matches!(cli_err, CliError::Json(_)));
    }

    #[test]
    fn test_result_type_ok() {
        fn returns_ok() -> Result<i32> {
            Ok(42)
        }
        let result = returns_ok();
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), 42);
    }

    #[test]
    fn test_result_type_err() {
        fn returns_err() -> Result<i32> {
            Err(CliError::NotGitRepository)
        }
        let result = returns_err();
        assert!(result.is_err());
        assert_eq!(result.unwrap_err().to_string(), "Not in a git repository");
    }
}
