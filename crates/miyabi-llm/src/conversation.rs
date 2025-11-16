//! LLM Conversation System
//!
//! Provides a conversational interface for multi-turn LLM interactions
//! with message history and context management.
//!
//! # Example
//!
//! ```rust,no_run
//! use miyabi_llm::{LLMConversation, GPTOSSProvider, LLMContext};
//! use miyabi_llm::prompt::presets;
//! use miyabi_types::{Task, task::TaskType};
//!
//! # async fn example() -> anyhow::Result<()> {
//! let provider = GPTOSSProvider::new_mac_mini("192.168.3.27")?;
//! let task = Task {
//!     id: "example-task".to_string(),
//!     title: "Example Task".to_string(),
//!     description: "An example task for demonstration".to_string(),
//!     task_type: TaskType::Feature,
//!     priority: 1,
//!     severity: None,
//!     impact: None,
//!     assigned_agent: None,
//!     dependencies: vec![],
//!     estimated_duration: Some(60),
//!     status: None,
//!     start_time: None,
//!     end_time: None,
//!     metadata: None,
//! };
//! let context = LLMContext::from_task(&task);
//!
//! let mut conversation = LLMConversation::new(Box::new(provider), context);
//!
//! // Ask question
//! let response = conversation.ask("How should I implement this?").await?;
//! println!("Response: {}", response);
//!
//! // Follow-up question (with message history)
//! let followup = conversation.ask("Can you explain more?").await?;
//! # Ok(())
//! # }
//! ```

use crate::context::LLMContext;
use crate::prompt::LLMPromptTemplate;
use crate::provider::LLMProvider;
use crate::types::{ChatMessage, ChatRole, LLMRequest, ReasoningEffort};
use crate::{LLMError, Result};
use serde::de::DeserializeOwned;
use std::sync::Arc;

/// LLM Conversation
///
/// Manages a multi-turn conversation with an LLM provider,
/// maintaining message history and context.
pub struct LLMConversation {
    /// LLM provider
    provider: Arc<dyn LLMProvider>,

    /// Message history
    messages: Vec<ChatMessage>,

    /// Execution context
    context: LLMContext,

    /// Default temperature
    temperature: f32,

    /// Default max tokens
    max_tokens: usize,

    /// Default reasoning effort
    reasoning_effort: ReasoningEffort,
}

impl LLMConversation {
    /// Create a new conversation
    ///
    /// # Arguments
    /// * `provider` - LLM provider implementation
    /// * `context` - Execution context
    pub fn new(provider: Box<dyn LLMProvider>, context: LLMContext) -> Self {
        Self {
            provider: Arc::from(provider),
            messages: Vec::new(),
            context,
            temperature: 0.2,
            max_tokens: 4096,
            reasoning_effort: ReasoningEffort::Medium,
        }
    }

    /// Set temperature
    pub fn with_temperature(mut self, temperature: f32) -> Self {
        self.temperature = temperature;
        self
    }

    /// Set max tokens
    pub fn with_max_tokens(mut self, max_tokens: usize) -> Self {
        self.max_tokens = max_tokens;
        self
    }

    /// Set reasoning effort
    pub fn with_reasoning_effort(mut self, effort: ReasoningEffort) -> Self {
        self.reasoning_effort = effort;
        self
    }

    /// Ask a question and get response
    ///
    /// # Arguments
    /// * `prompt` - User message
    ///
    /// # Returns
    /// Assistant's response text
    pub async fn ask(&mut self, prompt: &str) -> Result<String> {
        // Add user message to history
        self.messages.push(ChatMessage::user(prompt));

        // Create request with full message history
        let full_prompt = self.build_full_prompt();

        let request = LLMRequest::new(full_prompt)
            .with_temperature(self.temperature)
            .with_max_tokens(self.max_tokens)
            .with_reasoning_effort(self.reasoning_effort);

        // Generate response
        let response = self.provider.generate(&request).await?;

        // Add assistant message to history
        self.messages.push(ChatMessage::assistant(response.text.clone()));

        Ok(response.text)
    }

