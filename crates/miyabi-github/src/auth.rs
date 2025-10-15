//! GitHub authentication utilities
//!
//! Provides utilities for discovering and validating GitHub authentication tokens
//! from multiple sources with fallback logic.

use miyabi_types::error::{MiyabiError, Result};
use std::fs;
use std::process::Command;

/// Discover GitHub token from multiple sources with fallback
///
/// Tries the following sources in order:
/// 1. `GITHUB_TOKEN` environment variable
/// 2. `gh auth token` command (GitHub CLI)
/// 3. `~/.config/gh/hosts.yml` file
///
/// # Returns
/// - `Ok(String)` with the token if found
/// - `Err(MiyabiError::Auth)` with helpful setup instructions if not found
///
/// # Examples
///
/// ```no_run
/// use miyabi_github::auth::discover_token;
///
/// # async fn example() -> miyabi_types::error::Result<()> {
/// let token = discover_token()?;
/// println!("Found token: {}", &token[..10]); // Print first 10 chars
/// # Ok(())
/// # }
/// ```
pub fn discover_token() -> Result<String> {
    // Try 1: GITHUB_TOKEN environment variable
    if let Ok(token) = std::env::var("GITHUB_TOKEN") {
        if !token.is_empty() && token.starts_with("ghp_") {
            tracing::debug!("Found GitHub token from GITHUB_TOKEN environment variable");
            return Ok(token);
        }
    }

    // Try 2: gh CLI command
    if let Ok(token) = get_token_from_gh_cli() {
        tracing::debug!("Found GitHub token from gh CLI");
        return Ok(token);
    }

    // Try 3: gh config file
    if let Ok(token) = get_token_from_gh_config() {
        tracing::debug!("Found GitHub token from gh config file");
        return Ok(token);
    }

    // No token found - return detailed error with setup instructions
    Err(MiyabiError::Auth(
        "GitHub token not found. Please set up authentication:\n\n\
         Option 1: Set environment variable\n\
         \x20 export GITHUB_TOKEN=ghp_your_token_here\n\
         \x20 # Add to ~/.zshrc or ~/.bashrc for persistence\n\n\
         Option 2: Use GitHub CLI (recommended)\n\
         \x20 gh auth login\n\
         \x20 # Follow the interactive prompts\n\n\
         Option 3: Create a Personal Access Token\n\
         \x20 1. Go to https://github.com/settings/tokens\n\
         \x20 2. Generate new token (classic) with 'repo' scope\n\
         \x20 3. Set GITHUB_TOKEN environment variable\n\n\
         For more help, see: https://docs.github.com/en/authentication"
            .to_string(),
    ))
}

/// Get token from gh CLI using `gh auth token` command
fn get_token_from_gh_cli() -> Result<String> {
    let output = Command::new("gh")
        .args(["auth", "token"])
        .output()
        .map_err(|e| MiyabiError::Auth(format!("Failed to execute gh command: {}", e)))?;

    if output.status.success() {
        let token = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if !token.is_empty() && token.starts_with("ghp_") {
            return Ok(token);
        }
    }

    Err(MiyabiError::Auth(
        "gh CLI is available but not authenticated".to_string(),
    ))
}

/// Get token from gh config file (~/.config/gh/hosts.yml)
fn get_token_from_gh_config() -> Result<String> {
    let config_path = dirs::home_dir()
        .ok_or_else(|| MiyabiError::Auth("Could not determine home directory".to_string()))?
        .join(".config")
        .join("gh")
        .join("hosts.yml");

    if !config_path.exists() {
        return Err(MiyabiError::Auth(
            "gh config file not found".to_string(),
        ));
    }

    let content = fs::read_to_string(&config_path).map_err(|e| {
        MiyabiError::Auth(format!("Failed to read gh config file: {}", e))
    })?;

    // Parse YAML to extract token
    // Format: github.com:
    //           oauth_token: ghp_xxx
    for line in content.lines() {
        let trimmed = line.trim();
        if trimmed.starts_with("oauth_token:") {
            if let Some(token) = trimmed.split(':').nth(1) {
                let token = token.trim().to_string();
                if token.starts_with("ghp_") {
                    return Ok(token);
                }
            }
        }
    }

    Err(MiyabiError::Auth(
        "No oauth_token found in gh config file".to_string(),
    ))
}

/// Validate that a token looks correct (starts with ghp_)
///
/// This is a simple format check, not a full validation against GitHub API.
pub fn validate_token_format(token: &str) -> Result<()> {
    if token.is_empty() {
        return Err(MiyabiError::Auth("Token is empty".to_string()));
    }

    if !token.starts_with("ghp_") && !token.starts_with("gho_") && !token.starts_with("ghs_") {
        return Err(MiyabiError::Auth(
            "Token does not start with expected prefix (ghp_, gho_, or ghs_)".to_string(),
        ));
    }

    if token.len() < 20 {
        return Err(MiyabiError::Auth(
            "Token is too short (expected at least 20 characters)".to_string(),
        ));
    }

    Ok(())
}

/// Check if GitHub CLI is installed and authenticated
pub fn check_gh_cli_status() -> GhCliStatus {
    // Check if gh is installed
    let output = Command::new("which").arg("gh").output();
    if output.is_err() || !output.as_ref().unwrap().status.success() {
        return GhCliStatus::NotInstalled;
    }

    // Check if authenticated
    let output = Command::new("gh").args(["auth", "status"]).output();
    if let Ok(output) = output {
        if output.status.success() {
            return GhCliStatus::Authenticated;
        }
    }

    GhCliStatus::NotAuthenticated
}

/// GitHub CLI status
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum GhCliStatus {
    /// gh CLI is not installed
    NotInstalled,
    /// gh CLI is installed but not authenticated
    NotAuthenticated,
    /// gh CLI is installed and authenticated
    Authenticated,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_token_format_valid() {
        assert!(validate_token_format("ghp_1234567890abcdefghij").is_ok());
        assert!(validate_token_format("gho_1234567890abcdefghij").is_ok());
        assert!(validate_token_format("ghs_1234567890abcdefghij").is_ok());
    }

    #[test]
    fn test_validate_token_format_invalid() {
        assert!(validate_token_format("").is_err());
        assert!(validate_token_format("invalid").is_err());
        assert!(validate_token_format("ghp_123").is_err()); // Too short
        assert!(validate_token_format("xyz_1234567890abcdefghij").is_err());
    }

    #[test]
    fn test_gh_cli_status() {
        // Just ensure it doesn't panic
        let status = check_gh_cli_status();
        // Status will vary by environment, so just check it's one of the valid variants
        assert!(matches!(
            status,
            GhCliStatus::NotInstalled
                | GhCliStatus::NotAuthenticated
                | GhCliStatus::Authenticated
        ));
    }

    #[test]
    fn test_discover_token_doesnt_panic() {
        // Just ensure it doesn't panic (may error if no token is set)
        let _ = discover_token();
    }
}
