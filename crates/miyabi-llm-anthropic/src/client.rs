//! Anthropic Claude API client implementation

use crate::types::{AnthropicMessage, AnthropicResponse, AnthropicTool};
use async_trait::async_trait;
use futures::stream::Stream;
use futures::StreamExt;
use miyabi_llm_core::{
    LlmClient, LlmError, LlmStreamingClient, Message, Result, Role, StreamResponse, ToolCall, ToolCallResponse,
    ToolDefinition,
};
use serde_json::json;

const ANTHROPIC_API_URL: &str = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION: &str = "2023-06-01";

/// Anthropic Claude client
///
/// Supports Claude 3.5 Sonnet and other Claude models with:
/// - Simple chat completion
/// - Tool/function calling
/// - Streaming responses
pub struct AnthropicClient {
    api_key: String,
    model: String,
    client: reqwest::Client,
    max_tokens: usize,
}

impl AnthropicClient {
    /// Create a new Anthropic client with API key
    ///
    /// # Arguments
    /// * `api_key` - Anthropic API key
    ///
    /// # Example
    /// ```no_run
    /// use miyabi_llm_anthropic::AnthropicClient;
    ///
    /// let client = AnthropicClient::new("sk-ant-...".to_string());
    /// ```
    pub fn new(api_key: String) -> Self {
        Self {
            api_key,
            model: "claude-3-5-sonnet-20241022".to_string(),
            client: reqwest::Client::new(),
            max_tokens: 4096,
        }
    }

    /// Create client from ANTHROPIC_API_KEY environment variable
    ///
    /// # Errors
    /// Returns `LlmError::MissingApiKey` if environment variable is not set
    pub fn from_env() -> Result<Self> {
        let api_key =
            std::env::var("ANTHROPIC_API_KEY").map_err(|_| LlmError::MissingApiKey("ANTHROPIC_API_KEY".to_string()))?;
        Ok(Self::new(api_key))
    }

    /// Set custom model
    ///
    /// # Example
    /// ```no_run
    /// use miyabi_llm_anthropic::AnthropicClient;
    ///
    /// let client = AnthropicClient::from_env()
    ///     .unwrap()
    ///     .with_model("claude-3-opus-20240229".to_string());
    /// ```
    pub fn with_model(mut self, model: String) -> Self {
        self.model = model;
        self
    }

    /// Set max tokens for response
    ///
    /// Default: 4096
    pub fn with_max_tokens(mut self, max_tokens: usize) -> Self {
        self.max_tokens = max_tokens;
        self
    }

    /// Convert Miyabi Message to Anthropic format
    fn convert_messages(&self, messages: Vec<Message>) -> Vec<AnthropicMessage> {
        messages
            .into_iter()
            .filter(|m| m.role != Role::System) // System messages handled separately
            .map(|m| AnthropicMessage {
                role: match m.role {
                    Role::User => "user".to_string(),
                    Role::Assistant => "assistant".to_string(),
                    Role::System => "user".to_string(), // Fallback
                },
                content: m.content,
            })
            .collect()
    }

    /// Extract system message from messages
    fn extract_system_prompt(&self, messages: &[Message]) -> Option<String> {
        messages
            .iter()
            .find(|m| m.role == Role::System)
            .map(|m| m.content.clone())
    }

    /// Convert Miyabi ToolDefinition to Anthropic format
    fn convert_tools(&self, tools: Vec<ToolDefinition>) -> Vec<AnthropicTool> {
        tools
            .into_iter()
            .map(|t| AnthropicTool { name: t.name, description: t.description, input_schema: t.parameters })
            .collect()
    }

    /// Extract text from Anthropic response
    fn extract_text(&self, response: &AnthropicResponse) -> Result<String> {
        response
            .content
            .iter()
            .find(|c| c.content_type == "text")
            .and_then(|c| c.text.clone())
            .ok_or_else(|| LlmError::InvalidResponse("No text content in response".to_string()))
    }

    /// Extract tool calls from Anthropic response
    fn extract_tool_calls(&self, response: &AnthropicResponse) -> Vec<ToolCall> {
        response
            .content
            .iter()
            .filter(|c| c.content_type == "tool_use")
            .filter_map(|c| {
                Some(ToolCall {
                    id: c.id.as_ref()?.clone(),
                    name: c.name.as_ref()?.clone(),
                    arguments: c.input.clone()?,
                })
            })
            .collect()
    }

