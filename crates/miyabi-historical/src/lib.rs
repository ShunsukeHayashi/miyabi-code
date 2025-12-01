//! Miyabi Historical - Unified Historical AI System
//!
//! This crate provides a comprehensive RAG (Retrieval-Augmented Generation) system
//! for historical figures, including:
//! - AI personality system with data collection and embedding
//! - REST API server for historical chatbot interactions
//!
//! # Modules
//!
//! - `ai`: RAG pipeline, character system, and prompt building
//! - `api`: Axum REST API server components (models, routes, state)

pub mod ai {
    //! Historical AI - RAG Pipeline for Historical Figures
    //!
    //! This module provides a RAG system for historical figures,
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

    /// Common error type for AI module
    pub type Result<T> = std::result::Result<T, anyhow::Error>;
}

pub mod api {
    //! Historical API - Axum server for historical AI chatbot
    //!
    //! This module provides a REST API for chatting with historical figures
    //! using RAG and Claude AI.

    pub mod models;
    pub mod routes;
    pub mod state;

    pub use models::{ChatRequest, ChatResponse};
    pub use routes::chat_handler;
    pub use state::AppState;
}

// Top-level re-exports for convenience
pub use ai::{
    AdviceStyle, HistoricalCharacter, HistoricalEpisode, Personality, PromptBuilder, Tone, WikipediaCollector,
};
pub use api::{AppState, ChatRequest, ChatResponse};
