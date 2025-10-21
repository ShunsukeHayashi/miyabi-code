//! Miyabi Coordinator Agent
//!
//! Task decomposition, DAG construction, and parallel execution orchestration.
//!
//! # Components
//!
//! - **CoordinatorAgent**: Breaks down Issues into executable Tasks
//! - **CoordinatorAgentWithLLM**: LLM-enhanced task decomposition
//! - **ParallelExecutor**: Manages parallel task execution
//!
//! # Example
//!
//! ```rust,no_run
//! use miyabi_agent_coordinator::CoordinatorAgent;
//! use miyabi_types::{AgentConfig, Issue};
//!
//! # async fn example() -> miyabi_types::error::Result<()> {
//! let config = AgentConfig::default();
//! let coordinator = CoordinatorAgent::new(config);
//!
//! let issue = Issue::default(); // Your issue here
//! let decomposition = coordinator.decompose_issue(&issue).await?;
//!
//! println!("Created {} tasks", decomposition.tasks.len());
//! # Ok(())
//! # }
//! ```

pub mod coordinator;
pub mod coordinator_with_llm;
pub mod parallel;

pub use coordinator::CoordinatorAgent;
pub use coordinator_with_llm::CoordinatorAgentWithLLM;
pub use parallel::ParallelExecutor;

// Re-export TaskDecomposition from miyabi-types for convenience
pub use miyabi_types::task::TaskDecomposition;
