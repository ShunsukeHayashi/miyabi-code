//! Integration tests for core ↔ worktree interaction
//! Tests the interaction between miyabi-core and miyabi-worktree crates

use miyabi_core::Config;
use miyabi_worktree::{Worktree, WorktreeStatus};
use std::env;
use std::fs;
use std::path::PathBuf;
use tempfile::TempDir;

/// Helper to create test config with worktree settings
fn create_worktree_config() -> Config {
    let temp_dir = TempDir::new().unwrap();
    let config_path = temp_dir.path().join(".miyabi.yml");

    let config_content = r#"
github_token: ghp_test_token
device_identifier: test-device
use_worktree: true
worktree_base_path: ".worktrees"
log_directory: "./logs"
report_directory: "./reports"
"#;

    fs::write(&config_path, config_content).unwrap();
    env::set_current_dir(temp_dir.path()).unwrap();

    Config::from_file(config_path.to_str().unwrap()).unwrap()
}

#[test]
fn test_worktree_config_integration() {
    let config = create_worktree_config();

    assert!(config.use_worktree);
    assert_eq!(config.worktree_base_path, Some(PathBuf::from(".worktrees")));
}

#[test]
fn test_worktree_path_construction() {
    let config = create_worktree_config();
    let issue_number = 418;

    if let Some(base_path) = &config.worktree_base_path {
        let worktree_path = base_path.join(format!("issue-{}", issue_number));
        assert_eq!(worktree_path, PathBuf::from(".worktrees/issue-418"));
    }
}

#[test]
fn test_worktree_creation_from_config() {
    let config = create_worktree_config();

    let worktree = Worktree {
        id: "test-worktree-001".to_string(),
        path: config
            .worktree_base_path
            .unwrap_or_else(|| PathBuf::from(".worktrees"))
            .join("test-worktree"),
        branch: "test-branch".to_string(),
        issue_number: Some(418),
        status: WorktreeStatus::Active,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };

    assert_eq!(worktree.issue_number, Some(418));
    assert_eq!(worktree.status, WorktreeStatus::Active);
}

#[test]
fn test_config_without_worktree() {
    let temp_dir = TempDir::new().unwrap();
    let config_path = temp_dir.path().join(".miyabi.yml");

    let config_content = r#"
github_token: ghp_test_token
device_identifier: test-device
use_worktree: false
"#;

    fs::write(&config_path, config_content).unwrap();
    env::set_current_dir(temp_dir.path()).unwrap();

    let config = Config::from_file(config_path.to_str().unwrap()).unwrap();

    assert!(!config.use_worktree);
    assert_eq!(config.worktree_base_path, None);
}

#[test]
fn test_worktree_naming_convention() {
    let config = create_worktree_config();
    let issue_number = 418;

    // Standard naming: issue-{number}
    let worktree_name = format!("issue-{}", issue_number);
    assert_eq!(worktree_name, "issue-418");

    if let Some(base_path) = &config.worktree_base_path {
        let full_path = base_path.join(&worktree_name);
        assert!(full_path.to_str().unwrap().contains("issue-418"));
    }
}

#[test]
fn test_worktree_status_transitions() {
    let statuses = vec![
        WorktreeStatus::Active,
        WorktreeStatus::Completed,
        WorktreeStatus::Failed,
        WorktreeStatus::Abandoned,
    ];

    for status in statuses {
        let status_str = match status {
            WorktreeStatus::Active => "active",
            WorktreeStatus::Completed => "completed",
            WorktreeStatus::Failed => "failed",
            WorktreeStatus::Abandoned => "abandoned",
        };
        assert!(!status_str.is_empty());
    }
}

#[test]
fn test_multiple_worktrees_config() {
    let config = create_worktree_config();

    // Test multiple worktree paths
    let issue_numbers = vec![418, 419, 420];

    if let Some(base_path) = &config.worktree_base_path {
        let worktree_paths: Vec<_> = issue_numbers
            .iter()
            .map(|num| base_path.join(format!("issue-{}", num)))
            .collect();

        assert_eq!(worktree_paths.len(), 3);
        assert!(worktree_paths[0].to_str().unwrap().contains("issue-418"));
        assert!(worktree_paths[1].to_str().unwrap().contains("issue-419"));
        assert!(worktree_paths[2].to_str().unwrap().contains("issue-420"));
    }
}

#[test]
fn test_worktree_concurrency_limit() {
    let config = create_worktree_config();

    // Max concurrency should limit parallel worktrees
    assert!(config.max_concurrency > 0);
    assert!(config.max_concurrency <= 10);
}

#[test]
fn test_worktree_cleanup_paths() {
    let config = create_worktree_config();

    if let Some(base_path) = &config.worktree_base_path {
        // Cleanup should remove worktree directory
        let worktree_path = base_path.join("issue-test");

        // Path should be under base_path
        assert!(worktree_path.starts_with(base_path));
    }
}

#[test]
fn test_worktree_branch_naming() {
    let issue_number = 418;
    let branch_name = format!("issue-{}-feature", issue_number);

    assert_eq!(branch_name, "issue-418-feature");
    assert!(branch_name.starts_with("issue-"));
}
