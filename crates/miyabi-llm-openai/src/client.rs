//! OpenAI GPT API client implementation

use crate::types::{OpenAIFunction, OpenAIMessage, OpenAIResponse, OpenAITool};
use async_trait::async_trait;
use futures::stream::Stream;
use futures::StreamExt;
use miyabi_llm_core::{
    LlmClient, LlmError, LlmStreamingClient, Message, Result, Role, StreamResponse, ToolCall, ToolCallResponse,
    ToolDefinition,
};
use serde_json::json;

const OPENAI_API_URL: &str = "https://api.openai.com/v1/chat/completions";

/// OpenAI GPT client
///
/// Supports GPT-4o, GPT-4o-mini, and other GPT models with:
/// - Simple chat completion
/// - Tool/function calling
/// - Streaming responses
pub struct OpenAIClient {
    api_key: String,
    model: String,
    client: reqwest::Client,
    max_tokens: Option<usize>,
}

impl OpenAIClient {
    /// Create a new OpenAI client with API key
    ///
    /// Default model: gpt-4o
    ///
    /// # Example
    /// ```no_run
    /// use miyabi_llm_openai::OpenAIClient;
    ///
    /// let client = OpenAIClient::new("sk-...".to_string());
    /// ```
    pub fn new(api_key: String) -> Self {
        Self { api_key, model: "gpt-4o".to_string(), client: reqwest::Client::new(), max_tokens: Some(4096) }
    }

    /// Create client from OPENAI_API_KEY environment variable
    ///
    /// # Errors
    /// Returns `LlmError::MissingApiKey` if environment variable is not set
    pub fn from_env() -> Result<Self> {
        let api_key =
            std::env::var("OPENAI_API_KEY").map_err(|_| LlmError::MissingApiKey("OPENAI_API_KEY".to_string()))?;
        Ok(Self::new(api_key))
    }

    /// Create GPT-4o-mini client (cost-optimized)
    ///
    /// GPT-4o-mini is significantly cheaper while maintaining high quality.
    pub fn new_gpt4o_mini(api_key: String) -> Self {
        Self { api_key, model: "gpt-4o-mini".to_string(), client: reqwest::Client::new(), max_tokens: Some(4096) }
    }

    /// Create GPT-4o-mini client from environment
    pub fn gpt4o_mini_from_env() -> Result<Self> {
        let api_key =
            std::env::var("OPENAI_API_KEY").map_err(|_| LlmError::MissingApiKey("OPENAI_API_KEY".to_string()))?;
        Ok(Self::new_gpt4o_mini(api_key))
    }

    /// Set custom model
    ///
    /// # Example
    /// ```no_run
    /// use miyabi_llm_openai::OpenAIClient;
    ///
    /// let client = OpenAIClient::from_env()
    ///     .unwrap()
    ///     .with_model("gpt-4-turbo".to_string());
    /// ```
    pub fn with_model(mut self, model: String) -> Self {
        self.model = model;
        self
    }

    /// Set max tokens for response
    ///
    /// Default: Some(4096)
    pub fn with_max_tokens(mut self, max_tokens: usize) -> Self {
        self.max_tokens = Some(max_tokens);
        self
    }

    /// Convert Miyabi Message to OpenAI format
    fn convert_messages(&self, messages: Vec<Message>) -> Vec<OpenAIMessage> {
        messages
            .into_iter()
            .map(|m| OpenAIMessage {
                role: match m.role {
                    Role::System => "system".to_string(),
                    Role::User => "user".to_string(),
                    Role::Assistant => "assistant".to_string(),
                },
                content: m.content,
            })
            .collect()
    }

    /// Convert Miyabi ToolDefinition to OpenAI format
    fn convert_tools(&self, tools: Vec<ToolDefinition>) -> Vec<OpenAITool> {
        tools
            .into_iter()
            .map(|t| OpenAITool {
                tool_type: "function".to_string(),
                function: OpenAIFunction { name: t.name, description: t.description, parameters: t.parameters },
            })
            .collect()
    }

    /// Parse a single SSE event and extract text delta if present
    fn parse_sse_event(event: &str) -> Option<String> {
        // Look for "data: " lines
        for line in event.lines() {
            if let Some(data) = line.strip_prefix("data: ") {
                // Skip [DONE] marker
                if data == "[DONE]" {
                    continue;
                }

                // Try to parse as JSON
                if let Ok(json) = serde_json::from_str::<serde_json::Value>(data) {
                    // Extract text from choices[0].delta.content
                    if let Some(content) = json["choices"][0]["delta"]["content"].as_str() {
                        return Some(content.to_string());
                    }
                }
            }
        }
        None
    }

