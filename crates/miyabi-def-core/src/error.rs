//! Error types for miyabi-def-core

use std::path::PathBuf;
use thiserror::Error;

/// Result type for miyabi-def-core operations
pub type Result<T> = std::result::Result<T, Error>;

/// Error types for miyabi-def-core
#[derive(Debug, Error)]
pub enum Error {
    /// Path not found
    #[error("Path not found: {0}")]
    PathNotFound(PathBuf),

    /// File not found
    #[error("File not found: {0}")]
    FileNotFound(PathBuf),

    /// YAML parsing error
    #[error("YAML parsing error: {0}")]
    YamlParse(#[from] serde_yaml::Error),

    /// IO error
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    /// Missing required field
    #[error("Missing required field: {0}")]
    MissingField(String),

    /// Invalid format
    #[error("Invalid format: {0}")]
    InvalidFormat(String),

    /// Generic error
    #[error("{0}")]
    Other(String),
}

impl From<String> for Error {
    fn from(s: String) -> Self {
        Error::Other(s)
    }
}

impl From<&str> for Error {
    fn from(s: &str) -> Self {
        Error::Other(s.to_string())
    }
}
