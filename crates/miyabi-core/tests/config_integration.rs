//! Integration tests for configuration management

use miyabi_core::{init_logger, Config, LogLevel};
use serial_test::serial;
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

    // Include required fields in YAML
    let config_content = r#"
github_token: ghp_yaml_token
device_identifier: yaml-device
log_level: info
log_directory: "./logs"
report_directory: "./reports"
"#;

    fs::write(&config_path, config_content).unwrap();
    env::set_current_dir(temp_dir.path()).unwrap();

    // Load config from file
    let config = Config::from_file(config_path.to_str().unwrap()).unwrap();

    // Verify config loaded from YAML (not env vars when using from_file directly)
    assert_eq!(config.github_token, "ghp_yaml_token");
    assert_eq!(config.device_identifier, "yaml-device");

    // Cleanup
    env::remove_var("GITHUB_TOKEN");
    env::remove_var("DEVICE_IDENTIFIER");
}

#[test]
#[serial]
fn test_logger_initialization() {
    // Note: tracing::subscriber::set_global_default() can only be called once per process
    // This test only verifies that init_logger() doesn't panic
    // Multiple calls in the same process will fail after the first successful initialization
    init_logger(LogLevel::Debug);

    // Cannot test multiple logger initializations in the same test process
    // as the global subscriber can only be set once
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

    // Minimal config with required fields
    let config_content = r#"
github_token: ghp_test
device_identifier: test-device
"#;

    fs::write(&config_path, config_content).unwrap();
    env::set_current_dir(temp_dir.path()).unwrap();

    let config = Config::from_file(config_path.to_str().unwrap()).unwrap();

    // Check default values are applied
    assert_eq!(config.log_level, "info");
    assert_eq!(config.max_concurrency, 3);
    assert_eq!(config.log_directory, "./logs");
    assert_eq!(config.report_directory, "./reports");
    assert_eq!(config.worktree_base_path, None); // default should be None
}
