//! Miyabi LLM - LLM Integration for Autonomous Agents
//!
//! Provides a unified interface for multiple LLM providers:
//! - Anthropic Claude (Claude 3.5 Sonnet)
//! - OpenAI GPT (GPT-4o, GPT-4 Turbo)
//! - Ollama (Local LLM - GPT-OSS-20B)
//! - Groq (Ultra-fast inference - Llama 3)

pub mod client;
pub mod error;
pub mod message;
pub mod providers;
pub mod tools;

pub use client::{LlmClient, ToolCallResponse};
pub use error::{LlmError, Result};
pub use message::{Message, Role};
pub use tools::{ToolCall, ToolDefinition};

// Re-export provider implementations
pub use providers::anthropic::AnthropicClient;
pub use providers::openai::OpenAIClient;
