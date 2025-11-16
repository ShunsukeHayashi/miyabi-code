//! LLM provider trait and implementations

use crate::types::{ChatMessage, LLMRequest, LLMResponse};
use crate::{LLMError, Result};
use async_trait::async_trait;
use std::time::Duration;

/// LLM provider trait
///
/// Provides a unified interface for different LLM backends
#[async_trait]
pub trait LLMProvider: Send + Sync {
    /// Generate text from a prompt
    async fn generate(&self, request: &LLMRequest) -> Result<LLMResponse>;

    /// Chat completion with message history
    async fn chat(&self, messages: &[ChatMessage]) -> Result<ChatMessage>;

    /// Call a function using function calling
    async fn call_function(&self, name: &str, args: serde_json::Value)
        -> Result<serde_json::Value>;

    /// Get model name
    fn model_name(&self) -> &str;

    /// Get maximum tokens supported
    fn max_tokens(&self) -> usize;
}

/// GPT-OSS-20B provider
///
/// Supports multiple backends: vLLM, Ollama, Groq
pub struct GPTOSSProvider {
    /// API endpoint URL
    endpoint: String,
    /// API key (required for Groq)
    api_key: Option<String>,
    /// Model name
    model: String,
    /// HTTP client
    client: reqwest::Client,
    /// Request timeout
    timeout: Duration,
}

impl GPTOSSProvider {
    /// Create a new provider with custom endpoint
    pub fn new(endpoint: impl Into<String>, api_key: Option<String>) -> Result<Self> {
        let endpoint_str = endpoint.into();

        // Validate endpoint URL
        if !endpoint_str.starts_with("http://") && !endpoint_str.starts_with("https://") {
            return Err(LLMError::InvalidEndpoint(format!(
                "Endpoint must start with http:// or https://: {}",
                endpoint_str
            )));
        }

        let client = reqwest::Client::builder()
            .timeout(Duration::from_secs(120)) // 2 minutes timeout for LLM generation
            .build()
            .map_err(|e| LLMError::Unknown(format!("Failed to create HTTP client: {}", e)))?;

        Ok(Self {
            endpoint: endpoint_str,
            api_key,
            model: "openai/gpt-oss-20b".to_string(),
            client,
            timeout: Duration::from_secs(120), // 2 minutes timeout for LLM generation
        })
    }

    /// Create a Groq provider
    ///
    /// # Arguments
    /// * `api_key` - Groq API key (required)
    ///
    /// # Example
    /// ```rust,no_run
    /// use miyabi_llm::GPTOSSProvider;
    ///
    /// let provider = GPTOSSProvider::new_groq("gsk_xxxxx").unwrap();
    /// ```
    pub fn new_groq(api_key: impl Into<String>) -> Result<Self> {
        Self::new("https://api.groq.com/openai/v1", Some(api_key.into()))
    }

    /// Create a vLLM provider
    ///
    /// # Arguments
    /// * `endpoint` - vLLM endpoint URL (e.g., "http://localhost:8000")
    ///
    /// # Example
    /// ```rust,no_run
    /// use miyabi_llm::GPTOSSProvider;
    ///
    /// let provider = GPTOSSProvider::new_vllm("http://localhost:8000").unwrap();
    /// ```
    pub fn new_vllm(endpoint: impl Into<String>) -> Result<Self> {
        Self::new(endpoint, None)
    }

    /// Create an Ollama provider
    ///
    /// Uses default Ollama endpoint (http://localhost:11434)
    ///
    /// # Example
    /// ```rust,no_run
    /// use miyabi_llm::GPTOSSProvider;
    ///
    /// let provider = GPTOSSProvider::new_ollama().unwrap();
    /// ```
    pub fn new_ollama() -> Result<Self> {
        let mut provider = Self::new("http://localhost:11434", None)?;
        provider.model = "gpt-oss:20b".to_string(); // Ollama model naming
        Ok(provider)
    }

    /// Create a Mac mini Ollama provider
    ///
    /// # Arguments
    /// * `ip_address` - Mac mini IP address (LAN or Tailscale)
    ///
    /// # Example
    /// ```rust,no_run
    /// use miyabi_llm::GPTOSSProvider;
    ///
    /// // LAN address
    /// let provider = GPTOSSProvider::new_mac_mini("192.168.3.27").unwrap();
    ///
    /// // Tailscale address
    /// let provider = GPTOSSProvider::new_mac_mini("100.88.201.67").unwrap();
    /// ```
    pub fn new_mac_mini(ip_address: impl Into<String>) -> Result<Self> {
        let ip = ip_address.into();
        let endpoint = format!("http://{}:11434", ip);
        let mut provider = Self::new(endpoint, None)?;
        provider.model = "gpt-oss:20b".to_string();
        Ok(provider)
    }

