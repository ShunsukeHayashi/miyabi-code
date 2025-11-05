//! Miyabi Workflow DSL
//!
//! Graph-based agent orchestration with fluent API for building complex workflows.
//!
//! # Features
//!
//! - `.then()` - Sequential execution
//! - `.branch()` - Conditional branching
//! - `.parallel()` - Concurrent execution
//! - State persistence with sled
//!
//! # Example
//!
//! ```rust,no_run
//! use miyabi_workflow::*;
//!
//! // Define a workflow
//! let workflow = Workflow::new("my-workflow")
//!     .then(task_a)
//!     .parallel(vec![task_b, task_c])
//!     .then(task_d);
//! ```

pub mod error;
pub mod state;

pub use error::{WorkflowError, Result};
pub use state::{StepContext, StepOutput, WorkflowOutput, StateStore};

/// Workflow DSL version
pub const VERSION: &str = env!("CARGO_PKG_VERSION");
