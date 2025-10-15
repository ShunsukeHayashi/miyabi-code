//! Error types for Miyabi

use crate::agent::{AgentType, EscalationTarget, Severity};
use thiserror::Error;

/// Main error type for Miyabi operations
#[derive(Error, Debug)]
pub enum MiyabiError {
    #[error("Agent error: {0}")]
    Agent(#[from] AgentError),

    #[error("Escalation required: {0}")]
    Escalation(#[from] EscalationError),

    #[error("Circular dependency detected: {0}")]
    CircularDependency(#[from] CircularDependencyError),

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("JSON error: {0}")]
    Json(#[from] serde_json::Error),

    #[error("HTTP error: {0}")]
    Http(String),

    #[error("GitHub API error: {0}")]
    GitHub(String),

    #[error("Git error: {0}")]
    Git(String),

    #[error("Authentication error: {0}")]
    Auth(String),

    #[error("Configuration error: {0}")]
    Config(String),

    #[error("Validation error: {0}")]
    Validation(String),

    #[error("Timeout error: operation timed out after {0}ms")]
    Timeout(u64),

    #[error("Unknown error: {0}")]
    Unknown(String),
}

/// Agent-specific error
#[derive(Error, Debug)]
#[error("Agent {agent_type:?} failed: {message}")]
pub struct AgentError {
    pub message: String,
    pub agent_type: AgentType,
    pub task_id: Option<String>,
    #[source]
    pub cause: Option<Box<dyn std::error::Error + Send + Sync>>,
}

impl AgentError {
    pub fn new(message: impl Into<String>, agent_type: AgentType, task_id: Option<String>) -> Self {
        Self {
            message: message.into(),
            agent_type,
            task_id,
            cause: None,
        }
    }

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
#[derive(Error, Debug)]
#[error("Escalation to {target:?} required: {message} (severity: {severity:?})")]
pub struct EscalationError {
    pub message: String,
    pub target: EscalationTarget,
    pub severity: Severity,
    pub context: serde_json::Value,
}

impl EscalationError {
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
#[derive(Error, Debug)]
#[error("Circular dependency detected: {}", cycle.join(" -> "))]
pub struct CircularDependencyError {
    pub cycle: Vec<String>,
}

impl CircularDependencyError {
    pub fn new(cycle: Vec<String>) -> Self {
        Self { cycle }
    }
}

/// Result type alias for Miyabi operations
pub type Result<T> = std::result::Result<T, MiyabiError>;

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