    /// Ask with a template and render with context variables
    ///
    /// # Arguments
    /// * `template` - Prompt template
    ///
    /// # Returns
    /// Assistant's response text
    pub async fn ask_with_template(&mut self, template: &LLMPromptTemplate) -> Result<String> {
        let vars = self.context.to_prompt_variables();
        let rendered = template.render(&vars).map_err(|err| {
            LLMError::Unknown(format!("Failed to render prompt template: {}", err))
        })?;

        self.ask(&rendered).await
    }

    /// Ask for JSON response and parse
    ///
    /// # Arguments
    /// * `prompt` - User message requesting JSON
    ///
    /// # Returns
    /// Parsed JSON object
    pub async fn ask_for_json<T: DeserializeOwned>(&mut self, prompt: &str) -> Result<T> {
        let response = self.ask(prompt).await?;

        // Try to extract JSON from markdown code blocks
        let json_str = if response.contains("```json") {
            extract_json_from_markdown(&response)?
        } else if response.contains("```") {
            extract_code_from_markdown(&response)?
        } else {
            response.clone()
        };

        serde_json::from_str(&json_str).map_err(|e| {
            LLMError::ParseError(format!(
                "Failed to parse JSON response: {}\nResponse: {}",
                e, json_str
            ))
        })
    }

    /// Ask for code response and extract from markdown
    ///
    /// # Arguments
    /// * `prompt` - User message requesting code
    /// * `language` - Expected language (e.g., "rust", "python")
    ///
    /// # Returns
    /// Extracted code string
    pub async fn ask_for_code(&mut self, prompt: &str, language: &str) -> Result<String> {
        let response = self.ask(prompt).await?;

        // Try to extract code from markdown code blocks
        if response.contains(&format!("```{}", language)) {
            extract_code_block(&response, language)
        } else if response.contains("```") {
            extract_code_from_markdown(&response)
        } else {
            Ok(response)
        }
    }

    /// Get message history
    pub fn messages(&self) -> &[ChatMessage] {
        &self.messages
    }

    /// Get mutable context
    pub fn context_mut(&mut self) -> &mut LLMContext {
        &mut self.context
    }

    /// Get context
    pub fn context(&self) -> &LLMContext {
        &self.context
    }

    /// Clear message history
    pub fn clear_history(&mut self) {
        self.messages.clear();
    }

    /// Build full prompt from message history
    fn build_full_prompt(&self) -> String {
        let mut prompt = String::new();

        for (i, msg) in self.messages.iter().enumerate() {
            match msg.role {
                ChatRole::System => {
                    prompt.push_str(&format!("System: {}\n\n", msg.content));
                },
                ChatRole::User => {
                    prompt.push_str(&format!("User: {}\n\n", msg.content));
                },
                ChatRole::Assistant => {
                    prompt.push_str(&format!("Assistant: {}\n\n", msg.content));
                },
                ChatRole::Function => {
                    prompt.push_str(&format!("Function: {}\n\n", msg.content));
                },
            }

            // Add separator between messages (except last)
            if i < self.messages.len() - 1 {
                prompt.push_str("---\n\n");
            }
        }

        prompt
    }
}

/// Extract JSON from markdown code block
fn extract_json_from_markdown(text: &str) -> Result<String> {
    if let Some(start) = text.find("```json") {
        let after_start = &text[start + 7..]; // Skip "```json"
        if let Some(end) = after_start.find("```") {
            return Ok(after_start[..end].trim().to_string());
        }
    }

    Err(LLMError::ParseError("No JSON code block found in response".to_string()))
}

/// Extract code from markdown code block (any language)
fn extract_code_from_markdown(text: &str) -> Result<String> {
    if let Some(start) = text.find("```") {
        let after_start = &text[start + 3..];
        // Skip language identifier line
        if let Some(newline) = after_start.find('\n') {
            let after_lang = &after_start[newline + 1..];
            if let Some(end) = after_lang.find("```") {
                return Ok(after_lang[..end].trim().to_string());
            }
        }
    }

    Err(LLMError::ParseError("No code block found in response".to_string()))
}

