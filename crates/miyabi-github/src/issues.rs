//! GitHub Issues API wrapper
//!
//! Provides high-level interface for Issue CRUD operations and label management

use crate::client::GitHubClient;
use miyabi_types::error::{MiyabiError, Result};
use miyabi_types::issue::{Issue, IssueState, IssueStateGithub};
use octocrab::models::issues::Issue as OctoIssue;
use octocrab::params::State;

impl GitHubClient {
    /// Get a single issue by number
    ///
    /// # Arguments
    /// * `number` - Issue number
    ///
    /// # Returns
    /// `Issue` struct with all metadata
    pub async fn get_issue(&self, number: u64) -> Result<Issue> {
        let issue = self
            .client
            .issues(&self.owner, &self.repo)
            .get(number)
            .await
            .map_err(|e| {
                MiyabiError::GitHub(format!(
                    "Failed to get issue #{} from {}/{}: {}",
                    number, self.owner, self.repo, e
                ))
            })?;

        convert_issue(issue)
    }

    /// List issues with optional filtering
    ///
    /// # Arguments
    /// * `state` - Filter by state (Open/Closed/All)
    /// * `labels` - Filter by labels (empty = all)
    ///
    /// # Returns
    /// Vector of `Issue` structs
    pub async fn list_issues(
        &self,
        state: Option<State>,
        labels: Vec<String>,
    ) -> Result<Vec<Issue>> {
        let issues = self.client.issues(&self.owner, &self.repo);
        let mut handler = issues.list();

        // Apply filters
        if let Some(s) = state {
            handler = handler.state(s);
        }

        if !labels.is_empty() {
            handler = handler.labels(&labels);
        }

        let page = handler.send().await.map_err(|e| {
            MiyabiError::GitHub(format!(
                "Failed to list issues for {}/{}: {}",
                self.owner, self.repo, e
            ))
        })?;

        page.items.into_iter().map(convert_issue).collect()
    }

    /// Create a new issue
    ///
    /// # Arguments
    /// * `title` - Issue title
    /// * `body` - Issue body (optional)
    ///
    /// # Returns
    /// Created `Issue` struct
    pub async fn create_issue(&self, title: &str, body: Option<&str>) -> Result<Issue> {
        let issues = self.client.issues(&self.owner, &self.repo);
        let mut handler = issues.create(title);

        if let Some(b) = body {
            handler = handler.body(b);
        }

        let issue = handler.send().await.map_err(|e| {
            MiyabiError::GitHub(format!(
                "Failed to create issue in {}/{}: {}",
                self.owner, self.repo, e
            ))
        })?;

        convert_issue(issue)
    }

    /// Update an existing issue
    ///
    /// # Arguments
    /// * `number` - Issue number to update
    /// * `title` - New title (optional)
    /// * `body` - New body (optional)
    /// * `state` - New state (optional)
    ///
    /// # Returns
    /// Updated `Issue` struct
    pub async fn update_issue(
        &self,
        number: u64,
        title: Option<&str>,
        body: Option<&str>,
        state: Option<State>,
    ) -> Result<Issue> {
        use octocrab::models::IssueState as OctoState;

        let issues = self.client.issues(&self.owner, &self.repo);
        let mut handler = issues.update(number);

        if let Some(t) = title {
            handler = handler.title(t);
        }

        if let Some(b) = body {
            handler = handler.body(b);
        }

        if let Some(s) = state {
            let issue_state = match s {
                State::Open => OctoState::Open,
                State::Closed => OctoState::Closed,
                State::All => {
                    return Err(MiyabiError::GitHub(
                        "Cannot update issue to 'All' state".to_string(),
                    ))
                }
                _ => return Err(MiyabiError::GitHub(format!("Unknown state: {:?}", s))),
            };
            handler = handler.state(issue_state);
        }

        let issue = handler.send().await.map_err(|e| {
            MiyabiError::GitHub(format!(
                "Failed to update issue #{} in {}/{}: {}",
                number, self.owner, self.repo, e
            ))
        })?;

        convert_issue(issue)
    }

    /// Close an issue
    pub async fn close_issue(&self, number: u64) -> Result<Issue> {
        self.update_issue(number, None, None, Some(State::Closed))
            .await
    }