    /// Parse a single SSE event and extract text delta if present
    fn parse_sse_event(event: &str) -> Option<String> {
        // Look for "data: " lines
        for line in event.lines() {
            if let Some(data) = line.strip_prefix("data: ") {
                // Try to parse as JSON
                if let Ok(json) = serde_json::from_str::<serde_json::Value>(data) {
                    // Check if it's a content_block_delta event
                    if json["type"] == "content_block_delta" {
                        // Extract text from delta
                        if let Some(text) = json["delta"]["text"].as_str() {
                            return Some(text.to_string());
                        }
                    }
                }
            }
        }
        None
    }

    /// Parse Server-Sent Events stream from Anthropic API
    fn parse_sse_stream(&self, response: reqwest::Response) -> impl Stream<Item = Result<String>> {
        async_stream::stream! {
            let mut stream = response.bytes_stream();
            let mut buffer = Vec::new();

            while let Some(chunk_result) = stream.next().await {
                match chunk_result {
                    Ok(chunk) => {
                        // Convert Bytes to Vec<u8>
                        buffer.extend_from_slice(&chunk);

                        // Split by double newlines (SSE event separator)
                        let text = String::from_utf8_lossy(&buffer);
                        let parts: Vec<&str> = text.split("\n\n").collect();

                        // Process all complete events (all but the last incomplete one)
                        for part in parts.iter().take(parts.len().saturating_sub(1)) {
                            if let Some(text_delta) = Self::parse_sse_event(part) {
                                yield Ok(text_delta);
                            }
                        }

                        // Keep last incomplete event in buffer
                        buffer = parts
                            .last()
                            .unwrap_or(&"")
                            .as_bytes()
                            .to_vec();
                    }
                    Err(e) => {
                        yield Err(LlmError::ApiError(format!("Stream error: {}", e)));
                        break;
                    }
                }
            }

            // Process any remaining buffer
            if !buffer.is_empty() {
                let text = String::from_utf8_lossy(&buffer);
                if let Some(text_delta) = Self::parse_sse_event(&text) {
                    yield Ok(text_delta);
                }
            }
        }
    }
}

#[async_trait]
impl LlmClient for AnthropicClient {
    async fn chat(&self, messages: Vec<Message>) -> Result<String> {
        let system_prompt = self.extract_system_prompt(&messages);
        let anthropic_messages = self.convert_messages(messages);

        let mut request_body = json!({
            "model": self.model,
            "max_tokens": self.max_tokens,
            "messages": anthropic_messages,
        });

        // Add system prompt if present
        if let Some(system) = system_prompt {
            request_body["system"] = json!(system);
        }

        let response = self
            .client
            .post(ANTHROPIC_API_URL)
            .header("x-api-key", &self.api_key)
            .header("anthropic-version", ANTHROPIC_VERSION)
            .header("content-type", "application/json")
            .json(&request_body)
            .send()
            .await
            .map_err(|e| LlmError::ApiError(format!("HTTP request failed: {}", e)))?;

        // Check for API errors
        if !response.status().is_success() {
            let status = response.status();
            let error_body = response
                .text()
                .await
                .unwrap_or_else(|_| "Unable to read error body".to_string());
            return Err(LlmError::ApiError(format!("API returned error {}: {}", status, error_body)));
        }

        let anthropic_response: AnthropicResponse = response
            .json()
            .await
            .map_err(|e| LlmError::InvalidResponse(format!("Failed to parse response: {}", e)))?;

        self.extract_text(&anthropic_response)
    }

