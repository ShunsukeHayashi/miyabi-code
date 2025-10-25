//! Miyabi Historical AI - RAG Pipeline for Historical Figures
//!
//! This crate provides a RAG (Retrieval-Augmented Generation) system for historical figures,
//! including data collection from Wikipedia, text embedding, vector storage with Qdrant,
//! and semantic search functionality.

pub mod data_collection;
pub mod embedding;
pub mod vector_store;
pub mod retrieval;

// Character-based prompt system
pub mod character;
pub mod prompt_builder;
pub mod error;

pub use data_collection::WikipediaCollector;
pub use embedding::{ChunkConfig, TextEmbedder};
pub use vector_store::{VectorStore, Document};
pub use retrieval::search_knowledge;

// Character exports
pub use character::{HistoricalCharacter, HistoricalEpisode, Personality, Tone, AdviceStyle};
pub use prompt_builder::PromptBuilder;
pub use error::HistoricalAiError;

/// Common error type for this crate
pub type Result<T> = std::result::Result<T, anyhow::Error>;
