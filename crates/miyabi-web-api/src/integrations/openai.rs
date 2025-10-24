//! OpenAI API Client
//!
//! Provides integration with OpenAI GPT-4 for natural language processing.

use reqwest::Client;
use serde::{Deserialize, Serialize};
use thiserror::Error;

/// OpenAI API error
#[derive(Error, Debug)]
pub enum OpenAIError {
    #[error("HTTP request failed: {0}")]
    Request(#[from] reqwest::Error),

    #[error("OpenAI API error: {message}")]
    ApiError { message: String },

    #[error("Missing API key")]
    MissingApiKey,

    #[error("JSON parsing error: {0}")]
    Json(#[from] serde_json::Error),
}

pub type Result<T> = std::result::Result<T, OpenAIError>;

/// OpenAI API Client
#[derive(Clone)]
pub struct OpenAIClient {
    api_key: String,
    http_client: Client,
    api_base_url: String,
}

impl OpenAIClient {
    /// Create a new OpenAI client
    pub fn new(api_key: String) -> Self {
        Self {
            api_key,
            http_client: Client::new(),
            api_base_url: "https://api.openai.com/v1".to_string(),
        }
    }

    /// Analyze user message and convert to structured Issue data
    pub async fn analyze_issue_request(
        &self,
        user_message: &str,
    ) -> Result<IssueAnalysis> {
        let system_prompt = r#"You are a development task analysis assistant for Miyabi, an AI-powered development framework.

Your role is to analyze user requests and convert them into structured GitHub Issues with:
1. Title: Clear, concise title
2. Description: Detailed markdown description
3. Agent: Which Miyabi agent should handle this (coordinator, codegen, review, pr, deploy, issue)
4. Priority: P0-Critical, P1-High, P2-Medium, P3-Low
5. Labels: Appropriate labels from the 57-label system
6. Estimated Duration: Time estimate in minutes

Respond ONLY with valid JSON."#;

        let user_prompt = format!(
            r#"Analyze this user request and create a structured Issue:

User Request: "{}"

Generate JSON with:
{{
  "title": "Issue title",
  "description": "Detailed markdown description with ## sections",
  "agent": "coordinator|codegen|review|pr|deploy|issue",
  "priority": "P0-Critical|P1-High|P2-Medium|P3-Low",
  "labels": ["type:feature", "agent:codegen", etc],
  "estimated_duration_minutes": 30-120
}}"#,
            user_message
        );

        let request_payload = ChatCompletionRequest {
            model: "gpt-4".to_string(),
            messages: vec![
                ChatMessage {
                    role: "system".to_string(),
                    content: system_prompt.to_string(),
                },
                ChatMessage {
                    role: "user".to_string(),
                    content: user_prompt,
                },
            ],
            temperature: Some(0.7),
            max_tokens: Some(1000),
        };

        let url = format!("{}/chat/completions", self.api_base_url);

        let response = self
            .http_client
            .post(&url)
            .header("Authorization", format!("Bearer {}", self.api_key))
            .header("Content-Type", "application/json")
            .json(&request_payload)
            .send()
            .await?;

        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
            return Err(OpenAIError::ApiError {
                message: error_text,
            });
        }

        let completion_response: ChatCompletionResponse = response.json().await?;

        let content = completion_response
            .choices
            .first()
            .and_then(|choice| Some(&choice.message.content))
            .ok_or_else(|| OpenAIError::ApiError {
                message: "No response from GPT-4".to_string(),
            })?;

        // Parse JSON response
        let issue_analysis: IssueAnalysis = serde_json::from_str(content)?;

        Ok(issue_analysis)
    }
}

/// Chat completion request
#[derive(Debug, Clone, Serialize, Deserialize)]
struct ChatCompletionRequest {
    model: String,
    messages: Vec<ChatMessage>,
    #[serde(skip_serializing_if = "Option::is_none")]
    temperature: Option<f32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    max_tokens: Option<u32>,
}

/// Chat message
#[derive(Debug, Clone, Serialize, Deserialize)]
struct ChatMessage {
    role: String,
    content: String,
}

/// Chat completion response
#[derive(Debug, Clone, Serialize, Deserialize)]
struct ChatCompletionResponse {
    choices: Vec<ChatChoice>,
}

/// Chat choice
#[derive(Debug, Clone, Serialize, Deserialize)]
struct ChatChoice {
    message: ChatMessage,
}

/// Issue analysis result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IssueAnalysis {
    pub title: String,
    pub description: String,
    pub agent: String,
    pub priority: String,
    pub labels: Vec<String>,
    pub estimated_duration_minutes: u32,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_issue_analysis_deserialization() {
        let json = r#"{
            "title": "Add Google OAuth support",
            "description": "## Overview\nImplement Google OAuth 2.0",
            "agent": "codegen",
            "priority": "P1-High",
            "labels": ["type:feature", "agent:codegen"],
            "estimated_duration_minutes": 60
        }"#;

        let analysis: IssueAnalysis = serde_json::from_str(json).unwrap();
        assert_eq!(analysis.title, "Add Google OAuth support");
        assert_eq!(analysis.agent, "codegen");
    }
}
