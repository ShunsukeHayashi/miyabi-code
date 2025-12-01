//! Anthropic Claude SDK for Miyabi LLM
//!
//! This crate provides Anthropic Claude API integration for the Miyabi LLM framework.
//! It implements the `LlmClient` and `LlmStreamingClient` traits from `miyabi-llm-core`.
//!
//! # Features
//!
//! - Claude 3.5 Sonnet support
//! - Tool/function calling
//! - Streaming responses via SSE
//! - Environment variable configuration
//!
//! # Example
//!
//! ```no_run
//! use miyabi_llm_anthropic::AnthropicClient;
//! use miyabi_llm_core::{LlmClient, Message};
//!
//! #[tokio::main]
//! async fn main() -> Result<(), Box<dyn std::error::Error>> {
//!     let client = AnthropicClient::from_env()?;
//!     let messages = vec![Message::user("Hello!")];
//!     let response = client.chat(messages).await?;
//!     println!("Response: {}", response);
//!     Ok(())
//! }
//! ```

mod client;
mod types;

pub use client::AnthropicClient;
pub use types::{AnthropicContent, AnthropicMessage, AnthropicResponse, AnthropicTool, AnthropicUsage};

// Re-export core types for convenience
pub use miyabi_llm_core::{
    LlmClient, LlmError, LlmStreamingClient, Message, Result, Role, StreamEvent, StreamResponse, ToolCall,
    ToolCallResponse, ToolDefinition,
};
