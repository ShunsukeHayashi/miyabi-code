//! GitHub API client wrapper
//!
//! Provides a high-level interface to GitHub API using octocrab

use miyabi_types::error::{MiyabiError, Result};
use octocrab::Octocrab;

/// GitHub API client
#[derive(Clone)]
pub struct GitHubClient {
    pub(crate) client: Octocrab,
    pub(crate) owner: String,
    pub(crate) repo: String,
}

impl GitHubClient {
    /// Create a new GitHub client with personal access token
    ///
    /// # Arguments
    /// * `token` - GitHub personal access token (ghp_xxx)
    /// * `owner` - Repository owner (user or organization)
    /// * `repo` - Repository name
    ///
    /// # Example
    /// ```no_run
    /// use miyabi_github::GitHubClient;
    ///
    /// let client = GitHubClient::new("ghp_xxx", "user", "repo")?;
    /// # Ok::<(), miyabi_types::error::MiyabiError>(())
    /// ```
    pub fn new(
        token: impl Into<String>,
        owner: impl Into<String>,
        repo: impl Into<String>,
    ) -> Result<Self> {
        let client = Octocrab::builder()
            .personal_token(token.into())
            .build()
            .map_err(|e| MiyabiError::GitHub(format!("Failed to build Octocrab client: {}", e)))?;

        Ok(Self {
            client,
            owner: owner.into(),
            repo: repo.into(),
        })
    }

    /// Get the underlying Octocrab client for advanced usage
    pub fn octocrab(&self) -> &Octocrab {
        &self.client
    }

    /// Get repository owner
    pub fn owner(&self) -> &str {
        &self.owner
    }

    /// Get repository name
    pub fn repo(&self) -> &str {
        &self.repo
    }

    /// Get full repository name (owner/repo)
    pub fn full_name(&self) -> String {
        format!("{}/{}", self.owner, self.repo)
    }

    /// Verify authentication by fetching current user
    pub async fn verify_auth(&self) -> Result<String> {
        let user = self
            .client
            .current()
            .user()
            .await
            .map_err(|e| MiyabiError::GitHub(format!("Authentication failed: {}", e)))?;

        Ok(user.login)
    }

    /// Get repository information
    pub async fn get_repository(&self) -> Result<octocrab::models::Repository> {
        self.client
            .repos(&self.owner, &self.repo)
            .get()
            .await
            .map_err(|e| {
                MiyabiError::GitHub(format!(
                    "Failed to get repository {}/{}: {}",
                    self.owner, self.repo, e
                ))
            })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_client_creation() {
        // Test with dummy token (will fail auth, but construction should work)
        let client = GitHubClient::new("ghp_test", "owner", "repo");
        assert!(client.is_ok());

        let client = client.unwrap();
        assert_eq!(client.owner(), "owner");
        assert_eq!(client.repo(), "repo");
        assert_eq!(client.full_name(), "owner/repo");
    }

    #[tokio::test]
    async fn test_client_cloning() {
        let client = GitHubClient::new("ghp_test", "owner", "repo").unwrap();
        let _cloned = client.clone();
        assert_eq!(client.owner(), "owner");
    }

    // Note: Integration tests requiring real GitHub API calls are in tests/ directory
}
