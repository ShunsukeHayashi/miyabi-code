//! Issue and trace logging types

use crate::agent::{AgentResult, AgentStatus, AgentType, EscalationInfo, ImpactLevel};
use crate::quality::QualityReport;
use serde::{Deserialize, Serialize};

/// GitHub Issue
///
/// Represents a GitHub issue with its metadata, state, and lifecycle information.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Issue {
    /// Issue number (starts at 1 in GitHub)
    pub number: u64,
    /// Issue title (max 256 characters recommended)
    pub title: String,
    /// Issue body/description in Markdown format
    pub body: String,
    /// GitHub state (open/closed)
    pub state: IssueStateGithub,
    /// List of label names attached to this issue
    pub labels: Vec<String>,
    /// Optional GitHub username of assigned user
    #[serde(skip_serializing_if = "Option::is_none")]
    pub assignee: Option<String>,
    /// Timestamp when the issue was created
    pub created_at: chrono::DateTime<chrono::Utc>,
    /// Timestamp when the issue was last updated
    pub updated_at: chrono::DateTime<chrono::Utc>,
    /// Full URL to the issue (e.g., "https://github.com/owner/repo/issues/123")
    pub url: String,
}

impl Issue {
    /// Validate issue fields
    ///
    /// # Returns
    /// * `Ok(())` if all validations pass
    /// * `Err(String)` with detailed error message if validation fails
    ///
    /// # Examples
    /// ```
    /// use miyabi_types::issue::{Issue, IssueStateGithub};
    ///
    /// let issue = Issue {
    ///     number: 123,
    ///     title: "Valid issue".to_string(),
    ///     body: "Description".to_string(),
    ///     state: IssueStateGithub::Open,
    ///     labels: vec![],
    ///     assignee: None,
    ///     created_at: chrono::Utc::now(),
    ///     updated_at: chrono::Utc::now(),
    ///     url: "https://github.com/owner/repo/issues/123".to_string(),
    /// };
    ///
    /// assert!(issue.validate().is_ok());
    /// ```
    pub fn validate(&self) -> Result<(), String> {
        // Validate number
        if self.number == 0 {
            return Err("Issue number must be > 0. \
                Hint: GitHub issue numbers start at 1"
                .to_string());
        }

        // Validate title
        if self.title.is_empty() {
            return Err("Issue title cannot be empty. \
                Hint: Provide a clear, descriptive title"
                .to_string());
        }

        if self.title.len() > 256 {
            return Err(format!(
                "Issue title too long ({} characters). Maximum 256 characters allowed. \
                Hint: Keep titles concise and move details to body",
                self.title.len()
            ));
        }

        // Validate URL format
        if !self.url.starts_with("https://github.com/") {
            return Err(format!(
                "Invalid GitHub URL format: '{}'. \
                Hint: URL must start with 'https://github.com/'",
                self.url
            ));
        }

        // Validate URL contains issue number
        if !self.url.contains(&format!("/issues/{}", self.number)) {
            return Err(format!(
                "URL {} does not match issue number {}. \
                Hint: URL should contain '/issues/{}'",
                self.url, self.number, self.number
            ));
        }

        // Validate timestamps
        if self.updated_at < self.created_at {
            return Err(format!(
                "Invalid timestamps: updated_at ({}) < created_at ({}). \
                Hint: Ensure updated_at is after created_at",
                self.updated_at, self.created_at
            ));
        }

        Ok(())
    }
}

/// GitHub issue state (open/closed)
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum IssueStateGithub {
    /// Issue is open and active
    Open,
    /// Issue is closed and resolved
    Closed,
}

/// Issue state in Miyabi lifecycle (8 states)
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum IssueState {
    /// Issue created, awaiting triage by CoordinatorAgent
    Pending,
    /// CoordinatorAgent is analyzing and decomposing the issue into tasks
    Analyzing,
    /// Specialist Agents (CodeGen, Review, etc.) are working on tasks
    Implementing,
    /// ReviewAgent is checking code quality and running tests
    Reviewing,
    /// DeploymentAgent is deploying changes to staging/production
    Deploying,
    /// Issue completed successfully with all tasks done
    Done,
    /// Issue is blocked and requires human intervention
    Blocked,
    /// Execution failed - needs manual review and restart
    Failed,
}

