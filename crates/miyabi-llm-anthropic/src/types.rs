//! Anthropic API request/response types

use serde::{Deserialize, Serialize};

/// Anthropic message format
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct AnthropicMessage {
    pub role: String,
    pub content: String,
}

/// Anthropic tool definition
#[derive(Serialize, Debug, Clone)]
pub struct AnthropicTool {
    pub name: String,
    pub description: String,
    pub input_schema: serde_json::Value,
}

/// Anthropic API response
#[derive(Deserialize, Debug)]
#[allow(dead_code)]
pub struct AnthropicResponse {
    pub id: String,
    #[serde(rename = "type")]
    pub response_type: String,
    pub role: String,
    pub content: Vec<AnthropicContent>,
    pub model: String,
    pub stop_reason: String,
    pub stop_sequence: Option<String>,
    pub usage: AnthropicUsage,
}

/// Content block in Anthropic response
#[derive(Deserialize, Debug, Clone)]
pub struct AnthropicContent {
    #[serde(rename = "type")]
    pub content_type: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub text: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub input: Option<serde_json::Value>,
}

/// Token usage information
#[derive(Deserialize, Debug, Clone)]
#[allow(dead_code)]
pub struct AnthropicUsage {
    pub input_tokens: usize,
    pub output_tokens: usize,
}
