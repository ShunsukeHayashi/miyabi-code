//! GitHub Issues API wrapper

use crate::client::GitHubClient;
use anyhow::Result;
use miyabi_types::Issue;

impl GitHubClient {
    pub async fn get_issue(&self, owner: &str, repo: &str, number: u64) -> Result<Issue> {
        // TODO: Implement
        todo!("Implement get_issue")
    }

    pub async fn list_issues(&self, owner: &str, repo: &str) -> Result<Vec<Issue>> {
        // TODO: Implement
        todo!("Implement list_issues")
    }
}