    /// Create a Mac mini Ollama provider with custom port
    ///
    /// # Arguments
    /// * `ip_address` - Mac mini IP address
    /// * `port` - Custom port number (default: 11434)
    ///
    /// # Example
    /// ```rust,no_run
    /// use miyabi_llm::GPTOSSProvider;
    ///
    /// let provider = GPTOSSProvider::new_mac_mini_custom("192.168.3.27", 8080).unwrap();
    /// ```
    pub fn new_mac_mini_custom(ip_address: impl Into<String>, port: u16) -> Result<Self> {
        let ip = ip_address.into();
        let endpoint = format!("http://{}:{}", ip, port);
        let mut provider = Self::new(endpoint, None)?;
        provider.model = "gpt-oss:20b".to_string();
        Ok(provider)
    }

    /// Create a Mac mini Ollama provider (LAN address: 192.168.3.27)
    ///
    /// # Example
    /// ```rust,no_run
    /// use miyabi_llm::GPTOSSProvider;
    ///
    /// let provider = GPTOSSProvider::new_mac_mini_lan().unwrap();
    /// ```
    pub fn new_mac_mini_lan() -> Result<Self> {
        Self::new_mac_mini("192.168.3.27")
    }

    /// Create a Mac mini Ollama provider (Tailscale address: 100.88.201.67)
    ///
    /// # Example
    /// ```rust,no_run
    /// use miyabi_llm::GPTOSSProvider;
    ///
    /// let provider = GPTOSSProvider::new_mac_mini_tailscale().unwrap();
    /// ```
    pub fn new_mac_mini_tailscale() -> Result<Self> {
        Self::new_mac_mini("100.88.201.67")
    }

    /// Create a provider with standard fallback chain
    ///
    /// Attempts to initialize LLM provider in the following order:
    /// 1. Mac mini LAN (192.168.3.27:11434)
    /// 2. Mac mini Tailscale (100.88.201.67:11434)
    /// 3. Groq API (requires GROQ_API_KEY environment variable)
    ///
    /// # Returns
    ///
    /// Returns the first successfully initialized provider.
    ///
    /// # Errors
    ///
    /// Returns `LLMError::AllProvidersUnavailable` if all providers fail to initialize.
    ///
    /// # Example
    ///
    /// ```rust,no_run
    /// use miyabi_llm::GPTOSSProvider;
    ///
    /// # tokio_test::block_on(async {
    /// let provider = GPTOSSProvider::new_with_fallback().unwrap();
    /// # });
    /// ```
    pub fn new_with_fallback() -> Result<Self> {
        // Try Mac mini LAN
        if let Ok(provider) = Self::new_mac_mini_lan() {
            tracing::debug!("LLM provider initialized: Mac mini LAN");
            return Ok(provider);
        }

        // Try Mac mini Tailscale
        if let Ok(provider) = Self::new_mac_mini_tailscale() {
            tracing::debug!("LLM provider initialized: Mac mini Tailscale");
            return Ok(provider);
        }

        // Try Groq API
        if let Ok(api_key) = std::env::var("GROQ_API_KEY") {
            if let Ok(provider) = Self::new_groq(&api_key) {
                tracing::debug!("LLM provider initialized: Groq API");
                return Ok(provider);
            }
        }

        // All providers failed
        Err(LLMError::AllProvidersUnavailable)
    }

    /// Set custom model name
    pub fn with_model(mut self, model: impl Into<String>) -> Self {
        self.model = model.into();
        self
    }

    /// Set request timeout
    pub fn with_timeout(mut self, timeout: Duration) -> Self {
        self.timeout = timeout;
        self
    }

    /// Build OpenAI-compatible request body
    fn build_request_body(&self, request: &LLMRequest) -> serde_json::Value {
        serde_json::json!({
            "model": self.model,
            "messages": [
                {
                    "role": "user",
                    "content": request.prompt
                }
            ],
            "temperature": request.temperature,
            "max_tokens": request.max_tokens,
            "reasoning_effort": request.reasoning_effort.to_string(),
        })
    }

