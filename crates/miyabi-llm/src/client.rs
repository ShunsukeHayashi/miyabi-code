//! LLM Client trait and response types

use crate::{Message, Result, ToolCall, ToolDefinition};
use async_trait::async_trait;
use serde::{Deserialize, Serialize};

/// LLM Client trait - unified interface for all providers
#[async_trait]
pub trait LlmClient: Send + Sync {
    /// Simple chat completion
    async fn chat(&self, messages: Vec<Message>) -> Result<String>;

    /// Chat completion with tool/function calling support
    async fn chat_with_tools(
        &self,
        messages: Vec<Message>,
        tools: Vec<ToolDefinition>,
    ) -> Result<ToolCallResponse>;
}

/// Response from LLM with tool calling support
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum ToolCallResponse {
    /// LLM wants to call tools
    #[serde(rename = "tool_calls")]
    ToolCalls(Vec<ToolCall>),

    /// Task completed with final answer
    #[serde(rename = "conclusion")]
    Conclusion(String),

    /// Need user approval (for interactive mode)
    #[serde(rename = "need_approval")]
    NeedApproval { action: String, reason: String },
}
