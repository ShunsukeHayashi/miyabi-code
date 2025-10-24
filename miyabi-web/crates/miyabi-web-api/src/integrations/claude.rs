//! Anthropic Claude API integration for natural language processing
//!
//! This module provides functionality to analyze LINE messages using Claude API
//! and extract structured information for Issue creation.

use reqwest::Client;
use serde::{Deserialize, Serialize};
use thiserror::Error;
use tracing::{debug, error, info};

/// Claude API endpoint
const CLAUDE_API_ENDPOINT: &str = "https://api.anthropic.com/v1/messages";

/// Claude API version header
const CLAUDE_API_VERSION: &str = "2023-06-01";

/// Claude model to use (Sonnet 4)
const CLAUDE_MODEL: &str = "claude-sonnet-4-20250514";

/// Maximum tokens for response
const MAX_TOKENS: u32 = 2048;

/// Errors that can occur during Claude API operations
#[derive(Error, Debug)]
pub enum ClaudeError {
    #[error("HTTP request failed: {0}")]
    RequestFailed(#[from] reqwest::Error),

    #[error("JSON parsing failed: {0}")]
    JsonParsing(#[from] serde_json::Error),

    #[error("API returned error: {status} - {message}")]
    ApiError { status: u16, message: String },

    #[error("Missing API key")]
    MissingApiKey,

    #[error("Invalid response format")]
    InvalidResponse,
}

/// Claude API request structure
#[derive(Debug, Serialize)]
struct ClaudeRequest {
    model: String,
    max_tokens: u32,
    messages: Vec<Message>,
}

/// Message in Claude API
#[derive(Debug, Serialize, Deserialize)]
struct Message {
    role: String,
    content: String,
}

/// Claude API response structure
#[derive(Debug, Deserialize)]
struct ClaudeResponse {
    id: String,
    #[serde(rename = "type")]
    response_type: String,
    role: String,
    content: Vec<ContentBlock>,
    model: String,
    stop_reason: Option<String>,
}

/// Content block in Claude response
#[derive(Debug, Deserialize)]
struct ContentBlock {
    #[serde(rename = "type")]
    block_type: String,
    text: String,
}

/// Parsed issue information from user message
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParsedIssue {
    /// Issue title (concise summary)
    pub title: String,

    /// Issue description (detailed explanation)
    pub description: String,

    /// Recommended agent type
    pub agent_type: Option<String>,

    /// Priority level (P0-P3)
    pub priority: Option<String>,

    /// Issue type (feature, bug, docs, etc.)
    pub issue_type: Option<String>,
}

/// Claude API client
pub struct ClaudeClient {
    http_client: Client,
    api_key: String,
}

impl ClaudeClient {
    /// Create a new Claude API client
    pub fn new(api_key: String) -> Self {
        Self {
            http_client: Client::new(),
            api_key,
        }
    }

    /// Create a Claude client from environment variable
    pub fn from_env() -> Result<Self, ClaudeError> {
        let api_key = std::env::var("ANTHROPIC_API_KEY")
            .map_err(|_| ClaudeError::MissingApiKey)?;

        Ok(Self::new(api_key))
    }

    /// Analyze user message and extract issue information
    ///
    /// # Arguments
    /// * `user_message` - The message from LINE user
    ///
    /// # Returns
    /// * `Ok(ParsedIssue)` - Successfully parsed issue information
    /// * `Err(ClaudeError)` - API error or parsing error
    pub async fn analyze_message(&self, user_message: &str) -> Result<ParsedIssue, ClaudeError> {
        info!("Analyzing message with Claude API: \"{}\"", user_message);

        let prompt = self.build_analysis_prompt(user_message);
        let response = self.call_api(&prompt).await?;

        debug!("Claude API response: {:?}", response);

        // Parse JSON response
        let parsed = self.parse_response(&response)?;

        info!(
            "Parsed issue: title=\"{}\", agent={:?}, priority={:?}",
            parsed.title, parsed.agent_type, parsed.priority
        );

        Ok(parsed)
    }

    /// Build prompt for issue analysis
    fn build_analysis_prompt(&self, user_message: &str) -> String {
        format!(
            r#"あなたはGitHub Issue作成を支援するAIアシスタントです。
ユーザーのメッセージから以下の情報を抽出し、JSON形式で出力してください。

**ユーザーメッセージ**:
```
{}
```

**出力形式**:
```json
{{
  "title": "Issue のタイトル（50文字以内、簡潔に）",
  "description": "Issue の詳細説明（具体的に）",
  "agent_type": "推奨Agentタイプ（coordinator, codegen, review, deployment, pr, issue のいずれか。不明な場合は null）",
  "priority": "優先度（P0-Critical, P1-High, P2-Medium, P3-Low のいずれか。不明な場合は null）",
  "issue_type": "Issue種別（feature, bug, docs, refactor, test, chore のいずれか。不明な場合は null）"
}}
```

**推奨Agentの判断基準**:
- coordinator: 複雑なタスク分解が必要、複数のAgentの調整が必要
- codegen: 新機能実装、コード生成が必要
- review: コードレビュー、品質チェックが必要
- deployment: デプロイ、インフラ作業が必要
- pr: Pull Request作成が必要
- issue: Issue分析・ラベリングが必要

**優先度の判断基準**:
- P0-Critical: システムダウン、セキュリティ問題、緊急対応が必要
- P1-High: 重要な機能追加、深刻なバグ
- P2-Medium: 通常の機能追加、軽微なバグ
- P3-Low: 小さな改善、ドキュメント修正

JSON形式で出力してください。他の説明は不要です。"#,
            user_message
        )
    }

    /// Call Claude API
    async fn call_api(&self, prompt: &str) -> Result<String, ClaudeError> {
        let request = ClaudeRequest {
            model: CLAUDE_MODEL.to_string(),
            max_tokens: MAX_TOKENS,
            messages: vec![Message {
                role: "user".to_string(),
                content: prompt.to_string(),
            }],
        };

        debug!("Calling Claude API with model: {}", CLAUDE_MODEL);

        let response = self
            .http_client
            .post(CLAUDE_API_ENDPOINT)
            .header("x-api-key", &self.api_key)
            .header("anthropic-version", CLAUDE_API_VERSION)
            .header("content-type", "application/json")
            .json(&request)
            .send()
            .await?;

        let status = response.status();
        if !status.is_success() {
            let body = response.text().await.unwrap_or_default();
            error!("Claude API error: {} - {}", status, body);
            return Err(ClaudeError::ApiError {
                status: status.as_u16(),
                message: body,
            });
        }

        let claude_response: ClaudeResponse = response.json().await?;

        // Extract text from content blocks
        let text = claude_response
            .content
            .into_iter()
            .filter_map(|block| {
                if block.block_type == "text" {
                    Some(block.text)
                } else {
                    None
                }
            })
            .collect::<Vec<_>>()
            .join("\n");

        if text.is_empty() {
            error!("Claude API returned empty response");
            return Err(ClaudeError::InvalidResponse);
        }

        Ok(text)
    }

    /// Parse Claude response to ParsedIssue
    fn parse_response(&self, response: &str) -> Result<ParsedIssue, ClaudeError> {
        // Extract JSON from response (may be wrapped in markdown code blocks)
        let json_str = if response.contains("```json") {
            // Extract from markdown code block
            response
                .split("```json")
                .nth(1)
                .and_then(|s| s.split("```").next())
                .unwrap_or(response)
                .trim()
        } else if response.contains("```") {
            // Extract from generic code block
            response
                .split("```")
                .nth(1)
                .and_then(|s| s.split("```").next())
                .unwrap_or(response)
                .trim()
        } else {
            response.trim()
        };

        debug!("Parsing JSON: {}", json_str);

        let parsed: ParsedIssue = serde_json::from_str(json_str)?;

        Ok(parsed)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parsed_issue_serialization() {
        let issue = ParsedIssue {
            title: "Add user authentication".to_string(),
            description: "Implement JWT-based authentication".to_string(),
            agent_type: Some("codegen".to_string()),
            priority: Some("P1-High".to_string()),
            issue_type: Some("feature".to_string()),
        };

        let json = serde_json::to_string(&issue).unwrap();
        assert!(json.contains("Add user authentication"));
        assert!(json.contains("codegen"));

        let deserialized: ParsedIssue = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized.title, issue.title);
    }

    #[test]
    fn test_parse_response_from_markdown() {
        let client = ClaudeClient::new("test_key".to_string());

        let response = r#"```json
{
  "title": "Test issue",
  "description": "Test description",
  "agent_type": "codegen",
  "priority": "P2-Medium",
  "issue_type": "feature"
}
```"#;

        let parsed = client.parse_response(response).unwrap();
        assert_eq!(parsed.title, "Test issue");
        assert_eq!(parsed.agent_type, Some("codegen".to_string()));
    }

    #[test]
    fn test_parse_response_plain_json() {
        let client = ClaudeClient::new("test_key".to_string());

        let response = r#"{
  "title": "Test issue",
  "description": "Test description",
  "agent_type": null,
  "priority": null,
  "issue_type": "bug"
}"#;

        let parsed = client.parse_response(response).unwrap();
        assert_eq!(parsed.title, "Test issue");
        assert_eq!(parsed.agent_type, None);
        assert_eq!(parsed.issue_type, Some("bug".to_string()));
    }

    #[test]
    fn test_build_analysis_prompt() {
        let client = ClaudeClient::new("test_key".to_string());
        let prompt = client.build_analysis_prompt("ログイン機能を追加したい");

        assert!(prompt.contains("ログイン機能を追加したい"));
        assert!(prompt.contains("JSON形式で出力"));
        assert!(prompt.contains("agent_type"));
    }
}
