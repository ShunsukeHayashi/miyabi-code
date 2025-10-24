//! Potpie AI Integration Module
//!
//! Integrated from `miyabi-potpie` crate.
//! Provides Neo4j knowledge graph and RAG engine integration.

pub mod client;
pub mod error;
pub mod knowledge_graph;

pub use client::{PotpieClient, PotpieConfig};
pub use error::{PotpieError, Result};
pub use knowledge_graph::CodeGraph;
