//! Google Gemini client implementation

use crate::types::*;
use async_trait::async_trait;
use futures::stream::StreamExt;
use miyabi_llm_core::{
    LlmClient, LlmError, LlmStreamingClient, Message, Result, StreamResponse, ToolCall, ToolCallResponse,
    ToolDefinition,
};

/// Google Gemini API client
pub struct GoogleClient {
    api_key: String,
    model: String,
    client: reqwest::Client,
    max_tokens: Option<i32>,
    temperature: Option<f32>,
}

impl GoogleClient {
    /// Create a new Google Gemini client
    pub fn new(api_key: String) -> Self {
        Self {
            api_key,
            model: "gemini-1.5-pro".to_string(),
            client: reqwest::Client::new(),
            max_tokens: Some(4096),
            temperature: Some(0.7),
        }
    }

    /// Create a client from environment variable
    pub fn from_env() -> Result<Self> {
        let api_key = std::env::var("GOOGLE_API_KEY")
            .or_else(|_| std::env::var("GEMINI_API_KEY"))
            .map_err(|_| LlmError::MissingApiKey("GOOGLE_API_KEY or GEMINI_API_KEY".to_string()))?;
        Ok(Self::new(api_key))
    }

    /// Use Gemini 1.5 Flash model (faster, cheaper)
    pub fn with_flash(mut self) -> Self {
        self.model = "gemini-1.5-flash".to_string();
        self
    }

    /// Use Gemini 1.5 Pro model (default)
    pub fn with_pro(mut self) -> Self {
        self.model = "gemini-1.5-pro".to_string();
        self
    }

    /// Set custom model
    pub fn with_model(mut self, model: impl Into<String>) -> Self {
        self.model = model.into();
        self
    }

    /// Set maximum output tokens
    pub fn with_max_tokens(mut self, max_tokens: i32) -> Self {
        self.max_tokens = Some(max_tokens);
        self
    }

    /// Set temperature (0.0-1.0)
    pub fn with_temperature(mut self, temperature: f32) -> Self {
        self.temperature = Some(temperature);
        self
    }

    /// Get API endpoint URL
    fn get_endpoint(&self, stream: bool) -> String {
        let base = format!("https://generativelanguage.googleapis.com/v1beta/models/{}", self.model);
        if stream {
            format!("{}:streamGenerateContent?key={}&alt=sse", base, self.api_key)
        } else {
            format!("{}:generateContent?key={}", base, self.api_key)
        }
    }

    /// Convert miyabi Message to Gemini format
    fn convert_messages(&self, messages: Vec<Message>) -> Vec<GeminiContent> {
        messages
            .into_iter()
            .map(|msg| {
                let part = GeminiPart { text: Some(msg.content), function_call: None, function_response: None };
                GeminiContent { parts: vec![part] }
            })
            .collect()
    }

    /// Convert tool definitions to Gemini format
    fn convert_tools(&self, tools: Vec<ToolDefinition>) -> Vec<GeminiTool> {
        let declarations: Vec<GeminiFunctionDeclaration> = tools
            .into_iter()
            .map(|tool| GeminiFunctionDeclaration {
                name: tool.name,
                description: tool.description,
                parameters: tool.parameters,
            })
            .collect();

        vec![GeminiTool { function_declarations: declarations }]
    }

    /// Parse function calls from response
    fn parse_tool_calls(&self, response: &GeminiResponse) -> Option<Vec<ToolCall>> {
        let candidate = response.candidates.first()?;
        let parts = &candidate.content.parts;

        let tool_calls: Vec<ToolCall> = parts
            .iter()
            .filter_map(|part| {
                part.function_call.as_ref().map(|fc| ToolCall {
                    id: format!("call_{}", fc.name),
                    name: fc.name.clone(),
                    arguments: fc.args.clone(),
                })
            })
            .collect();

        if tool_calls.is_empty() {
            None
        } else {
            Some(tool_calls)
        }
    }

    /// Extract text from response
    fn extract_text(&self, response: &GeminiResponse) -> Result<String> {
        let candidate = response
            .candidates
            .first()
            .ok_or_else(|| LlmError::ApiError("No candidates in response".to_string()))?;

        let text: String = candidate
            .content
            .parts
            .iter()
            .filter_map(|part| part.text.as_ref())
            .cloned()
            .collect::<Vec<_>>()
            .join("");

        if text.is_empty() {
            Err(LlmError::ApiError("Empty response text".to_string()))
        } else {
            Ok(text)
        }
    }
}

