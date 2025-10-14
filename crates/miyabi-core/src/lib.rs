//! Miyabi Core - Core utilities and shared functionality
//!
//! Provides core utilities for the Miyabi project:
//! - Configuration management (YAML/TOML/JSON/env vars)
//! - Structured logging (Pretty/Compact/JSON formats)
//! - Error handling integration with miyabi-types

pub mod config;
pub mod logger;

pub use config::Config;
pub use logger::{init_logger, init_logger_with_config, LogFormat, LogLevel, LoggerConfig};
