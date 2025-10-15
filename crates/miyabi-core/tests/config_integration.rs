//! Integration tests for configuration management

use miyabi_core::{init_logger, Config, LogLevel};
use std::env;
use std::fs;
use tempfile::TempDir;

#[test]
fn test_config_load_from_file() {
    let temp_dir = TempDir::new().unwrap();
    let config_path = temp_dir.path().join(".miyabi.yml");

    // Create test config file
    let config_content = r#"
github_token: ghp_test
device_identifier: test-device
log_level: info
max_concurrency: 3
log_directory: "./logs"
report_directory: "./reports"
worktree_base_path: ".worktrees"
"#;

    fs::write(&config_path, config_content).unwrap();

    // Set required env vars
    env::set_var("GITHUB_TOKEN", "ghp_test");
    env::set_var("DEVICE_IDENTIFIER", "test-device");

    // Change to temp directory
    env::set_current_dir(temp_dir.path()).unwrap();

    // Load config
    let config = Config::from_file(config_path.to_str().unwrap()).unwrap();

    assert_eq!(config.log_directory, "./logs");
    assert_eq!(config.worktree_base_path, Some(".worktrees".to_string()));

    env::remove_var("GITHUB_TOKEN");
    env::remove_var("DEVICE_IDENTIFIER");
}

#[test]
fn test_config_with_env_vars() {
    env::set_var("GITHUB_TOKEN", "ghp_test_token");
    env::set_var("DEVICE_IDENTIFIER", "test-device");

    let temp_dir = TempDir::new().unwrap();
    let config_path = temp_dir.path().join(".miyabi.yml");

    let config_content = r#"
project_name: test-project
version: "0.1.0"

logging:
  level: info
  directory: "./logs"
"#;

    fs::write(&config_path, config_content).unwrap();
    env::set_current_dir(temp_dir.path()).unwrap();

    let config = Config::from_file(config_path.to_str().unwrap()).unwrap();

    assert_eq!(config.github_token, "ghp_test_token");
    assert_eq!(config.device_identifier, "test-device");

    // Cleanup
    env::remove_var("GITHUB_TOKEN");
    env::remove_var("DEVICE_IDENTIFIER");
}

#[test]
fn test_logger_initialization() {
    // Test different log levels
    init_logger(LogLevel::Debug);
    init_logger(LogLevel::Info);
    init_logger(LogLevel::Warn);
    init_logger(LogLevel::Error);

    // Should not panic
}

#[test]
fn test_config_missing_file() {
    let result = Config::from_file("/nonexistent/path/.miyabi.yml");
    assert!(result.is_err());
}

#[test]
fn test_config_default_values() {
    let temp_dir = TempDir::new().unwrap();
    let config_path = temp_dir.path().join(".miyabi.yml");

    // Minimal config
    let config_content = r#"
project_name: minimal-project
version: "0.1.0"
"#;

    fs::write(&config_path, config_content).unwrap();
    env::set_current_dir(temp_dir.path()).unwrap();

    // Set required env vars
    env::set_var("GITHUB_TOKEN", "ghp_test");
    env::set_var("DEVICE_IDENTIFIER", "test-device");

    let config = Config::from_file(config_path.to_str().unwrap()).unwrap();

    // Check default values
    assert_eq!(config.log_directory, "./logs");
    assert_eq!(config.report_directory, "./reports");
    assert_eq!(config.worktree_base_path, None); // default should be None

    env::remove_var("GITHUB_TOKEN");
    env::remove_var("DEVICE_IDENTIFIER");
}
