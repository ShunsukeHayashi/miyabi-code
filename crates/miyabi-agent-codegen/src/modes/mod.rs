//! CodeGenAgent Execution Modes
//!
//! CodeGenAgent supports two execution modes:
//! - **Auto Mode**: Fully automated code generation using LLM providers
//! - **Manual Mode**: Human-driven implementation via Claude Code session
//!
//! # Usage
//!
//! ```bash
//! # Auto mode (default)
//! miyabi agent codegen --issue 670 --mode auto
//!
//! # Manual mode
//! miyabi agent codegen --issue 670 --mode manual
//! ```

use miyabi_types::Task;
use serde::{Deserialize, Serialize};

type Result<T> = std::result::Result<T, Box<dyn std::error::Error + Send + Sync>>;

pub mod auto;
pub mod manual;

/// Execution mode for CodeGenAgent
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Default)]
#[serde(rename_all = "lowercase")]
pub enum ExecutionMode {
    /// Automated code generation using LLM providers
    #[default]
    Auto,
    /// Manual implementation guided by Claude Code
    Manual,
}

impl std::fmt::Display for ExecutionMode {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Auto => write!(f, "auto"),
            Self::Manual => write!(f, "manual"),
        }
    }
}

impl std::str::FromStr for ExecutionMode {
    type Err = Box<dyn std::error::Error + Send + Sync>;

    fn from_str(s: &str) -> std::result::Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "auto" | "a" => Ok(Self::Auto),
            "manual" | "m" => Ok(Self::Manual),
            _ => Err(format!("Invalid execution mode: '{}'. Valid options: auto, manual", s).into()),
        }
    }
}

/// Mode execution trait
pub trait ModeExecutor {
    /// Execute code generation in this mode
    fn execute(&self, task: &Task) -> impl std::future::Future<Output = Result<String>> + Send;

    /// Get mode name
    fn mode_name(&self) -> &'static str;

    /// Check if mode requires human interaction
    fn requires_human(&self) -> bool;
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_execution_mode_from_str() {
        assert_eq!("auto".parse::<ExecutionMode>().unwrap(), ExecutionMode::Auto);
        assert_eq!("manual".parse::<ExecutionMode>().unwrap(), ExecutionMode::Manual);
        assert_eq!("a".parse::<ExecutionMode>().unwrap(), ExecutionMode::Auto);
        assert_eq!("m".parse::<ExecutionMode>().unwrap(), ExecutionMode::Manual);
        assert!("invalid".parse::<ExecutionMode>().is_err());
    }

    #[test]
    fn test_execution_mode_display() {
        assert_eq!(ExecutionMode::Auto.to_string(), "auto");
        assert_eq!(ExecutionMode::Manual.to_string(), "manual");
    }
}
