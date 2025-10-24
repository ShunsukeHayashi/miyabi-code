//! Miyabi Core - Core utilities and shared functionality
//!
//! Provides core utilities for the Miyabi project:
//! - Configuration management (YAML/TOML/JSON/env vars)
//! - Structured logging (Pretty/Compact/JSON formats)
//! - Retry logic with exponential backoff
//! - Documentation generation (Rustdoc, README, code examples)
//! - Security audit (cargo-audit integration)
//! - Git utilities (repository discovery, branch management, validation)
//! - Error handling integration with miyabi-types
//! - Project-specific rules support (.miyabirules)

pub mod cache;
pub mod config;
pub mod documentation;
pub mod git;
pub mod logger;
pub mod retry;
pub mod rules;
pub mod security;

pub use config::Config;
pub use documentation::{
    generate_readme, generate_rustdoc, CodeExample, DocumentationConfig, DocumentationResult,
    ReadmeTemplate, ValidationResult,
};
// Re-export all git utilities from consolidated git module
pub use git::{
    find_git_root, get_current_branch, get_main_branch, has_uncommitted_changes, is_in_git_repo,
    is_valid_repository,
};
pub use logger::{init_logger, init_logger_with_config, LogFormat, LogLevel, LoggerConfig};
pub use retry::{is_retryable, retry_with_backoff, RetryConfig};
pub use rules::{
    AgentPreferences, MiyabiRules, Result as RulesResult, Rule, RulesError, RulesLoader,
};
pub use security::{run_cargo_audit, SecurityAuditResult, Vulnerability, VulnerabilitySeverity};
