//! miyabi-dag - DAG-based task graph construction for Omega System θ₃
//!
//! This crate implements the Allocation Phase (θ₃) of the Omega System,
//! which transforms generated code into a Directed Acyclic Graph (DAG) of
//! executable tasks for parallel processing.
//!
//! # Overview
//!
//! **Function**: `θ₃: Code → TaskGraph`
//!
//! **Algorithm**:
//! 1. Analyze dependencies between code files/modules
//! 2. Perform topological sort to determine execution order
//! 3. Group independent tasks for parallel execution
//! 4. Assign resources (worktrees) to tasks
//!
//! # Example
//!
//! ```rust,no_run
//! use miyabi_dag::{DAGBuilder, GeneratedCode};
//!
//! # async fn example() -> Result<(), Box<dyn std::error::Error>> {
//! let builder = DAGBuilder::new(4); // max 4 parallel tasks
//! let code = GeneratedCode::from_files(vec![/* ... */]);
//! let graph = builder.build(&code)?;
//!
//! println!("Graph has {} levels", graph.levels().len());
//! println!("Max parallelism: {}", graph.max_parallel_tasks());
//! # Ok(())
//! # }
//! ```

pub mod builder;
pub mod dependency;
pub mod error;
pub mod graph;
pub mod topological;
pub mod types;

pub use builder::DAGBuilder;
pub use error::{DAGError, Result};
pub use graph::{TaskGraph, TaskLevel, TaskNode};
pub use types::{GeneratedCode, CodeFile, ModulePath, TaskId};

#[cfg(test)]
mod tests;
