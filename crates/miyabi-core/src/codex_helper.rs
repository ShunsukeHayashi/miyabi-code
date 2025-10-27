//! Codex X Helper - Claude Code Integration
//!
//! This module provides direct integration between Claude Code and Codex X (GPT-5 Codex).
//! Claude Code can use these helpers to delegate complex coding tasks to Codex X.

use std::process::Output;
use tokio::process::Command;

/// Codex execution configuration
#[derive(Debug, Clone)]
pub struct CodexConfig {
    /// Model to use (e.g., "gpt-5-codex", "o3")
    pub model: Option<String>,
    /// Sandbox policy
    pub sandbox: SandboxPolicy,
    /// Approval policy
    pub approval: ApprovalPolicy,
    /// Working directory
    pub working_dir: Option<String>,
}

impl Default for CodexConfig {
    fn default() -> Self {
        Self {
            model: None,
            sandbox: SandboxPolicy::WorkspaceWrite,
            approval: ApprovalPolicy::OnFailure,
            working_dir: None,
        }
    }
}

/// Sandbox policy for Codex execution
#[derive(Debug, Clone, Copy)]
pub enum SandboxPolicy {
    /// Read-only access (safe for analysis, code review)
    ReadOnly,
    /// Workspace write access (default, good for most tasks)
    WorkspaceWrite,
    /// Full system access (dangerous, use with caution)
    DangerFullAccess,
}

impl SandboxPolicy {
    fn as_str(&self) -> &'static str {
        match self {
            SandboxPolicy::ReadOnly => "read-only",
            SandboxPolicy::WorkspaceWrite => "workspace-write",
            SandboxPolicy::DangerFullAccess => "danger-full-access",
        }
    }
}

/// Approval policy for command execution
#[derive(Debug, Clone, Copy)]
pub enum ApprovalPolicy {
    /// Only run trusted commands without approval
    Untrusted,
    /// Run all commands, ask for approval only on failure (default)
    OnFailure,
    /// Model decides when to ask for approval
    OnRequest,
    /// Never ask for approval (CI/CD only)
    Never,
}

impl ApprovalPolicy {
    fn as_str(&self) -> &'static str {
        match self {
            ApprovalPolicy::Untrusted => "untrusted",
            ApprovalPolicy::OnFailure => "on-failure",
            ApprovalPolicy::OnRequest => "on-request",
            ApprovalPolicy::Never => "never",
        }
    }
}

/// Codex execution result
#[derive(Debug)]
pub struct CodexResult {
    /// Whether the execution succeeded
    pub success: bool,
    /// Standard output
    pub stdout: String,
    /// Standard error
    pub stderr: String,
    /// Exit code
    pub exit_code: Option<i32>,
}

impl CodexResult {
    fn from_output(output: Output) -> Self {
        Self {
            success: output.status.success(),
            stdout: String::from_utf8_lossy(&output.stdout).to_string(),
            stderr: String::from_utf8_lossy(&output.stderr).to_string(),
            exit_code: output.status.code(),
        }
    }
}

/// Execute Codex X with a given instruction
///
/// # Arguments
/// * `instruction` - Detailed instruction for Codex X
/// * `config` - Execution configuration
///
/// # Example
/// ```no_run
/// use miyabi_core::codex_helper::{execute_codex, CodexConfig};
///
/// #[tokio::main]
/// async fn main() {
///     let result = execute_codex(
///         "Refactor the authentication module to use async/await",
///         CodexConfig::default()
///     ).await.unwrap();
///
///     println!("Output: {}", result.stdout);
/// }
/// ```
pub async fn execute_codex(
    instruction: &str,
    config: CodexConfig,
) -> Result<CodexResult, Box<dyn std::error::Error>> {
    let mut cmd = Command::new("codex");
    cmd.arg("exec");

    // Add model if specified
    if let Some(ref model) = config.model {
        cmd.arg("--model").arg(model);
    }

    // Add sandbox policy
    cmd.arg("--sandbox").arg(config.sandbox.as_str());

    // Add approval policy
    cmd.arg("--ask-for-approval").arg(config.approval.as_str());

    // Add instruction
    cmd.arg(instruction);

    // Set working directory if specified
    if let Some(ref dir) = config.working_dir {
        cmd.current_dir(dir);
    }

    let output = cmd.output().await?;
    Ok(CodexResult::from_output(output))
}

