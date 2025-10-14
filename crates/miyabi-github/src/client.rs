//! GitHub API client

use anyhow::Result;
use octocrab::Octocrab;

pub struct GitHubClient {
    client: Octocrab,
}

impl GitHubClient {
    pub fn new(token: impl Into<String>) -> Result<Self> {
        let client = Octocrab::builder()
            .personal_token(token.into())
            .build()?;
        Ok(Self { client })
    }

    pub fn octocrab(&self) -> &Octocrab {
        &self.client
    }
}
