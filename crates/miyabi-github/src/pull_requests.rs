//! GitHub Pull Requests API wrapper
//!
//! Provides high-level interface for PR operations

use crate::client::GitHubClient;
use miyabi_types::error::{MiyabiError, Result};
use miyabi_types::issue::{PRResult, PRState};
use octocrab::models::pulls::PullRequest as OctoPR;
use octocrab::params::pulls::State as PullState;
use octocrab::params::State;

impl GitHubClient {
    /// Get a single pull request by number
    ///
    /// # Arguments
    /// * `number` - Pull request number
    pub async fn get_pull_request(&self, number: u64) -> Result<PRResult> {
        let pr = self.client.pulls(&self.owner, &self.repo).get(number).await.map_err(|e| {
            MiyabiError::GitHub(format!(
                "Failed to get pull request #{} from {}/{}: {}",
                number, self.owner, self.repo, e
            ))
        })?;

        convert_pull_request(pr)
    }

    /// List pull requests with optional filtering
    ///
    /// # Arguments
    /// * `state` - Filter by state (Open/Closed/All)
    pub async fn list_pull_requests(&self, state: Option<State>) -> Result<Vec<PRResult>> {
        let pulls = self.client.pulls(&self.owner, &self.repo);
        let mut handler = pulls.list();

        // Apply state filter
        if let Some(s) = state {
            handler = handler.state(s);
        }

        let page = handler.send().await.map_err(|e| {
            MiyabiError::GitHub(format!(
                "Failed to list pull requests for {}/{}: {}",
                self.owner, self.repo, e
            ))
        })?;

        page.items.into_iter().map(convert_pull_request).collect()
    }

    /// Create a pull request
    ///
    /// # Arguments
    /// * `title` - PR title
    /// * `head` - Branch containing changes
    /// * `base` - Base branch (e.g., "main")
    /// * `body` - PR body (optional)
    /// * `draft` - Create as draft PR
    pub async fn create_pull_request(
        &self,
        title: &str,
        head: &str,
        base: &str,
        body: Option<&str>,
        draft: bool,
    ) -> Result<PRResult> {
        let pulls = self.client.pulls(&self.owner, &self.repo);
        let mut handler = pulls.create(title, head, base);

        if let Some(b) = body {
            handler = handler.body(b);
        }

        handler = handler.draft(draft);

        let pr = handler.send().await.map_err(|e| {
            MiyabiError::GitHub(format!(
                "Failed to create pull request in {}/{}: {}",
                self.owner, self.repo, e
            ))
        })?;

        convert_pull_request(pr)
    }

    /// Update a pull request
    ///
    /// # Arguments
    /// * `number` - PR number to update
    /// * `title` - New title (optional)
    /// * `body` - New body (optional)
    /// * `state` - New state (optional)
    pub async fn update_pull_request(
        &self,
        number: u64,
        title: Option<&str>,
        body: Option<&str>,
        state: Option<PullState>,
    ) -> Result<PRResult> {
        let pulls = self.client.pulls(&self.owner, &self.repo);
        let mut handler = pulls.update(number);

        if let Some(t) = title {
            handler = handler.title(t);
        }

        if let Some(b) = body {
            handler = handler.body(b);
        }

        if let Some(s) = state {
            handler = handler.state(s);
        }

        let pr = handler.send().await.map_err(|e| {
            MiyabiError::GitHub(format!(
                "Failed to update pull request #{} in {}/{}: {}",
                number, self.owner, self.repo, e
            ))
        })?;

        convert_pull_request(pr)
    }

    /// Close a pull request (without merging)
    pub async fn close_pull_request(&self, number: u64) -> Result<PRResult> {
        self.update_pull_request(number, None, None, Some(PullState::Closed)).await
    }

    /// Merge a pull request
    ///
    /// # Arguments
    /// * `number` - PR number to merge
    /// * `commit_title` - Merge commit title (optional)
    /// * `commit_message` - Merge commit message (optional)
    pub async fn merge_pull_request(
        &self,
        number: u64,
        commit_title: Option<&str>,
        commit_message: Option<&str>,
    ) -> Result<()> {
        let pulls = self.client.pulls(&self.owner, &self.repo);
        let mut handler = pulls.merge(number);

        if let Some(title) = commit_title {
            handler = handler.title(title);
        }

        if let Some(message) = commit_message {
            handler = handler.message(message);
        }

        handler.send().await.map_err(|e| {
            MiyabiError::GitHub(format!(
                "Failed to merge pull request #{} in {}/{}: {}",
                number, self.owner, self.repo, e
            ))
        })?;

        Ok(())
    }

    /// Check if a pull request is mergeable
    pub async fn is_mergeable(&self, number: u64) -> Result<bool> {
        let pr = self.get_pull_request(number).await?;

        // A PR is mergeable if it's in Open state (not Closed or Merged)
        Ok(matches!(pr.state, PRState::Open | PRState::Draft))
    }
}

/// Convert octocrab PullRequest to miyabi-types PRResult
fn convert_pull_request(pr: OctoPR) -> Result<PRResult> {
    use octocrab::models::IssueState as OctoState;

    let state = if pr.merged_at.is_some() {
        PRState::Merged
    } else if pr.draft.unwrap_or(false) {
        PRState::Draft
    } else {
        match pr.state {
            Some(OctoState::Open) => PRState::Open,
            Some(OctoState::Closed) => PRState::Closed,
            Some(ref s) => {
                return Err(MiyabiError::GitHub(format!("Unknown pull request state: {:?}", s)))
            },
            None => return Err(MiyabiError::GitHub("Pull request state is missing".to_string())),
        }
    };

    Ok(PRResult {
        number: pr.number,
        url: pr.html_url.map(|u| u.to_string()).unwrap_or_default(),
        state,
        created_at: pr
            .created_at
            .ok_or_else(|| MiyabiError::GitHub("Pull request created_at is missing".to_string()))?,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_pr_state_conversion() {
        // Test PRState enum (defined in miyabi-types)
        // Just verify we can use it
        let _draft = PRState::Draft;
        let _open = PRState::Open;
        let _merged = PRState::Merged;
        let _closed = PRState::Closed;
    }

    // Integration tests requiring GitHub API are in tests/ directory
}
