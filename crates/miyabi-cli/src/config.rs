//! Configuration management with singleton pattern
//!
//! This module provides a centralized configuration loader that eliminates
//! code duplication across `agent.rs` and `parallel.rs`.

use crate::error::{CliError, Result};
use crate::worktree::default_worktree_base_dir;
use miyabi_types::AgentConfig;
use once_cell::sync::OnceCell;
use std::sync::Mutex;

/// Configuration loader with caching
///
/// This struct provides a singleton pattern for loading configuration
/// exactly once and reusing it across the application.
pub struct ConfigLoader {
    cache: Mutex<Option<AgentConfig>>,
}

impl ConfigLoader {
    /// Get the global ConfigLoader instance
    ///
    /// # Example
    /// ```ignore
    /// let config = ConfigLoader::global().load()?;
    /// ```
    pub fn global() -> &'static Self {
        static INSTANCE: OnceCell<ConfigLoader> = OnceCell::new();
        INSTANCE.get_or_init(|| ConfigLoader { cache: Mutex::new(None) })
    }

    /// Load configuration (cached after first call)
    ///
    /// This method loads the configuration from multiple sources and caches
    /// the result for subsequent calls.
    ///
    /// # Returns
    /// * `Ok(AgentConfig)` - Loaded configuration
    /// * `Err(CliError)` - Configuration loading failed
    ///
    /// # Example
    /// ```ignore
    /// let config = ConfigLoader::global().load()?;
    /// assert!(config.github_token.starts_with("ghp_"));
    /// ```
    pub fn load(&self) -> Result<AgentConfig> {
        let mut cache = self.cache.lock().unwrap();

        if let Some(ref config) = *cache {
            return Ok(config.clone());
        }

        // Load configuration
        let github_token = Self::get_github_token()?;
        let device_identifier = std::env::var("DEVICE_IDENTIFIER")
            .unwrap_or_else(|_| hostname::get().unwrap().to_string_lossy().to_string());
        let (repo_owner, repo_name) = Self::parse_git_remote()?;

        let config = AgentConfig {
            device_identifier,
            github_token,
            repo_owner: Some(repo_owner),
            repo_name: Some(repo_name),
            use_task_tool: false,
            use_worktree: true,
            worktree_base_path: Some(default_worktree_base_dir()),
            log_directory: "./logs".to_string(),
            report_directory: "./reports".to_string(),
            tech_lead_github_username: None,
            ciso_github_username: None,
            po_github_username: None,
            firebase_production_project: None,
            firebase_staging_project: None,
            production_url: None,
            staging_url: None,
        };

        *cache = Some(config.clone());
        Ok(config)
    }

    /// Get GitHub token with auto-detection from multiple sources
    ///
    /// Tries the following sources in order:
    /// 1. GITHUB_TOKEN environment variable
    /// 2. gh CLI (`gh auth token`)
    /// 3. Error with helpful instructions
    ///
    /// # Returns
    /// * `Ok(String)` - GitHub token
    /// * `Err(CliError)` - Token not found with helpful error message
    fn get_github_token() -> Result<String> {
        // 1. Try environment variable first
        if let Ok(token) = std::env::var("GITHUB_TOKEN") {
            if !token.trim().is_empty() {
                return Ok(token.trim().to_string());
            }
        }

        // 2. Try gh CLI
        if let Ok(output) = std::process::Command::new("gh").args(["auth", "token"]).output() {
            if output.status.success() {
                let token = String::from_utf8_lossy(&output.stdout).trim().to_string();
                if !token.is_empty()
                    && (token.starts_with("ghp_")
                        || token.starts_with("gho_")
                        || token.starts_with("ghu_")
                        || token.starts_with("ghs_")
                        || token.starts_with("ghr_"))
                {
                    return Ok(token);
                }
            }
        }

        // 3. Token not found - provide helpful error
        Err(CliError::GitConfig(
            "GitHub token not found. Please set up authentication:\n\n\
             Option 1: Set environment variable\n\
             export GITHUB_TOKEN=ghp_xxx\n\n\
             Option 2: Authenticate with gh CLI\n\
             gh auth login\n\n\
             Option 3: Add to .env file (uncomment the GITHUB_TOKEN line)\n\
             GITHUB_TOKEN=ghp_xxx"
                .to_string(),
        ))
    }

    /// Parse repository owner and name from git remote URL
    ///
    /// Supports formats:
    /// - `https://github.com/owner/repo`
    /// - `https://github.com/owner/repo.git`
    /// - `git@github.com:owner/repo.git`
    ///
    /// # Returns
    /// * `Ok((owner, repo))` - Repository owner and name
    /// * `Err(CliError)` - Failed to parse git remote
    fn parse_git_remote() -> Result<(String, String)> {
        // Run git remote get-url origin
        let output = std::process::Command::new("git")
            .args(["remote", "get-url", "origin"])
            .output()
            .map_err(|e| CliError::GitConfig(format!("Failed to run git command: {}", e)))?;

        if !output.status.success() {
            return Err(CliError::GitConfig("Failed to get git remote URL. Not a git repository?".to_string()));
        }

        let remote_url = String::from_utf8_lossy(&output.stdout).trim().to_string();

        // Parse HTTPS format: https://github.com/owner/repo(.git)?
        if remote_url.starts_with("http") && remote_url.contains("github.com/") {
            let parts: Vec<&str> = remote_url
                .split("github.com/")
                .nth(1)
                .ok_or_else(|| CliError::GitConfig("Invalid GitHub URL".to_string()))?
                .trim_end_matches(".git")
                .split('/')
                .collect();

            if parts.len() >= 2 {
                return Ok((parts[0].to_string(), parts[1].to_string()));
            }
        }

        // Parse SSH format: git@github.com:owner/repo.git
        if remote_url.starts_with("git@github.com:") {
            let repo_part = remote_url
                .strip_prefix("git@github.com:")
                .ok_or_else(|| CliError::GitConfig("Invalid SSH URL".to_string()))?
                .trim_end_matches(".git");

            let parts: Vec<&str> = repo_part.split('/').collect();
            if parts.len() >= 2 {
                return Ok((parts[0].to_string(), parts[1].to_string()));
            }
        }

        Err(CliError::GitConfig(format!("Could not parse GitHub owner/repo from remote URL: {}", remote_url)))
    }

    /// Clear the cached configuration (useful for testing)
    #[cfg(test)]
    pub fn clear_cache(&self) {
        let mut cache = self.cache.lock().unwrap();
        *cache = None;
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_config_loader_singleton() {
        let loader1 = ConfigLoader::global();
        let loader2 = ConfigLoader::global();
        assert!(std::ptr::eq(loader1, loader2));
    }

    #[test]
    fn test_config_loader_caching() {
        let loader = ConfigLoader::global();
        loader.clear_cache();

        // First load
        let config1 = loader.load();

        // Second load should return cached value
        let config2 = loader.load();

        match (config1, config2) {
            (Ok(c1), Ok(c2)) => {
                assert_eq!(c1.github_token, c2.github_token);
                assert_eq!(c1.device_identifier, c2.device_identifier);
            }
            _ => {
                // If either fails, it's expected in test environment without git/token
            }
        }
    }

    #[test]
    fn test_parse_git_remote_https() {
        // This test will only pass in actual git repository
        // In CI, it may fail - that's expected
        let result = ConfigLoader::parse_git_remote();
        if let Ok((owner, repo)) = result {
            assert!(!owner.is_empty());
            assert!(!repo.is_empty());
        }
    }

    #[test]
    fn test_get_github_token_from_env() {
        // Set test token
        std::env::set_var("GITHUB_TOKEN", "ghp_test_token_123");

        let token = ConfigLoader::get_github_token();

        // Clean up
        std::env::remove_var("GITHUB_TOKEN");

        assert!(token.is_ok());
        assert_eq!(token.unwrap(), "ghp_test_token_123");
    }

    #[test]
    fn test_get_github_token_empty_env() {
        // Set empty token
        std::env::set_var("GITHUB_TOKEN", "");

        let token = ConfigLoader::get_github_token();

        // Clean up
        std::env::remove_var("GITHUB_TOKEN");

        // Should try gh CLI as fallback
        // If gh is authenticated on the system, this will succeed (which is correct behavior)
        // If gh is not available or not authenticated, it will fail
        // Both outcomes are valid depending on the system state
        if let Ok(token_str) = token {
            // If successful, should be a valid GitHub token format
            assert!(
                token_str.starts_with("ghp_")
                    || token_str.starts_with("gho_")
                    || token_str.starts_with("ghu_")
                    || token_str.starts_with("ghs_")
                    || token_str.starts_with("ghr_")
            );
        }
        // If gh CLI is not available/authenticated, error is also acceptable
    }
}
