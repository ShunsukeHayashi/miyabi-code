//! Miyabi Core - Core utilities and shared functionality
//!
//! Provides core utilities for the Miyabi project:
//! - Configuration management (YAML/TOML/JSON/env vars)
//! - Structured logging (Pretty/Compact/JSON formats)
//! - Retry logic with exponential backoff
//! - Error handling policies (Circuit Breaker, Fallback strategies)
//! - Resource limits management (Hardware detection, concurrent worktrees)
//! - Documentation generation (Rustdoc, README, code examples)
//! - Security audit (cargo-audit integration)
//! - Git utilities (repository discovery, branch management, validation)
//! - Error handling integration with miyabi-types
//! - Project-specific rules support (.miyabirules)

pub mod approval;
pub mod cache;
pub mod config;
pub mod documentation;
pub mod error_policy;
pub mod executor;
pub mod feature_flags;
pub mod git;
pub mod logger;
pub mod output;
pub mod plugin;
pub mod resource_limits;
pub mod retry;
pub mod rules;
pub mod security;
pub mod session;
pub mod task_metadata;
pub mod tools;
pub mod utils;

pub use approval::{
    ApprovalDecision, ApprovalSystem, CommandApproval, FileChangeApproval, FileOperation,
};
pub use config::Config;
pub use documentation::{
    generate_readme, generate_rustdoc, CodeExample, DocumentationConfig, DocumentationResult,
    ReadmeTemplate, ValidationResult,
};
pub use error_policy::{CircuitBreaker, CircuitState, FallbackStrategy};
// Re-export all git utilities from consolidated git module
pub use executor::TaskExecutor;
pub use feature_flags::{FeatureFlag, FeatureFlagManager};
pub use git::{
    find_git_root, get_current_branch, get_main_branch, has_uncommitted_changes, is_in_git_repo,
    is_valid_repository,
};
pub use logger::{init_logger, init_logger_with_config, LogFormat, LogLevel, LoggerConfig};
pub use output::{ExecutionEvent, JsonlWriter};
pub use plugin::{Plugin, PluginContext, PluginManager, PluginMetadata, PluginResult, PluginState};
pub use resource_limits::{HardwareLimits, PerWorktreeLimits, ResourceType};
pub use retry::{is_retryable, retry_with_backoff, RetryConfig};
pub use rules::{
    AgentPreferences, MiyabiRules, Result as RulesResult, Rule, RulesError, RulesLoader,
};
pub use security::{run_cargo_audit, SecurityAuditResult, Vulnerability, VulnerabilitySeverity};
pub use session::{
    Action, ExecutionMode, ReasoningStep, Session, SessionContext, SessionStatus, SessionSummary,
    Turn, TurnStatus,
};
pub use task_metadata::{
    TaskMetadata, TaskMetadataManager, TaskStatistics, TaskStatus,
};
pub use tools::{ToolRegistry, ToolResult};