impl IssueState {
    /// Get corresponding GitHub label for this state
    pub fn to_label(&self) -> &'static str {
        match self {
            IssueState::Pending => "📥 state:pending",
            IssueState::Analyzing => "🔍 state:analyzing",
            IssueState::Implementing => "🏗️ state:implementing",
            IssueState::Reviewing => "👀 state:reviewing",
            IssueState::Deploying => "🚀 state:deploying",
            IssueState::Done => "✅ state:done",
            IssueState::Blocked => "🚫 state:blocked",
            IssueState::Failed => "❌ state:failed",
        }
    }
}

/// State transition record
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StateTransition {
    /// Previous state before transition
    pub from: IssueState,
    /// New state after transition
    pub to: IssueState,
    /// Timestamp when transition occurred
    pub timestamp: chrono::DateTime<chrono::Utc>,
    /// Who triggered the transition (Agent name or "user")
    pub triggered_by: String,
    /// Optional reason for the transition
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reason: Option<String>,
}

/// Agent execution record
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentExecution {
    /// Type of agent that executed (CodeGenAgent, ReviewAgent, etc.)
    pub agent_type: AgentType,
    /// Optional task ID if this execution was for a specific task
    #[serde(skip_serializing_if = "Option::is_none")]
    pub task_id: Option<String>,
    /// Timestamp when execution started
    pub start_time: chrono::DateTime<chrono::Utc>,
    /// Timestamp when execution ended (None if still running)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub end_time: Option<chrono::DateTime<chrono::Utc>>,
    /// Execution duration in milliseconds (None if still running)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub duration_ms: Option<u64>,
    /// Current status of the execution
    pub status: AgentStatus,
    /// Execution result (None if failed or still running)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub result: Option<AgentResult>,
    /// Error message if execution failed
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

/// Label change record
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LabelChange {
    /// Timestamp when label was changed
    pub timestamp: chrono::DateTime<chrono::Utc>,
    /// Action performed (added or removed)
    pub action: LabelAction,
    /// Label name that was added or removed
    pub label: String,
    /// Who performed the action (Agent name or "user")
    pub performed_by: String,
}

/// Label action type
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum LabelAction {
    /// Label was added to the issue
    Added,
    /// Label was removed from the issue
    Removed,
}

/// Trace note (manual annotation)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TraceNote {
    /// Timestamp when note was created
    pub timestamp: chrono::DateTime<chrono::Utc>,
    /// Author of the note (Agent name or "user")
    pub author: String,
    /// Note content in Markdown format
    pub content: String,
    /// Optional tags for categorization
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tags: Option<Vec<String>>,
}

/// Pull Request result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PRResult {
    pub number: u64,
    pub url: String,
    pub state: PRState,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum PRState {
    Draft,
    Open,
    Merged,
    Closed,
}

