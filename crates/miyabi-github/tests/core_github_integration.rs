//! Integration tests for core ↔ github interaction
//! Tests the interaction between miyabi-core and miyabi-github crates

use miyabi_core::Config;
use miyabi_github::GitHubClient;
use miyabi_types::issue::DevIssue;
use miyabi_types::Issue;
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
    let result = GitHubClient::new(&config.github_token, "test-owner", "test-repo");

    assert!(result.is_ok());
}

#[tokio::test]
async fn test_github_client_with_config_token() {
    let config = create_test_config();

    let client = GitHubClient::new(&config.github_token, "test-owner", "test-repo").unwrap();

    // Verify client is properly initialized
    assert_eq!(client.owner(), "test-owner");
    assert_eq!(client.repo(), "test-repo");
}

#[test]
fn test_config_repo_validation() {
    let config = create_test_config();

    // Config now doesn't have repo_owner/repo_name
    // These are passed directly to GitHubClient::new
    let owner = "test-owner";
    let name = "test-repo";

    let repo_full_name = format!("{}/{}", owner, name);
    assert_eq!(repo_full_name, "test-owner/test-repo");

    // Config should have required fields
    assert!(!config.github_token.is_empty());
    assert!(!config.device_identifier.is_empty());
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
    let owner = "test-owner";
    let repo = "test-repo";
    let issue_number = 418;

    let url = format!("https://github.com/{}/{}/issues/{}", owner, repo, issue_number);
    assert_eq!(url, "https://github.com/test-owner/test-repo/issues/418");
}

#[tokio::test]
async fn test_github_api_error_handling() {
    // Test with empty token - GitHubClient should still create (Octocrab allows it)
    // But operations will fail
    let result = GitHubClient::new("", "test", "repo");
    // Empty token may or may not be rejected at construction time
    // depending on Octocrab's behavior
    let _ = result; // Just verify it doesn't panic
}

#[test]
fn test_issue_label_parsing() {
    let labels = [
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

    // Optional fields should be None
    assert_eq!(config.tech_lead_github_username, None);
}

#[test]
fn test_github_rate_limit_handling() {
    // Test rate limit configuration
    let config = create_test_config();

    // Default max_concurrency should limit parallel requests
    assert!(config.max_concurrency > 0);
    assert!(config.max_concurrency <= 100); // Reasonable limit based on validation
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

// ========================================================================
// DevIssue Tests
// ========================================================================

#[test]
fn test_dev_issue_creation() {
    let dev_issue = DevIssue::new("Test issue", "This is a test issue body");

    assert_eq!(dev_issue.title, "Test issue");
    assert_eq!(dev_issue.body, "This is a test issue body");
    assert!(dev_issue.labels.is_none());
    assert!(dev_issue.assignee.is_none());
}

#[test]
fn test_dev_issue_with_labels() {
    let labels = vec!["type:feature".to_string(), "priority:high".to_string()];
    let dev_issue = DevIssue::with_labels("Add new feature", "Feature description", labels.clone());

    assert_eq!(dev_issue.title, "Add new feature");
    assert_eq!(dev_issue.labels, Some(labels));
}

#[test]
fn test_dev_issue_with_assignee() {
    let dev_issue = DevIssue::new("Fix bug", "Bug description").with_assignee("developer123");

    assert_eq!(dev_issue.assignee, Some("developer123".to_string()));
}

#[test]
fn test_dev_issue_builder_pattern() {
    let dev_issue = DevIssue::new("Implement feature", "Feature details")
        .with_labels_chained(vec!["type:feature".to_string(), "priority:medium".to_string()])
        .with_assignee("dev456");

    assert_eq!(dev_issue.title, "Implement feature");
    assert_eq!(dev_issue.body, "Feature details");
    assert!(dev_issue.labels.is_some());
    assert_eq!(dev_issue.assignee, Some("dev456".to_string()));
}

#[test]
fn test_dev_issue_validation_success() {
    let dev_issue = DevIssue::new("Valid title", "Valid body");
    assert!(dev_issue.validate().is_ok());
}

#[test]
fn test_dev_issue_validation_empty_title() {
    let dev_issue = DevIssue::new("", "Body");
    let result = dev_issue.validate();
    assert!(result.is_err());
    assert!(result.unwrap_err().contains("title cannot be empty"));
}

#[test]
fn test_dev_issue_validation_title_too_long() {
    let long_title = "a".repeat(257);
    let dev_issue = DevIssue::new(long_title, "Body");
    let result = dev_issue.validate();
    assert!(result.is_err());
    assert!(result.unwrap_err().contains("title too long"));
}
