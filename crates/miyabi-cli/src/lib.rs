//! Miyabi CLI - Library interface for testing
//!
//! This module exposes internal structures for integration testing

pub mod commands;
pub mod error;

pub use commands::{AgentCommand, InitCommand, InstallCommand, StatusCommand};
pub use error::{CliError, Result};
