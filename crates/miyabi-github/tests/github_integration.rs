//! Integration tests for GitHub API client
//!
//! Note: These tests require a valid GITHUB_TOKEN and will hit the real GitHub API.
//! They are marked as #[ignore] by default. Run with: cargo test -- --ignored

use miyabi_github::GitHubClient;

#[test]
#[ignore] // Requires GITHUB_TOKEN
fn test_github_client_auth() {
    let token = std::env::var("GITHUB_TOKEN").expect("GITHUB_TOKEN not set");
    let client = GitHubClient::new(&token, "ShunsukeHayashi", "Miyabi").unwrap();

    // Verify authentication
    let result = tokio_test::block_on(client.verify_auth());
    assert!(result.is_ok());
}

#[test]
fn test_github_client_creation() {
    let client = GitHubClient::new("ghp_test", "owner", "repo");
    assert!(client.is_ok());

    let client = client.unwrap();
    assert_eq!(client.owner(), "owner");
    assert_eq!(client.repo(), "repo");
    assert_eq!(client.full_name(), "owner/repo");
}

#[test]
fn test_github_client_cloning() {
    let client = GitHubClient::new("ghp_test", "owner", "repo").unwrap();
    let cloned = client.clone();

    assert_eq!(client.owner(), cloned.owner());
    assert_eq!(client.repo(), cloned.repo());
}

#[test]
#[ignore] // Requires GITHUB_TOKEN and network access
fn test_list_issues() {
    let token = std::env::var("GITHUB_TOKEN").expect("GITHUB_TOKEN not set");
    let client = GitHubClient::new(&token, "ShunsukeHayashi", "Miyabi").unwrap();

    let result = tokio_test::block_on(client.list_issues(None, vec![]));
    assert!(result.is_ok());
}

#[test]
#[ignore] // Requires GITHUB_TOKEN and network access
fn test_get_repository() {
    let token = std::env::var("GITHUB_TOKEN").expect("GITHUB_TOKEN not set");
    let client = GitHubClient::new(&token, "ShunsukeHayashi", "Miyabi").unwrap();

    let result = tokio_test::block_on(client.get_repository());
    assert!(result.is_ok());

    let repo = result.unwrap();
    assert_eq!(repo.name, "Miyabi");
}

// Test error cases
#[test]
fn test_invalid_token() {
    let client = GitHubClient::new("invalid_token", "owner", "repo").unwrap();

    // This should fail authentication
    let result = tokio_test::block_on(client.verify_auth());
    assert!(result.is_err());
}
