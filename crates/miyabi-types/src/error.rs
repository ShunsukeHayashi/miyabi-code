//! Error types for Miyabi

use crate::agent::{AgentType, EscalationTarget, Severity};
use std::any::Any;
use std::fmt;
use thiserror::Error;

/// Error code for programmatic handling
///
/// Error codes allow:
/// - Programmatic error matching (without string comparison)
/// - Documentation references
/// - Metrics/monitoring
/// - Internationalization
/// - Stable error identification across versions
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct ErrorCode(&'static str);

impl ErrorCode {
    // I/O Errors
    pub const IO_ERROR: Self = Self("IO_ERROR");
    pub const FILE_NOT_FOUND: Self = Self("FILE_NOT_FOUND");
    pub const PERMISSION_DENIED: Self = Self("PERMISSION_DENIED");

    // Parse Errors
    pub const PARSE_ERROR: Self = Self("PARSE_ERROR");
    pub const INVALID_FORMAT: Self = Self("INVALID_FORMAT");
    pub const INVALID_SYNTAX: Self = Self("INVALID_SYNTAX");

    // Configuration Errors
    pub const CONFIG_ERROR: Self = Self("CONFIG_ERROR");
    pub const MISSING_CONFIG: Self = Self("MISSING_CONFIG");
    pub const INVALID_CONFIG: Self = Self("INVALID_CONFIG");

    // Internal Errors
    pub const INTERNAL_ERROR: Self = Self("INTERNAL_ERROR");
    pub const UNEXPECTED_STATE: Self = Self("UNEXPECTED_STATE");

    // Validation Errors
    pub const VALIDATION_ERROR: Self = Self("VALIDATION_ERROR");
    pub const INVALID_INPUT: Self = Self("INVALID_INPUT");

    // Agent Errors
    pub const AGENT_ERROR: Self = Self("AGENT_ERROR");
    pub const ESCALATION_ERROR: Self = Self("ESCALATION_ERROR");
    pub const CIRCULAR_DEPENDENCY_ERROR: Self = Self("CIRCULAR_DEPENDENCY_ERROR");

    // External Service Errors
    pub const HTTP_ERROR: Self = Self("HTTP_ERROR");
    pub const GITHUB_ERROR: Self = Self("GITHUB_ERROR");
    pub const GIT_ERROR: Self = Self("GIT_ERROR");
    pub const AUTH_ERROR: Self = Self("AUTH_ERROR");

    // Operation Errors
    pub const TIMEOUT_ERROR: Self = Self("TIMEOUT_ERROR");
    pub const TOOL_ERROR: Self = Self("TOOL_ERROR");
    pub const UNKNOWN_ERROR: Self = Self("UNKNOWN_ERROR");

    /// Get the string representation of the error code
    pub fn as_str(&self) -> &'static str {
        self.0
    }
}

impl fmt::Display for ErrorCode {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.0)
    }
}

/// Unified error trait for all Miyabi errors
///
/// All error types in the Miyabi project should implement this trait
/// to provide consistent error handling across the codebase.
///
/// This trait provides a unified interface for:
/// - Error codes (programmatic handling)
/// - User-friendly messages (end-user display)
/// - Debug context (developer debugging)
///
/// # Required Methods
///
/// - `code()`: Returns a machine-readable error code
/// - `user_message()`: Returns a user-friendly message
/// - `context()`: Returns additional debugging context (optional)
pub trait UnifiedError: std::error::Error {
    /// Get error code for programmatic handling
    fn code(&self) -> ErrorCode;

    /// Get user-friendly message suitable for displaying to end users
    fn user_message(&self) -> String;

    /// Get additional context for debugging (optional)
    fn context(&self) -> Option<&dyn Any>;
}

