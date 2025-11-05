//! Google Gemini API client for Miyabi LLM
//!
//! Provides implementation of the `LlmClient` trait for Google's Gemini models.
//!
//! # Features
//!
//! - Gemini 1.5 Pro and Flash support
//! - Streaming responses
//! - Tool (function) calling
//! - Multi-turn conversations
//!
//! # Example
//!
//! ```no_run
//! use miyabi_llm_google::GoogleClient;
//! use miyabi_llm_core::{LlmClient, Message, Role};
//!
//! # async fn example() -> Result<(), Box<dyn std::error::Error>> {
//! let client = GoogleClient::from_env()?;
//!
//! let messages = vec![
//!     Message::new(Role::User, "What is the capital of France?"),
//! ];
//!
//! let response = client.chat(messages).await?;
//! println!("Response: {}", response);
//! # Ok(())
//! # }
//! ```

pub mod client;
pub mod types;

pub use client::GoogleClient;
pub use types::{GeminiContent, GeminiMessage, GeminiPart, GeminiResponse, GeminiTool};