    /// Reopen an issue
    pub async fn reopen_issue(&self, number: u64) -> Result<Issue> {
        self.update_issue(number, None, None, Some(State::Open))
            .await
    }

    /// Add labels to an issue
    ///
    /// # Arguments
    /// * `number` - Issue number
    /// * `labels` - Labels to add
    pub async fn add_labels(&self, number: u64, labels: &[String]) -> Result<Vec<String>> {
        let labels_result = self
            .client
            .issues(&self.owner, &self.repo)
            .add_labels(number, labels)
            .await
            .map_err(|e| {
                MiyabiError::GitHub(format!(
                    "Failed to add labels to issue #{} in {}/{}: {}",
                    number, self.owner, self.repo, e
                ))
            })?;

        Ok(labels_result.into_iter().map(|l| l.name).collect())
    }

    /// Remove a label from an issue
    ///
    /// # Arguments
    /// * `number` - Issue number
    /// * `label` - Label to remove
    pub async fn remove_label(&self, number: u64, label: &str) -> Result<()> {
        self.client
            .issues(&self.owner, &self.repo)
            .remove_label(number, label)
            .await
            .map_err(|e| {
                MiyabiError::GitHub(format!(
                    "Failed to remove label '{}' from issue #{} in {}/{}: {}",
                    label, number, self.owner, self.repo, e
                ))
            })?;

        Ok(())
    }

    /// Replace all labels on an issue
    ///
    /// # Arguments
    /// * `number` - Issue number
    /// * `labels` - New set of labels
    pub async fn replace_labels(&self, number: u64, labels: &[String]) -> Result<Vec<String>> {
        let labels_result = self
            .client
            .issues(&self.owner, &self.repo)
            .replace_all_labels(number, labels)
            .await
            .map_err(|e| {
                MiyabiError::GitHub(format!(
                    "Failed to replace labels on issue #{} in {}/{}: {}",
                    number, self.owner, self.repo, e
                ))
            })?;

        Ok(labels_result.into_iter().map(|l| l.name).collect())
    }

    /// Get issues by state label (e.g., "state:pending")
    ///
    /// # Arguments
    /// * `state` - IssueState enum value
    ///
    /// # Returns
    /// Vector of issues with that state label
    pub async fn get_issues_by_state(&self, state: IssueState) -> Result<Vec<Issue>> {
        let label = state.to_label().to_string();
        self.list_issues(Some(State::Open), vec![label]).await
    }
}

/// Convert octocrab Issue to miyabi-types Issue
fn convert_issue(issue: OctoIssue) -> Result<Issue> {
    use octocrab::models::IssueState as OctoState;

    let state = match issue.state {
        OctoState::Open => IssueStateGithub::Open,
        OctoState::Closed => IssueStateGithub::Closed,
        _ => {
            return Err(MiyabiError::GitHub(format!(
                "Unknown issue state: {:?}",
                issue.state
            )))
        }
    };

    let assignee = issue.assignee.map(|a| a.login);

    let labels = issue
        .labels
        .into_iter()
        .map(|l| l.name)
        .collect::<Vec<String>>();

    Ok(Issue {
        number: issue.number,
        title: issue.title,
        body: issue.body.unwrap_or_default(),
        state,
        labels,
        assignee,
        created_at: issue.created_at,
        updated_at: issue.updated_at,
        url: issue.html_url.to_string(),
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    // Unit tests for conversion functions

    #[test]
    fn test_issue_state_conversion() {
        // Test IssueState::to_label() is correct
        assert_eq!(IssueState::Pending.to_label(), "📥 state:pending");
        assert_eq!(IssueState::Analyzing.to_label(), "🔍 state:analyzing");
        assert_eq!(IssueState::Implementing.to_label(), "🏗️ state:implementing");
        assert_eq!(IssueState::Reviewing.to_label(), "👀 state:reviewing");
        assert_eq!(IssueState::Deploying.to_label(), "🚀 state:deploying");
        assert_eq!(IssueState::Done.to_label(), "✅ state:done");
        assert_eq!(IssueState::Blocked.to_label(), "🚫 state:blocked");
        assert_eq!(IssueState::Failed.to_label(), "❌ state:failed");
    }

    // Integration tests are in tests/ directory
}