/// Main error type for Miyabi operations
#[derive(Error, Debug)]
pub enum MiyabiError {
    /// Agent execution error
    #[error("Agent error: {0}")]
    Agent(#[from] AgentError),

    /// Escalation required (human intervention needed)
    #[error("Escalation required: {0}")]
    Escalation(#[from] EscalationError),

    /// Circular dependency detected in task DAG
    #[error("Circular dependency detected: {0}")]
    CircularDependency(#[from] CircularDependencyError),

    /// I/O operation error
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    /// JSON serialization/deserialization error
    #[error("JSON error: {0}")]
    Json(#[from] serde_json::Error),

    /// HTTP request error
    #[error("HTTP error: {0}")]
    Http(String),

    /// GitHub API error
    #[error("GitHub API error: {0}")]
    GitHub(String),

    /// Git operation error
    #[error("Git error: {0}")]
    Git(String),

    /// Authentication error (invalid token, permissions, etc.)
    #[error("Authentication error: {0}")]
    Auth(String),

    /// Configuration error (missing or invalid config)
    #[error("Configuration error: {0}")]
    Config(String),

    /// Validation error (invalid input)
    #[error("Validation error: {0}")]
    Validation(String),

    /// Operation timeout error
    #[error("Timeout error: operation timed out after {0}ms")]
    Timeout(u64),

    /// Tool execution error
    #[error("Tool error: {0}")]
    ToolError(String),

    /// Permission denied error
    #[error("Permission denied: {0}")]
    PermissionDenied(String),

    /// Unknown or unclassified error
    #[error("Unknown error: {0}")]
    Unknown(String),
}

/// Agent-specific error
///
/// Represents errors that occur during agent execution, including
/// the agent type, optional task ID, and error message.
#[derive(Error, Debug)]
#[error("Agent {agent_type:?} failed: {message}")]
pub struct AgentError {
    /// Human-readable error message describing what went wrong
    pub message: String,
    /// Type of agent that encountered the error (e.g., CodeGenAgent, ReviewAgent)
    pub agent_type: AgentType,
    /// Optional task ID if the error occurred during task execution
    pub task_id: Option<String>,
    /// Optional underlying cause of the error for error chaining
    #[source]
    pub cause: Option<Box<dyn std::error::Error + Send + Sync>>,
}

impl AgentError {
    /// Creates a new `AgentError` without an underlying cause
    ///
    /// # Arguments
    ///
    /// * `message` - Error message describing what went wrong
    /// * `agent_type` - Type of agent that encountered the error
    /// * `task_id` - Optional task ID if error occurred during task execution
    pub fn new(message: impl Into<String>, agent_type: AgentType, task_id: Option<String>) -> Self {
        Self {
            message: message.into(),
            agent_type,
            task_id,
            cause: None,
        }
    }

    /// Creates a new `AgentError` with an underlying cause for error chaining
    ///
    /// # Arguments
    ///
    /// * `message` - Error message describing what went wrong
    /// * `agent_type` - Type of agent that encountered the error
    /// * `task_id` - Optional task ID if error occurred during task execution
    /// * `cause` - Underlying error that caused this error
    pub fn with_cause(
        message: impl Into<String>,
        agent_type: AgentType,
        task_id: Option<String>,
        cause: impl Into<Box<dyn std::error::Error + Send + Sync>>,
    ) -> Self {
        Self {
            message: message.into(),
            agent_type,
            task_id,
            cause: Some(cause.into()),
        }
    }
}

/// Escalation error (requires human intervention)
///
/// Represents situations where automated agent execution cannot proceed
/// and requires escalation to a human operator (Tech Lead, PO, CISO, etc.).
#[derive(Error, Debug)]
#[error("Escalation to {target:?} required: {message} (severity: {severity:?})")]
pub struct EscalationError {
    /// Human-readable message explaining why escalation is needed
    pub message: String,
    /// Target role to escalate to (TechLead, PO, CISO, CTO, DevOps)
    pub target: EscalationTarget,
    /// Severity level of the issue (Critical, High, Medium, Low, Trivial)
    pub severity: Severity,
    /// Additional context as JSON (e.g., issue number, PR URL, error details)
    pub context: serde_json::Value,
}

impl EscalationError {
    /// Creates a new `EscalationError`
    ///
    /// # Arguments
    ///
    /// * `message` - Human-readable message explaining why escalation is needed
    /// * `target` - Target role to escalate to (TechLead, PO, CISO, CTO, DevOps)
    /// * `severity` - Severity level (Critical, High, Medium, Low, Trivial)
    /// * `context` - Additional context as JSON value
    pub fn new(
        message: impl Into<String>,
        target: EscalationTarget,
        severity: Severity,
        context: serde_json::Value,
    ) -> Self {
        Self {
            message: message.into(),
            target,
            severity,
            context,
        }
    }
}

/// Circular dependency error in DAG
///
/// Represents a detected cycle in the task dependency graph (DAG).
/// Contains the sequence of task IDs forming the cycle.
#[derive(Error, Debug)]
#[error("Circular dependency detected: {}", cycle.join(" -> "))]
pub struct CircularDependencyError {
    /// Sequence of task IDs forming the cycle (e.g., ["task-1", "task-2", "task-1"])
    pub cycle: Vec<String>,
}

impl CircularDependencyError {
    /// Creates a new `CircularDependencyError`
    ///
    /// # Arguments
    ///
    /// * `cycle` - Sequence of task IDs forming the cycle
    pub fn new(cycle: Vec<String>) -> Self {
        Self { cycle }
    }
}

/// Result type alias for Miyabi operations
pub type Result<T> = std::result::Result<T, MiyabiError>;

// Implement UnifiedError trait for MiyabiError
impl UnifiedError for MiyabiError {
    fn code(&self) -> ErrorCode {

        match self {
            Self::Agent(_) => ErrorCode::AGENT_ERROR,
            Self::Escalation(_) => ErrorCode::ESCALATION_ERROR,
            Self::CircularDependency(_) => ErrorCode::CIRCULAR_DEPENDENCY_ERROR,
            Self::Io(e) => match e.kind() {
                std::io::ErrorKind::NotFound => ErrorCode::FILE_NOT_FOUND,
                std::io::ErrorKind::PermissionDenied => ErrorCode::PERMISSION_DENIED,
                _ => ErrorCode::IO_ERROR,
            },
            Self::Json(_) => ErrorCode::PARSE_ERROR,
            Self::Http(_) => ErrorCode::HTTP_ERROR,
            Self::GitHub(_) => ErrorCode::GITHUB_ERROR,
            Self::Git(_) => ErrorCode::GIT_ERROR,
            Self::Auth(_) => ErrorCode::AUTH_ERROR,
            Self::Config(_) => ErrorCode::CONFIG_ERROR,
            Self::Validation(_) => ErrorCode::VALIDATION_ERROR,
            Self::Timeout(_) => ErrorCode::TIMEOUT_ERROR,
            Self::ToolError(_) => ErrorCode::TOOL_ERROR,
            Self::PermissionDenied(_) => ErrorCode::PERMISSION_DENIED,
            Self::Unknown(_) => ErrorCode::UNKNOWN_ERROR,
        }
    }

    fn user_message(&self) -> String {
        match self {
            Self::Agent(e) => format!(
                "An agent failed to complete its task: {} (Agent: {:?})",
                e.message, e.agent_type
            ),
            Self::Escalation(e) => format!(
                "This issue requires human intervention ({}). Target: {:?}, Severity: {:?}",
                e.message, e.target, e.severity
            ),
            Self::CircularDependency(e) => format!(
                "Tasks have circular dependencies that prevent execution: {}",
                e.cycle.join(" → ")
            ),
            Self::Io(e) => format!(
                "A file operation failed: {}. Please check file paths and permissions.",
                e
            ),
            Self::Json(e) => format!(
                "Failed to process JSON data: {}. Please check the data format.",
                e
            ),
            Self::Http(msg) => format!(
                "A network request failed: {}. Please check your internet connection.",
                msg
            ),
            Self::GitHub(msg) => format!(
                "GitHub API request failed: {}. Please check your token and permissions.",
                msg
            ),
            Self::Git(msg) => format!(
                "Git operation failed: {}. Please check your repository state.",
                msg
            ),
            Self::Auth(msg) => format!(
                "Authentication failed: {}. Please check your credentials.",
                msg
            ),
            Self::Config(msg) => format!(
                "Configuration error: {}. Please check your settings.",
                msg
            ),
            Self::Validation(msg) => format!(
                "Input validation failed: {}. Please check your input.",
                msg
            ),
            Self::Timeout(ms) => format!(
                "Operation timed out after {}ms. Please try again or increase the timeout.",
                ms
            ),
            Self::ToolError(msg) => format!(
                "Tool execution failed: {}. Please check the tool configuration.",
                msg
            ),
            Self::PermissionDenied(msg) => format!(
                "Permission denied: {}. Please check file or API permissions.",
                msg
            ),
            Self::Unknown(msg) => format!(
                "An unexpected error occurred: {}. Please report this issue.",
                msg
            ),
        }
    }

    fn context(&self) -> Option<&dyn std::any::Any> {
        match self {
            Self::Agent(e) => e.task_id.as_ref().map(|id| id as &dyn std::any::Any),
            Self::Escalation(e) => Some(&e.context as &dyn std::any::Any),
            Self::CircularDependency(e) => Some(&e.cycle as &dyn std::any::Any),
            _ => None,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // ========================================================================
    // MiyabiError Tests
    // ========================================================================

    #[test]
    fn test_miyabi_error_agent_variant() {
        let agent_error = AgentError::new(
            "Test error",
            AgentType::CodeGenAgent,
            Some("task-1".to_string()),
        );
        let miyabi_error = MiyabiError::Agent(agent_error);
        assert!(miyabi_error.to_string().contains("Agent error"));
    }

    #[test]
    fn test_miyabi_error_from_agent_error() {
        let agent_error = AgentError::new(
            "Test error",
            AgentType::ReviewAgent,
            Some("task-2".to_string()),
        );
        let miyabi_error: MiyabiError = agent_error.into();
        assert!(matches!(miyabi_error, MiyabiError::Agent(_)));
    }

    #[test]
    fn test_miyabi_error_escalation_variant() {
        let escalation_error = EscalationError::new(
            "Needs review",
            EscalationTarget::TechLead,
            Severity::High,
            serde_json::json!({"issue": 123}),
        );
        let miyabi_error = MiyabiError::Escalation(escalation_error);
        assert!(miyabi_error.to_string().contains("Escalation required"));
    }

    #[test]
    fn test_miyabi_error_from_escalation_error() {
        let escalation_error = EscalationError::new(
            "Security issue",
            EscalationTarget::CISO,
            Severity::Critical,
            serde_json::json!({}),
        );
        let miyabi_error: MiyabiError = escalation_error.into();
        assert!(matches!(miyabi_error, MiyabiError::Escalation(_)));
    }

    #[test]
    fn test_miyabi_error_circular_dependency_variant() {
        let cycle_error =
            CircularDependencyError::new(vec!["A".to_string(), "B".to_string(), "A".to_string()]);
        let miyabi_error = MiyabiError::CircularDependency(cycle_error);
        assert!(miyabi_error.to_string().contains("Circular dependency"));
    }

    #[test]
    fn test_miyabi_error_from_circular_dependency_error() {
        let cycle_error = CircularDependencyError::new(vec!["X".to_string(), "Y".to_string()]);
        let miyabi_error: MiyabiError = cycle_error.into();
        assert!(matches!(miyabi_error, MiyabiError::CircularDependency(_)));
    }

    #[test]
    fn test_miyabi_error_io_variant() {
        let io_error = std::io::Error::new(std::io::ErrorKind::NotFound, "File not found");
        let miyabi_error = MiyabiError::Io(io_error);
        assert!(miyabi_error.to_string().contains("IO error"));
    }

    #[test]
    fn test_miyabi_error_from_io_error() {
        let io_error = std::io::Error::new(std::io::ErrorKind::PermissionDenied, "Access denied");
        let miyabi_error: MiyabiError = io_error.into();
        assert!(matches!(miyabi_error, MiyabiError::Io(_)));
    }

    #[test]
    fn test_miyabi_error_json_variant() {
        let json_str = "{invalid json}";
        let json_error = serde_json::from_str::<serde_json::Value>(json_str).unwrap_err();
        let miyabi_error = MiyabiError::Json(json_error);
        assert!(miyabi_error.to_string().contains("JSON error"));
    }

    #[test]
    fn test_miyabi_error_from_json_error() {
        let json_str = "not valid";
        let json_error = serde_json::from_str::<serde_json::Value>(json_str).unwrap_err();
        let miyabi_error: MiyabiError = json_error.into();
        assert!(matches!(miyabi_error, MiyabiError::Json(_)));
    }

    #[test]
    fn test_miyabi_error_http_variant() {
        let miyabi_error = MiyabiError::Http("Connection timeout".to_string());
        assert!(miyabi_error.to_string().contains("HTTP error"));
        assert!(miyabi_error.to_string().contains("Connection timeout"));
    }

    #[test]
    fn test_miyabi_error_github_variant() {
        let miyabi_error = MiyabiError::GitHub("Rate limit exceeded".to_string());
        assert!(miyabi_error.to_string().contains("GitHub API error"));
        assert!(miyabi_error.to_string().contains("Rate limit"));
    }

    #[test]
    fn test_miyabi_error_git_variant() {
        let miyabi_error = MiyabiError::Git("Failed to checkout branch".to_string());
        assert!(miyabi_error.to_string().contains("Git error"));
        assert!(miyabi_error.to_string().contains("checkout"));
    }

    #[test]
    fn test_miyabi_error_config_variant() {
        let miyabi_error = MiyabiError::Config("Missing API key".to_string());
        assert!(miyabi_error.to_string().contains("Configuration error"));
        assert!(miyabi_error.to_string().contains("API key"));
    }

    #[test]
    fn test_miyabi_error_validation_variant() {
        let miyabi_error = MiyabiError::Validation("Invalid task ID format".to_string());
        assert!(miyabi_error.to_string().contains("Validation error"));
        assert!(miyabi_error.to_string().contains("task ID"));
    }

    #[test]
    fn test_miyabi_error_timeout_variant() {
        let miyabi_error = MiyabiError::Timeout(30000);
        assert!(miyabi_error.to_string().contains("Timeout error"));
        assert!(miyabi_error.to_string().contains("30000ms"));
    }

    #[test]
    fn test_miyabi_error_unknown_variant() {
        let miyabi_error = MiyabiError::Unknown("Something went wrong".to_string());
        assert!(miyabi_error.to_string().contains("Unknown error"));
        assert!(miyabi_error.to_string().contains("went wrong"));
    }

    // ========================================================================
    // AgentError Tests
    // ========================================================================

    #[test]
    fn test_agent_error_creation() {
        let error = AgentError::new(
            "Failed to generate code",
            AgentType::CodeGenAgent,
            Some("task-123".to_string()),
        );
        assert_eq!(error.message, "Failed to generate code");
        assert_eq!(error.agent_type, AgentType::CodeGenAgent);
        assert_eq!(error.task_id, Some("task-123".to_string()));
        assert!(error.cause.is_none());
    }

    #[test]
    fn test_agent_error_without_task_id() {
        let error = AgentError::new("Generic error", AgentType::ReviewAgent, None);
        assert_eq!(error.message, "Generic error");
        assert!(error.task_id.is_none());
    }

    #[test]
    fn test_agent_error_with_cause() {
        let io_error = std::io::Error::new(std::io::ErrorKind::NotFound, "File not found");
        let error = AgentError::with_cause(
            "Failed to read file",
            AgentType::DeploymentAgent,
            Some("task-456".to_string()),
            io_error,
        );
        assert_eq!(error.message, "Failed to read file");
        assert!(error.cause.is_some());
    }

    #[test]
    fn test_agent_error_display() {
        let error = AgentError::new(
            "Test message",
            AgentType::IssueAgent,
            Some("task-789".to_string()),
        );
        let display = error.to_string();
        assert!(display.contains("IssueAgent"));
        assert!(display.contains("Test message"));
    }

    #[test]
    fn test_agent_error_into_miyabi_error() {
        let agent_error = AgentError::new("Test", AgentType::PRAgent, Some("task-1".to_string()));
        let miyabi_error: MiyabiError = agent_error.into();
        assert!(matches!(miyabi_error, MiyabiError::Agent(_)));
    }

    #[test]
    fn test_agent_error_source_trait() {
        let io_error = std::io::Error::new(std::io::ErrorKind::NotFound, "File not found");
        let error =
            AgentError::with_cause("Wrapper error", AgentType::CodeGenAgent, None, io_error);

        use std::error::Error;
        assert!(error.source().is_some());
    }

    // ========================================================================
    // EscalationError Tests
    // ========================================================================

    #[test]
    fn test_escalation_error() {
        let context = serde_json::json!({"reason": "security vulnerability"});
        let error = EscalationError::new(
            "Security issue detected",
            EscalationTarget::CISO,
            Severity::Critical,
            context.clone(),
        );
        assert_eq!(error.message, "Security issue detected");
        assert_eq!(error.target, EscalationTarget::CISO);
        assert_eq!(error.severity, Severity::Critical);
        assert_eq!(error.context, context);
    }

    #[test]
    fn test_escalation_error_display() {
        let error = EscalationError::new(
            "Needs review",
            EscalationTarget::TechLead,
            Severity::High,
            serde_json::json!({"pr": 123}),
        );
        let display = error.to_string();
        assert!(display.contains("TechLead"));
        assert!(display.contains("Needs review"));
        assert!(display.contains("High"));
    }

    #[test]
    fn test_escalation_error_all_targets() {
        let targets = vec![
            EscalationTarget::TechLead,
            EscalationTarget::PO,
            EscalationTarget::CISO,
            EscalationTarget::CTO,
            EscalationTarget::DevOps,
        ];

        for target in targets {
            let error =
                EscalationError::new("Test", target, Severity::Medium, serde_json::json!({}));
            assert_eq!(error.target, target);
        }
    }

    #[test]
    fn test_escalation_error_all_severities() {
        let severities = vec![
            Severity::Critical,
            Severity::High,
            Severity::Medium,
            Severity::Low,
            Severity::Trivial,
        ];

        for severity in severities {
            let error = EscalationError::new(
                "Test",
                EscalationTarget::TechLead,
                severity,
                serde_json::json!({}),
            );
            assert_eq!(error.severity, severity);
        }
    }

    #[test]
    fn test_escalation_error_into_miyabi_error() {
        let error = EscalationError::new(
            "Test",
            EscalationTarget::PO,
            Severity::Low,
            serde_json::json!({}),
        );
        let miyabi_error: MiyabiError = error.into();
        assert!(matches!(miyabi_error, MiyabiError::Escalation(_)));
    }

    // ========================================================================
    // CircularDependencyError Tests
    // ========================================================================

    #[test]
    fn test_circular_dependency_error() {
        let cycle = vec![
            "task-1".to_string(),
            "task-2".to_string(),
            "task-1".to_string(),
        ];
        let error = CircularDependencyError::new(cycle.clone());
        assert_eq!(error.cycle, cycle);
        assert!(error.to_string().contains("task-1 -> task-2 -> task-1"));
    }

    #[test]
    fn test_circular_dependency_error_simple_cycle() {
        let cycle = vec!["A".to_string(), "A".to_string()];
        let error = CircularDependencyError::new(cycle);
        assert!(error.to_string().contains("A -> A"));
    }

    #[test]
    fn test_circular_dependency_error_long_cycle() {
        let cycle = vec![
            "X".to_string(),
            "Y".to_string(),
            "Z".to_string(),
            "W".to_string(),
            "X".to_string(),
        ];
        let error = CircularDependencyError::new(cycle.clone());
        assert_eq!(error.cycle.len(), 5);
        assert!(error.to_string().contains("X -> Y -> Z -> W -> X"));
    }

    #[test]
    fn test_circular_dependency_error_display() {
        let cycle = vec![
            "task-A".to_string(),
            "task-B".to_string(),
            "task-A".to_string(),
        ];
        let error = CircularDependencyError::new(cycle);
        let display = error.to_string();
        assert!(display.contains("Circular dependency detected"));
        assert!(display.contains("task-A"));
        assert!(display.contains("task-B"));
    }

    #[test]
    fn test_circular_dependency_error_into_miyabi_error() {
        let error =
            CircularDependencyError::new(vec!["1".to_string(), "2".to_string(), "1".to_string()]);
        let miyabi_error: MiyabiError = error.into();
        assert!(matches!(miyabi_error, MiyabiError::CircularDependency(_)));
    }

    // ========================================================================
    // Result Type Alias Tests
    // ========================================================================

    #[test]
    fn test_result_type_alias_ok() {
        fn returns_ok() -> Result<String> {
            Ok("success".to_string())
        }
        let result = returns_ok();
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "success");
    }

    #[test]
    fn test_result_type_alias_err() {
        fn returns_err() -> Result<String> {
            Err(MiyabiError::Config("Missing config".to_string()))
        }
        let result = returns_err();
        assert!(result.is_err());
        let error = result.unwrap_err();
        assert!(matches!(error, MiyabiError::Config(_)));
    }

    #[test]
    fn test_result_type_alias_with_agent_error() {
        let agent_error = AgentError::new("Test", AgentType::CodeGenAgent, None);
        let result: Result<()> = Err(agent_error.into());
        assert!(result.is_err());
    }

    #[test]
    fn test_result_type_alias_propagation() {
        fn inner_function() -> Result<String> {
            Err(MiyabiError::Validation("Invalid input".to_string()))
        }

        fn outer_function() -> Result<String> {
            let value = inner_function()?;
            Ok(value)
        }

        let result = outer_function();
        assert!(result.is_err());
    }

    // ========================================================================
    // Error Chain Tests
    // ========================================================================

    #[test]
    fn test_error_chain_with_source() {
        use std::error::Error;

        let io_error = std::io::Error::new(std::io::ErrorKind::NotFound, "Original error");
        let agent_error =
            AgentError::with_cause("Wrapped error", AgentType::DeploymentAgent, None, io_error);

        let source = agent_error.source();
        assert!(source.is_some());
        assert!(source.unwrap().to_string().contains("Original error"));
    }

    #[test]
    fn test_error_chain_miyabi_to_agent() {
        use std::error::Error;

        let agent_error = AgentError::new("Inner error", AgentType::ReviewAgent, None);
        let miyabi_error = MiyabiError::Agent(agent_error);

        let source = miyabi_error.source();
        assert!(source.is_some());
    }
}
