//! OpenAI GPT SDK for Miyabi LLM
//!
//! This crate provides OpenAI GPT API integration for the Miyabi LLM framework.
//! It implements the `LlmClient` and `LlmStreamingClient` traits from `miyabi-llm-core`.
//!
//! # Features
//!
//! - GPT-4o, GPT-4o-mini, GPT-4 Turbo support
//! - Tool/function calling
//! - Streaming responses via SSE
//! - Environment variable configuration
//!
//! # Example
//!
//! ```no_run
//! use miyabi_llm_openai::OpenAIClient;
//! use miyabi_llm_core::{LlmClient, Message};
//!
//! #[tokio::main]
//! async fn main() -> Result<(), Box<dyn std::error::Error>> {
//!     let client = OpenAIClient::from_env()?;
//!     let messages = vec![Message::user("Hello!")];
//!     let response = client.chat(messages).await?;
//!     println!("Response: {}", response);
//!     Ok(())
//! }
//! ```

mod client;
mod types;

pub use client::OpenAIClient;
pub use types::{
    OpenAIChoice, OpenAIFunction, OpenAIFunctionCall, OpenAIMessage, OpenAIResponse,
    OpenAIResponseMessage, OpenAITool, OpenAIToolCall, OpenAIUsage,
};

// Re-export core types for convenience
pub use miyabi_llm_core::{
    LlmClient, LlmError, LlmStreamingClient, Message, Result, Role, StreamEvent, StreamResponse,
    ToolCall, ToolCallResponse, ToolDefinition,
};
