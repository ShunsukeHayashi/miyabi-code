//! Miyabi Feedback Loop - Infinite Loop Orchestration
//!
//! This crate provides infinite feedback loop capabilities for autonomous agent execution,
//! ported from the TypeScript legacy implementation.
//!
//! # Features
//!
//! - **Infinite Loop Execution**: Run agents in a continuous feedback loop
//! - **Convergence Detection**: Automatically detect when goals are achieved
//! - **Auto-Refinement**: Dynamically adjust goals based on feedback
//! - **Error Handling**: Robust retry and escalation mechanisms
//!
//! # Example
//!
//! ```rust,ignore
//! use miyabi_feedback_loop::{InfiniteLoopOrchestrator, LoopConfig};
//!
//! let config = LoopConfig {
//!     max_iterations: Some(10),
//!     convergence_threshold: 5.0,
//!     auto_refinement_enabled: true,
//!     ..Default::default()
//! };
//!
//! let mut orchestrator = InfiniteLoopOrchestrator::new(config);
//! let result = orchestrator.start_loop("goal-id").await?;
//! ```

mod config;
mod error;
mod goal_manager;
mod infinite_loop;

pub use config::LoopConfig;
pub use error::{LoopError, LoopResult};
pub use goal_manager::GoalManager;
pub use infinite_loop::{FeedbackLoop, InfiniteLoopOrchestrator, IterationResult, LoopStatus};
