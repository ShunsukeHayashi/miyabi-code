//! Miyabi Review Agent
//!
//! Code review, quality scoring (100-point scale), and security scanning.
//!
//! # Components
//!
//! - **ReviewAgent**: Analyzes code quality and generates reports
//!
//! # Features
//!
//! - 100-point quality scoring
//! - Clippy/rustfmt integration
//! - Security vulnerability detection
//! - Test coverage analysis
//!
//! # Example
//!
//! ```rust,no_run
//! use miyabi_agent_review::ReviewAgent;
//! use miyabi_agent_core::BaseAgent;
//! use miyabi_types::{AgentConfig, Task};
//!
//! # async fn example() -> miyabi_types::error::Result<()> {
//! let config = AgentConfig::default();
//! let reviewer = ReviewAgent::new(config);
//!
//! let task = Task::default(); // Your task here
//! let result = reviewer.execute(&task).await?;
//!
//! println!("Quality score: {}", result.data);
//! # Ok(())
//! # }
//! ```

pub mod review;

pub use review::ReviewAgent;
