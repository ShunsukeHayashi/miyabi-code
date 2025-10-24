//! Miyabi Claudable - AI-driven Next.js frontend generation client
//!
//! This crate provides a Rust client for the Claudable API, enabling automated
//! Next.js application generation through natural language descriptions.
//!
//! # Features
//!
//! - HTTP API client for Claudable
//! - Type-safe request/response handling
//! - Worktree integration for generated files
//! - npm install and build automation
//! - Comprehensive error handling
//!
//! # Example
//!
//! ```no_run
//! use miyabi_claudable::client::ClaudableClient;
//! use miyabi_claudable::types::GenerateRequest;
//! use miyabi_claudable::worktree;
//! use std::path::Path;
//!
//! # async fn example() -> Result<(), Box<dyn std::error::Error>> {
//! // Create client
//! let client = ClaudableClient::new("http://localhost:8080")?;
//!
//! // Generate Next.js app
//! let request = GenerateRequest::new("Create a dashboard with charts");
//! let response = client.generate(request).await?;
//!
//! // Write to worktree
//! let worktree_path = Path::new("/path/to/worktree");
//! worktree::write_files_to_worktree(worktree_path, &response).await?;
//!
//! // Install dependencies and build
//! worktree::install_dependencies(worktree_path).await?;
//! worktree::build_nextjs_app(worktree_path).await?;
//! # Ok(())
//! # }
//! ```

pub mod client;
pub mod error;
pub mod types;
pub mod worktree;

// Re-export commonly used types
pub use client::ClaudableClient;
pub use error::{ClaudableError, Result};
pub use types::{GenerateOptions, GenerateRequest, GenerateResponse};
pub use worktree::{build_nextjs_app, install_dependencies, write_files_to_worktree, WriteSummary};
