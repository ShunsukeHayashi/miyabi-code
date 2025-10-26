//! Miyabi Historical AI - RAG Pipeline for Historical Figures
//!
//! This crate provides a RAG (Retrieval-Augmented Generation) system for historical figures,
//! including data collection from Wikipedia, text embedding, vector storage with Qdrant,
//! and semantic search functionality.

pub mod data_collection;
pub mod embedding;
pub mod retrieval;
pub mod vector_store;

// Character-based prompt system
pub mod character;
pub mod error;
pub mod prompt_builder;

pub use data_collection::WikipediaCollector;
pub use embedding::{ChunkConfig, TextEmbedder};
pub use retrieval::search_knowledge;
pub use vector_store::{Document, VectorStore};

// Character exports
pub use character::{AdviceStyle, HistoricalCharacter, HistoricalEpisode, Personality, Tone};
pub use error::HistoricalAiError;
pub use prompt_builder::PromptBuilder;

/// Common error type for this crate
pub type Result<T> = std::result::Result<T, anyhow::Error>;
