//! Error types for miyabi-dag

use std::fmt;

/// Result type alias for DAG operations
pub type Result<T> = std::result::Result<T, DAGError>;

/// Errors that can occur during DAG construction and manipulation
#[derive(Debug, thiserror::Error)]
pub enum DAGError {
    /// Circular dependency detected in task graph
    #[error("Circular dependency detected: {0}")]
    CircularDependency(String),

    /// Invalid task graph structure
    #[error("Invalid graph structure: {0}")]
    InvalidGraph(String),

    /// Task not found in graph
    #[error("Task not found: {0}")]
    TaskNotFound(String),

    /// Dependency resolution failed
    #[error("Failed to resolve dependencies: {0}")]
    DependencyResolution(String),

    /// Topological sort failed
    #[error("Topological sort failed: {0}")]
    TopologicalSort(String),

    /// Maximum parallelism exceeded
    #[error("Maximum parallelism ({max}) exceeded: requested {requested}")]
    MaxParallelismExceeded { max: usize, requested: usize },

    /// Empty task graph
    #[error("Empty task graph: no tasks to execute")]
    EmptyGraph,

    /// Invalid task ID
    #[error("Invalid task ID: {0}")]
    InvalidTaskId(String),

    /// IO error
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    /// Serialization error
    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),

    /// Other error
    #[error("Other error: {0}")]
    Other(String),
}

impl DAGError {
    /// Create a new circular dependency error
    pub fn circular_dependency(msg: impl fmt::Display) -> Self {
        Self::CircularDependency(msg.to_string())
    }

    /// Create a new invalid graph error
    pub fn invalid_graph(msg: impl fmt::Display) -> Self {
        Self::InvalidGraph(msg.to_string())
    }

    /// Create a new task not found error
    pub fn task_not_found(msg: impl fmt::Display) -> Self {
        Self::TaskNotFound(msg.to_string())
    }

    /// Create a new dependency resolution error
    pub fn dependency_resolution(msg: impl fmt::Display) -> Self {
        Self::DependencyResolution(msg.to_string())
    }

    /// Create a new topological sort error
    pub fn topological_sort(msg: impl fmt::Display) -> Self {
        Self::TopologicalSort(msg.to_string())
    }

    /// Create a new max parallelism exceeded error
    pub fn max_parallelism_exceeded(max: usize, requested: usize) -> Self {
        Self::MaxParallelismExceeded { max, requested }
    }

    /// Create a new empty graph error
    pub fn empty_graph() -> Self {
        Self::EmptyGraph
    }

    /// Create a new invalid task ID error
    pub fn invalid_task_id(msg: impl fmt::Display) -> Self {
        Self::InvalidTaskId(msg.to_string())
    }

    /// Create a new other error
    pub fn other(msg: impl fmt::Display) -> Self {
        Self::Other(msg.to_string())
    }
}
