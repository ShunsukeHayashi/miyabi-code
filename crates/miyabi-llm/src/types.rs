//! Core types for LLM operations

use serde::{Deserialize, Serialize};

/// Reasoning effort level for LLM inference
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Default)]
#[serde(rename_all = "lowercase")]
pub enum ReasoningEffort {
    /// Low effort - fast inference for simple tasks
    Low,
    /// Medium effort - balanced quality and speed
    #[default]
    Medium,
    /// High effort - high quality reasoning for complex tasks
    High,
}

impl std::fmt::Display for ReasoningEffort {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Low => write!(f, "low"),
            Self::Medium => write!(f, "medium"),
            Self::High => write!(f, "high"),
        }
    }
}

/// LLM inference request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LLMRequest {
    /// Prompt text
    pub prompt: String,
    /// Temperature (0.0-2.0) - higher values make output more random
    pub temperature: f32,
    /// Maximum number of tokens to generate
    pub max_tokens: usize,
    /// Reasoning effort level
    pub reasoning_effort: ReasoningEffort,
}

impl LLMRequest {
    /// Create a new request with default values
    pub fn new(prompt: impl Into<String>) -> Self {
        Self {
            prompt: prompt.into(),
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
}

/// LLM inference response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LLMResponse {
    /// Generated text
    pub text: String,
    /// Number of tokens used
    pub tokens_used: u32,
    /// Finish reason (e.g., "stop", "length", "function_call")
    pub finish_reason: String,
    /// Optional function call result
    pub function_call: Option<FunctionCall>,
    /// Optional tool calls (for multi-tool calling)
    pub tool_calls: Option<Vec<FunctionCall>>,
}

/// Chat message role
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ChatRole {
    /// System message (instructions)
    System,
    /// User message (input)
    User,
    /// Assistant message (output)
    Assistant,
    /// Function call result
    Function,
}

/// Chat message
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatMessage {
    /// Message role
    pub role: ChatRole,
    /// Message content
    pub content: String,
    /// Optional function call (for assistant messages)
    pub function_call: Option<FunctionCall>,
    /// Optional function name (for function messages)
    pub name: Option<String>,
}

impl ChatMessage {
    /// Create a system message
    pub fn system(content: impl Into<String>) -> Self {
        Self {
            role: ChatRole::System,
            content: content.into(),
            function_call: None,
            name: None,
        }
    }

    /// Create a user message
    pub fn user(content: impl Into<String>) -> Self {
        Self {
            role: ChatRole::User,
            content: content.into(),
            function_call: None,
            name: None,
        }
    }

    /// Create an assistant message
    pub fn assistant(content: impl Into<String>) -> Self {
        Self {
            role: ChatRole::Assistant,
            content: content.into(),
            function_call: None,
            name: None,
        }
    }

    /// Create a function result message
    pub fn function(name: impl Into<String>, content: impl Into<String>) -> Self {
        Self {
            role: ChatRole::Function,
            content: content.into(),
            function_call: None,
            name: Some(name.into()),
        }
    }
}

/// Function call from LLM
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FunctionCall {
    /// Function name
    pub name: String,
    /// Function arguments (JSON)
    pub arguments: serde_json::Value,
}

/// Function definition for function calling
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FunctionDefinition {
    /// Function name
    pub name: String,
    /// Function description
    pub description: String,
    /// Function parameters
    pub parameters: FunctionParameter,
}

/// Function parameters schema
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FunctionParameter {
    /// Type (always "object")
    #[serde(rename = "type")]
    pub param_type: String,
    /// Properties (parameter definitions)
    pub properties: serde_json::Value,
    /// Required parameter names
    pub required: Vec<String>,
}

impl FunctionParameter {
    /// Create a new function parameter schema
    pub fn new(properties: serde_json::Value, required: Vec<String>) -> Self {
        Self {
            param_type: "object".to_string(),
            properties,
            required,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_reasoning_effort_default() {
        let effort = ReasoningEffort::default();
        assert_eq!(effort, ReasoningEffort::Medium);
    }

    #[test]
    fn test_reasoning_effort_display() {
        assert_eq!(ReasoningEffort::Low.to_string(), "low");
        assert_eq!(ReasoningEffort::Medium.to_string(), "medium");
        assert_eq!(ReasoningEffort::High.to_string(), "high");
    }

    #[test]
    fn test_llm_request_builder() {
        let request = LLMRequest::new("test prompt")
            .with_temperature(0.5)
            .with_max_tokens(1024)
            .with_reasoning_effort(ReasoningEffort::High);

        assert_eq!(request.prompt, "test prompt");
        assert_eq!(request.temperature, 0.5);
        assert_eq!(request.max_tokens, 1024);
        assert_eq!(request.reasoning_effort, ReasoningEffort::High);
    }

    #[test]
    fn test_chat_message_constructors() {
        let system = ChatMessage::system("You are a helpful assistant");
        assert_eq!(system.role, ChatRole::System);
        assert_eq!(system.content, "You are a helpful assistant");

        let user = ChatMessage::user("Hello");
        assert_eq!(user.role, ChatRole::User);
        assert_eq!(user.content, "Hello");

        let assistant = ChatMessage::assistant("Hi there!");
        assert_eq!(assistant.role, ChatRole::Assistant);
        assert_eq!(assistant.content, "Hi there!");

        let function = ChatMessage::function("test_fn", "result");
        assert_eq!(function.role, ChatRole::Function);
        assert_eq!(function.content, "result");
        assert_eq!(function.name, Some("test_fn".to_string()));
    }

    #[test]
    fn test_function_parameter_creation() {
        let properties = serde_json::json!({
            "name": {
                "type": "string",
                "description": "The name parameter"
            },
            "age": {
                "type": "integer",
                "description": "The age parameter"
            }
        });

        let param = FunctionParameter::new(properties.clone(), vec!["name".to_string()]);

        assert_eq!(param.param_type, "object");
        assert_eq!(param.properties, properties);
        assert_eq!(param.required, vec!["name"]);
    }

    #[test]
    fn test_serialization() {
        let request = LLMRequest::new("test")
            .with_temperature(0.7)
            .with_reasoning_effort(ReasoningEffort::Low);

        let json = serde_json::to_string(&request).unwrap();
        assert!(json.contains("test"));
        assert!(json.contains("0.7"));
        assert!(json.contains("low"));

        let deserialized: LLMRequest = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized.prompt, "test");
        assert_eq!(deserialized.temperature, 0.7);
        assert_eq!(deserialized.reasoning_effort, ReasoningEffort::Low);
    }
}