/// Deployment result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeploymentResult {
    pub environment: Environment,
    pub version: String,
    pub project_id: String,
    pub deployment_url: String,
    pub deployed_at: chrono::DateTime<chrono::Utc>,
    pub duration_ms: u64,
    pub status: DeploymentStatus,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Environment {
    Staging,
    Production,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum DeploymentStatus {
    Success,
    Failed,
    RolledBack,
}

/// Issue analysis result from IssueAgent
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IssueAnalysis {
    pub issue_number: u64,
    pub issue_type: crate::task::TaskType,
    pub severity: crate::agent::Severity,
    pub impact: ImpactLevel,
    pub assigned_agent: crate::agent::AgentType,
    pub estimated_duration: u32, // minutes
    pub dependencies: Vec<String>,
    pub labels: Vec<String>,
}

/// Issue Trace Log - complete lifecycle tracking
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IssueTraceLog {
    // Identification
    pub issue_number: u64,
    pub issue_title: String,
    pub issue_url: String,

    // Lifecycle tracking
    pub created_at: chrono::DateTime<chrono::Utc>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub closed_at: Option<chrono::DateTime<chrono::Utc>>,
    pub current_state: IssueState,
    pub state_transitions: Vec<StateTransition>,

    // Agent execution tracking
    pub agent_executions: Vec<AgentExecution>,

    // Task decomposition
    pub total_tasks: u32,
    pub completed_tasks: u32,
    pub failed_tasks: u32,

    // Label tracking
    pub label_changes: Vec<LabelChange>,
    pub current_labels: Vec<String>,

    // Quality & metrics
    pub quality_reports: Vec<QualityReport>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub final_quality_score: Option<u8>,

    // Pull Request tracking
    pub pull_requests: Vec<PRResult>,

    // Deployment tracking
    pub deployments: Vec<DeploymentResult>,

    // Escalations
    pub escalations: Vec<EscalationInfo>,

    // Notes & annotations
    pub notes: Vec<TraceNote>,

    // Metadata
    pub metadata: IssueMetadata,
}

impl IssueTraceLog {
    /// Validate issue trace log fields
    ///
    /// # Returns
    /// * `Ok(())` if all validations pass
    /// * `Err(String)` with detailed error message if validation fails
    pub fn validate(&self) -> Result<(), String> {
        // Validate issue number
        if self.issue_number == 0 {
            return Err("Issue number must be > 0. \
                Hint: GitHub issue numbers start at 1"
                .to_string());
        }

        // Validate title
        if self.issue_title.is_empty() {
            return Err("Issue title cannot be empty. \
                Hint: Provide a clear, descriptive title"
                .to_string());
        }

        // Validate URL format
        if !self.issue_url.starts_with("https://github.com/") {
            return Err(format!(
                "Invalid GitHub URL format: '{}'. \
                Hint: URL must start with 'https://github.com/'",
                self.issue_url
            ));
        }

        // Validate timestamps
        if let Some(closed_at) = self.closed_at {
            if closed_at < self.created_at {
                return Err(format!(
                    "Invalid timestamps: closed_at ({}) < created_at ({}). \
                    Hint: Ensure closed_at is after created_at",
                    closed_at, self.created_at
                ));
            }
        }

        // Validate task counts consistency
        let sum = self.completed_tasks + self.failed_tasks;
        if sum > self.total_tasks {
            return Err(format!(
                "Task count inconsistency: completed({}) + failed({}) > total({}). \
                Hint: Sum of completed and failed tasks cannot exceed total",
                self.completed_tasks, self.failed_tasks, self.total_tasks
            ));
        }

        // Validate final quality score range
        if let Some(score) = self.final_quality_score {
            if score > 100 {
                return Err(format!(
                    "Final quality score out of range: {}. Must be 0-100. \
                    Hint: Quality scores represent percentage (0-100)",
                    score
                ));
            }
        }

        Ok(())
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IssueMetadata {
    pub device_identifier: String,
    pub session_ids: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub total_duration_ms: Option<u64>,
    pub last_updated: chrono::DateTime<chrono::Utc>,
}

#[cfg(test)]
mod tests {
    use super::*;

    // ========================================================================
    // IssueStateGithub Tests
    // ========================================================================

    #[test]
    fn test_issue_state_github_serialization() {
        let state = IssueStateGithub::Open;
        let json = serde_json::to_string(&state).unwrap();
        assert_eq!(json, "\"open\"");

        let state = IssueStateGithub::Closed;
        let json = serde_json::to_string(&state).unwrap();
        assert_eq!(json, "\"closed\"");
    }

    #[test]
    fn test_issue_state_github_roundtrip() {
        let states = vec![IssueStateGithub::Open, IssueStateGithub::Closed];

        for state in states {
            let json = serde_json::to_string(&state).unwrap();
            let deserialized: IssueStateGithub = serde_json::from_str(&json).unwrap();
            assert_eq!(state, deserialized);
        }
    }

    // ========================================================================
    // IssueState Tests
    // ========================================================================

    #[test]
    fn test_issue_state_to_label() {
        assert_eq!(IssueState::Pending.to_label(), "📥 state:pending");
        assert_eq!(IssueState::Analyzing.to_label(), "🔍 state:analyzing");
        assert_eq!(IssueState::Implementing.to_label(), "🏗️ state:implementing");
        assert_eq!(IssueState::Reviewing.to_label(), "👀 state:reviewing");
        assert_eq!(IssueState::Deploying.to_label(), "🚀 state:deploying");
        assert_eq!(IssueState::Done.to_label(), "✅ state:done");
        assert_eq!(IssueState::Blocked.to_label(), "🚫 state:blocked");
        assert_eq!(IssueState::Failed.to_label(), "❌ state:failed");
    }

    #[test]
    fn test_issue_state_serialization() {
        let state = IssueState::Pending;
        let json = serde_json::to_string(&state).unwrap();
        assert_eq!(json, "\"pending\"");

        let state = IssueState::Done;
        let json = serde_json::to_string(&state).unwrap();
        assert_eq!(json, "\"done\"");
    }

    #[test]
    fn test_issue_state_roundtrip() {
        let states = vec![
            IssueState::Pending,
            IssueState::Analyzing,
            IssueState::Implementing,
            IssueState::Reviewing,
            IssueState::Deploying,
            IssueState::Done,
            IssueState::Blocked,
            IssueState::Failed,
        ];

        for state in states {
            let json = serde_json::to_string(&state).unwrap();
            let deserialized: IssueState = serde_json::from_str(&json).unwrap();
            assert_eq!(state, deserialized);
        }
    }

    // ========================================================================
    // Issue Tests
    // ========================================================================

    #[test]
    fn test_issue_serialization() {
        let issue = Issue {
            number: 123,
            title: "Test issue".to_string(),
            body: "Issue body".to_string(),
            state: IssueStateGithub::Open,
            labels: vec!["bug".to_string(), "priority:high".to_string()],
            assignee: Some("user123".to_string()),
            created_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
            url: "https://github.com/user/repo/issues/123".to_string(),
        };

        let json = serde_json::to_string(&issue).unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed["number"], 123);
        assert_eq!(parsed["title"], "Test issue");
        assert_eq!(parsed["state"], "open");
        assert_eq!(parsed["assignee"], "user123");
    }

    #[test]
    fn test_issue_optional_assignee() {
        let issue = Issue {
            number: 456,
            title: "Unassigned issue".to_string(),
            body: "".to_string(),
            state: IssueStateGithub::Closed,
            labels: vec![],
            assignee: None,
            created_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
            url: "https://github.com/user/repo/issues/456".to_string(),
        };

        let json = serde_json::to_string(&issue).unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&json).unwrap();
        assert!(parsed.get("assignee").is_none());
    }

    #[test]
    fn test_issue_roundtrip() {
        let issue = Issue {
            number: 789,
            title: "Roundtrip test".to_string(),
            body: "Test".to_string(),
            state: IssueStateGithub::Open,
            labels: vec!["test".to_string()],
            assignee: Some("tester".to_string()),
            created_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
            url: "https://github.com/user/repo/issues/789".to_string(),
        };

        let json = serde_json::to_string(&issue).unwrap();
        let deserialized: Issue = serde_json::from_str(&json).unwrap();
        assert_eq!(issue.number, deserialized.number);
        assert_eq!(issue.title, deserialized.title);
        assert_eq!(issue.state, deserialized.state);
    }

    // ========================================================================
    // StateTransition Tests
    // ========================================================================

    #[test]
    fn test_state_transition_serialization() {
        let transition = StateTransition {
            from: IssueState::Pending,
            to: IssueState::Analyzing,
            timestamp: chrono::Utc::now(),
            triggered_by: "CoordinatorAgent".to_string(),
            reason: Some("Starting analysis".to_string()),
        };

        let json = serde_json::to_string(&transition).unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed["from"], "pending");
        assert_eq!(parsed["to"], "analyzing");
        assert_eq!(parsed["triggered_by"], "CoordinatorAgent");
    }

    #[test]
    fn test_state_transition_roundtrip() {
        let transition = StateTransition {
            from: IssueState::Implementing,
            to: IssueState::Reviewing,
            timestamp: chrono::Utc::now(),
            triggered_by: "ReviewAgent".to_string(),
            reason: None,
        };

        let json = serde_json::to_string(&transition).unwrap();
        let deserialized: StateTransition = serde_json::from_str(&json).unwrap();
        assert_eq!(transition.from, deserialized.from);
        assert_eq!(transition.to, deserialized.to);
    }

    // ========================================================================
    // AgentExecution Tests
    // ========================================================================

    #[test]
    fn test_agent_execution_serialization() {
        let execution = AgentExecution {
            agent_type: AgentType::CodeGenAgent,
            task_id: Some("task-001".to_string()),
            start_time: chrono::Utc::now(),
            end_time: Some(chrono::Utc::now()),
            duration_ms: Some(5000),
            status: AgentStatus::Completed,
            result: None,
            error: None,
        };

        let json = serde_json::to_string(&execution).unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed["agent_type"], "CodeGenAgent");
        assert_eq!(parsed["status"], "completed");
        assert_eq!(parsed["duration_ms"], 5000);
    }

    #[test]
    fn test_agent_execution_with_error() {
        let execution = AgentExecution {
            agent_type: AgentType::DeploymentAgent,
            task_id: Some("task-002".to_string()),
            start_time: chrono::Utc::now(),
            end_time: Some(chrono::Utc::now()),
            duration_ms: Some(1000),
            status: AgentStatus::Failed,
            result: None,
            error: Some("Deployment failed".to_string()),
        };

        let json = serde_json::to_string(&execution).unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed["error"], "Deployment failed");
    }

    // ========================================================================
    // LabelAction Tests
    // ========================================================================

    #[test]
    fn test_label_action_serialization() {
        let action = LabelAction::Added;
        let json = serde_json::to_string(&action).unwrap();
        assert_eq!(json, "\"added\"");

        let action = LabelAction::Removed;
        let json = serde_json::to_string(&action).unwrap();
        assert_eq!(json, "\"removed\"");
    }

    #[test]
    fn test_label_action_roundtrip() {
        let actions = vec![LabelAction::Added, LabelAction::Removed];

        for action in actions {
            let json = serde_json::to_string(&action).unwrap();
            let deserialized: LabelAction = serde_json::from_str(&json).unwrap();
            assert_eq!(action, deserialized);
        }
    }

    // ========================================================================
    // LabelChange Tests
    // ========================================================================

    #[test]
    fn test_label_change_serialization() {
        let change = LabelChange {
            timestamp: chrono::Utc::now(),
            action: LabelAction::Added,
            label: "bug".to_string(),
            performed_by: "IssueAgent".to_string(),
        };

        let json = serde_json::to_string(&change).unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed["action"], "added");
        assert_eq!(parsed["label"], "bug");
    }

    // ========================================================================
    // PRState Tests
    // ========================================================================

    #[test]
    fn test_pr_state_serialization() {
        let state = PRState::Draft;
        let json = serde_json::to_string(&state).unwrap();
        assert_eq!(json, "\"draft\"");

        let state = PRState::Merged;
        let json = serde_json::to_string(&state).unwrap();
        assert_eq!(json, "\"merged\"");
    }

    #[test]
    fn test_pr_state_roundtrip() {
        let states = vec![
            PRState::Draft,
            PRState::Open,
            PRState::Merged,
            PRState::Closed,
        ];

        for state in states {
            let json = serde_json::to_string(&state).unwrap();
            let deserialized: PRState = serde_json::from_str(&json).unwrap();
            assert_eq!(state, deserialized);
        }
    }

    // ========================================================================
    // PRResult Tests
    // ========================================================================

    #[test]
    fn test_pr_result_serialization() {
        let pr = PRResult {
            number: 42,
            url: "https://github.com/user/repo/pull/42".to_string(),
            state: PRState::Open,
            created_at: chrono::Utc::now(),
        };

        let json = serde_json::to_string(&pr).unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed["number"], 42);
        assert_eq!(parsed["state"], "open");
    }

    // ========================================================================
    // Environment Tests
    // ========================================================================

    #[test]
    fn test_environment_serialization() {
        let env = Environment::Staging;
        let json = serde_json::to_string(&env).unwrap();
        assert_eq!(json, "\"staging\"");

        let env = Environment::Production;
        let json = serde_json::to_string(&env).unwrap();
        assert_eq!(json, "\"production\"");
    }

    // ========================================================================
    // DeploymentStatus Tests
    // ========================================================================

    #[test]
    fn test_deployment_status_serialization() {
        let status = DeploymentStatus::Success;
        let json = serde_json::to_string(&status).unwrap();
        assert_eq!(json, "\"success\"");

        let status = DeploymentStatus::RolledBack;
        let json = serde_json::to_string(&status).unwrap();
        assert_eq!(json, "\"rolled_back\"");
    }

    #[test]
    fn test_deployment_status_roundtrip() {
        let statuses = vec![
            DeploymentStatus::Success,
            DeploymentStatus::Failed,
            DeploymentStatus::RolledBack,
        ];

        for status in statuses {
            let json = serde_json::to_string(&status).unwrap();
            let deserialized: DeploymentStatus = serde_json::from_str(&json).unwrap();
            assert_eq!(status, deserialized);
        }
    }

    // ========================================================================
    // DeploymentResult Tests
    // ========================================================================

    #[test]
    fn test_deployment_result_serialization() {
        let deployment = DeploymentResult {
            environment: Environment::Production,
            version: "v1.2.3".to_string(),
            project_id: "project-123".to_string(),
            deployment_url: "https://app.example.com".to_string(),
            deployed_at: chrono::Utc::now(),
            duration_ms: 30000,
            status: DeploymentStatus::Success,
        };

        let json = serde_json::to_string(&deployment).unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed["environment"], "production");
        assert_eq!(parsed["version"], "v1.2.3");
        assert_eq!(parsed["status"], "success");
    }

    // ========================================================================
    // TraceNote Tests
    // ========================================================================

    #[test]
    fn test_trace_note_serialization() {
        let note = TraceNote {
            timestamp: chrono::Utc::now(),
            author: "user123".to_string(),
            content: "This is a note".to_string(),
            tags: Some(vec!["important".to_string()]),
        };

        let json = serde_json::to_string(&note).unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed["content"], "This is a note");
        assert_eq!(parsed["tags"][0], "important");
    }

    // ========================================================================
    // IssueMetadata Tests
    // ========================================================================

    #[test]
    fn test_issue_metadata_serialization() {
        let metadata = IssueMetadata {
            device_identifier: "MacBook-Pro".to_string(),
            session_ids: vec!["session-1".to_string(), "session-2".to_string()],
            total_duration_ms: Some(120000),
            last_updated: chrono::Utc::now(),
        };

        let json = serde_json::to_string(&metadata).unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed["device_identifier"], "MacBook-Pro");
        assert_eq!(parsed["total_duration_ms"], 120000);
    }

    // ========================================================================
    // IssueTraceLog Tests
    // ========================================================================

    #[test]
    fn test_issue_trace_log_structure() {
        let metadata = IssueMetadata {
            device_identifier: "test-device".to_string(),
            session_ids: vec!["session-1".to_string()],
            total_duration_ms: Some(60000),
            last_updated: chrono::Utc::now(),
        };

        let trace_log = IssueTraceLog {
            issue_number: 100,
            issue_title: "Test issue".to_string(),
            issue_url: "https://github.com/user/repo/issues/100".to_string(),
            created_at: chrono::Utc::now(),
            closed_at: None,
            current_state: IssueState::Implementing,
            state_transitions: vec![],
            agent_executions: vec![],
            total_tasks: 5,
            completed_tasks: 2,
            failed_tasks: 0,
            label_changes: vec![],
            current_labels: vec!["bug".to_string()],
            quality_reports: vec![],
            final_quality_score: None,
            pull_requests: vec![],
            deployments: vec![],
            escalations: vec![],
            notes: vec![],
            metadata,
        };

        let json = serde_json::to_string(&trace_log).unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed["issue_number"], 100);
        assert_eq!(parsed["current_state"], "implementing");
        assert_eq!(parsed["total_tasks"], 5);
        assert_eq!(parsed["completed_tasks"], 2);
    }
}
