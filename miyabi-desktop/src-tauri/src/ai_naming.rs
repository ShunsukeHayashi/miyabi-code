//! AI-Powered Naming Service
//!
//! Provides intelligent naming suggestions for worktrees and branches using Anthropic API.
//! Generates human-readable, context-aware names based on Issue titles and descriptions.

use anyhow::{Context, Result};
use async_openai::{
    config::OpenAIConfig,
    types::{
        ChatCompletionRequestMessage, ChatCompletionRequestSystemMessageArgs,
        ChatCompletionRequestUserMessageArgs, CreateChatCompletionRequestArgs,
    },
    Client,
};
use serde::{Deserialize, Serialize};
use std::env;

/// AI naming suggestion
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NamingSuggestion {
    /// Suggested branch name (kebab-case, git-friendly)
    pub branch_name: String,
    /// Human-readable display name
    pub display_name: String,
    /// Brief explanation of the naming choice
    pub explanation: String,
}

/// Naming context from Issue
#[derive(Debug, Clone, Deserialize)]
pub struct NamingContext {
    /// Issue number
    pub issue_number: u64,
    /// Issue title
    pub title: String,
    /// Issue description (optional)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    /// Issue labels (optional)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub labels: Option<Vec<String>>,
}

/// AI naming service
pub struct AINamingService {
    client: Client<OpenAIConfig>,
}

impl AINamingService {
    /// Create new AI naming service
    pub fn new() -> Result<Self> {
        // Get Anthropic API key from environment
        let api_key = env::var("ANTHROPIC_API_KEY")
            .context("ANTHROPIC_API_KEY environment variable not set")?;

        // Configure client for Anthropic API
        let config = OpenAIConfig::new()
            .with_api_key(api_key)
            .with_api_base("https://api.anthropic.com/v1");

        let client = Client::with_config(config);

        Ok(Self { client })
    }

    /// Generate naming suggestions for a worktree/branch
    pub async fn suggest_name(&self, context: NamingContext) -> Result<NamingSuggestion> {
        // Build prompt for Claude
        let system_prompt = r#"You are a Git branch naming expert. Generate a concise, descriptive branch name following these rules:
1. Use kebab-case (lowercase with hyphens)
2. Max 50 characters
3. Start with a category prefix: feature/, bugfix/, refactor/, docs/, test/, chore/
4. Be descriptive but concise
5. Use common abbreviations when appropriate (e.g., 'impl' for implementation, 'integ' for integration)

Respond in JSON format:
{
  "branch_name": "feature/example-branch",
  "display_name": "Example Feature Branch",
  "explanation": "Brief explanation of naming choice"
}
"#;

        let user_prompt = format!(
            "Issue #{}: {}\n\n{}{}",
            context.issue_number,
            context.title,
            context
                .description
                .as_ref()
                .map(|d| format!("Description: {}\n\n", d))
                .unwrap_or_default(),
            context
                .labels
                .as_ref()
                .map(|l| format!("Labels: {}", l.join(", ")))
                .unwrap_or_default()
        );

        // Create chat completion request
        let messages = vec![
            ChatCompletionRequestMessage::System(
                ChatCompletionRequestSystemMessageArgs::default()
                    .content(system_prompt)
                    .build()?,
            ),
            ChatCompletionRequestMessage::User(
                ChatCompletionRequestUserMessageArgs::default()
                    .content(user_prompt)
                    .build()?,
            ),
        ];

        let request = CreateChatCompletionRequestArgs::default()
            .model("claude-3-5-sonnet-20241022")
            .messages(messages)
            .temperature(0.7)
            .max_tokens(200u32)
            .build()?;

        // Call Anthropic API
        let response = self
            .client
            .chat()
            .create(request)
            .await
            .context("Failed to call Anthropic API")?;

        // Parse response
        let content = response
            .choices
            .first()
            .and_then(|choice| choice.message.content.as_ref())
            .context("No response content from API")?;

        // Parse JSON response
        let suggestion: NamingSuggestion = serde_json::from_str(content)
            .context("Failed to parse AI response as JSON")?;

        Ok(suggestion)
    }

    /// Generate fallback name if AI service is unavailable
    pub fn generate_fallback_name(context: &NamingContext) -> NamingSuggestion {
        // Simple fallback: issue-{number}-{sanitized-title}
        let sanitized_title: String = context
            .title
            .chars()
            .take(30)
            .map(|c| {
                if c.is_alphanumeric() {
                    c.to_lowercase().to_string()
                } else if c.is_whitespace() {
                    "-".to_string()
                } else {
                    "".to_string()
                }
            })
            .collect::<String>()
            .split("--")
            .collect::<Vec<_>>()
            .join("-");

        // Determine prefix from labels
        let prefix = context
            .labels
            .as_ref()
            .and_then(|labels| {
                if labels.iter().any(|l| l.contains("feature")) {
                    Some("feature")
                } else if labels.iter().any(|l| l.contains("bug")) {
                    Some("bugfix")
                } else if labels.iter().any(|l| l.contains("refactor")) {
                    Some("refactor")
                } else if labels.iter().any(|l| l.contains("docs")) {
                    Some("docs")
                } else if labels.iter().any(|l| l.contains("test")) {
                    Some("test")
                } else {
                    None
                }
            })
            .unwrap_or("feature");

        let branch_name = format!("{}/issue-{}-{}", prefix, context.issue_number, sanitized_title);

        NamingSuggestion {
            branch_name,
            display_name: format!("Issue #{}: {}", context.issue_number, context.title),
            explanation: "Generated using fallback naming (AI service unavailable)".to_string(),
        }
    }
}

/// Tauri command: Generate AI naming suggestion
#[tauri::command]
pub async fn suggest_worktree_name(context: NamingContext) -> Result<NamingSuggestion, String> {
    // Try AI service first
    match AINamingService::new() {
        Ok(service) => {
            match service.suggest_name(context.clone()).await {
                Ok(suggestion) => Ok(suggestion),
                Err(_) => {
                    // Fallback if API call fails
                    Ok(AINamingService::generate_fallback_name(&context))
                }
            }
        }
        Err(_) => {
            // Use fallback if service initialization fails
            Ok(AINamingService::generate_fallback_name(&context))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_fallback_naming() {
        let context = NamingContext {
            issue_number: 673,
            title: "Integrate @humanu/orchestra (gwr) into miyabi-desktop".to_string(),
            description: None,
            labels: Some(vec!["enhancement".to_string(), "feature".to_string()]),
        };

        let suggestion = AINamingService::generate_fallback_name(&context);

        assert!(suggestion.branch_name.starts_with("feature/issue-673"));
        assert!(suggestion.branch_name.contains("integrate"));
        assert_eq!(suggestion.display_name, "Issue #673: Integrate @humanu/orchestra (gwr) into miyabi-desktop");
    }

    #[test]
    fn test_fallback_naming_bugfix() {
        let context = NamingContext {
            issue_number: 100,
            title: "Fix memory leak in logger".to_string(),
            description: None,
            labels: Some(vec!["bug".to_string()]),
        };

        let suggestion = AINamingService::generate_fallback_name(&context);

        assert!(suggestion.branch_name.starts_with("bugfix/issue-100"));
    }
}
