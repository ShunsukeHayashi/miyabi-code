//! Miyabi LLM - LLM Integration for Autonomous Agents
//!
//! Provides a unified interface for multiple LLM providers:
//! - Anthropic Claude (Claude 3.5 Sonnet)
//! - OpenAI GPT (GPT-4o, GPT-4 Turbo)
//! - Google Gemini (Gemini 1.5 Pro/Flash)
//! - Ollama (Local LLM - GPT-OSS-20B)
//! - Groq (Ultra-fast inference - Llama 3)
//!
//! # Architecture
//!
//! This crate is the integration layer that:
//! - Re-exports `miyabi-llm-core` traits and types
//! - Re-exports `miyabi-llm-anthropic`, `miyabi-llm-openai`, and `miyabi-llm-google` client implementations
//! - Provides `HybridRouter` for intelligent model selection
//! - Maintains legacy API for backward compatibility

// Compatibility modules (re-export from miyabi-llm-core)
pub mod client_compat;
pub mod error_compat;
pub mod message_compat;
pub mod tools_compat;

pub use client_compat as client;
pub use error_compat as error;
pub use message_compat as message;
pub use tools_compat as tools;

// Legacy modules for backward compatibility
pub mod context;
pub mod conversation;
pub mod prompt;
pub mod provider;
pub mod router;
pub mod types;

// Re-export miyabi-llm-core (new unified API)
pub use miyabi_llm_core::LlmError as LLMError;
pub use miyabi_llm_core::{
    LlmClient, LlmError, LlmStreamingClient, Message, Result, Role, StreamEvent, StreamResponse, ToolCall,
    ToolCallResponse, ToolDefinition,
};

// Re-export provider implementations from dedicated crates
pub use miyabi_llm_anthropic::AnthropicClient;
pub use miyabi_llm_google::GoogleClient;
pub use miyabi_llm_openai::OpenAIClient;

// Re-export hybrid router
pub use router::{CostMetrics, HybridRouter, TaskComplexity};

// Legacy API (for backward compatibility with existing agents)
pub use context::LLMContext;
pub use conversation::LLMConversation;
pub use prompt::{LLMPromptTemplate, PromptError, ResponseFormat};
pub use provider::{GPTOSSProvider, LLMProvider};
pub use types::{ChatMessage, LLMRequest, LLMResponse, ReasoningEffort};