#[async_trait]
impl LlmClient for GoogleClient {
    async fn chat(&self, messages: Vec<Message>) -> Result<String> {
        let contents = self.convert_messages(messages);

        let request = GeminiRequest {
            contents,
            tools: None,
            generation_config: Some(GeminiGenerationConfig {
                temperature: self.temperature,
                top_p: None,
                top_k: None,
                max_output_tokens: self.max_tokens,
            }),
        };

        tracing::debug!("Gemini request: {:?}", request);

        let response = self
            .client
            .post(self.get_endpoint(false))
            .json(&request)
            .send()
            .await
            .map_err(|e| LlmError::NetworkError(e.to_string()))?;

        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
            return Err(LlmError::ApiError(format!("Gemini API error {}: {}", status, error_text)));
        }

        let gemini_response: GeminiResponse = response.json().await.map_err(|e| LlmError::ParseError(e.to_string()))?;

        tracing::debug!("Gemini response: {:?}", gemini_response);

        self.extract_text(&gemini_response)
    }

    async fn chat_with_tools(&self, messages: Vec<Message>, tools: Vec<ToolDefinition>) -> Result<ToolCallResponse> {
        let contents = self.convert_messages(messages);
        let gemini_tools = self.convert_tools(tools);

        let request = GeminiRequest {
            contents,
            tools: Some(gemini_tools),
            generation_config: Some(GeminiGenerationConfig {
                temperature: self.temperature,
                top_p: None,
                top_k: None,
                max_output_tokens: self.max_tokens,
            }),
        };

        let response = self
            .client
            .post(self.get_endpoint(false))
            .json(&request)
            .send()
            .await
            .map_err(|e| LlmError::NetworkError(e.to_string()))?;

        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
            return Err(LlmError::ApiError(format!("Gemini API error {}: {}", status, error_text)));
        }

        let gemini_response: GeminiResponse = response.json().await.map_err(|e| LlmError::ParseError(e.to_string()))?;

        // Check for function calls
        if let Some(tool_calls) = self.parse_tool_calls(&gemini_response) {
            Ok(ToolCallResponse::ToolCalls(tool_calls))
        } else {
            // No function calls, return conclusion
            let text = self.extract_text(&gemini_response)?;
            Ok(ToolCallResponse::Conclusion { text })
        }
    }

    fn provider_name(&self) -> &str {
        "google"
    }

    fn model_name(&self) -> &str {
        &self.model
    }
}

#[async_trait]
impl LlmStreamingClient for GoogleClient {
    async fn chat_stream(&self, messages: Vec<Message>) -> Result<StreamResponse> {
        let contents = self.convert_messages(messages);

        let request = GeminiRequest {
            contents,
            tools: None,
            generation_config: Some(GeminiGenerationConfig {
                temperature: self.temperature,
                top_p: None,
                top_k: None,
                max_output_tokens: self.max_tokens,
            }),
        };

        let response = self
            .client
            .post(self.get_endpoint(true))
            .json(&request)
            .send()
            .await
            .map_err(|e| LlmError::NetworkError(e.to_string()))?;

        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
            return Err(LlmError::ApiError(format!("Gemini API error {}: {}", status, error_text)));
        }

        // Create stream from response
        let stream = response.bytes_stream();

        let text_stream = stream.filter_map(|chunk_result| async move {
            match chunk_result {
                Ok(bytes) => {
                    let text = String::from_utf8_lossy(&bytes);

                    // Parse SSE format: data: {...}
                    for line in text.lines() {
                        if let Some(json_str) = line.strip_prefix("data: ") {
                            if let Ok(chunk) = serde_json::from_str::<GeminiStreamChunk>(json_str) {
                                if let Some(candidate) = chunk.candidates.first() {
                                    let content: String = candidate
                                        .content
                                        .parts
                                        .iter()
                                        .filter_map(|part| part.text.as_ref())
                                        .cloned()
                                        .collect::<Vec<_>>()
                                        .join("");

                                    if !content.is_empty() {
                                        return Some(Ok(content));
                                    }
                                }
                            }
                        }
                    }
                    None
                }
                Err(e) => Some(Err(LlmError::NetworkError(e.to_string()))),
            }
        });

        Ok(Box::pin(text_stream))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_client_creation() {
        let client = GoogleClient::new("test-key".to_string());
        assert_eq!(client.provider_name(), "google");
        assert_eq!(client.model_name(), "gemini-1.5-pro");
    }

    #[test]
    fn test_model_selection() {
        let client = GoogleClient::new("test-key".to_string()).with_flash();
        assert_eq!(client.model_name(), "gemini-1.5-flash");

        let client = GoogleClient::new("test-key".to_string()).with_pro();
        assert_eq!(client.model_name(), "gemini-1.5-pro");
    }

    #[test]
    fn test_endpoint_generation() {
        let client = GoogleClient::new("test-key".to_string());

        let endpoint = client.get_endpoint(false);
        assert!(endpoint.contains("gemini-1.5-pro"));
        assert!(endpoint.contains("generateContent"));

        let stream_endpoint = client.get_endpoint(true);
        assert!(stream_endpoint.contains("streamGenerateContent"));
        assert!(stream_endpoint.contains("alt=sse"));
    }
}
