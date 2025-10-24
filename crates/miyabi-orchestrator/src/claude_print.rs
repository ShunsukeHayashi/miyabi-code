//! Claude Code --print mode integration
//!
//! This module provides integration with `claude --print` for non-interactive
//! execution of Claude Code commands. This enables full automation of Agent
//! execution workflows without requiring interactive terminal sessions.

use crate::error::{Result, SchedulerError};
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use tokio::fs;
use tokio::io::AsyncWriteExt;

/// Configuration for Claude Code --print execution
#[derive(Debug, Clone)]
pub struct ClaudePrintConfig {
    /// Working directory for execution
    pub working_dir: PathBuf,
    /// Output format (default: "text")
    pub output_format: String,
    /// Timeout in seconds (default: 300)
    pub timeout_secs: u64,
    /// Path to claude binary (default: "claude")
    pub claude_bin: String,
}

impl Default for ClaudePrintConfig {
    fn default() -> Self {
        Self {
            working_dir: PathBuf::from("."),
            output_format: "text".to_string(),
            timeout_secs: 300,
            claude_bin: "claude".to_string(),
        }
    }
}

/// Result of Claude Code --print execution
#[derive(Debug, Clone)]
pub struct ClaudePrintResult {
    /// Whether execution was successful
    pub success: bool,
    /// Standard output
    pub stdout: String,
    /// Standard error
    pub stderr: String,
    /// Exit code
    pub exit_code: Option<i32>,
    /// Output file path (if specified)
    pub output_file: Option<PathBuf>,
}

/// Executor for Claude Code --print mode
pub struct ClaudePrintExecutor {
    config: ClaudePrintConfig,
}

impl ClaudePrintExecutor {
    /// Create a new executor with default configuration
    pub fn new() -> Self {
        Self {
            config: ClaudePrintConfig::default(),
        }
    }

    /// Create a new executor with custom configuration
    pub fn with_config(config: ClaudePrintConfig) -> Self {
        Self { config }
    }

    /// Execute a Claude Code prompt in non-interactive mode
    ///
    /// # Arguments
    ///
    /// * `prompt` - The prompt to send to Claude Code
    /// * `output_file` - Optional path to write output to
    ///
    /// # Returns
    ///
    /// Result containing execution status and output
    ///
    /// # Example
    ///
    /// ```no_run
    /// use miyabi_scheduler::claude_print::{ClaudePrintExecutor, ClaudePrintConfig};
    /// use std::path::PathBuf;
    ///
    /// #[tokio::main]
    /// async fn main() -> Result<(), Box<dyn std::error::Error>> {
    ///     let mut config = ClaudePrintConfig::default();
    ///     config.working_dir = PathBuf::from(".worktrees/issue-270");
    ///
    ///     let executor = ClaudePrintExecutor::with_config(config);
    ///
    ///     let prompt = "Analyze Issue #270 and create implementation plan";
    ///     let result = executor.execute(prompt, Some(PathBuf::from("plan.md"))).await?;
    ///
    ///     if result.success {
    ///         println!("Execution successful!");
    ///     }
    ///
    ///     Ok(())
    /// }
    /// ```
    pub async fn execute(
        &self,
        prompt: &str,
        output_file: Option<PathBuf>,
    ) -> Result<ClaudePrintResult> {
        // Validate working directory
        if !self.config.working_dir.exists() {
            return Err(SchedulerError::Validation(format!(
                "Working directory does not exist: {:?}",
                self.config.working_dir
            )));
        }

        // Build command
        let mut cmd = Command::new(&self.config.claude_bin);
        cmd.arg("--print")
            .arg("--output-format")
            .arg(&self.config.output_format)
            .arg(prompt)
            .current_dir(&self.config.working_dir)
            .stdin(Stdio::null())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());

        // Execute command
        let output = cmd
            .output()
            .map_err(|e| SchedulerError::Io(std::io::Error::new(e.kind(), e.to_string())))?;

        let stdout = String::from_utf8_lossy(&output.stdout).to_string();
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();
        let exit_code = output.status.code();

        // Write to output file if specified
        if let Some(ref path) = output_file {
            let full_path = self.config.working_dir.join(path);
            let mut file = fs::File::create(&full_path)
                .await
                .map_err(|e| SchedulerError::Io(e))?;
            file.write_all(stdout.as_bytes())
                .await
                .map_err(|e| SchedulerError::Io(e))?;
        }

