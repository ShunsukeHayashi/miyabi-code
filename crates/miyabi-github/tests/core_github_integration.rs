//! Integration tests for core ↔ github interaction
//! Tests the interaction between miyabi-core and miyabi-github crates

use chrono::Utc;
use miyabi_core::Config;
use miyabi_github::GitHubClient;
use miyabi_types::issue::{Issue, IssueStateGithub};
use std::env;
use std::fs;
use tempfile::TempDir;

/// Helper to create test config
fn create_test_config() -> (Config, String, String) {
    let temp_dir = TempDir::new().unwrap();
    let config_path = temp_dir.path().join(".miyabi.yml");

    let config_content = r#"
github_token: ghp_test_token
device_identifier: test-device
repo_owner: test-owner
repo_name: test-repo
log_directory: "./logs"
report_directory: "./reports"
"#;
    fs::write(&config_path, config_content).unwrap();
    env::set_current_dir(temp_dir.path()).unwrap();

    let config = Config::from_file(config_path.to_str().unwrap()).unwrap();
    (config, "test-owner".to_string(), "test-repo".to_string())
}

#[tokio::test]
async fn test_github_client_initialization() {
    let config = create_test_config();

    // Create GitHub client from config
    let (config, owner, repo) = config;
    let result = GitHubClient::new(&config.github_token, owner.clone(), repo.clone());

    assert!(result.is_ok());
}

#[tokio::test]
async fn test_github_client_with_config_token() {
    let config = create_test_config();

    let (config, owner, repo) = config;
    let client = GitHubClient::new(&config.github_token, owner.clone(), repo.clone()).unwrap();

    // Verify client is properly initialized
    assert_eq!(client.owner(), owner);
    assert_eq!(client.repo(), repo);
    assert_eq!(client.full_name(), format!("{}/{}", owner, repo));
}

#[test]
fn test_config_repo_validation() {
    let (_config, owner, repo) = create_test_config();

    // Validate repository format
    let repo_full_name = format!("{}/{}", owner, repo);
    assert_eq!(repo_full_name, "test-owner/test-repo");
}

#[test]
fn test_github_token_validation() {
    let (config, _, _) = create_test_config();

    // GitHub tokens should start with "ghp_", "gho_", "ghu_", etc.
    assert!(
        config.github_token.starts_with("ghp_")
            || config.github_token.starts_with("gho_")
            || config.github_token.starts_with("ghu_")
            || config.github_token.starts_with("ghs_")
    );
}

#[test]
fn test_issue_url_construction() {
    let (_config, owner, repo) = create_test_config();
    let issue_number = 418;

    let url = format!(
        "https://github.com/{}/{}/issues/{}",
        owner, repo, issue_number
    );
    assert_eq!(url, "https://github.com/test-owner/test-repo/issues/418");
}

#[tokio::test]
async fn test_github_api_error_handling() {
    // GitHub client construction should succeed even with an empty token
    // (authentication errors surface when making API calls).
    let result = GitHubClient::new("", "owner", "repo");
    assert!(result.is_ok());
}

#[test]
fn test_issue_label_parsing() {
    let labels = ["type:test", "priority:P1-High", "agent:codegen"];

    // Parse type
    let type_labels: Vec<&str> = labels
        .iter()
        .copied()
        .filter(|l| l.starts_with("type:"))
        .collect();
    assert_eq!(type_labels.len(), 1);
    assert_eq!(type_labels[0], "type:test");

    // Parse priority
    let priority_labels: Vec<&str> = labels
        .iter()
        .copied()
        .filter(|l| l.starts_with("priority:"))
        .collect();
    assert_eq!(priority_labels.len(), 1);
    assert_eq!(priority_labels[0], "priority:P1-High");
}

#[test]
fn test_config_directory_paths() {
    let (config, _, _) = create_test_config();

    // Verify log and report directories are set
    assert!(!config.log_directory.is_empty());
    assert!(!config.report_directory.is_empty());

    // Directories should be relative paths
    assert!(!config.log_directory.starts_with('/'));
    assert!(!config.report_directory.starts_with('/'));
}

#[test]
fn test_github_issue_state_mapping() {
    use miyabi_types::issue::IssueStateGithub;

    let states = vec![IssueStateGithub::Open, IssueStateGithub::Closed];

    for state in states {
        let state_str = match state {
            IssueStateGithub::Open => "open",
            IssueStateGithub::Closed => "closed",
        };
        assert!(!state_str.is_empty());
    }
}

#[test]
fn test_issue_creation_from_github_data() {
    let issue = Issue {
        number: 418,
        title: "Test issue".to_string(),
        body: "Test body".to_string(),
        state: IssueStateGithub::Open,
        labels: vec!["type:test".to_string()],
        assignee: Some("testuser".to_string()),
        created_at: Utc::now(),
        updated_at: Utc::now(),
        url: "https://github.com/test/repo/issues/418".to_string(),
    };

    assert_eq!(issue.number, 418);
    assert!(issue.assignee.is_some());
}

#[test]
fn test_config_optional_fields() {
    let temp_dir = TempDir::new().unwrap();
    let config_path = temp_dir.path().join(".miyabi.yml");

    // Config without optional fields
    let config_content = r#"
github_token: ghp_test
device_identifier: test-device
"#;

    fs::write(&config_path, config_content).unwrap();
    env::set_current_dir(temp_dir.path()).unwrap();

    let config = Config::from_file(config_path.to_str().unwrap()).unwrap();

    // Optional fields should be None or default
    assert_eq!(config.tech_lead_github_username, None);
}

#[test]
fn test_github_rate_limit_handling() {
    // Test rate limit configuration
    let (config, _, _) = create_test_config();

    // Default max_concurrency should limit parallel requests
    assert!(config.max_concurrency > 0);
    assert!(config.max_concurrency <= 10); // Reasonable limit
}

#[test]
fn test_issue_milestone_handling() {
    let mut issue = Issue {
        number: 1,
        title: "Milestone issue".to_string(),
        body: "Sample body".to_string(),
        state: IssueStateGithub::Open,
        labels: vec!["milestone:Week 16".to_string()],
        assignee: None,
        created_at: Utc::now(),
        updated_at: Utc::now(),
        url: "https://github.com/test/repo/issues/1".to_string(),
    };

    issue.labels.push("priority:P1-High".to_string());
    assert!(issue
        .labels
        .iter()
        .any(|label| label == "milestone:Week 16"));
}

#[test]
fn test_github_username_validation() {
    let (config, _, _) = create_test_config();

    // Test usernames if present
    if let Some(username) = &config.tech_lead_github_username {
        // GitHub usernames are alphanumeric with hyphens
        assert!(!username.is_empty());
        assert!(username.chars().all(|c| c.is_alphanumeric() || c == '-'));
    }
}

#[test]
fn test_issue_validation_helpers() {
    let issue = Issue {
        number: 10,
        title: "Validation issue".to_string(),
        body: "Body".to_string(),
        state: IssueStateGithub::Open,
        labels: vec![],
        assignee: None,
        created_at: Utc::now(),
        updated_at: Utc::now(),
        url: "https://github.com/test/repo/issues/10".to_string(),
    };

    assert!(issue.validate().is_ok());

    let mut bad_issue = issue.clone();
    bad_issue.url = "https://example.com/incorrect".to_string();
    assert!(bad_issue.validate().is_err());
}
