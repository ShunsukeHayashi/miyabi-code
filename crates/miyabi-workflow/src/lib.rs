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
//! ```no_run
//! use miyabi_workflow::WorkflowBuilder;
//! use miyabi_types::agent::AgentType;
//!
//! // Define a workflow
//! let workflow = WorkflowBuilder::new("issue-resolution")
//!     .step("analyze", AgentType::IssueAgent)
//!     .then("implement", AgentType::CodeGenAgent)
//!     .parallel(vec![
//!         ("test", AgentType::ReviewAgent),
//!         ("lint", AgentType::CodeGenAgent),
//!     ])
//!     .then("deploy", AgentType::DeploymentAgent);
//!
//! let dag = workflow.build_dag().unwrap();
//! ```

pub mod builder;
pub mod condition;
pub mod error;
pub mod state;

pub use builder::{ConditionalBranch, Step, StepType, WorkflowBuilder};
pub use condition::Condition;
pub use error::{Result, WorkflowError};
pub use state::{
    ExecutionState, StateStore, StepContext, StepOutput, WorkflowOutput, WorkflowStatus,
};

/// Workflow DSL version
pub const VERSION: &str = env!("CARGO_PKG_VERSION");
