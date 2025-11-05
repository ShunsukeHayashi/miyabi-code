//! Unified Error Handling Framework for Miyabi
//!
//! This module provides a comprehensive error handling system with:
//! - Error codes for programmatic handling
//! - User-friendly messages
//! - Full context chains
//! - Structured error types
//!
//! # Architecture
//!
//! ```text
//! MiyabiError (trait)
//!   ├─ ErrorCode (for programmatic handling)
//!   ├─ user_message() (for end users)
//!   └─ context() (for debugging)
//!
//! CoreError (enum)
//!   ├─ Io { operation, path, source }
//!   ├─ Parse { location, message, source }
//!   ├─ Config(String)
//!   └─ Internal(String)
//! ```
//!
//! # Examples
//!
//! ```
//! use miyabi_core::error::{CoreError, MiyabiError, ErrorCode};
//! use std::path::PathBuf;
//!
//! let error = CoreError::Io {
//!     operation: "read".to_string(),
//!     path: PathBuf::from("/tmp/test"),
//!     source: std::io::Error::from(std::io::ErrorKind::NotFound),
//! };
//!
//! assert_eq!(error.code(), ErrorCode::IO_ERROR);
//! assert!(error.user_message().contains("Failed to read"));
//! ```

use std::any::Any;
use std::fmt;
use std::path::PathBuf;
use thiserror::Error;

// Re-export ErrorCode and UnifiedError from miyabi-types
pub use miyabi_types::error::{ErrorCode, UnifiedError};

/// Core error types for fundamental operations
///
/// This enum defines structured error types for common operations
/// across the Miyabi codebase, replacing unstructured String errors.
///
/// # Structured Error Pattern
///
/// Instead of:
/// ```ignore
/// #[error("Parse error: {0}")]
/// ParseError(String), // ❌ Loses structure
/// ```
///
/// Use:
/// ```ignore
/// #[error("Parse error at {location}: {message}")]
/// Parse {
///     location: String,
///     message: String,
///     #[source]
///     source: Option<Box<dyn std::error::Error + Send + Sync>>,
/// }, // ✅ Structured with context
/// ```
#[derive(Error, Debug)]
pub enum CoreError {
    /// I/O error with full operation context
    ///
    /// # Fields
    ///
    /// - `operation`: What operation was being performed (e.g., "read", "write", "open")
    /// - `path`: The file path involved
    /// - `source`: The underlying I/O error
    ///
    /// # Example
    ///
    /// ```
    /// use miyabi_core::error::CoreError;
    /// use std::path::PathBuf;
    ///
    /// let error = CoreError::Io {
    ///     operation: "write".to_string(),
    ///     path: PathBuf::from("/tmp/output.txt"),
    ///     source: std::io::Error::from(std::io::ErrorKind::PermissionDenied),
    /// };
    /// ```
    #[error("I/O error: {operation} failed for {path}: {source}")]
    Io {
        operation: String,
        path: PathBuf,
        #[source]
        source: std::io::Error,
    },

    /// Parse error with location information
    ///
    /// # Fields
    ///
    /// - `location`: Where the parse error occurred (e.g., "line 42, column 10")
    /// - `message`: Description of what went wrong
    /// - `source`: Optional underlying error
    #[error("Parse error at {location}: {message}")]
    Parse {
        location: String,
        message: String,
        #[source]
        source: Option<Box<dyn std::error::Error + Send + Sync>>,
    },

    /// Configuration error
    ///
    /// Used for invalid or missing configuration values.
    ///
    /// # Migration Note
    ///
    /// This variant currently uses `String` for backward compatibility.
    /// Future versions will use structured error data.
    #[error("Configuration error: {0}")]
    Config(String),

    /// Internal error
    ///
    /// Used for unexpected internal states that should not occur in normal operation.
    /// These errors typically indicate bugs and should be reported.
    ///
    /// # Migration Note
    ///
    /// This variant currently uses `String` for backward compatibility.
    /// Future versions will include stack traces and diagnostic information.
    #[error("Internal error: {0}")]
    Internal(String),
}

impl UnifiedError for CoreError {
    fn code(&self) -> ErrorCode {
        match self {
            Self::Io { source, .. } => match source.kind() {
                std::io::ErrorKind::NotFound => ErrorCode::FILE_NOT_FOUND,
                std::io::ErrorKind::PermissionDenied => ErrorCode::PERMISSION_DENIED,
                _ => ErrorCode::IO_ERROR,
            },
            Self::Parse { .. } => ErrorCode::PARSE_ERROR,
            Self::Config(_) => ErrorCode::CONFIG_ERROR,
            Self::Internal(_) => ErrorCode::INTERNAL_ERROR,
        }
    }

