//! Data models for the API Gateway

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Task submission request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskRequest {
    /// Task description/instruction
    pub instruction: String,
    
    /// Target repository (optional, defaults to miyabi-private)
    #[serde(default)]
    pub repository: Option<String>,
    
    /// Target branch (optional, defaults to main)
    #[serde(default)]
    pub branch: Option<String>,
    
    /// Issue number to work on (optional)
    #[serde(default)]
    pub issue_number: Option<u64>,
    
    /// Preferred agent (optional)
    #[serde(default)]
    pub agent: Option<String>,
    
    /// Priority (1=highest, 5=lowest)
    #[serde(default = "default_priority")]
    pub priority: u8,
    
    /// Callback URL for completion notification
    #[serde(default)]
    pub callback_url: Option<String>,
    
    /// Source of the request (chatgpt, claude, api, etc.)
    #[serde(default = "default_source")]
    pub source: String,
}

fn default_priority() -> u8 { 3 }
fn default_source() -> String { "api".to_string() }

/// Task status
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum TaskStatus {
    Pending,
    Queued,
    Running,
    Completed,
    Failed,
    Cancelled,
}

/// Task record
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Task {
    pub id: Uuid,
    pub instruction: String,
    pub repository: String,
    pub branch: String,
    pub issue_number: Option<u64>,
    pub status: TaskStatus,
    pub agent: Option<String>,
    pub priority: u8,
    pub source: String,
    pub callback_url: Option<String>,
    
    /// Result/output when completed
    pub result: Option<TaskResult>,
    
    pub created_at: DateTime<Utc>,
    pub started_at: Option<DateTime<Utc>>,
    pub completed_at: Option<DateTime<Utc>>,
}

impl Task {
    pub fn new(request: TaskRequest) -> Self {
        Self {
            id: Uuid::new_v4(),
            instruction: request.instruction,
            repository: request.repository.unwrap_or_else(|| "miyabi-private".to_string()),
            branch: request.branch.unwrap_or_else(|| "main".to_string()),
            issue_number: request.issue_number,
            status: TaskStatus::Pending,
            agent: request.agent,
            priority: request.priority,
            source: request.source,
            callback_url: request.callback_url,
            result: None,
            created_at: Utc::now(),
            started_at: None,
            completed_at: None,
        }
    }
}

/// Task execution result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskResult {
    pub success: bool,
    pub message: String,
    pub pr_url: Option<String>,
    pub commit_sha: Option<String>,
    pub files_changed: Vec<String>,
    pub agent_used: String,
    pub execution_time_ms: u64,
}

/// Task status response
#[derive(Debug, Serialize)]
pub struct TaskStatusResponse {
    pub task_id: Uuid,
    pub status: TaskStatus,
    pub instruction: String,
    pub agent: Option<String>,
    pub result: Option<TaskResult>,
    pub created_at: DateTime<Utc>,
    pub completed_at: Option<DateTime<Utc>>,
}

/// System status response
#[derive(Debug, Serialize)]
pub struct SystemStatus {
    pub healthy: bool,
    pub version: String,
    pub active_tasks: usize,
    pub queued_tasks: usize,
    pub agents_available: Vec<AgentInfo>,
}

/// Agent information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentInfo {
    pub id: String,
    pub name: String,
    pub status: AgentStatus,
    pub current_task: Option<Uuid>,
    pub capabilities: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum AgentStatus {
    Available,
    Busy,
    Offline,
}

/// API error response
#[derive(Debug, Serialize)]
pub struct ApiError {
    pub error: String,
    pub code: String,
    pub details: Option<String>,
}
