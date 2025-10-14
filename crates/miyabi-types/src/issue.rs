//! Issue and trace logging types

use crate::agent::{AgentResult, AgentStatus, AgentType, EscalationInfo};
use crate::quality::QualityReport;
use serde::{Deserialize, Serialize};

/// GitHub Issue
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Issue {
    pub number: u64,
    pub title: String,
    pub body: String,
    pub state: IssueStateGithub,
    pub labels: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub assignee: Option<String>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
    pub url: String,
}

/// GitHub issue state (open/closed)
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum IssueStateGithub {
    Open,
    Closed,
}

/// Issue state in Miyabi lifecycle (8 states)
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum IssueState {
    Pending,      // Issue created, awaiting triage
    Analyzing,    // CoordinatorAgent analyzing
    Implementing, // Specialist Agents working
    Reviewing,    // ReviewAgent checking quality
    Deploying,    // DeploymentAgent deploying
    Done,         // Completed successfully
    Blocked,      // Blocked - requires intervention
    Failed,       // Execution failed
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
    pub from: IssueState,
    pub to: IssueState,
    pub timestamp: chrono::DateTime<chrono::Utc>,
    pub triggered_by: String, // Agent or user
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reason: Option<String>,
}

/// Agent execution record
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentExecution {
    pub agent_type: AgentType,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub task_id: Option<String>,
    pub start_time: chrono::DateTime<chrono::Utc>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub end_time: Option<chrono::DateTime<chrono::Utc>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub duration_ms: Option<u64>,
    pub status: AgentStatus,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub result: Option<AgentResult>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

/// Label change record
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LabelChange {
    pub timestamp: chrono::DateTime<chrono::Utc>,
    pub action: LabelAction,
    pub label: String,
    pub performed_by: String, // Agent or user
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum LabelAction {
    Added,
    Removed,
}

/// Trace note (manual annotation)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TraceNote {
    pub timestamp: chrono::DateTime<chrono::Utc>,
    pub author: String, // Agent or user
    pub content: String,
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
        assert_eq!(
            IssueState::Implementing.to_label(),
            "🏗️ state:implementing"
        );
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