    /// Parse Server-Sent Events stream from OpenAI API
    fn parse_sse_stream(&self, response: reqwest::Response) -> impl Stream<Item = Result<String>> {
        async_stream::stream! {
            let mut stream = response.bytes_stream();
            let mut buffer = Vec::new();

            while let Some(chunk_result) = stream.next().await {
                match chunk_result {
                    Ok(chunk) => {
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
impl LlmClient for OpenAIClient {
    async fn chat(&self, messages: Vec<Message>) -> Result<String> {
        let openai_messages = self.convert_messages(messages);

        let mut request_body = json!({
            "model": self.model,
            "messages": openai_messages,
        });

        if let Some(max_tokens) = self.max_tokens {
            request_body["max_tokens"] = json!(max_tokens);
        }

        let response = self
            .client
            .post(OPENAI_API_URL)
            .header("Authorization", format!("Bearer {}", self.api_key))
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

        let openai_response: OpenAIResponse = response
            .json()
            .await
            .map_err(|e| LlmError::InvalidResponse(format!("Failed to parse response: {}", e)))?;

        // Extract text from first choice
        openai_response
            .choices
            .first()
            .and_then(|choice| choice.message.content.clone())
            .ok_or_else(|| LlmError::InvalidResponse("No content in response".to_string()))
    }

    async fn chat_with_tools(&self, messages: Vec<Message>, tools: Vec<ToolDefinition>) -> Result<ToolCallResponse> {
        let openai_messages = self.convert_messages(messages);
        let openai_tools = self.convert_tools(tools);

        let mut request_body = json!({
            "model": self.model,
            "messages": openai_messages,
            "tools": openai_tools,
        });

        if let Some(max_tokens) = self.max_tokens {
            request_body["max_tokens"] = json!(max_tokens);
        }

        let response = self
            .client
            .post(OPENAI_API_URL)
            .header("Authorization", format!("Bearer {}", self.api_key))
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

        let openai_response: OpenAIResponse = response
            .json()
            .await
            .map_err(|e| LlmError::InvalidResponse(format!("Failed to parse response: {}", e)))?;

        // Extract first choice
        let choice = openai_response
            .choices
            .first()
            .ok_or_else(|| LlmError::InvalidResponse("No choices in response".to_string()))?;

        // Check finish reason to determine response type
        match choice.finish_reason.as_str() {
            "tool_calls" => {
                // Extract tool calls
                let tool_calls = choice
                    .message
                    .tool_calls
                    .as_ref()
                    .ok_or_else(|| {
                        LlmError::InvalidResponse("finish_reason was tool_calls but no tool_calls found".to_string())
                    })?
                    .iter()
                    .map(|tc| {
                        // Parse JSON string arguments to Value
                        let arguments =
                            serde_json::from_str(&tc.function.arguments).unwrap_or_else(|_| serde_json::json!({}));

                        ToolCall { id: tc.id.clone(), name: tc.function.name.clone(), arguments }
                    })
                    .collect();

                Ok(ToolCallResponse::ToolCalls(tool_calls))
            }
            "stop" | "length" => {
                // Task completed or reached limit
                let text = choice
                    .message
                    .content
                    .clone()
                    .unwrap_or_else(|| "Task completed".to_string());
                Ok(ToolCallResponse::Conclusion { text })
            }
            other => Err(LlmError::InvalidResponse(format!("Unexpected finish_reason: {}", other))),
        }
    }

    fn provider_name(&self) -> &str {
        "openai"
    }

    fn model_name(&self) -> &str {
        &self.model
    }
}

#[async_trait]
impl LlmStreamingClient for OpenAIClient {
    async fn chat_stream(&self, messages: Vec<Message>) -> Result<StreamResponse> {
        let openai_messages = self.convert_messages(messages);

        let mut request_body = json!({
            "model": self.model,
            "messages": openai_messages,
            "stream": true,  // Enable streaming
        });

        if let Some(max_tokens) = self.max_tokens {
            request_body["max_tokens"] = json!(max_tokens);
        }

        let response = self
            .client
            .post(OPENAI_API_URL)
            .header("Authorization", format!("Bearer {}", self.api_key))
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
        let client = OpenAIClient::new("test-key".to_string());
        assert_eq!(client.model, "gpt-4o");
        assert_eq!(client.provider_name(), "openai");
    }

    #[test]
    fn test_with_model() {
        let client = OpenAIClient::new("test-key".to_string()).with_model("gpt-4-turbo".to_string());
        assert_eq!(client.model, "gpt-4-turbo");
        assert_eq!(client.model_name(), "gpt-4-turbo");
    }

    #[test]
    fn test_with_max_tokens() {
        let client = OpenAIClient::new("test-key".to_string()).with_max_tokens(8192);
        assert_eq!(client.max_tokens, Some(8192));
    }

    #[test]
    fn test_gpt4o_mini_creation() {
        let client = OpenAIClient::new_gpt4o_mini("test-key".to_string());
        assert_eq!(client.model, "gpt-4o-mini");
    }

    #[test]
    fn test_message_conversion() {
        let client = OpenAIClient::new("test-key".to_string());
        let messages = vec![
            Message::system("You are helpful"),
            Message::user("Hello"),
            Message::assistant("Hi there"),
        ];

        let converted = client.convert_messages(messages);
        assert_eq!(converted.len(), 3);
        assert_eq!(converted[0].role, "system");
        assert_eq!(converted[0].content, "You are helpful");
        assert_eq!(converted[1].role, "user");
        assert_eq!(converted[2].role, "assistant");
    }

    #[test]
    fn test_tool_conversion() {
        let client = OpenAIClient::new("test-key".to_string());
        let tools = vec![ToolDefinition::new("get_weather", "Get weather info")];

        let converted = client.convert_tools(tools);
        assert_eq!(converted.len(), 1);
        assert_eq!(converted[0].function.name, "get_weather");
        assert_eq!(converted[0].function.description, "Get weather info");
        assert_eq!(converted[0].tool_type, "function");
    }
}
