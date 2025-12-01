//! Streaming support for LLM responses

use crate::{Message, Result};
use async_trait::async_trait;
use futures::stream::Stream;
use std::pin::Pin;

/// Type alias for streaming response
pub type StreamResponse = Pin<Box<dyn Stream<Item = Result<String>> + Send>>;

/// LLM Streaming Client trait
///
/// This trait extends the basic LlmClient with streaming support.
/// Streaming allows for real-time token-by-token responses from the LLM.
#[async_trait]
pub trait LlmStreamingClient: Send + Sync {
    /// Chat completion with streaming support
    ///
    /// # Arguments
    /// * `messages` - Conversation history
    ///
    /// # Returns
    /// * `Ok(StreamResponse)` - Stream of response chunks
    /// * `Err(LlmError)` - Error occurred during request setup
    ///
    /// # Example
    /// ```no_run
    /// use miyabi_llm_core::{LlmStreamingClient, Message};
    /// use futures::stream::StreamExt;
    ///
    /// async fn stream_example(client: impl LlmStreamingClient) {
    ///     let messages = vec![Message::user("Hello!")];
    ///     let mut stream = client.chat_stream(messages).await.unwrap();
    ///
    ///     while let Some(chunk) = stream.next().await {
    ///         match chunk {
    ///             Ok(text) => print!("{}", text),
    ///             Err(e) => eprintln!("Error: {}", e),
    ///         }
    ///     }
    /// }
    /// ```
    async fn chat_stream(&self, messages: Vec<Message>) -> Result<StreamResponse>;
}

/// Stream event type for more detailed streaming information
#[derive(Debug, Clone)]
pub enum StreamEvent {
    /// Text chunk from the LLM
    TextChunk(String),

    /// Metadata about the stream
    Metadata { tokens_used: Option<usize>, finish_reason: Option<String> },

    /// Stream completed
    Done,
}
