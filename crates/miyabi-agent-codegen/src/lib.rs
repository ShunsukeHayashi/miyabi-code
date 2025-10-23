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
//! ```rust,no_run
//! use miyabi_agent_codegen::CodeGenAgent;
//! use miyabi_agent_core::BaseAgent;
//! use miyabi_types::{AgentConfig, Task};
//!
//! # async fn example() -> miyabi_types::error::Result<()> {
//! let config = AgentConfig::default();
//! let codegen = CodeGenAgent::new(config);
//!
//! let task = Task::default(); // Your task here
//! let result = codegen.execute(&task).await?;
//!
//! println!("Generated code: {}", result.data);
//! # Ok(())
//! # }
//! ```

mod context;
mod documentation;
mod prompt;
mod worktree;

pub mod codegen;

pub use codegen::CodeGenAgent;
pub use documentation::DocumentationGenerationResult;
