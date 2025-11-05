//! Event emission infrastructure for Miyabi Desktop
//!
//! Provides a centralized EventEmitter for broadcasting real-time events
//! to the frontend via Tauri's event system.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use tauri::AppHandle;

// ==================== Event Type Definitions ====================

/// Agent execution event types
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum AgentEventType {
    /// Agent started execution
    Started,
    /// Progress update during execution
    Progress,
    /// Successfully completed
    Completed,
    /// Execution failed
    Failed,
    /// User cancelled execution
    Cancelled,
}

/// Agent event payload
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentEvent {
    /// Name of the agent (e.g., "CodeGen", "ReviewAgent")
    pub agent_name: String,
    /// Event type
    pub event_type: AgentEventType,
    /// Associated GitHub issue number (if any)
    pub issue_number: Option<u64>,
    /// Human-readable message
    pub message: String,
    /// Event timestamp
    pub timestamp: DateTime<Utc>,
    /// Additional metadata (JSON)
    #[serde(default)]
    pub metadata: serde_json::Value,
}

/// Worktree event types
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum WorktreeEventType {
    /// Worktree created
    Created,
    /// Worktree updated (e.g., branch changed)
    Updated,
    /// Worktree deleted
    Deleted,
    /// Status changed (e.g., dirty → clean)
    StatusChanged,
}

/// Worktree event payload
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorktreeEvent {
    /// Absolute path to worktree
    pub worktree_path: String,
    /// Event type
    pub event_type: WorktreeEventType,
    /// Branch name
    pub branch: String,
    /// Event timestamp
    pub timestamp: DateTime<Utc>,
    /// Additional metadata
    #[serde(default)]
    pub metadata: serde_json::Value,
}

/// GitHub event payload
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitHubEvent {
    /// Issue or PR number
    pub number: u64,
    /// Event type (e.g., "issue_updated", "pr_created", "pr_merged")
    pub event_type: String,
    /// Issue/PR title
    pub title: String,
    /// Event timestamp
    pub timestamp: DateTime<Utc>,
    /// Additional metadata
    #[serde(default)]
    pub metadata: serde_json::Value,
}

/// System event severity levels
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, PartialOrd, Ord)]
#[serde(rename_all = "lowercase")]
pub enum Severity {
    /// Informational message
    Info,
    /// Warning (non-critical)
    Warning,
    /// Error occurred
    Error,
    /// Critical failure requiring immediate attention
    Critical,
}

/// System event payload
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemEvent {
    /// Event type (e.g., "automation_started", "health_check_failed")
    pub event_type: String,
    /// Severity level
    pub severity: Severity,
    /// Human-readable message
    pub message: String,
    /// Event timestamp
    pub timestamp: DateTime<Utc>,
    /// Additional metadata
    #[serde(default)]
    pub metadata: serde_json::Value,
}

// ==================== EventEmitter ====================

/// Central event emitter for broadcasting events to frontend
#[derive(Clone)]
pub struct EventEmitter {
    app_handle: AppHandle,
}

impl EventEmitter {
    /// Create a new EventEmitter with the given Tauri AppHandle
    pub fn new(app_handle: AppHandle) -> Self {
        Self { app_handle }
    }

    /// Emit an agent event
    ///
    /// # Example
    /// ```ignore
    /// emitter.emit_agent_event(AgentEvent {
    ///     agent_name: "CodeGenAgent".to_string(),
    ///     event_type: AgentEventType::Started,
    ///     issue_number: Some(688),
    ///     message: "Starting code generation for Issue #688".to_string(),
    ///     timestamp: Utc::now(),
    ///     metadata: serde_json::json!({}),
    /// })?;
    /// ```
    pub fn emit_agent_event(&self, event: AgentEvent) -> Result<(), String> {
        self.app_handle
            .emit_all("agent:event", event)
            .map_err(|e| format!("Failed to emit agent event: {}", e))
    }

    /// Emit a worktree event
    pub fn emit_worktree_event(&self, event: WorktreeEvent) -> Result<(), String> {
        self.app_handle
            .emit_all("worktree:event", event)
            .map_err(|e| format!("Failed to emit worktree event: {}", e))
    }

