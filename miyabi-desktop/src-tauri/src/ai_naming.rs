//! AI-powered worktree naming using Anthropic Claude API
//!
//! Generates concise, descriptive names for Git worktrees based on GitHub Issue titles.

use anyhow::{Context, Result};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::time::Duration;

/// Anthropic API client for generating worktree names
#[derive(Clone)]
pub struct AnthropicClient {
    api_key: String,
    client: Client,
    model: String,
}

#[derive(Debug, Serialize)]
struct AnthropicRequest {
    model: String,
    max_tokens: usize,
    messages: Vec<Message>,
}

#[derive(Debug, Serialize)]
struct Message {
    role: String,
    content: String,
}

#[derive(Debug, Deserialize)]
struct AnthropicResponse {
    content: Vec<Content>,
}

#[derive(Debug, Deserialize)]
struct Content {
    text: String,
}

impl AnthropicClient {
    /// Create a new AnthropicClient
    ///
    /// # Arguments
    /// * `api_key` - Anthropic API key (from ANTHROPIC_API_KEY environment variable)
    ///
    /// # Example
    /// ```
    /// use miyabi_desktop_lib::ai_naming::AnthropicClient;
    ///
    /// let api_key = std::env::var("ANTHROPIC_API_KEY").unwrap();
    /// let client = AnthropicClient::new(api_key);
    /// ```
    pub fn new(api_key: String) -> Self {
        let client = Client::builder()
            .timeout(Duration::from_secs(30))
            .build()
            .expect("Failed to create HTTP client");

        Self {
            api_key,
            client,
            model: "claude-3-5-sonnet-20241022".to_string(),
        }
    }

    /// Generate a worktree name from an issue title
    ///
    /// Generates a concise, kebab-case name (max 30 characters) suitable for Git worktree naming.
    ///
    /// # Arguments
    /// * `issue_title` - The GitHub Issue title
    ///
    /// # Returns
    /// A kebab-case string representing a suitable worktree name
    ///
    /// # Example
    /// ```no_run
    /// # use miyabi_desktop_lib::ai_naming::AnthropicClient;
    /// # async fn example() -> anyhow::Result<()> {
    /// let client = AnthropicClient::new("api-key".to_string());
    /// let name = client.generate_worktree_name("Fix memory leak in logger.rs").await?;
    /// // name might be: "fix-logger-memory-leak"
    /// # Ok(())
    /// # }
    /// ```
    pub async fn generate_worktree_name(&self, issue_title: &str) -> Result<String> {
        let prompt = format!(
            "Generate a concise Git worktree name in kebab-case (max 30 characters) for this GitHub Issue:\n\n\"{}\"\n\nRequirements:\n- Use kebab-case (lowercase with hyphens)\n- Maximum 30 characters\n- Be descriptive but concise\n- Focus on the core problem or feature\n- Do NOT include \"issue\" or numbers\n- Return ONLY the name, no explanation\n\nExample: \"fix-memory-leak-logger\"",
            issue_title
        );

        let request = AnthropicRequest {
            model: self.model.clone(),
            max_tokens: 100,
            messages: vec![Message {
                role: "user".to_string(),
                content: prompt,
            }],
        };

        let response = self
            .client
            .post("https://api.anthropic.com/v1/messages")
            .header("x-api-key", &self.api_key)
            .header("anthropic-version", "2023-06-01")
            .header("content-type", "application/json")
            .json(&request)
            .send()
            .await
            .context("Failed to send request to Anthropic API")?;

        let status = response.status();
        if !status.is_success() {
            let error_text = response
                .text()
                .await
                .unwrap_or_else(|_| "Unknown error".to_string());
            anyhow::bail!("Anthropic API returned error {}: {}", status, error_text);
        }

        let api_response: AnthropicResponse = response
            .json()
            .await
            .context("Failed to parse Anthropic API response")?;

        let name = api_response
            .content
            .first()
            .map(|c| c.text.trim().to_string())
            .unwrap_or_else(|| "worktree".to_string());

        // Validate and sanitize the name
        let sanitized = self.sanitize_worktree_name(&name);

        Ok(sanitized)
    }

