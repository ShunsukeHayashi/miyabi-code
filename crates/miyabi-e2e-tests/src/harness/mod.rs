//! Test harness for E2E tests
//!
//! Provides setup, teardown, and context management for end-to-end tests.

use crate::fixtures::Fixtures;
use crate::mocks::MockGitHub;
use crate::E2EResult;
use miyabi_types::agent::AgentConfig;
use std::path::{Path, PathBuf};
use tempfile::TempDir;
use tracing::info;

/// Test context containing all resources needed for E2E testing
#[derive(Debug)]
pub struct TestContext {
    /// Temporary directory for test files
    pub temp_dir: TempDir,
    /// Mock GitHub server
    pub mock_github: Option<MockGitHub>,
    /// Agent configuration for testing
    pub config: AgentConfig,
    /// Test fixtures
    pub fixtures: Fixtures,
}

impl TestContext {
    /// Get the root path of the temporary test directory
    pub fn root_path(&self) -> &Path {
        self.temp_dir.path()
    }

    /// Get a path relative to the test root
    pub fn path<P: AsRef<Path>>(&self, relative: P) -> PathBuf {
        self.temp_dir.path().join(relative)
    }
}

/// Main test harness for E2E tests
///
/// Handles setup and teardown of test infrastructure including:
/// - Temporary directories
/// - Mock servers
/// - Test fixtures
/// - Agent configuration
pub struct TestHarness {
    context: TestContext,
}

impl TestHarness {
    /// Create a new test harness with default configuration
    pub async fn new() -> Self {
        Self::builder().build().await
    }

    /// Create a test harness builder for customization
    pub fn builder() -> TestHarnessBuilder {
        TestHarnessBuilder::default()
    }

    /// Get the test context
    pub fn context(&self) -> &TestContext {
        &self.context
    }

    /// Get mutable test context
    pub fn context_mut(&mut self) -> &mut TestContext {
        &mut self.context
    }

    /// Get test fixtures
    pub fn fixtures(&self) -> &Fixtures {
        &self.context.fixtures
    }

    /// Get agent configuration
    pub fn config(&self) -> &AgentConfig {
        &self.context.config
    }

    /// Get mock GitHub server
    pub fn mock_github(&self) -> Option<&MockGitHub> {
        self.context.mock_github.as_ref()
    }

    /// Initialize a git repository in the test directory
    pub async fn init_git_repo(&self) -> E2EResult<()> {
        let output = tokio::process::Command::new("git")
            .arg("init")
            .current_dir(self.context.root_path())
            .output()
            .await?;

        if !output.status.success() {
            return Err(format!(
                "Failed to initialize git repo: {}",
                String::from_utf8_lossy(&output.stderr)
            )
            .into());
        }

        // Configure git for testing
        let commands = vec![
            vec!["config", "user.name", "Test User"],
            vec!["config", "user.email", "test@example.com"],
            vec!["config", "commit.gpgsign", "false"],
        ];

        for args in commands {
            let output = tokio::process::Command::new("git")
                .args(&args)
                .current_dir(self.context.root_path())
                .output()
                .await?;

            if !output.status.success() {
                return Err(format!(
                    "Failed to configure git: {}",
                    String::from_utf8_lossy(&output.stderr)
                )
                .into());
            }
        }

        info!(
            "Initialized git repository at {:?}",
            self.context.root_path()
        );
        Ok(())
    }

    /// Create an initial commit in the test repository
    pub async fn create_initial_commit(&self) -> E2EResult<()> {
        // Create README
        let readme_path = self.context.path("README.md");
        tokio::fs::write(&readme_path, "# Test Repository\n\nInitial commit.\n").await?;

        // Stage and commit
        let commands = vec![vec!["add", "."], vec!["commit", "-m", "Initial commit"]];

        for args in commands {
            let output = tokio::process::Command::new("git")
                .args(&args)
                .current_dir(self.context.root_path())
                .output()
                .await?;

            if !output.status.success() {
                return Err(format!(
                    "Failed to create initial commit: {}",
                    String::from_utf8_lossy(&output.stderr)
                )
                .into());
            }
        }

        info!("Created initial commit");
        Ok(())
    }

