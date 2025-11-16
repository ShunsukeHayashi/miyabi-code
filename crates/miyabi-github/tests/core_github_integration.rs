//! Integration tests for core ↔ github interaction
//! Tests the interaction between miyabi-core and miyabi-github crates

use miyabi_core::Config;
use miyabi_github::GitHubClient;
use miyabi_types::{Issue, IssueFilter};
use std::env;
use std::fs;
use tempfile::TempDir;

/// Helper to create test config
fn create_test_config() -> Config {
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

    Config::from_file(config_path.to_str().unwrap()).unwrap()
}

#[tokio::test]
async fn test_github_client_initialization() {
    let config = create_test_config();

    // Create GitHub client from config
    let result = GitHubClient::new(&config.github_token);

    assert!(result.is_ok());
}

#[tokio::test]
async fn test_github_client_with_config_token() {
    let config = create_test_config();

    let client = GitHubClient::new(&config.github_token).unwrap();

    // Verify client is properly initialized
    assert!(client.token().starts_with("ghp_"));
}

#[test]
fn test_issue_filter_creation() {
    let filter = IssueFilter {
        state: Some("open".to_string()),
        labels: vec!["type:test".to_string()],
        assignee: None,
        milestone: None,
        since: None,
    };

    assert_eq!(filter.state, Some("open".to_string()));
    assert_eq!(filter.labels.len(), 1);
}

#[test]
fn test_config_repo_validation() {
    let config = create_test_config();

    assert_eq!(config.repo_owner, Some("test-owner".to_string()));
    assert_eq!(config.repo_name, Some("test-repo".to_string()));

    // Validate repository format
    if let (Some(owner), Some(name)) = (&config.repo_owner, &config.repo_name) {
        let repo_full_name = format!("{}/{}", owner, name);
        assert_eq!(repo_full_name, "test-owner/test-repo");
    }
}

#[test]
fn test_github_token_validation() {
    let config = create_test_config();

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
    let config = create_test_config();
    let issue_number = 418;

    if let (Some(owner), Some(repo)) = (&config.repo_owner, &config.repo_name) {
        let url = format!("https://github.com/{}/{}/issues/{}", owner, repo, issue_number);
        assert_eq!(url, "https://github.com/test-owner/test-repo/issues/418");
    }
}

#[tokio::test]
async fn test_github_api_error_handling() {
    // Test with invalid token
    let result = GitHubClient::new("");
    assert!(result.is_err());
}

#[test]
fn test_issue_label_parsing() {
    let labels = vec![
        "type:test".to_string(),
        "priority:P1-High".to_string(),
        "agent:codegen".to_string(),
    ];

    // Parse type
    let type_labels: Vec<_> = labels.iter().filter(|l| l.starts_with("type:")).collect();
    assert_eq!(type_labels.len(), 1);
    assert_eq!(*type_labels[0], "type:test");

    // Parse priority
    let priority_labels: Vec<_> = labels.iter().filter(|l| l.starts_with("priority:")).collect();
    assert_eq!(priority_labels.len(), 1);
    assert_eq!(*priority_labels[0], "priority:P1-High");
}

#[test]
fn test_config_directory_paths() {
    let config = create_test_config();

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
        state: miyabi_types::issue::IssueStateGithub::Open,
        labels: vec!["type:test".to_string()],
        assignee: Some("testuser".to_string()),
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
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
    assert_eq!(config.repo_owner, None);
    assert_eq!(config.repo_name, None);
    assert_eq!(config.tech_lead_github_username, None);
}

#[test]
fn test_github_rate_limit_handling() {
    // Test rate limit configuration
    let config = create_test_config();

    // Default max_concurrency should limit parallel requests
    assert!(config.max_concurrency > 0);
    assert!(config.max_concurrency <= 10); // Reasonable limit
}

#[test]
fn test_issue_milestone_handling() {
    let filter = IssueFilter {
        state: Some("open".to_string()),
        labels: vec![],
        assignee: None,
        milestone: Some("Week 16".to_string()),
        since: None,
    };

    assert_eq!(filter.milestone, Some("Week 16".to_string()));
}

#[test]
fn test_github_username_validation() {
    let config = create_test_config();

    // Test usernames if present
    if let Some(username) = &config.tech_lead_github_username {
        // GitHub usernames are alphanumeric with hyphens
        assert!(!username.is_empty());
        assert!(username.chars().all(|c| c.is_alphanumeric() || c == '-'));
    }
}
