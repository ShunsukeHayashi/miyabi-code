//! LLM abstraction layer for Miyabi
//!
//! Provides a unified interface for interacting with different LLM providers
//! (vLLM, Ollama, Groq) with OpenAI GPT-OSS-20B model.
//!
//! # Features
//!
//! - **Provider abstraction**: Unified trait for all LLM providers
//! - **GPT-OSS-20B support**: Native support for OpenAI's open-source model
//! - **Multiple backends**: vLLM, Ollama, Groq
//! - **Async/await**: Built on tokio for high performance
//! - **Function calling**: Support for structured function calls
//! - **Reasoning levels**: Low, Medium, High reasoning effort
//!
//! # Example
//!
//! ```rust,no_run
//! use miyabi_llm::{LLMProvider, GPTOSSProvider, LLMRequest, ReasoningEffort};
//!
//! #[tokio::main]
//! async fn main() -> anyhow::Result<()> {
//!     // Initialize Groq provider
//!     let provider = GPTOSSProvider::new_groq("gsk_xxxxx")?;
//!
//!     // Create request
//!     let request = LLMRequest {
//!         prompt: "Write a Rust function to calculate factorial".to_string(),
//!         temperature: 0.2,
//!         max_tokens: 512,
//!         reasoning_effort: ReasoningEffort::Medium,
//!     };
//!
//!     // Generate response
//!     let response = provider.generate(&request).await?;
//!     println!("Generated: {}", response.text);
//!
//!     Ok(())
//! }
//! ```

mod provider;
mod types;
mod error;
pub mod prompt;
pub mod context;
pub mod conversation;

pub use provider::{LLMProvider, GPTOSSProvider};
pub use types::{
    ChatMessage, ChatRole, FunctionCall, FunctionDefinition, FunctionParameter, LLMRequest,
    LLMResponse, ReasoningEffort,
};
pub use error::{LLMError, Result};
pub use prompt::{LLMPromptTemplate, ResponseFormat, PromptError};
pub use context::{LLMContext, TestResults};
pub use conversation::LLMConversation;

/// Re-export common types
pub use miyabi_types::error::MiyabiError;