/// Extract code block of specific language
fn extract_code_block(text: &str, language: &str) -> Result<String> {
    let marker = format!("```{}", language);
    if let Some(start) = text.find(&marker) {
        let after_start = &text[start + marker.len()..];
        if let Some(newline) = after_start.find('\n') {
            let after_newline = &after_start[newline + 1..];
            if let Some(end) = after_newline.find("```") {
                return Ok(after_newline[..end].trim().to_string());
            }
        }
    }

    Err(LLMError::ParseError(format!("No {} code block found in response", language)))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::{LLMResponse, ReasoningEffort};
    use async_trait::async_trait;
    use miyabi_types::agent::{AgentStatus, AgentType};
    use miyabi_types::task::TaskType;
    use miyabi_types::Task;

    // Helper function to create a test task
    fn create_test_task() -> Task {
        Task {
            id: "task-1".to_string(),
            title: "Test Task".to_string(),
            description: "Test description".to_string(),
            task_type: TaskType::Feature,
            priority: 1,
            severity: None,
            impact: None,
            assigned_agent: Some(AgentType::CodeGenAgent),
            dependencies: vec![],
            estimated_duration: Some(60),
            status: Some(AgentStatus::Idle),
            start_time: None,
            end_time: None,
            metadata: None,
        }
    }

    // Mock provider for testing
    struct MockProvider {
        responses: Vec<String>,
        call_count: std::sync::Arc<std::sync::Mutex<usize>>,
    }

    impl MockProvider {
        fn new(responses: Vec<String>) -> Self {
            Self {
                responses,
                call_count: std::sync::Arc::new(std::sync::Mutex::new(0)),
            }
        }
    }

    #[async_trait]
    impl LLMProvider for MockProvider {
        async fn generate(&self, _request: &LLMRequest) -> Result<LLMResponse> {
            let mut count = self.call_count.lock().unwrap();
            let response_text = self
                .responses
                .get(*count)
                .cloned()
                .unwrap_or_else(|| "Mock response".to_string());
            *count += 1;

            Ok(LLMResponse {
                text: response_text,
                tokens_used: 10,
                finish_reason: "stop".to_string(),
                function_call: None,
                tool_calls: None,
            })
        }

        async fn chat(&self, _messages: &[ChatMessage]) -> Result<ChatMessage> {
            Ok(ChatMessage::assistant("Mock chat response"))
        }

        async fn call_function(
            &self,
            _name: &str,
            _args: serde_json::Value,
        ) -> Result<serde_json::Value> {
            Ok(serde_json::json!({}))
        }

        fn model_name(&self) -> &str {
            "mock"
        }

        fn max_tokens(&self) -> usize {
            4096
        }
    }

    #[tokio::test]
    async fn test_conversation_creation() {
        let provider = MockProvider::new(vec![]);
        let task = create_test_task();
        let context = LLMContext::from_task(&task);

        let conversation = LLMConversation::new(Box::new(provider), context);

        assert_eq!(conversation.messages.len(), 0);
        assert_eq!(conversation.temperature, 0.2);
        assert_eq!(conversation.max_tokens, 4096);
    }

    #[tokio::test]
    async fn test_ask_single_message() {
        let provider = MockProvider::new(vec!["Response 1".to_string()]);
        let task = create_test_task();
        let context = LLMContext::from_task(&task);

        let mut conversation = LLMConversation::new(Box::new(provider), context);

        let response = conversation.ask("Question 1").await.unwrap();

        assert_eq!(response, "Response 1");
        assert_eq!(conversation.messages.len(), 2); // User + Assistant
        assert_eq!(conversation.messages[0].role, ChatRole::User);
        assert_eq!(conversation.messages[0].content, "Question 1");
        assert_eq!(conversation.messages[1].role, ChatRole::Assistant);
        assert_eq!(conversation.messages[1].content, "Response 1");
    }

    #[tokio::test]
    async fn test_ask_multiple_messages() {
        let provider = MockProvider::new(vec!["Response 1".to_string(), "Response 2".to_string()]);
        let task = create_test_task();
        let context = LLMContext::from_task(&task);

        let mut conversation = LLMConversation::new(Box::new(provider), context);

        conversation.ask("Question 1").await.unwrap();
        conversation.ask("Question 2").await.unwrap();

        assert_eq!(conversation.messages.len(), 4); // 2 User + 2 Assistant
    }

    #[tokio::test]
    async fn test_clear_history() {
        let provider = MockProvider::new(vec!["Response".to_string()]);
        let task = create_test_task();
        let context = LLMContext::from_task(&task);

        let mut conversation = LLMConversation::new(Box::new(provider), context);

        conversation.ask("Question").await.unwrap();
        assert_eq!(conversation.messages.len(), 2);

        conversation.clear_history();
        assert_eq!(conversation.messages.len(), 0);
    }

    #[tokio::test]
    async fn test_with_temperature() {
        let provider = MockProvider::new(vec![]);
        let task = create_test_task();
        let context = LLMContext::from_task(&task);

        let conversation = LLMConversation::new(Box::new(provider), context).with_temperature(0.8);

        assert_eq!(conversation.temperature, 0.8);
    }

    #[tokio::test]
    async fn test_with_max_tokens() {
        let provider = MockProvider::new(vec![]);
        let task = create_test_task();
        let context = LLMContext::from_task(&task);

        let conversation = LLMConversation::new(Box::new(provider), context).with_max_tokens(2048);

        assert_eq!(conversation.max_tokens, 2048);
    }

    #[tokio::test]
    async fn test_with_reasoning_effort() {
        let provider = MockProvider::new(vec![]);
        let task = create_test_task();
        let context = LLMContext::from_task(&task);

        let conversation = LLMConversation::new(Box::new(provider), context)
            .with_reasoning_effort(ReasoningEffort::High);

        assert_eq!(conversation.reasoning_effort, ReasoningEffort::High);
    }

    #[tokio::test]
    async fn test_ask_for_json() {
        let json_response = r#"```json
{
  "name": "test",
  "value": 42
}
```"#;
        let provider = MockProvider::new(vec![json_response.to_string()]);
        let task = create_test_task();
        let context = LLMContext::from_task(&task);

        let mut conversation = LLMConversation::new(Box::new(provider), context);

        #[derive(serde::Deserialize, Debug, PartialEq)]
        struct TestData {
            name: String,
            value: i32,
        }

        let result: TestData = conversation.ask_for_json("Get JSON").await.unwrap();

        assert_eq!(result.name, "test");
        assert_eq!(result.value, 42);
    }

    #[tokio::test]
    async fn test_ask_for_code() {
        let code_response = r#"```rust
fn main() {
    println!("Hello");
}
```"#;
        let provider = MockProvider::new(vec![code_response.to_string()]);
        let task = create_test_task();
        let context = LLMContext::from_task(&task);

        let mut conversation = LLMConversation::new(Box::new(provider), context);

        let code = conversation.ask_for_code("Generate code", "rust").await.unwrap();

        assert!(code.contains("fn main()"));
        assert!(code.contains("println!"));
    }

    #[test]
    fn test_extract_json_from_markdown() {
        let text = r#"Here is the JSON:
```json
{"key": "value"}
```
Done!"#;

        let result = extract_json_from_markdown(text).unwrap();
        assert_eq!(result, r#"{"key": "value"}"#);
    }

    #[test]
    fn test_extract_code_from_markdown() {
        let text = r#"Here is the code:
```rust
fn test() {}
```
Done!"#;

        let result = extract_code_from_markdown(text).unwrap();
        assert_eq!(result, "fn test() {}");
    }

    #[test]
    fn test_extract_code_block_specific_language() {
        let text = r#"```rust
fn main() {
    println!("test");
}
```"#;

        let result = extract_code_block(text, "rust").unwrap();
        assert!(result.contains("fn main()"));
    }

    #[test]
    fn test_extract_json_not_found() {
        let text = "No JSON here";
        let result = extract_json_from_markdown(text);
        assert!(result.is_err());
    }

    #[test]
    fn test_extract_code_not_found() {
        let text = "No code here";
        let result = extract_code_from_markdown(text);
        assert!(result.is_err());
    }
}