    /// Build Ollama-specific request body
    fn build_ollama_request_body(&self, request: &LLMRequest) -> serde_json::Value {
        serde_json::json!({
            "model": self.model,
            "prompt": request.prompt,
            "stream": false,
            "options": {
                "temperature": request.temperature,
                "num_predict": request.max_tokens,
            }
        })
    }

    /// Build chat request body
    fn build_chat_request_body(
        &self,
        messages: &[ChatMessage],
        temperature: f32,
        max_tokens: usize,
    ) -> serde_json::Value {
        serde_json::json!({
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        })
    }

    /// Parse OpenAI-compatible response
    fn parse_response(&self, response_json: &serde_json::Value) -> Result<LLMResponse> {
        let choices = response_json
            .get("choices")
            .and_then(|c| c.as_array())
            .ok_or_else(|| LLMError::ParseError("Missing 'choices' in response".to_string()))?;

        let first_choice = choices
            .first()
            .ok_or_else(|| LLMError::ParseError("Empty 'choices' array".to_string()))?;

        let message = first_choice
            .get("message")
            .ok_or_else(|| LLMError::ParseError("Missing 'message' in choice".to_string()))?;

        let content = message.get("content").and_then(|c| c.as_str()).unwrap_or("").to_string();

        let finish_reason = first_choice
            .get("finish_reason")
            .and_then(|f| f.as_str())
            .unwrap_or("stop")
            .to_string();

        let usage = response_json.get("usage");
        let tokens_used =
            usage.and_then(|u| u.get("total_tokens")).and_then(|t| t.as_u64()).unwrap_or(0) as u32;

        Ok(LLMResponse {
            text: content,
            tokens_used,
            finish_reason,
            function_call: None, // TODO: Parse function calls
            tool_calls: None,
        })
    }

    /// Parse Ollama-specific response
    fn parse_ollama_response(&self, response_json: &serde_json::Value) -> Result<LLMResponse> {
        let response_text =
            response_json.get("response").and_then(|r| r.as_str()).unwrap_or("").to_string();

        let done_reason = response_json
            .get("done_reason")
            .and_then(|d| d.as_str())
            .unwrap_or("stop")
            .to_string();

        // Calculate tokens from context if available
        let tokens_used =
            response_json.get("eval_count").and_then(|e| e.as_u64()).unwrap_or(0) as u32;

        Ok(LLMResponse {
            text: response_text,
            tokens_used,
            finish_reason: done_reason,
            function_call: None,
            tool_calls: None,
        })
    }

    /// Check if this is an Ollama endpoint
    fn is_ollama(&self) -> bool {
        self.endpoint.contains("11434") || self.model.contains("gpt-oss:20b")
    }
}

#[async_trait]
impl LLMProvider for GPTOSSProvider {
    async fn generate(&self, request: &LLMRequest) -> Result<LLMResponse> {
        tracing::info!(
            "Generating with model {} (reasoning: {})",
            self.model,
            request.reasoning_effort
        );

        let (request_body, endpoint_path) = if self.is_ollama() {
            (self.build_ollama_request_body(request), "/api/generate".to_string())
        } else {
            (self.build_request_body(request), "/chat/completions".to_string())
        };

        // Build HTTP request
        let mut http_request = self
            .client
            .post(format!("{}{}", self.endpoint, endpoint_path))
            .json(&request_body)
            .timeout(self.timeout);

        // Add API key header if provided (Groq)
        if let Some(ref api_key) = self.api_key {
            http_request = http_request.header("Authorization", format!("Bearer {}", api_key));
        }

        // Send request
        let response = http_request.send().await.map_err(|e| {
            if e.is_timeout() {
                LLMError::Timeout(self.timeout.as_millis() as u64)
            } else {
                LLMError::NetworkError(e.to_string())
            }
        })?;

        // Check status
        let status = response.status();
        if !status.is_success() {
            let error_text = response.text().await.unwrap_or_default();
            return Err(LLMError::ApiError(format!(
                "API returned status {}: {}",
                status, error_text
            )));
        }

        // Parse response
        let response_json: serde_json::Value = response
            .json()
            .await
            .map_err(|e| LLMError::ParseError(format!("Failed to parse response JSON: {}", e)))?;

        if self.is_ollama() {
            self.parse_ollama_response(&response_json)
        } else {
            self.parse_response(&response_json)
        }
    }

