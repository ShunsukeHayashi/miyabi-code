//! Miyabi LLM - LLM Integration for Autonomous Agents
//!
//! Provides a unified interface for multiple LLM providers:
//! - Anthropic Claude (Claude 3.5 Sonnet)
//! - OpenAI GPT (GPT-4o, GPT-4 Turbo)
//! - Ollama (Local LLM - GPT-OSS-20B)
//! - Groq (Ultra-fast inference - Llama 3)

pub mod client;
pub mod context;
pub mod conversation;
pub mod error;
pub mod message;
pub mod prompt;
pub mod provider;
pub mod providers;
pub mod router;
pub mod tools;
pub mod types;

// New API (modern trait-based interface)
pub use client::{LlmClient, ToolCallResponse};
pub use error::{LLMError, LlmError, Result};
pub use message::{Message, Role};
pub use tools::{ToolCall, ToolDefinition};

// Re-export provider implementations
pub use providers::anthropic::AnthropicClient;
pub use providers::openai::OpenAIClient;

// Re-export hybrid router
pub use router::{CostMetrics, HybridRouter, TaskComplexity};

// Legacy API (for backward compatibility with existing agents)
pub use context::LLMContext;
pub use conversation::LLMConversation;
pub use prompt::{LLMPromptTemplate, PromptError, ResponseFormat};
pub use provider::{GPTOSSProvider, LLMProvider};
pub use types::{ChatMessage, LLMRequest, LLMResponse, ReasoningEffort};
