//! Miyabi CodeGen Agent
//!
//! AI-driven code generation with LLM and Potpie integration.
//!
//! # Components
//!
//! - **CodeGenAgent**: Generates code based on Task requirements
//!
//! # Features
//!
//! - LLM integration (GPT-OSS-20B via Ollama)
//! - Potpie AI knowledge graph integration
//! - Code documentation generation
//! - Retry logic with exponential backoff
//!
//! # Example
//!
//! ```rust,ignore
//! use miyabi_agent_codegen::CodeGenAgent;
//! use miyabi_agent_core::BaseAgent;
//! use miyabi_types::{AgentConfig, Task};
//!
//! # async fn example() {
//! let config = AgentConfig { /* config fields */ };
//! let codegen = CodeGenAgent::new(config);
//!
//! let task = Task { /* task fields */ };
//! let result = codegen.execute(&task).await;
//! # }
//! ```

mod context;
mod documentation;
mod prompt;
mod worktree;

pub mod codegen;
pub mod frontend;
pub mod modes;

pub use codegen::CodeGenAgent;
pub use documentation::DocumentationGenerationResult;
pub use modes::{ExecutionMode, ModeExecutor};
