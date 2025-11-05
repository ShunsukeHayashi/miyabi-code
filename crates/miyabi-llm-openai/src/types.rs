//! OpenAI API request/response types

use serde::{Deserialize, Serialize};

/// OpenAI message format
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct OpenAIMessage {
    pub role: String,
    pub content: String,
}

/// OpenAI tool definition
#[derive(Serialize, Debug, Clone)]
pub struct OpenAITool {
    #[serde(rename = "type")]
    pub tool_type: String,
    pub function: OpenAIFunction,
}

/// OpenAI function definition
#[derive(Serialize, Debug, Clone)]
pub struct OpenAIFunction {
    pub name: String,
    pub description: String,
    pub parameters: serde_json::Value,
}

/// OpenAI API response
#[derive(Deserialize, Debug)]
#[allow(dead_code)]
pub struct OpenAIResponse {
    pub id: String,
    pub object: String,
    pub created: u64,
    pub model: String,
    pub choices: Vec<OpenAIChoice>,
    pub usage: OpenAIUsage,
}

/// Choice in OpenAI response
#[derive(Deserialize, Debug, Clone)]
#[allow(dead_code)]
pub struct OpenAIChoice {
    pub index: usize,
    pub message: OpenAIResponseMessage,
    pub finish_reason: String,
}

/// Response message in OpenAI choice
#[derive(Deserialize, Debug, Clone)]
#[allow(dead_code)]
pub struct OpenAIResponseMessage {
    pub role: String,
    pub content: Option<String>,
    pub tool_calls: Option<Vec<OpenAIToolCall>>,
}

/// Tool call in OpenAI response
#[derive(Deserialize, Debug, Clone)]
#[allow(dead_code)]
pub struct OpenAIToolCall {
    pub id: String,
    #[serde(rename = "type")]
    pub tool_type: String,
    pub function: OpenAIFunctionCall,
}

/// Function call in OpenAI tool call
#[derive(Deserialize, Debug, Clone)]
pub struct OpenAIFunctionCall {
    pub name: String,
    pub arguments: String, // OpenAI returns JSON string, not object
}

/// Token usage information
#[derive(Deserialize, Debug, Clone)]
#[allow(dead_code)]
pub struct OpenAIUsage {
    pub prompt_tokens: usize,
    pub completion_tokens: usize,
    pub total_tokens: usize,
}
