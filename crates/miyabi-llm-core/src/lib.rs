//! Miyabi LLM Core - Unified LLM Interface for Rust
//!
//! This crate provides core traits and types for interacting with various LLM providers.
//! It is designed to be provider-agnostic and serves as the foundation for provider-specific
//! implementations (OpenAI, Anthropic, Google, etc.).
//!
//! # Features
//!
//! - **Unified Interface**: Single trait (`LlmClient`) for all providers
//! - **Tool Calling**: First-class support for function/tool calling
//! - **Streaming**: Optional streaming support via `LlmStreamingClient`
//! - **Type Safety**: Strong typing for messages, roles, and tool definitions
//! - **Async/Await**: Built on Tokio for efficient async operations
//!
//! # Example
//!
//! ```rust
//! use miyabi_llm_core::{LlmClient, Message};
//!
//! async fn chat_example(client: impl LlmClient) -> Result<String, Box<dyn std::error::Error>> {
//!     let messages = vec![
//!         Message::system("You are a helpful assistant"),
//!         Message::user("Hello!"),
//!     ];
//!
//!     let response = client.chat(messages).await?;
//!     Ok(response)
//! }
//! ```
//!
//! # Provider Implementations
//!
//! This crate defines the core interfaces. Actual provider implementations are in separate crates:
//!
//! - `miyabi-llm-openai` - OpenAI (GPT-4o, GPT-4 Turbo, o1)
//! - `miyabi-llm-anthropic` - Anthropic (Claude 3.5 Sonnet, Opus)
//! - `miyabi-llm-google` - Google (Gemini 1.5 Pro/Flash)
//!
//! # Architecture
//!
//! ```text
//! miyabi-llm-core (this crate)
//!     ├── LlmClient trait
//!     ├── LlmStreamingClient trait
//!     ├── Message, Role types
//!     ├── ToolDefinition, ToolCall types
//!     └── LlmError type
//!         ↓ implements
//!     ┌───────────────────────────────┐
//!     │   Provider Implementations    │
//!     ├───────────────────────────────┤
//!     │ miyabi-llm-openai             │
//!     │ miyabi-llm-anthropic          │
//!     │ miyabi-llm-google             │
//!     └───────────────────────────────┘
//!         ↓ unified via
//!     ┌───────────────────────────────┐
//!     │   Integration Package         │
//!     ├───────────────────────────────┤
//!     │ miyabi-llm                    │
//!     │ ├── HybridRouter              │
//!     │ └── Feature flags             │
//!     └───────────────────────────────┘
//! ```

pub mod client;
pub mod error;
pub mod message;
pub mod streaming;
pub mod tools;

// Re-export main types
pub use client::{LlmClient, ToolCallResponse};
pub use error::{LlmError, Result};
pub use message::{Message, Role};
pub use streaming::{LlmStreamingClient, StreamEvent, StreamResponse};
pub use tools::{ToolCall, ToolDefinition};
