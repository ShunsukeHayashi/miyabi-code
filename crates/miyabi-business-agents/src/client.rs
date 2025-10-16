//! Claude API client for business agents
//!
//! Provides a high-level interface to the Claude API for generating business plans.

use anyhow::{Context, Result};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::env;
use tracing::{debug, info};

const CLAUDE_API_URL: &str = "https://api.anthropic.com/v1/messages";
const DEFAULT_MODEL: &str = "claude-sonnet-4-20250514";
const DEFAULT_MAX_TOKENS: u32 = 8192;

/// Claude API client
pub struct ClaudeClient {
    http_client: Client,
    api_key: String,
    model: String,
}

impl ClaudeClient {
    /// Create a new Claude client
    ///
    /// # Errors
    ///
    /// Returns error if ANTHROPIC_API_KEY environment variable is not set
    pub fn new() -> Result<Self> {
        let api_key = env::var("ANTHROPIC_API_KEY")
            .context("ANTHROPIC_API_KEY environment variable not set")?;

        Ok(Self {
            http_client: Client::new(),
            api_key,
            model: DEFAULT_MODEL.to_string(),
        })
    }

    /// Create client with custom model
    pub fn with_model(mut self, model: String) -> Self {
        self.model = model;
        self
    }

    /// Generate business plan using Claude API
    ///
    /// # Arguments
    ///
    /// * `system_prompt` - System instructions for the agent
    /// * `user_prompt` - User query with business context
    ///
    /// # Returns
    ///
    /// Claude's response as a string
    pub async fn generate(&self, system_prompt: &str, user_prompt: &str) -> Result<String> {
        info!("Generating business plan with Claude {}", self.model);
        debug!("System prompt length: {} chars", system_prompt.len());
        debug!("User prompt length: {} chars", user_prompt.len());

        let request = ClaudeRequest {
            model: self.model.clone(),
            max_tokens: DEFAULT_MAX_TOKENS,
            system: system_prompt.to_string(),
            messages: vec![Message {
                role: "user".to_string(),
                content: user_prompt.to_string(),
            }],
        };

        let response = self
            .http_client
            .post(CLAUDE_API_URL)
            .header("x-api-key", &self.api_key)
            .header("anthropic-version", "2023-06-01")
            .header("content-type", "application/json")
            .json(&request)
            .send()
            .await
            .context("Failed to send request to Claude API")?;

        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_default();
            anyhow::bail!("Claude API error ({}): {}", status, error_text);
        }

        let claude_response: ClaudeResponse = response
            .json()
            .await
            .context("Failed to parse Claude API response")?;

        if let Some(content) = claude_response.content.first() {
            Ok(content.text.clone())
        } else {
            anyhow::bail!("No content in Claude response");
        }
    }

    /// Validate output using Claude
    pub async fn validate(&self, plan_json: &str) -> Result<String> {
        let system_prompt = "You are a business plan validator. Analyze the provided business plan and return a JSON validation result with quality_score (0-100), warnings, errors, and suggestions.";

        let user_prompt = format!(
            "Validate this business plan and return JSON:\n\n{}",
            plan_json
        );

        self.generate(system_prompt, &user_prompt).await
    }
}

#[derive(Debug, Serialize)]
struct ClaudeRequest {
    model: String,
    max_tokens: u32,
    system: String,
    messages: Vec<Message>,
}

#[derive(Debug, Serialize, Deserialize)]
struct Message {
    role: String,
    content: String,
}

#[derive(Debug, Deserialize)]
struct ClaudeResponse {
    content: Vec<ContentBlock>,
}

#[derive(Debug, Deserialize)]
struct ContentBlock {
    #[serde(rename = "type")]
    #[allow(dead_code)]
    content_type: String,
    text: String,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_claude_client_creation() {
        // Skip if API key not set
        if env::var("ANTHROPIC_API_KEY").is_err() {
            return;
        }

        let client = ClaudeClient::new().unwrap();
        assert_eq!(client.model, DEFAULT_MODEL);
    }

    #[test]
    fn test_claude_client_with_custom_model() {
        // Skip if API key not set
        if env::var("ANTHROPIC_API_KEY").is_err() {
            return;
        }

        let client = ClaudeClient::new()
            .unwrap()
            .with_model("claude-3-opus-20240229".to_string());

        assert_eq!(client.model, "claude-3-opus-20240229");
    }
}