    fn user_message(&self) -> String {
        match self {
            Self::Io {
                operation, path, ..
            } => {
                format!(
                    "Failed to {} file: {}. Please check the file path and permissions.",
                    operation,
                    path.display()
                )
            }
            Self::Parse { location, .. } => {
                format!(
                    "Could not parse the file correctly at {}. Please check the file format.",
                    location
                )
            }
            Self::Config(msg) => format!("Configuration problem: {}. Please check your settings.", msg),
            Self::Internal(_) => {
                "An internal error occurred. This is likely a bug - please report it with the error details.".to_string()
            }
        }
    }

    fn context(&self) -> Option<&dyn Any> {
        None
    }
}

/// Result type for Miyabi operations
///
/// This is a convenience type alias for `Result<T, E>` where `E` implements `MiyabiError`.
///
/// # Examples
///
/// ```
/// use miyabi_core::error::{Result, CoreError};
///
/// fn read_config() -> Result<String, CoreError> {
///     Ok("config_value".to_string())
/// }
/// ```
pub type Result<T, E = CoreError> = std::result::Result<T, E>;

/// Extension trait for adding context to errors
///
/// This trait provides the `with_context` method for enriching errors
/// with additional contextual information.
///
/// # Examples
///
/// ```
/// use miyabi_core::error::{ErrorContextExt, CoreError, Result};
///
/// fn read_and_parse() -> Result<String, CoreError> {
///     let content = std::fs::read_to_string("/tmp/test.txt")
///         .map_err(|e| CoreError::Io {
///             operation: "read".to_string(),
///             path: "/tmp/test.txt".into(),
///             source: e,
///         })
///         .with_context(|| "Failed to read configuration file")?;
///
///     Ok(content)
/// }
/// ```
pub trait ErrorContextExt<T, E> {
    /// Add context to an error
    ///
    /// # Arguments
    ///
    /// * `f` - A closure that returns the context message
    ///
    /// # Returns
    ///
    /// A `Result` with the error wrapped with additional context
    fn with_context<F, C>(self, f: F) -> Result<T, CoreError>
    where
        F: FnOnce() -> C,
        C: fmt::Display;
}

impl<T, E> ErrorContextExt<T, E> for std::result::Result<T, E>
where
    E: std::error::Error + Send + Sync + 'static,
{
    fn with_context<F, C>(self, f: F) -> Result<T, CoreError>
    where
        F: FnOnce() -> C,
        C: fmt::Display,
    {
        self.map_err(|e| CoreError::Internal(format!("{}: {}", f(), e)))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io;

    #[test]
    fn test_error_code_equality() {
        assert_eq!(ErrorCode::IO_ERROR, ErrorCode::IO_ERROR);
        assert_ne!(ErrorCode::IO_ERROR, ErrorCode::PARSE_ERROR);
    }

    #[test]
    fn test_error_code_display() {
        assert_eq!(ErrorCode::IO_ERROR.to_string(), "IO_ERROR");
        assert_eq!(ErrorCode::PARSE_ERROR.to_string(), "PARSE_ERROR");
    }

    #[test]
    fn test_core_error_io() {
        let error = CoreError::Io {
            operation: "read".to_string(),
            path: PathBuf::from("/tmp/test"),
            source: io::Error::from(io::ErrorKind::NotFound),
        };

        assert_eq!(error.code(), ErrorCode::FILE_NOT_FOUND);
        assert!(error.user_message().contains("Failed to read"));
        assert!(error.to_string().contains("/tmp/test"));
    }

    #[test]
    fn test_core_error_parse() {
        let error = CoreError::Parse {
            location: "line 42".to_string(),
            message: "invalid syntax".to_string(),
            source: None,
        };

        assert_eq!(error.code(), ErrorCode::PARSE_ERROR);
        assert!(error.user_message().contains("line 42"));
    }

    #[test]
    fn test_core_error_config() {
        let error = CoreError::Config("missing api_key".to_string());

        assert_eq!(error.code(), ErrorCode::CONFIG_ERROR);
        assert!(error.user_message().contains("Configuration problem"));
    }

    #[test]
    fn test_core_error_internal() {
        let error = CoreError::Internal("unexpected state".to_string());

        assert_eq!(error.code(), ErrorCode::INTERNAL_ERROR);
        assert!(error.user_message().contains("internal error"));
        assert!(error.user_message().contains("bug"));
    }

    #[test]
    fn test_io_error_permission_denied() {
        let error = CoreError::Io {
            operation: "write".to_string(),
            path: PathBuf::from("/root/protected"),
            source: io::Error::from(io::ErrorKind::PermissionDenied),
        };

        assert_eq!(error.code(), ErrorCode::PERMISSION_DENIED);
    }

    #[test]
    fn test_with_context() {
        let result: std::result::Result<(), io::Error> =
            Err(io::Error::from(io::ErrorKind::NotFound));

        let error = result.with_context(|| "Failed to load configuration").unwrap_err();

        assert_eq!(error.code(), ErrorCode::INTERNAL_ERROR);
        assert!(error.to_string().contains("Failed to load configuration"));
    }
}
