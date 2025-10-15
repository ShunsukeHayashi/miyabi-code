//! Miyabi Core - Core utilities and shared functionality
//!
//! Provides core utilities for the Miyabi project:
//! - Configuration management (YAML/TOML/JSON/env vars)
//! - Structured logging (Pretty/Compact/JSON formats)
//! - Retry logic with exponential backoff
//! - Documentation generation (Rustdoc, README, code examples)
//! - Security audit (cargo-audit integration)
//! - Error handling integration with miyabi-types

pub mod config;
pub mod documentation;
pub mod logger;
pub mod retry;
pub mod security;

pub use config::Config;
pub use documentation::{
    generate_readme, generate_rustdoc, CodeExample, DocumentationConfig, DocumentationResult,
    ReadmeTemplate, ValidationResult,
};
pub use logger::{init_logger, init_logger_with_config, LogFormat, LogLevel, LoggerConfig};
pub use retry::{is_retryable, retry_with_backoff, RetryConfig};
pub use security::{
    run_cargo_audit, SecurityAuditResult, Vulnerability, VulnerabilitySeverity,
};
