//! # miyabi-dag
//!
//! DAG-based task graph for Miyabi Ω-System implementing θ₃ (Allocation Phase).
//!
//! ## Overview
//!
//! This crate provides functionality to transform generated code into a Directed Acyclic Graph (DAG)
//! of executable tasks, enabling parallel execution based on dependencies.
//!
//! **Ω-System Phase**: θ₃: Code → TaskGraph
//!
//! ## Features
//!
//! - **DAG Construction**: Build task graphs from code dependencies
//! - **Dependency Analysis**: Analyze file/module dependencies
//! - **Topological Sort**: Order tasks using Kahn's algorithm
//! - **Parallelization**: Group independent tasks for concurrent execution
//! - **Resource Allocation**: Assign worktrees to parallel tasks
//!
//! ## Example
//!
//! ```no_run
//! use miyabi_dag::{DAGBuilder, GeneratedCode};
//!
//! let builder = DAGBuilder::new(4); // max 4 parallel tasks
//! let code = GeneratedCode::from_files(vec![/* ... */]);
//! let task_graph = builder.build(code).unwrap();
//!
//! for level in task_graph.levels() {
//!     println!("Level {}: {} parallel tasks", level.level, level.tasks.len());
//! }
//! ```

mod builder;
mod dependency;
mod error;
mod graph;
mod types;

pub use builder::DAGBuilder;
pub use dependency::{DependencyAnalyzer, DependencyGraph};
pub use error::{DAGError, Result};
pub use graph::{TaskGraph, TaskLevel};
pub use types::{CodeFile, GeneratedCode, ModulePath, Task, TaskId, TaskNode};
