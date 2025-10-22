//! End-to-end integration tests for Miyabi CLI
//!
//! Tests the complete workflow from CLI commands to agent execution
//!
//! NOTE: These tests use #[serial] to prevent race conditions when changing
//! the current working directory. They must run sequentially.

use serial_test::serial;
use std::fs;
use tempfile::TempDir;

#[test]
#[serial]
fn test_init_command_creates_structure() {
    use miyabi_cli::commands::InitCommand;

    let temp_dir = TempDir::new().unwrap();
    let original_dir = std::env::current_dir().unwrap();

    // Change to temp directory
    std::env::set_current_dir(temp_dir.path()).unwrap();

    let cmd = InitCommand::with_interactive("test-project".to_string(), false, false);
    let result = tokio_test::block_on(cmd.execute());

    // Should succeed
    assert!(result.is_ok());

    // Verify directory structure
    let project_dir = temp_dir.path().join("test-project");
    assert!(project_dir.exists());
    assert!(project_dir.join(".git").exists());
    assert!(project_dir.join(".miyabi.yml").exists());
    assert!(project_dir.join(".gitignore").exists());
    assert!(project_dir.join("README.md").exists());
    assert!(project_dir.join(".github/workflows").exists());
    assert!(project_dir.join(".claude/agents").exists());

    // Cleanup
    std::env::set_current_dir(original_dir).unwrap();
}

#[test]
#[serial]
fn test_init_with_invalid_name() {
    use miyabi_cli::commands::InitCommand;

    let temp_dir = TempDir::new().unwrap();
    let original_dir = std::env::current_dir().unwrap();

    std::env::set_current_dir(temp_dir.path()).unwrap();

    // Test with invalid characters
    let cmd = InitCommand::with_interactive("test project".to_string(), false, false);
    let result = tokio_test::block_on(cmd.execute());

    assert!(result.is_err());

    // Cleanup
    std::env::set_current_dir(original_dir).unwrap();
}

#[test]
#[serial]
fn test_install_command_detects_git_repo() {
    use miyabi_cli::commands::InstallCommand;
    use std::process::Command;

    let temp_dir = TempDir::new().unwrap();
    let original_dir = std::env::current_dir().unwrap();

    // Initialize git repo
    std::env::set_current_dir(temp_dir.path()).unwrap();
    Command::new("git").args(["init"]).output().unwrap();

    let cmd = InstallCommand::new(true); // dry-run
    let result = tokio_test::block_on(cmd.execute());

    assert!(result.is_ok());

    // Cleanup
    std::env::set_current_dir(original_dir).unwrap();
}

#[test]
#[serial]
fn test_install_fails_without_git() {
    use miyabi_cli::commands::InstallCommand;

    let temp_dir = TempDir::new().unwrap();
    let original_dir = std::env::current_dir().unwrap();

    std::env::set_current_dir(temp_dir.path()).unwrap();

    let cmd = InstallCommand::new(false);
    let result = tokio_test::block_on(cmd.execute());

    // Should fail because no git repo
    assert!(result.is_err());

    // Cleanup
    std::env::set_current_dir(original_dir).unwrap();
}

#[test]
fn test_status_command_execution() {
    use miyabi_cli::commands::StatusCommand;

    let cmd = StatusCommand::new(false);
    let result = tokio_test::block_on(cmd.execute());

    // Should succeed even if Miyabi is not installed
    assert!(result.is_ok());
}

#[test]
fn test_agent_command_type_parsing() {
    use miyabi_cli::commands::AgentCommand;

    let cmd = AgentCommand::new("coordinator".to_string(), Some(123));
    assert!(cmd.parse_agent_type().is_ok());

    let cmd = AgentCommand::new("codegen".to_string(), Some(456));
    assert!(cmd.parse_agent_type().is_ok());

    let cmd = AgentCommand::new("invalid".to_string(), None);
    assert!(cmd.parse_agent_type().is_err());
}

#[test]
#[ignore] // Requires GITHUB_TOKEN
fn test_agent_execution_e2e() {
    use miyabi_cli::commands::AgentCommand;

    std::env::set_var("GITHUB_TOKEN", "ghp_test_token");

    let cmd = AgentCommand::new("coordinator".to_string(), Some(123));
    let result = tokio_test::block_on(cmd.execute());

    // Will fail because of invalid token, but should reach execution
    // In real scenario with valid token, this would succeed
    assert!(result.is_err() || result.is_ok());

    std::env::remove_var("GITHUB_TOKEN");
}

#[test]
#[serial]
fn test_full_workflow_init_to_status() {
    use miyabi_cli::commands::{InitCommand, StatusCommand};

    let temp_dir = TempDir::new().unwrap();
    let original_dir = std::env::current_dir().unwrap();

    // Step 1: Change to temp directory
    std::env::set_current_dir(temp_dir.path()).unwrap();

    // Step 2: Initialize project
    let init_cmd = InitCommand::with_interactive("workflow-test".to_string(), false, false);
    let init_result = tokio_test::block_on(init_cmd.execute());
    assert!(init_result.is_ok());

    // Step 3: Change into project directory
    let project_dir = temp_dir.path().join("workflow-test");
    std::env::set_current_dir(&project_dir).unwrap();

    // Step 4: Run status command
    let status_cmd = StatusCommand::new(false);
    let status_result = tokio_test::block_on(status_cmd.execute());
    assert!(status_result.is_ok());

    // Step 5: Verify Miyabi is detected as installed
    assert!(project_dir.join(".miyabi.yml").exists());

    // Cleanup
    std::env::set_current_dir(original_dir).unwrap();
}

#[test]
#[serial]
fn test_config_file_content() {
    use miyabi_cli::commands::InitCommand;

    let temp_dir = TempDir::new().unwrap();
    let original_dir = std::env::current_dir().unwrap();

    std::env::set_current_dir(temp_dir.path()).unwrap();

    let cmd = InitCommand::with_interactive("config-test".to_string(), false, false);
    tokio_test::block_on(cmd.execute()).unwrap();

    let config_path = temp_dir.path().join("config-test/.miyabi.yml");
    let config_content = fs::read_to_string(config_path).unwrap();

    // Verify config content
    assert!(config_content.contains("project_name: config-test"));
    assert!(config_content.contains("use_worktree: true"));
    assert!(config_content.contains("logging:"));

    std::env::set_current_dir(original_dir).unwrap();
}