    /// Emit a GitHub event
    pub fn emit_github_event(&self, event: GitHubEvent) -> Result<(), String> {
        self.app_handle
            .emit_all("github:event", event)
            .map_err(|e| format!("Failed to emit GitHub event: {}", e))
    }

    /// Emit a system event
    pub fn emit_system_event(&self, event: SystemEvent) -> Result<(), String> {
        self.app_handle
            .emit_all("system:event", event)
            .map_err(|e| format!("Failed to emit system event: {}", e))
    }
}

// ==================== Helper Functions ====================

impl AgentEvent {
    /// Create a new "Started" event
    pub fn started(agent_name: String, issue_number: Option<u64>, message: String) -> Self {
        Self {
            agent_name,
            event_type: AgentEventType::Started,
            issue_number,
            message,
            timestamp: Utc::now(),
            metadata: serde_json::json!({}),
        }
    }

    /// Create a new "Completed" event
    pub fn completed(agent_name: String, issue_number: Option<u64>, message: String) -> Self {
        Self {
            agent_name,
            event_type: AgentEventType::Completed,
            issue_number,
            message,
            timestamp: Utc::now(),
            metadata: serde_json::json!({}),
        }
    }

    /// Create a new "Failed" event
    pub fn failed(agent_name: String, issue_number: Option<u64>, message: String) -> Self {
        Self {
            agent_name,
            event_type: AgentEventType::Failed,
            issue_number,
            message,
            timestamp: Utc::now(),
            metadata: serde_json::json!({}),
        }
    }
}

impl WorktreeEvent {
    /// Create a new "Created" event
    pub fn created(worktree_path: String, branch: String) -> Self {
        Self {
            worktree_path,
            event_type: WorktreeEventType::Created,
            branch,
            timestamp: Utc::now(),
            metadata: serde_json::json!({}),
        }
    }

    /// Create a new "Deleted" event
    pub fn deleted(worktree_path: String, branch: String) -> Self {
        Self {
            worktree_path,
            event_type: WorktreeEventType::Deleted,
            branch,
            timestamp: Utc::now(),
            metadata: serde_json::json!({}),
        }
    }
}

impl SystemEvent {
    /// Create an info-level system event
    pub fn info(event_type: String, message: String) -> Self {
        Self {
            event_type,
            severity: Severity::Info,
            message,
            timestamp: Utc::now(),
            metadata: serde_json::json!({}),
        }
    }

    /// Create a warning-level system event
    pub fn warning(event_type: String, message: String) -> Self {
        Self {
            event_type,
            severity: Severity::Warning,
            message,
            timestamp: Utc::now(),
            metadata: serde_json::json!({}),
        }
    }

    /// Create an error-level system event
    pub fn error(event_type: String, message: String) -> Self {
        Self {
            event_type,
            severity: Severity::Error,
            message,
            timestamp: Utc::now(),
            metadata: serde_json::json!({}),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_agent_event_constructors() {
        let event = AgentEvent::started(
            "TestAgent".to_string(),
            Some(100),
            "Test message".to_string(),
        );
        assert_eq!(event.agent_name, "TestAgent");
        assert_eq!(event.event_type, AgentEventType::Started);
        assert_eq!(event.issue_number, Some(100));
        assert_eq!(event.message, "Test message");
    }

    #[test]
    fn test_worktree_event_constructors() {
        let event = WorktreeEvent::created("/path/to/worktree".to_string(), "main".to_string());
        assert_eq!(event.worktree_path, "/path/to/worktree");
        assert_eq!(event.event_type, WorktreeEventType::Created);
        assert_eq!(event.branch, "main");
    }

    #[test]
    fn test_system_event_severity() {
        let info = SystemEvent::info("test".to_string(), "Info message".to_string());
        let warning = SystemEvent::warning("test".to_string(), "Warning message".to_string());
        let error = SystemEvent::error("test".to_string(), "Error message".to_string());

        assert_eq!(info.severity, Severity::Info);
        assert_eq!(warning.severity, Severity::Warning);
        assert_eq!(error.severity, Severity::Error);

        // Test ordering
        assert!(Severity::Info < Severity::Warning);
        assert!(Severity::Warning < Severity::Error);
        assert!(Severity::Error < Severity::Critical);
    }
}
