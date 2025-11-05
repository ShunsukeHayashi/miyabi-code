//! Error types for DAG operations

use thiserror::Error;

/// Result type for DAG operations
pub type Result<T> = std::result::Result<T, DAGError>;

/// Errors that can occur during DAG operations
#[derive(Error, Debug)]
pub enum DAGError {
    /// Circular dependency detected in task graph
    #[error("Circular dependency detected: {0}")]
    CircularDependency(String),

    /// Invalid task graph structure
    #[error("Invalid task graph: {0}")]
    InvalidGraph(String),

    /// Task not found in graph
    #[error("Task not found: {0}")]
    TaskNotFound(String),

    /// Dependency analysis failed
    #[error("Dependency analysis failed: {0}")]
    DependencyAnalysisFailed(String),

    /// File parsing error
    #[error("Failed to parse file {file}: {error}")]
    ParseError { file: String, error: String },

    /// Invalid module path
    #[error("Invalid module path: {0}")]
    InvalidModulePath(String),

    /// Maximum parallelism exceeded
    #[error("Maximum parallelism exceeded: {0} > {1}")]
    MaxParallelismExceeded(usize, usize),

    /// Generic error
    #[error("{0}")]
    Other(String),
}

impl From<String> for DAGError {
    fn from(s: String) -> Self {
        DAGError::Other(s)
    }
}

impl From<&str> for DAGError {
    fn from(s: &str) -> Self {
        DAGError::Other(s.to_string())
    }
}