    /// Clean up test resources
    pub async fn cleanup(self) {
        info!("Cleaning up test harness");
        // TempDir will be automatically cleaned up when dropped
        if let Some(mock) = self.context.mock_github {
            drop(mock);
        }
    }
}

/// Builder for test harness customization
#[derive(Default)]
pub struct TestHarnessBuilder {
    use_mock_github: bool,
    temp_dir_prefix: Option<String>,
}

impl TestHarnessBuilder {
    /// Enable mock GitHub server
    pub fn with_mock_github(mut self) -> Self {
        self.use_mock_github = true;
        self
    }

    /// Set custom temporary directory prefix
    pub fn with_temp_prefix(mut self, prefix: impl Into<String>) -> Self {
        self.temp_dir_prefix = Some(prefix.into());
        self
    }

    /// Build the test harness
    pub async fn build(self) -> TestHarness {
        // Create temporary directory
        let temp_dir = if let Some(prefix) = self.temp_dir_prefix {
            TempDir::with_prefix(prefix).expect("Failed to create temp directory")
        } else {
            TempDir::new().expect("Failed to create temp directory")
        };

        info!("Created test directory: {:?}", temp_dir.path());

        // Create mock GitHub server if requested
        let mock_github = if self.use_mock_github {
            Some(
                MockGitHub::start()
                    .await
                    .expect("Failed to start mock GitHub"),
            )
        } else {
            None
        };

        // Create default agent configuration
        let config = AgentConfig {
            device_identifier: "test-device-e2e".to_string(),
            github_token: "test-token-e2e".to_string(),
            repo_owner: Some("test-owner".to_string()),
            repo_name: Some("test-repo".to_string()),
            use_task_tool: false,
            use_worktree: true,
            worktree_base_path: Some(temp_dir.path().join(".worktrees")),
            log_directory: temp_dir.path().join("logs").to_string_lossy().to_string(),
            report_directory: temp_dir
                .path()
                .join("reports")
                .to_string_lossy()
                .to_string(),
            tech_lead_github_username: Some("tech-lead".to_string()),
            ciso_github_username: Some("ciso".to_string()),
            po_github_username: Some("product-owner".to_string()),
            firebase_production_project: None,
            firebase_staging_project: None,
            production_url: None,
            staging_url: None,
        };

        // Create directories
        std::fs::create_dir_all(temp_dir.path().join("logs"))
            .expect("Failed to create logs directory");
        std::fs::create_dir_all(temp_dir.path().join("reports"))
            .expect("Failed to create reports directory");

        let context = TestContext {
            temp_dir,
            mock_github,
            config,
            fixtures: Fixtures::new(),
        };

        TestHarness { context }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_harness_creation() {
        let harness = TestHarness::new().await;
        assert!(harness.context().root_path().exists());
        harness.cleanup().await;
    }

    #[tokio::test]
    async fn test_harness_with_mock_github() {
        let harness = TestHarness::builder().with_mock_github().build().await;
        assert!(harness.mock_github().is_some());
        harness.cleanup().await;
    }

    #[tokio::test]
    async fn test_git_repo_initialization() {
        let harness = TestHarness::new().await;
        harness
            .init_git_repo()
            .await
            .expect("Failed to initialize git repo");
        assert!(harness.context().path(".git").exists());
        harness.cleanup().await;
    }

    #[tokio::test]
    async fn test_initial_commit() {
        let harness = TestHarness::new().await;
        harness
            .init_git_repo()
            .await
            .expect("Failed to initialize git repo");
        harness
            .create_initial_commit()
            .await
            .expect("Failed to create initial commit");
        assert!(harness.context().path("README.md").exists());
        harness.cleanup().await;
    }
}