    async fn chat(&self, messages: &[ChatMessage]) -> Result<ChatMessage> {
        tracing::info!("Chat completion with {} messages", messages.len());

        let request_body = self.build_chat_request_body(messages, 0.2, 4096);

        let mut http_request = self
            .client
            .post(format!("{}/chat/completions", self.endpoint))
            .json(&request_body)
            .timeout(self.timeout);

        if let Some(ref api_key) = self.api_key {
            http_request = http_request.header("Authorization", format!("Bearer {}", api_key));
        }

        let response = http_request.send().await.map_err(|e| {
            if e.is_timeout() {
                LLMError::Timeout(self.timeout.as_millis() as u64)
            } else {
                LLMError::NetworkError(e.to_string())
            }
        })?;

        let status = response.status();
        if !status.is_success() {
            let error_text = response.text().await.unwrap_or_default();
            return Err(LLMError::ApiError(format!(
                "API returned status {}: {}",
                status, error_text
            )));
        }

        let response_json: serde_json::Value = response
            .json()
            .await
            .map_err(|e| LLMError::ParseError(format!("Failed to parse response JSON: {}", e)))?;
        let llm_response = self.parse_response(&response_json)?;

        Ok(ChatMessage::assistant(llm_response.text))
    }

    async fn call_function(
        &self,
        name: &str,
        args: serde_json::Value,
    ) -> Result<serde_json::Value> {
        // TODO: Implement function calling
        // For now, return a placeholder
        tracing::warn!("Function calling not yet implemented");
        Ok(serde_json::json!({
            "function": name,
            "args": args,
            "result": "Not implemented"
        }))
    }

    fn model_name(&self) -> &str {
        &self.model
    }

