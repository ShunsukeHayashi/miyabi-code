//! GitHub API integration for Miyabi
//!
//! This crate provides a high-level wrapper around the Octocrab GitHub API client,
//! tailored for Miyabi's autonomous development workflow.
//!
//! # Features
//!
//! - **Issue Management**: Create, read, update, close issues
//! - **Label Management**: Full CRUD operations for labels, bulk sync for 53-label system
//! - **Pull Request Management**: Create, merge, close PRs
//! - **State-based Queries**: Filter issues by Miyabi state labels
//! - **Type Safety**: Uses miyabi-types for consistent type definitions
//!
//! # Examples
//!
//! ## Basic Issue Creation
//!
//! ```no_run
//! use miyabi_github::GitHubClient;
//! use miyabi_types::issue::IssueState;
//!
//! #[tokio::main]
//! async fn main() -> Result<(), Box<dyn std::error::Error>> {
//!     let client = GitHubClient::new("ghp_xxx", "owner", "repo")?;
//!
//!     // Get issues in "pending" state
//!     let pending = client.get_issues_by_state(IssueState::Pending).await?;
//!     println!("Found {} pending issues", pending.len());
//!
//!     // Create a new issue
//!     let issue = client.create_issue(
//!         "Implement new feature",
//!         Some("Feature description here")
//!     ).await?;
//!     println!("Created issue #{}", issue.number);
//!
//!     Ok(())
//! }
//! ```
//!
//! ## Creating Issues from DevIssue Struct
//!
//! ```no_run
//! use miyabi_github::GitHubClient;
//! use miyabi_types::issue::DevIssue;
//!
//! #[tokio::main]
//! async fn main() -> Result<(), Box<dyn std::error::Error>> {
//!     let client = GitHubClient::new("ghp_xxx", "owner", "repo")?;
//!
//!     // Create a DevIssue with labels and assignee
//!     let dev_issue = DevIssue::with_labels(
//!         "Fix authentication bug",
//!         "Users cannot login with SSO. Error occurs on login page.",
//!         vec!["type:bug".to_string(), "priority:high".to_string()]
//!     ).with_assignee("developer123");
//!
//!     // Create the issue and get the issue number
//!     let issue_number = client.create_issue_from_dev_issue(&dev_issue).await?;
//!     println!("Created issue #{}", issue_number);
//!
//!     Ok(())
//! }
//! ```

pub mod auth;
pub mod client;
pub mod issues;
pub mod labels;
pub mod projects;
pub mod pull_requests;

// Re-export main types
pub use auth::{check_gh_cli_status, discover_token, validate_token_format, GhCliStatus};
pub use client::GitHubClient;
pub use labels::Label;
pub use projects::{ContentType, KPIReport, ProjectItem};

// Re-export commonly used types from miyabi-types
pub use miyabi_types::issue::{DevIssue, Issue, IssueState, IssueStateGithub, PRResult, PRState};

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_lib_exports() {
        // Verify all exports are accessible
        let _: Option<GitHubClient> = None;
        let _: Option<Label> = None;
        let _: Option<Issue> = None;
        let _: Option<IssueState> = None;
    }
}
