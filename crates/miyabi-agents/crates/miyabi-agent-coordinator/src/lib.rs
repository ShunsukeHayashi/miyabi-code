//! Coordinator agents for task orchestration and parallel execution
//!
//! This crate provides agents responsible for:
//! - Task decomposition and DAG construction
//! - Parallel task execution and dependency management
//! - LLM-enhanced coordination (optional feature)

pub mod coordinator;
pub mod parallel;

#[cfg(feature = "llm-integration")]
pub mod coordinator_with_llm;

// Re-export main types
pub use coordinator::CoordinatorAgent;
pub use parallel::ParallelExecutor;

#[cfg(feature = "llm-integration")]
pub use coordinator_with_llm::CoordinatorAgentWithLLM;

// Re-export types from coordinator module
pub use coordinator::TaskDecomposition;
