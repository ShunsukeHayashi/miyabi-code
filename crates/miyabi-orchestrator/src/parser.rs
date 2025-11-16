//! Result parser for Claude Code headless execution

use crate::error::{Result, SchedulerError};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tracing::{debug, warn};

/// Agent execution result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentResult {
    /// Exit status code
    pub status: i32,
    /// Success flag
    pub success: bool,
    /// Output message
    pub message: String,
    /// Error message (if any)
    pub error: Option<String>,
    /// Generated files
    pub files: Vec<String>,
}

/// Parse Agent result from JSON file
///
/// # Arguments
///
/// * `json_path` - Path to the result JSON file
///
/// # Returns
///
/// Returns an `AgentResult` parsed from the JSON file
///
/// # Errors
///
/// Returns `SchedulerError::ParseFailed` if:
/// - File cannot be read
/// - JSON parsing fails
///
/// # Example
///
/// ```no_run
/// use miyabi_scheduler::parser::parse_agent_result;
/// use std::path::PathBuf;
///
/// # #[tokio::main]
/// # async fn main() -> Result<(), Box<dyn std::error::Error>> {
/// let result = parse_agent_result(PathBuf::from("/tmp/result.json")).await?;
/// println!("Status: {}", result.status);
/// # Ok(())
/// # }
/// ```
pub async fn parse_agent_result(json_path: PathBuf) -> Result<AgentResult> {
    debug!("Parsing result from: {}", json_path.display());

    // Read file
    let content = tokio::fs::read_to_string(&json_path).await.map_err(|e| {
        warn!("Failed to read file: {}", e);
        SchedulerError::Io(e)
    })?;

    // Parse JSON
    let result: AgentResult = serde_json::from_str(&content).map_err(|source| {
        warn!("Failed to parse JSON: {}", source);
        SchedulerError::ParseFailed {
            path: json_path.clone(),
            source,
        }
    })?;

    debug!("Parsed result: success={}, status={}", result.success, result.status);

    Ok(result)
}

/// Parse error logs from execution output
///
/// # Arguments
///
/// * `log_path` - Path to the log file
///
/// # Returns
///
/// Returns extracted error messages as a single String
pub async fn parse_error_logs(log_path: PathBuf) -> Result<String> {
    let content = tokio::fs::read_to_string(&log_path).await?;

    // Extract error lines
    let errors: Vec<&str> = content
        .lines()
        .filter(|line| line.contains("ERROR") || line.contains("error:") || line.contains("Error:"))
        .collect();

    Ok(errors.join("\n"))
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[tokio::test]
    async fn test_parse_agent_result_success() {
        let temp_dir = tempdir().unwrap();
        let json_path = temp_dir.path().join("result.json");

        let result_json = r#"{
            "status": 0,
            "success": true,
            "message": "Agent execution successful",
            "error": null,
            "files": ["file1.rs", "file2.rs"]
        }"#;

        tokio::fs::write(&json_path, result_json).await.unwrap();

        let result = parse_agent_result(json_path).await.unwrap();

        assert_eq!(result.status, 0);
        assert!(result.success);
        assert_eq!(result.message, "Agent execution successful");
        assert!(result.error.is_none());
        assert_eq!(result.files.len(), 2);
    }

    #[tokio::test]
    async fn test_parse_agent_result_failure() {
        let temp_dir = tempdir().unwrap();
        let json_path = temp_dir.path().join("result.json");

        let result_json = r#"{
            "status": 1,
            "success": false,
            "message": "Agent execution failed",
            "error": "Compilation error",
            "files": []
        }"#;

        tokio::fs::write(&json_path, result_json).await.unwrap();

        let result = parse_agent_result(json_path).await.unwrap();

        assert_eq!(result.status, 1);
        assert!(!result.success);
        assert_eq!(result.message, "Agent execution failed");
        assert_eq!(result.error.as_ref().unwrap(), "Compilation error");
        assert_eq!(result.files.len(), 0);
    }

    #[tokio::test]
    async fn test_parse_error_logs() {
        let temp_dir = tempdir().unwrap();
        let log_path = temp_dir.path().join("output.log");

        let log_content = r#"INFO: Starting execution
DEBUG: Loading config
ERROR: Failed to compile: syntax error
INFO: Cleanup
error: Could not parse file
"#;

        tokio::fs::write(&log_path, log_content).await.unwrap();

        let errors = parse_error_logs(log_path).await.unwrap();

        assert!(errors.contains("ERROR: Failed to compile"));
        assert!(errors.contains("error: Could not parse file"));
        assert!(!errors.contains("INFO: Starting"));
    }
}
