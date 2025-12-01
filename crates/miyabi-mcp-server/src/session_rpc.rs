//! Session Management RPC types and handlers

use serde::{Deserialize, Serialize};
use std::path::PathBuf;

use miyabi_session_manager::{Phase, SessionContext};

// ============================================================================
// Session Management RPC Types
// ============================================================================

/// Session spawn parameters
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionSpawnParams {
    /// Agent name to spawn
    pub agent_name: String,

    /// Purpose of the session
    pub purpose: String,

    /// Session context
    pub context: SessionContextParams,
}

/// Session context parameters (simplified for RPC)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionContextParams {
    /// Issue number (optional)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub issue_number: Option<u64>,

    /// Current phase (string representation)
    pub current_phase: String,

    /// Worktree path (optional)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub worktree_path: Option<String>,
}

impl From<SessionContextParams> for SessionContext {
    fn from(params: SessionContextParams) -> Self {
        // Parse phase string to Phase enum
        let current_phase = match params.current_phase.as_str() {
            "IssueAnalysis" => Phase::IssueAnalysis,
            "TaskDecomposition" => Phase::TaskDecomposition,
            "WorktreeCreation" => Phase::WorktreeCreation,
            "CodeGeneration" => Phase::CodeGeneration,
            "Review" => Phase::Review,
            "Test" => Phase::Test,
            "PullRequest" => Phase::PullRequest,
            "CICD" => Phase::CICD,
            "Merge" => Phase::Merge,
            _ => Phase::IssueAnalysis, // Default fallback
        };

        SessionContext {
            issue_number: params.issue_number,
            current_phase,
            worktree_path: params.worktree_path.map(PathBuf::from),
            previous_results: vec![], // RPC doesn't transfer Agent results (too complex)
        }
    }
}

impl From<SessionContext> for SessionContextParams {
    fn from(context: SessionContext) -> Self {
        Self {
            issue_number: context.issue_number,
            current_phase: format!("{:?}", context.current_phase),
            worktree_path: context.worktree_path.map(|p| p.to_string_lossy().to_string()),
        }
    }
}

/// Session spawn result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionSpawnResult {
    /// Session UUID
    pub session_id: String,

    /// Agent name
    pub agent_name: String,

    /// Created timestamp
    pub created_at: String,
}

/// Session handoff parameters
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionHandoffParams {
    /// Source session ID
    pub from_session_id: String,

    /// Target agent name
    pub to_agent: String,

    /// Updated context
    pub updated_context: SessionContextParams,
}

/// Session handoff result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionHandoffResult {
    /// New session UUID
    pub new_session_id: String,

    /// Parent session UUID
    pub parent_session_id: String,

    /// Agent name
    pub agent_name: String,

    /// Created timestamp
    pub created_at: String,
}

/// Session monitor parameters
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionMonitorParams {
    /// Session ID to monitor
    pub session_id: String,
}

/// Session monitor result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionMonitorResult {
    /// Session ID
    pub session_id: String,

    /// Session status
    pub status: String,

    /// Agent name
    pub agent_name: String,

    /// Is running
    pub is_running: bool,

    /// Exit code (if completed)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub exit_code: Option<i32>,

    /// Error message (if failed)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error_message: Option<String>,
}

/// Session terminate parameters
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionTerminateParams {
    /// Session ID to terminate
    pub session_id: String,
}

/// Session terminate result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionTerminateResult {
    /// Session ID
    pub session_id: String,

    /// Was terminated
    pub terminated: bool,
}

/// Session list parameters
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionListParams {
    /// Filter by status (optional)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub status: Option<String>,

    /// Limit number of results
    #[serde(default = "default_session_limit")]
    pub limit: usize,
}

fn default_session_limit() -> usize {
    50
}

/// Session list result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionListResult {
    /// Sessions
    pub sessions: Vec<SessionInfo>,

    /// Total count
    pub total: usize,
}

/// Session info (summary)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionInfo {
    /// Session ID
    pub id: String,

    /// Agent name
    pub agent_name: String,

    /// Purpose
    pub purpose: String,

    /// Status
    pub status: String,

    /// Created timestamp
    pub created_at: String,

    /// Parent session ID (optional)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub parent_session: Option<String>,
}

/// Session get parameters
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionGetParams {
    /// Session ID
    pub session_id: String,
}

/// Session get result (detailed)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionGetResult {
    /// Session ID
    pub id: String,

    /// Agent name
    pub agent_name: String,

    /// Purpose
    pub purpose: String,

    /// Context
    pub context: SessionContextParams,

    /// Status
    pub status: String,

    /// Created timestamp
    pub created_at: String,

    /// Parent session ID (optional)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub parent_session: Option<String>,

    /// Child session IDs
    pub child_sessions: Vec<String>,

    /// Handoff target (optional)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub handoff_to: Option<String>,

    /// Error message (optional)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error_message: Option<String>,
}

/// Session stats result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionStatsResult {
    /// Total sessions
    pub total_sessions: usize,

    /// Running sessions
    pub running_sessions: usize,

    /// Completed sessions
    pub completed_sessions: usize,

    /// Failed sessions
    pub failed_sessions: usize,

    /// Handed off sessions
    pub handed_off_sessions: usize,
}

/// Session lineage parameters
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionLineageParams {
    /// Session ID
    pub session_id: String,
}

/// Session lineage result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionLineageResult {
    /// Root session
    pub root: SessionInfo,

    /// All descendants (breadth-first order)
    pub descendants: Vec<SessionInfo>,

    /// Total lineage count
    pub total: usize,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_session_spawn_params_deserialization() {
        let json = r#"{
            "agent_name": "coordinator",
            "purpose": "Test decomposition",
            "context": {
                "issue_number": 270,
                "current_phase": "TaskDecomposition"
            }
        }"#;
        let params: SessionSpawnParams = serde_json::from_str(json).unwrap();
        assert_eq!(params.agent_name, "coordinator");
        assert_eq!(params.context.issue_number, Some(270));
    }

    #[test]
    fn test_session_context_conversion() {
        use miyabi_session_manager::Phase;

        let params = SessionContextParams {
            issue_number: Some(100),
            current_phase: "CodeGeneration".to_string(),
            worktree_path: Some("/tmp/worktree".to_string()),
        };

        let context: SessionContext = params.clone().into();
        assert_eq!(context.issue_number, Some(100));
        assert_eq!(context.current_phase, Phase::CodeGeneration);

        let back: SessionContextParams = context.into();
        assert_eq!(back.issue_number, params.issue_number);
        assert_eq!(back.current_phase, "CodeGeneration");
    }

    #[test]
    fn test_session_list_params_defaults() {
        let json = r#"{}"#;
        let params: SessionListParams = serde_json::from_str(json).unwrap();
        assert_eq!(params.limit, 50);
        assert!(params.status.is_none());
    }
}
