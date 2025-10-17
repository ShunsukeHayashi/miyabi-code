//! Potpie AI integration for Miyabi
//!
//! This crate provides integration with Potpie AI's Neo4j knowledge graph and RAG engine
//! to dramatically improve Agent precision by providing:
//! - Code structure understanding via knowledge graphs
//! - Semantic code search
//! - Dependency tracking
//! - Change impact analysis
//! - AST parsing and analysis
//!
//! # Features
//!
//! - **8 Tool APIs**: Complete coverage of Potpie's capabilities
//! - **Async/Await**: Built on tokio for efficient concurrent operations
//! - **Error Handling**: Comprehensive error types with fallback strategies
//! - **Type Safety**: Strongly-typed API responses
//! - **Automatic Fallback**: Falls back to Git when Potpie unavailable
//!
//! # Usage
//!
//! ```rust,no_run
//! use miyabi_potpie::{PotpieClient, PotpieConfig};
//!
//! #[tokio::main]
//! async fn main() -> Result<(), Box<dyn std::error::Error>> {
//!     let config = PotpieConfig {
//!         api_url: "http://localhost:8000".to_string(),
//!         auth_token: Some("your-token".to_string()),
//!         ..Default::default()
//!     };
//!
//!     let client = PotpieClient::new(config)?;
//!
//!     // Check service health
//!     if client.health_check().await.is_ok() {
//!         // Perform semantic search
//!         let results = client.semantic_search("authentication logic", Some(5)).await?;
//!         println!("Found {} relevant code sections", results.len());
//!     }
//!
//!     Ok(())
//! }
//! ```
//!
//! # Integration with Agents
//!
//! This crate is designed to be integrated with:
//! - **CodeGenAgent**: Semantic search for existing patterns, dependency tracking
//! - **ReviewAgent**: Change detection, impact analysis, affected test detection
//! - **CoordinatorAgent**: Dependency-aware task decomposition
//!
//! # Configuration
//!
//! Potpie integration is configured via `.miyabi.yml`:
//!
//! ```yaml
//! integrations:
//!   potpie:
//!     enabled: true
//!     api_url: "http://localhost:8000"
//!     auth_token: "${POTPIE_API_KEY}"
//!     timeout_seconds: 30
//!     fallback_to_git: true
//! ```

pub mod client;
pub mod error;
pub mod knowledge_graph;

pub use client::{PotpieClient, PotpieConfig};
pub use error::{PotpieError, Result};
pub use knowledge_graph::*;

/// Version of the Potpie integration
pub const VERSION: &str = env!("CARGO_PKG_VERSION");

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_version() {
        // VERSION is a compile-time constant from CARGO_PKG_VERSION
        assert_eq!(VERSION, env!("CARGO_PKG_VERSION"));
    }
}