/// Execute Codex X with default configuration (workspace-write + on-failure)
///
/// This is the recommended configuration for most coding tasks.
///
/// # Example
/// ```no_run
/// use miyabi_core::codex_helper::execute_codex_default;
///
/// #[tokio::main]
/// async fn main() {
///     let result = execute_codex_default(
///         "Add unit tests for the authentication module"
///     ).await.unwrap();
/// }
/// ```
pub async fn execute_codex_default(
    instruction: &str,
) -> Result<CodexResult, Box<dyn std::error::Error>> {
    execute_codex(instruction, CodexConfig::default()).await
}

/// Execute Codex X in read-only mode (safe for analysis)
///
/// # Example
/// ```no_run
/// use miyabi_core::codex_helper::execute_codex_readonly;
///
/// #[tokio::main]
/// async fn main() {
///     let result = execute_codex_readonly(
///         "Analyze the codebase for security vulnerabilities"
///     ).await.unwrap();
/// }
/// ```
pub async fn execute_codex_readonly(
    instruction: &str,
) -> Result<CodexResult, Box<dyn std::error::Error>> {
    let config = CodexConfig {
        sandbox: SandboxPolicy::ReadOnly,
        approval: ApprovalPolicy::Untrusted,
        ..Default::default()
    };
    execute_codex(instruction, config).await
}

/// Execute Codex X with full access (dangerous, use with caution)
///
/// # Example
/// ```no_run
/// use miyabi_core::codex_helper::execute_codex_full_access;
///
/// #[tokio::main]
/// async fn main() {
///     let result = execute_codex_full_access(
///         "Deploy application to production"
///     ).await.unwrap();
/// }
/// ```
pub async fn execute_codex_full_access(
    instruction: &str,
) -> Result<CodexResult, Box<dyn std::error::Error>> {
    let config = CodexConfig {
        sandbox: SandboxPolicy::DangerFullAccess,
        approval: ApprovalPolicy::OnRequest,
        ..Default::default()
    };
    execute_codex(instruction, config).await
}

/// Execute Codex X with a specific model
///
/// # Example
/// ```no_run
/// use miyabi_core::codex_helper::execute_codex_with_model;
///
/// #[tokio::main]
/// async fn main() {
///     let result = execute_codex_with_model(
///         "Optimize database queries",
///         "o3"
///     ).await.unwrap();
/// }
/// ```
pub async fn execute_codex_with_model(
    instruction: &str,
    model: &str,
) -> Result<CodexResult, Box<dyn std::error::Error>> {
    let config = CodexConfig {
        model: Some(model.to_string()),
        ..Default::default()
    };
    execute_codex(instruction, config).await
}

/// Execute Codex X in the specified directory
///
/// # Example
/// ```no_run
/// use miyabi_core::codex_helper::execute_codex_in_dir;
///
/// #[tokio::main]
/// async fn main() {
///     let result = execute_codex_in_dir(
///         "Add README.md",
///         "/path/to/project"
///     ).await.unwrap();
/// }
/// ```
pub async fn execute_codex_in_dir(
    instruction: &str,
    dir: &str,
) -> Result<CodexResult, Box<dyn std::error::Error>> {
    let config = CodexConfig {
        working_dir: Some(dir.to_string()),
        ..Default::default()
    };
    execute_codex(instruction, config).await
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sandbox_policy_as_str() {
        assert_eq!(SandboxPolicy::ReadOnly.as_str(), "read-only");
        assert_eq!(SandboxPolicy::WorkspaceWrite.as_str(), "workspace-write");
        assert_eq!(
            SandboxPolicy::DangerFullAccess.as_str(),
            "danger-full-access"
        );
    }

    #[test]
    fn test_approval_policy_as_str() {
        assert_eq!(ApprovalPolicy::Untrusted.as_str(), "untrusted");
        assert_eq!(ApprovalPolicy::OnFailure.as_str(), "on-failure");
        assert_eq!(ApprovalPolicy::OnRequest.as_str(), "on-request");
        assert_eq!(ApprovalPolicy::Never.as_str(), "never");
    }

    #[test]
    fn test_default_config() {
        let config = CodexConfig::default();
        assert!(config.model.is_none());
        assert!(matches!(config.sandbox, SandboxPolicy::WorkspaceWrite));
        assert!(matches!(config.approval, ApprovalPolicy::OnFailure));
        assert!(config.working_dir.is_none());
    }
}
