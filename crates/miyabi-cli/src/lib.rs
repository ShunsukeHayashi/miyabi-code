//! Miyabi CLI - Library interface for testing
//!
//! This module exposes internal structures for integration testing

pub mod commands;
pub mod error;
pub mod service;

pub use commands::{AgentCommand, InitCommand, InstallCommand, StatusCommand};
pub use error::{CliError, Result};
pub use service::{CommandMetadata, CommandService};
