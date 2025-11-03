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
