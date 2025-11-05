//! LLM Client trait and response types

use crate::{Message, Result, ToolCall, ToolDefinition};
use async_trait::async_trait;
use serde::{Deserialize, Serialize};

/// LLM Client trait - unified interface for all providers
///
/// This trait provides a unified interface for interacting with various LLM providers
/// (OpenAI, Anthropic, Google, etc.) with support for:
/// - Simple chat completion
/// - Tool/function calling
/// - Streaming responses (via separate trait)
#[async_trait]
pub trait LlmClient: Send + Sync {
    /// Simple chat completion
    ///
    /// # Arguments
    /// * `messages` - Conversation history
    ///
    /// # Returns
    /// * `Ok(String)` - LLM response text
    /// * `Err(LlmError)` - Error occurred during request
    async fn chat(&self, messages: Vec<Message>) -> Result<String>;

    /// Chat completion with tool/function calling support
    ///
    /// # Arguments
    /// * `messages` - Conversation history
    /// * `tools` - Available tools/functions
    ///
    /// # Returns
    /// * `Ok(ToolCallResponse)` - Response indicating tool calls or conclusion
    /// * `Err(LlmError)` - Error occurred during request
    async fn chat_with_tools(
        &self,
        messages: Vec<Message>,
        tools: Vec<ToolDefinition>,
    ) -> Result<ToolCallResponse>;

    /// Get the provider name
    fn provider_name(&self) -> &str;

    /// Get the model name
    fn model_name(&self) -> &str;
}

/// Response from LLM with tool calling support
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(tag = "type", content = "data")]
pub enum ToolCallResponse {
    /// LLM wants to call tools
    #[serde(rename = "tool_calls")]
    ToolCalls(Vec<ToolCall>),

    /// Task completed with final answer
    #[serde(rename = "conclusion")]
    Conclusion { text: String },

    /// Need user approval (for interactive mode)
    #[serde(rename = "need_approval")]
    NeedApproval { action: String, reason: String },
}

impl ToolCallResponse {
    /// Check if response contains tool calls
    pub fn is_tool_calls(&self) -> bool {
        matches!(self, ToolCallResponse::ToolCalls(_))
    }

    /// Check if response is a conclusion
    pub fn is_conclusion(&self) -> bool {
        matches!(self, ToolCallResponse::Conclusion { .. })
    }

    /// Check if response needs approval
    pub fn needs_approval(&self) -> bool {
        matches!(self, ToolCallResponse::NeedApproval { .. })
    }

    /// Extract tool calls if present
    pub fn tool_calls(&self) -> Option<&[ToolCall]> {
        match self {
            ToolCallResponse::ToolCalls(calls) => Some(calls),
            _ => None,
        }
    }

    /// Extract conclusion text if present
    pub fn conclusion(&self) -> Option<&str> {
        match self {
            ToolCallResponse::Conclusion { text } => Some(text),
            _ => None,
        }
    }
}
