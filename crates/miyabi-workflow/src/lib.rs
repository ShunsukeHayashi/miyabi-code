//! Miyabi Workflow - DAG-based workflow orchestration
//!
//! This crate provides a fluent API for building complex task workflows
//! using a Directed Acyclic Graph (DAG) structure with support for
//! sequential, parallel, and conditional execution.
//!
//! # Examples
//!
//! ```
//! use miyabi_workflow::WorkflowBuilder;
//! use miyabi_types::agent::AgentType;
//!
//! let workflow = WorkflowBuilder::new("issue-resolution")
//!     .step("analyze", AgentType::IssueAgent)
//!     .then("implement", AgentType::CodeGenAgent)
//!     .parallel(vec![
//!         ("test", AgentType::ReviewAgent),
//!         ("lint", AgentType::ReviewAgent),
//!     ])
//!     .build_dag()
//!     .unwrap();
//!
//! assert_eq!(workflow.nodes.len(), 4);
//! assert_eq!(workflow.levels.len(), 3);
//! ```

pub mod builder;

pub use builder::{Step, StepType, WorkflowBuilder};