    fn max_tokens(&self) -> usize {
        128_000 // GPT-OSS-20B context length
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::ReasoningEffort;

    #[test]
    fn test_provider_creation_groq() {
        let provider = GPTOSSProvider::new_groq("test_key").unwrap();
        assert_eq!(provider.model, "openai/gpt-oss-20b");
        assert_eq!(provider.endpoint, "https://api.groq.com/openai/v1");
        assert_eq!(provider.api_key, Some("test_key".to_string()));
    }

    #[test]
    fn test_provider_creation_vllm() {
        let provider = GPTOSSProvider::new_vllm("http://localhost:8000").unwrap();
        assert_eq!(provider.model, "openai/gpt-oss-20b");
        assert_eq!(provider.endpoint, "http://localhost:8000");
        assert_eq!(provider.api_key, None);
    }

    #[test]
    fn test_provider_creation_ollama() {
        let provider = GPTOSSProvider::new_ollama().unwrap();
        assert_eq!(provider.model, "gpt-oss:20b");
        assert_eq!(provider.endpoint, "http://localhost:11434");
        assert_eq!(provider.api_key, None);
    }

    #[test]
    fn test_provider_creation_mac_mini_lan() {
        let provider = GPTOSSProvider::new_mac_mini("192.168.3.27").unwrap();
        assert_eq!(provider.model, "gpt-oss:20b");
        assert_eq!(provider.endpoint, "http://192.168.3.27:11434");
        assert_eq!(provider.api_key, None);
    }

    #[test]
    fn test_provider_creation_mac_mini_tailscale() {
        let provider = GPTOSSProvider::new_mac_mini("100.88.201.67").unwrap();
        assert_eq!(provider.model, "gpt-oss:20b");
        assert_eq!(provider.endpoint, "http://100.88.201.67:11434");
        assert_eq!(provider.api_key, None);
    }

    #[test]
    fn test_provider_creation_mac_mini_custom_port() {
        let provider = GPTOSSProvider::new_mac_mini_custom("192.168.3.27", 8080).unwrap();
        assert_eq!(provider.model, "gpt-oss:20b");
        assert_eq!(provider.endpoint, "http://192.168.3.27:8080");
        assert_eq!(provider.api_key, None);
    }

    #[test]
    fn test_invalid_endpoint() {
        let result = GPTOSSProvider::new("invalid://endpoint", None);
        assert!(result.is_err());

        let result = GPTOSSProvider::new("not-a-url", None);
        assert!(result.is_err());
    }

    #[test]
    fn test_model_name() {
        let provider = GPTOSSProvider::new_groq("test").unwrap();
        assert_eq!(provider.model_name(), "openai/gpt-oss-20b");
    }

    #[test]
    fn test_max_tokens() {
        let provider = GPTOSSProvider::new_groq("test").unwrap();
        assert_eq!(provider.max_tokens(), 128_000);
    }

    #[test]
    fn test_build_request_body() {
        let provider = GPTOSSProvider::new_groq("test").unwrap();
        let request = LLMRequest::new("test prompt")
            .with_temperature(0.5)
            .with_max_tokens(1024)
            .with_reasoning_effort(ReasoningEffort::High);

        let body = provider.build_request_body(&request);

        assert_eq!(body["model"], "openai/gpt-oss-20b");
        assert_eq!(body["messages"][0]["content"], "test prompt");
        assert_eq!(body["temperature"], 0.5);
        assert_eq!(body["max_tokens"], 1024);
        assert_eq!(body["reasoning_effort"], "high");
    }

    #[test]
    fn test_parse_response() {
        let provider = GPTOSSProvider::new_groq("test").unwrap();

        let response_json = serde_json::json!({
            "id": "chatcmpl-123",
            "object": "chat.completion",
            "created": 1677652288,
            "model": "openai/gpt-oss-20b",
            "choices": [{
                "index": 0,
                "message": {
                    "role": "assistant",
                    "content": "Generated response"
                },
                "finish_reason": "stop"
            }],
            "usage": {
                "prompt_tokens": 10,
                "completion_tokens": 20,
                "total_tokens": 30
            }
        });

        let result = provider.parse_response(&response_json).unwrap();
        assert_eq!(result.text, "Generated response");
        assert_eq!(result.tokens_used, 30);
        assert_eq!(result.finish_reason, "stop");
    }

    #[test]
    fn test_parse_response_invalid() {
        let provider = GPTOSSProvider::new_groq("test").unwrap();

        // Missing choices
        let invalid_json = serde_json::json!({
            "id": "test"
        });
        assert!(provider.parse_response(&invalid_json).is_err());

        // Empty choices
        let invalid_json = serde_json::json!({
            "choices": []
        });
        assert!(provider.parse_response(&invalid_json).is_err());
    }

    #[test]
    fn test_custom_model() {
        let provider = GPTOSSProvider::new_groq("test").unwrap().with_model("custom-model");
        assert_eq!(provider.model_name(), "custom-model");
    }

    #[test]
    fn test_custom_timeout() {
        let provider =
            GPTOSSProvider::new_groq("test").unwrap().with_timeout(Duration::from_secs(60));
        assert_eq!(provider.timeout, Duration::from_secs(60));
    }

    #[test]
    fn test_is_ollama() {
        let ollama_provider = GPTOSSProvider::new_mac_mini_tailscale().unwrap();
        assert!(ollama_provider.is_ollama());

        let groq_provider = GPTOSSProvider::new_groq("test").unwrap();
        assert!(!groq_provider.is_ollama());
    }

    #[test]
    fn test_build_ollama_request_body() {
        let provider = GPTOSSProvider::new_mac_mini_tailscale().unwrap();
        let request = LLMRequest::new("test prompt").with_temperature(0.5).with_max_tokens(1024);

        let body = provider.build_ollama_request_body(&request);

        assert_eq!(body["model"], "gpt-oss:20b");
        assert_eq!(body["prompt"], "test prompt");
        assert_eq!(body["stream"], false);
        assert_eq!(body["options"]["temperature"], 0.5);
        assert_eq!(body["options"]["num_predict"], 1024);
    }

    #[test]
    fn test_parse_ollama_response() {
        let provider = GPTOSSProvider::new_mac_mini_tailscale().unwrap();

        let response_json = serde_json::json!({
            "model": "gpt-oss:20b",
            "created_at": "2025-10-16T18:39:31.214203Z",
            "response": "Hello! I'm just a bunch of algorithms, so I don't have feelings in the human sense, but I'm here and ready to help. How can I assist you today?",
            "done": true,
            "done_reason": "stop",
            "eval_count": 71
        });

        let result = provider.parse_ollama_response(&response_json).unwrap();
        assert!(result.text.contains("Hello! I'm just a bunch of algorithms"));
        assert_eq!(result.tokens_used, 71);
        assert_eq!(result.finish_reason, "stop");
    }
}