    /// Sanitize and validate worktree name
    fn sanitize_worktree_name(&self, name: &str) -> String {
        // First convert spaces to hyphens, then filter
        let mut sanitized = name
            .trim()
            .to_lowercase()
            .replace(' ', "-")
            .chars()
            .filter(|c| c.is_alphanumeric() || *c == '-')
            .collect::<String>();

        // Remove leading/trailing hyphens
        sanitized = sanitized.trim_matches('-').to_string();

        // Replace multiple consecutive hyphens with single hyphen
        while sanitized.contains("--") {
            sanitized = sanitized.replace("--", "-");
        }

        // Truncate to 30 characters
        if sanitized.len() > 30 {
            // Try to truncate at a hyphen to keep words intact
            if let Some(pos) = sanitized[..30].rfind('-') {
                sanitized.truncate(pos);
            } else {
                sanitized.truncate(30);
            }
        }

        // Fallback to generic name if empty
        if sanitized.is_empty() {
            sanitized = "worktree".to_string();
        }

        sanitized
    }

    /// Check if API key is configured
    pub fn is_configured(&self) -> bool {
        !self.api_key.is_empty() && self.api_key != "test-key"
    }
}

impl Default for AnthropicClient {
    /// Create client from ANTHROPIC_API_KEY environment variable
    fn default() -> Self {
        let api_key = std::env::var("ANTHROPIC_API_KEY").unwrap_or_else(|_| String::new());
        Self::new(api_key)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_new_client() {
        let client = AnthropicClient::new("test-key".to_string());
        assert_eq!(client.api_key, "test-key");
        assert_eq!(client.model, "claude-3-5-sonnet-20241022");
    }

    #[test]
    fn test_sanitize_worktree_name() {
        let client = AnthropicClient::new("test-key".to_string());

        assert_eq!(
            client.sanitize_worktree_name("Fix Memory Leak"),
            "fix-memory-leak"
        );
        assert_eq!(
            client.sanitize_worktree_name("Add--Multiple---Hyphens"),
            "add-multiple-hyphens"
        );
        assert_eq!(
            client.sanitize_worktree_name("Trailing Hyphen-"),
            "trailing-hyphen"
        );
        assert_eq!(
            client.sanitize_worktree_name("-Leading Hyphen"),
            "leading-hyphen"
        );
        assert_eq!(
            client.sanitize_worktree_name("Special!@#$%Characters"),
            "specialcharacters"
        );
        assert_eq!(
            client.sanitize_worktree_name(
                "This is a very long worktree name that exceeds thirty characters"
            ),
            "this-is-a-very-long-worktree"
        );
        assert_eq!(client.sanitize_worktree_name(""), "worktree");
        assert_eq!(client.sanitize_worktree_name("---"), "worktree");
    }

    #[test]
    fn test_is_configured() {
        let client = AnthropicClient::new("test-key".to_string());
        assert!(!client.is_configured()); // "test-key" is excluded

        let client = AnthropicClient::new("sk-ant-api03-xxx".to_string());
        assert!(client.is_configured());

        let client = AnthropicClient::new(String::new());
        assert!(!client.is_configured());
    }

    #[tokio::test]
    #[ignore] // Requires valid API key
    async fn test_generate_worktree_name_integration() {
        let api_key = std::env::var("ANTHROPIC_API_KEY").unwrap_or_default();
        if api_key.is_empty() {
            return; // Skip test if no API key
        }

        let client = AnthropicClient::new(api_key);
        let name = client
            .generate_worktree_name("Fix memory leak in logger.rs")
            .await
            .unwrap();

        assert!(!name.is_empty());
        assert!(name.len() <= 30);
        assert!(name.contains('-'));
        assert!(!name.contains(' '));
        assert_eq!(name, name.to_lowercase());
    }
}
