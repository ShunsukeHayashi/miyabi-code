//! Command service trait layer
//!
//! This module defines the core trait for all CLI commands, enabling:
//! - Consistent JSON output across all commands
//! - Reusable command logic for agents and other entry points
//! - Testable command execution with structured outputs

use crate::error::Result;
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use std::fmt::Debug;

/// Command service trait for all CLI commands
///
/// This trait provides a unified interface for command execution with support for:
/// - Type-safe structured outputs
/// - JSON serialization
/// - Async execution
/// - Error handling
///
/// # Example
///
/// ```rust
/// use miyabi_cli::service::CommandService;
/// use serde::Serialize;
///
/// #[derive(Debug, Serialize)]
/// pub struct StatusOutput {
///     pub is_installed: bool,
///     pub git_branch: Option<String>,
/// }
///
/// pub struct StatusCommand {
///     pub watch: bool,
/// }
///
/// #[async_trait]
/// impl CommandService for StatusCommand {
///     type Output = StatusOutput;
///
///     async fn execute(&self) -> Result<Self::Output> {
///         // Command implementation
///         Ok(StatusOutput {
///             is_installed: true,
///             git_branch: Some("main".to_string()),
///         })
///     }
/// }
/// ```
#[async_trait]
#[allow(dead_code)]
pub trait CommandService: Send + Sync {
    /// Output type for this command
    ///
    /// Must implement Serialize for JSON output and Debug for error reporting
    type Output: Serialize + Debug + Send;

    /// Execute the command and return structured output
    ///
    /// This method performs the core command logic and returns a structured result
    /// that can be serialized to JSON or displayed to the user.
    async fn execute(&self) -> Result<Self::Output>;

    /// Convert output to JSON string
    ///
    /// Default implementation uses serde_json::to_string_pretty
    fn to_json(&self, output: &Self::Output) -> Result<String> {
        serde_json::to_string_pretty(output).map_err(|e| {
            crate::error::CliError::Serialization(format!("Failed to serialize output: {}", e))
        })
    }

    /// Execute command and optionally output as JSON
    ///
    /// This is a convenience method that combines execute() and to_json()
    async fn execute_with_json(&self, json: bool) -> Result<String> {
        let output = self.execute().await?;

        if json {
            self.to_json(&output)
        } else {
            // For non-JSON output, return debug representation
            Ok(format!("{:?}", output))
        }
    }
}

/// Command output metadata
///
/// Common metadata fields that can be included in any command output
#[derive(Debug, Clone, Serialize, Deserialize)]
#[allow(dead_code)]
pub struct CommandMetadata {
    /// Command name
    pub command: String,
    /// Execution timestamp (ISO 8601)
    pub timestamp: String,
    /// Success status
    pub success: bool,
    /// Optional error message
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

#[allow(dead_code)]
impl CommandMetadata {
    /// Create new command metadata
    pub fn new(command: impl Into<String>, success: bool) -> Self {
        Self {
            command: command.into(),
            timestamp: chrono::Utc::now().to_rfc3339(),
            success,
            error: None,
        }
    }

    /// Create metadata with error
    pub fn with_error(command: impl Into<String>, error: impl Into<String>) -> Self {
        Self {
            command: command.into(),
            timestamp: chrono::Utc::now().to_rfc3339(),
            success: false,
            error: Some(error.into()),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[derive(Debug, Serialize)]
    struct TestOutput {
        message: String,
    }

    struct TestCommand;

    #[async_trait]
    impl CommandService for TestCommand {
        type Output = TestOutput;

        async fn execute(&self) -> Result<Self::Output> {
            Ok(TestOutput {
                message: "test".to_string(),
            })
        }
    }

    #[tokio::test]
    async fn test_command_service_execute() {
        let cmd = TestCommand;
        let output = cmd.execute().await.unwrap();
        assert_eq!(output.message, "test");
    }

    #[tokio::test]
    async fn test_command_service_to_json() {
        let cmd = TestCommand;
        let output = cmd.execute().await.unwrap();
        let json = cmd.to_json(&output).unwrap();
        assert!(json.contains("\"message\""));
        assert!(json.contains("\"test\""));
    }

    #[tokio::test]
    async fn test_command_service_execute_with_json() {
        let cmd = TestCommand;
        let json_output = cmd.execute_with_json(true).await.unwrap();
        assert!(json_output.contains("\"message\""));
    }

    #[test]
    fn test_command_metadata_creation() {
        let metadata = CommandMetadata::new("test", true);
        assert_eq!(metadata.command, "test");
        assert!(metadata.success);
        assert!(metadata.error.is_none());
    }

    #[test]
    fn test_command_metadata_with_error() {
        let metadata = CommandMetadata::with_error("test", "test error");
        assert_eq!(metadata.command, "test");
        assert!(!metadata.success);
        assert_eq!(metadata.error, Some("test error".to_string()));
    }
}