    async fn chat_with_tools(&self, messages: Vec<Message>, tools: Vec<ToolDefinition>) -> Result<ToolCallResponse> {
        let system_prompt = self.extract_system_prompt(&messages);
        let anthropic_messages = self.convert_messages(messages);
        let anthropic_tools = self.convert_tools(tools);

        let mut request_body = json!({
            "model": self.model,
            "max_tokens": self.max_tokens,
            "messages": anthropic_messages,
            "tools": anthropic_tools,
        });

        // Add system prompt if present
        if let Some(system) = system_prompt {
            request_body["system"] = json!(system);
        }

        let response = self
            .client
            .post(ANTHROPIC_API_URL)
            .header("x-api-key", &self.api_key)
            .header("anthropic-version", ANTHROPIC_VERSION)
            .header("content-type", "application/json")
            .json(&request_body)
            .send()
            .await
            .map_err(|e| LlmError::ApiError(format!("HTTP request failed: {}", e)))?;

        // Check for API errors
        if !response.status().is_success() {
            let status = response.status();
            let error_body = response
                .text()
                .await
                .unwrap_or_else(|_| "Unable to read error body".to_string());
            return Err(LlmError::ApiError(format!("API returned error {}: {}", status, error_body)));
        }

        let anthropic_response: AnthropicResponse = response
            .json()
            .await
            .map_err(|e| LlmError::InvalidResponse(format!("Failed to parse response: {}", e)))?;

        // Check stop reason to determine response type
        match anthropic_response.stop_reason.as_str() {
            "tool_use" => {
                let tool_calls = self.extract_tool_calls(&anthropic_response);
                if tool_calls.is_empty() {
                    return Err(LlmError::InvalidResponse(
                        "stop_reason was tool_use but no tool calls found".to_string(),
                    ));
                }
                Ok(ToolCallResponse::ToolCalls(tool_calls))
            }
            "end_turn" | "max_tokens" | "stop_sequence" => {
                // Task completed or reached limit
                let text = self.extract_text(&anthropic_response)?;
                Ok(ToolCallResponse::Conclusion { text })
            }
            other => Err(LlmError::InvalidResponse(format!("Unexpected stop_reason: {}", other))),
        }
    }

    fn provider_name(&self) -> &str {
        "anthropic"
    }

    fn model_name(&self) -> &str {
        &self.model
    }
}

#[async_trait]
impl LlmStreamingClient for AnthropicClient {
    async fn chat_stream(&self, messages: Vec<Message>) -> Result<StreamResponse> {
        let system_prompt = self.extract_system_prompt(&messages);
        let anthropic_messages = self.convert_messages(messages);

        let mut request_body = json!({
            "model": self.model,
            "max_tokens": self.max_tokens,
            "messages": anthropic_messages,
            "stream": true,  // Enable streaming
        });

        // Add system prompt if present
        if let Some(system) = system_prompt {
            request_body["system"] = json!(system);
        }

        let response = self
            .client
            .post(ANTHROPIC_API_URL)
            .header("x-api-key", &self.api_key)
            .header("anthropic-version", ANTHROPIC_VERSION)
            .header("content-type", "application/json")
            .json(&request_body)
            .send()
            .await
            .map_err(|e| LlmError::ApiError(format!("HTTP request failed: {}", e)))?;

        // Check for API errors
        if !response.status().is_success() {
            let status = response.status();
            let error_body = response
                .text()
                .await
                .unwrap_or_else(|_| "Unable to read error body".to_string());
            return Err(LlmError::ApiError(format!("API returned error {}: {}", status, error_body)));
        }

        // Parse SSE stream
        Ok(Box::pin(self.parse_sse_stream(response)))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_client_creation() {
        let client = AnthropicClient::new("test-key".to_string());
        assert_eq!(client.model, "claude-3-5-sonnet-20241022");
        assert_eq!(client.provider_name(), "anthropic");
    }

    #[test]
    fn test_with_model() {
        let client = AnthropicClient::new("test-key".to_string()).with_model("claude-opus".to_string());
        assert_eq!(client.model, "claude-opus");
        assert_eq!(client.model_name(), "claude-opus");
    }

    #[test]
    fn test_with_max_tokens() {
        let client = AnthropicClient::new("test-key".to_string()).with_max_tokens(8192);
        assert_eq!(client.max_tokens, 8192);
    }

    #[test]
    fn test_message_conversion() {
        let client = AnthropicClient::new("test-key".to_string());
        let messages = vec![
            Message::system("You are helpful"),
            Message::user("Hello"),
            Message::assistant("Hi there"),
        ];

        let converted = client.convert_messages(messages);
        assert_eq!(converted.len(), 2); // System message filtered out
        assert_eq!(converted[0].role, "user");
        assert_eq!(converted[0].content, "Hello");
        assert_eq!(converted[1].role, "assistant");
    }

    #[test]
    fn test_extract_system_prompt() {
        let client = AnthropicClient::new("test-key".to_string());
        let messages = vec![Message::system("System prompt"), Message::user("Hello")];

        let system = client.extract_system_prompt(&messages);
        assert_eq!(system, Some("System prompt".to_string()));
    }

    #[test]
    fn test_tool_conversion() {
        let client = AnthropicClient::new("test-key".to_string());
        let tools = vec![ToolDefinition::new("get_weather", "Get weather info")];

        let converted = client.convert_tools(tools);
        assert_eq!(converted.len(), 1);
        assert_eq!(converted[0].name, "get_weather");
        assert_eq!(converted[0].description, "Get weather info");
    }
}