        Ok(ClaudePrintResult {
            success: output.status.success(),
            stdout,
            stderr,
            exit_code,
            output_file,
        })
    }

    /// Execute with context from EXECUTION_CONTEXT.md
    ///
    /// This method reads `EXECUTION_CONTEXT.md` from the working directory
    /// and prepends it to the provided prompt.
    ///
    /// # Arguments
    ///
    /// * `prompt` - Additional prompt to append after context
    /// * `output_file` - Optional path to write output to
    ///
    /// # Example
    ///
    /// ```no_run
    /// use miyabi_scheduler::claude_print::{ClaudePrintExecutor, ClaudePrintConfig};
    /// use std::path::PathBuf;
    ///
    /// #[tokio::main]
    /// async fn main() -> Result<(), Box<dyn std::error::Error>> {
    ///     let mut config = ClaudePrintConfig::default();
    ///     config.working_dir = PathBuf::from(".worktrees/issue-270");
    ///
    ///     let executor = ClaudePrintExecutor::with_config(config);
    ///
    ///     // EXECUTION_CONTEXT.md will be automatically prepended
    ///     let result = executor.execute_with_context(
    ///         "Implement the feature described above",
    ///         Some(PathBuf::from("implementation.rs"))
    ///     ).await?;
    ///
    ///     Ok(())
    /// }
    /// ```
    pub async fn execute_with_context(
        &self,
        prompt: &str,
        output_file: Option<PathBuf>,
    ) -> Result<ClaudePrintResult> {
        let context_path = self.config.working_dir.join("EXECUTION_CONTEXT.md");

        let context = if context_path.exists() {
            fs::read_to_string(&context_path)
                .await
                .map_err(|e| SchedulerError::Io(e))?
        } else {
            String::new()
        };

        let full_prompt = if context.is_empty() {
            prompt.to_string()
        } else {
            format!("{}\n\n{}", context, prompt)
        };

        self.execute(&full_prompt, output_file).await
    }

    /// Create EXECUTION_CONTEXT.md file in working directory
    ///
    /// This helper method creates a standardized execution context file
    /// that can be consumed by `execute_with_context`.
    ///
    /// # Arguments
    ///
    /// * `issue_number` - GitHub Issue number
    /// * `agent_type` - Type of Agent to execute
    /// * `additional_context` - Additional context information
    pub async fn create_execution_context(
        &self,
        issue_number: u32,
        agent_type: &str,
        additional_context: Option<&str>,
    ) -> Result<()> {
        let context_path = self.config.working_dir.join("EXECUTION_CONTEXT.md");

        let content = format!(
            r#"# Execution Context for Issue #{}

## Issue Information
- **Issue Number**: #{}
- **GitHub URL**: https://github.com/ShunsukeHayashi/Miyabi/issues/{}
- **Assigned Agent**: {}
- **Worktree**: {:?}

## Execution Instructions

Please analyze Issue #{} and execute the following:

1. **Understand the Issue**: Read the Issue description from GitHub
2. **Plan the Implementation**: Break down into smaller tasks
3. **Execute the Tasks**: Implement code, tests, and documentation
4. **Create Git Commit**: Commit with Conventional Commits format

{}

## Output Format

IMPORTANT: Output ONLY executable code and documentation.
Do NOT output meta-information, explanations, or summaries.
Start directly with file content.

---

**Start your work below:**
"#,
            issue_number,
            issue_number,
            issue_number,
            agent_type,
            self.config.working_dir,
            issue_number,
            additional_context.unwrap_or("")
        );

        fs::write(&context_path, content)
            .await
            .map_err(|e| SchedulerError::Io(e))?;

        Ok(())
    }
}

impl Default for ClaudePrintExecutor {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_config_default() {
        let config = ClaudePrintConfig::default();
        assert_eq!(config.output_format, "text");
        assert_eq!(config.timeout_secs, 300);
        assert_eq!(config.claude_bin, "claude");
    }

    #[test]
    fn test_executor_creation() {
        let executor = ClaudePrintExecutor::new();
        assert_eq!(executor.config.output_format, "text");

        let custom_config = ClaudePrintConfig {
            working_dir: PathBuf::from("/tmp"),
            output_format: "json".to_string(),
            timeout_secs: 600,
            claude_bin: "/usr/local/bin/claude".to_string(),
        };

        let executor = ClaudePrintExecutor::with_config(custom_config.clone());
        assert_eq!(executor.config.output_format, "json");
        assert_eq!(executor.config.timeout_secs, 600);
    }

    #[tokio::test]
    async fn test_create_execution_context() {
        let temp_dir = std::env::temp_dir().join("test_claude_print");
        let _ = fs::create_dir_all(&temp_dir).await;

        let mut config = ClaudePrintConfig::default();
        config.working_dir = temp_dir.clone();

        let executor = ClaudePrintExecutor::with_config(config);

        executor
            .create_execution_context(270, "CoordinatorAgent", Some("Additional context here"))
            .await
            .unwrap();

        let context_path = temp_dir.join("EXECUTION_CONTEXT.md");
        assert!(context_path.exists());

        let content = fs::read_to_string(&context_path).await.unwrap();
        assert!(content.contains("Issue #270"));
        assert!(content.contains("CoordinatorAgent"));
        assert!(content.contains("Additional context here"));

        // Cleanup
        let _ = fs::remove_dir_all(&temp_dir).await;
    }
}
