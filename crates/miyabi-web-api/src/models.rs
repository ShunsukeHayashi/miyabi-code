//! Database models and DTOs

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use utoipa::ToSchema;
use uuid::Uuid;

/// User model
#[derive(Debug, Clone, Serialize, Deserialize, FromRow, ToSchema)]
pub struct User {
    /// Unique user ID
    pub id: Uuid,
    /// GitHub user ID
    pub github_id: i64,
    /// User email
    pub email: String,
    /// User display name
    #[serde(skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
    /// Avatar URL
    #[serde(skip_serializing_if = "Option::is_none")]
    pub avatar_url: Option<String>,
    /// GitHub access token (excluded from serialization)
    #[serde(skip_serializing)]
    pub access_token: String,
    /// Account creation timestamp
    pub created_at: DateTime<Utc>,
    /// Last update timestamp
    pub updated_at: DateTime<Utc>,
}

/// Repository model
#[derive(Debug, Clone, Serialize, Deserialize, FromRow, ToSchema)]
pub struct Repository {
    /// Unique repository ID
    pub id: Uuid,
    /// Owner user ID
    pub user_id: Uuid,
    /// GitHub repository ID
    pub github_repo_id: i64,
    /// Repository owner (username or organization)
    pub owner: String,
    /// Repository name
    pub name: String,
    /// Full repository name (owner/name)
    pub full_name: String,
    /// Whether repository is active
    pub is_active: bool,
    /// Repository creation timestamp
    pub created_at: DateTime<Utc>,
    /// Last update timestamp
    pub updated_at: DateTime<Utc>,
}

/// Agent execution status
#[derive(Debug, Clone, Copy, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "lowercase")]
pub enum ExecutionStatus {
    /// Execution is pending
    Pending,
    /// Execution is in progress
    Running,
    /// Execution completed successfully
    Completed,
    /// Execution failed
    Failed,
    /// Execution was cancelled
    Cancelled,
}

impl std::fmt::Display for ExecutionStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ExecutionStatus::Pending => write!(f, "pending"),
            ExecutionStatus::Running => write!(f, "running"),
            ExecutionStatus::Completed => write!(f, "completed"),
            ExecutionStatus::Failed => write!(f, "failed"),
            ExecutionStatus::Cancelled => write!(f, "cancelled"),
        }
    }
}

/// Agent type enumeration
#[derive(Debug, Clone, Copy, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "lowercase")]
pub enum AgentType {
    /// Coordinator agent - task decomposition
    Coordinator,
    /// Code generation agent
    CodeGen,
    /// Code review agent
    Review,
    /// Pull request creation agent
    #[serde(rename = "pr")]
    PR,
    /// Deployment agent
    Deployment,
    /// Issue analysis agent
    Issue,
}

impl std::fmt::Display for AgentType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            AgentType::Coordinator => write!(f, "coordinator"),
            AgentType::CodeGen => write!(f, "codegen"),
            AgentType::Review => write!(f, "review"),
            AgentType::PR => write!(f, "pr"),
            AgentType::Deployment => write!(f, "deployment"),
            AgentType::Issue => write!(f, "issue"),
        }
    }
}

/// Agent execution model
#[derive(Debug, Clone, Serialize, Deserialize, FromRow, ToSchema)]
pub struct AgentExecution {
    /// Unique execution ID
    pub id: Uuid,
    /// Repository ID
    pub repository_id: Uuid,
    /// GitHub issue number
    pub issue_number: i32,
    /// Agent type
    #[sqlx(try_from = "String")]
    pub agent_type: String,
    /// Execution status
    #[sqlx(try_from = "String")]
    pub status: String,
    /// Execution start timestamp
    #[serde(skip_serializing_if = "Option::is_none")]
    pub started_at: Option<DateTime<Utc>>,
    /// Execution completion timestamp
    #[serde(skip_serializing_if = "Option::is_none")]
    pub completed_at: Option<DateTime<Utc>>,
    /// Result summary (JSON)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub result_summary: Option<serde_json::Value>,
    /// Quality score (0-100)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub quality_score: Option<i32>,
    /// Pull request number (if created)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub pr_number: Option<i32>,
    /// Execution creation timestamp
    pub created_at: DateTime<Utc>,
    /// Last update timestamp
    pub updated_at: DateTime<Utc>,
}

/// Workflow model
#[derive(Debug, Clone, Serialize, Deserialize, FromRow, ToSchema)]
pub struct Workflow {
    /// Unique workflow ID
    pub id: Uuid,
    /// Repository ID
    pub repository_id: Uuid,
    /// Workflow name
    pub name: String,
    /// Workflow description
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    /// DAG definition (JSON)
    pub dag_definition: serde_json::Value,
    /// Whether workflow is active
    pub is_active: bool,
    /// Workflow creation timestamp
    pub created_at: DateTime<Utc>,
    /// Last update timestamp
    pub updated_at: DateTime<Utc>,
}

/// LINE message model
#[derive(Debug, Clone, Serialize, Deserialize, FromRow, ToSchema)]
pub struct LineMessage {
    /// Unique message ID
    pub id: Uuid,
    /// User ID
    pub user_id: Uuid,
    /// LINE user ID
    pub line_user_id: String,
    /// Message type (text, image, etc.)
    pub message_type: String,
    /// Message content
    pub content: String,
    /// Additional metadata (JSON)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<serde_json::Value>,
    /// Message creation timestamp
    pub created_at: DateTime<Utc>,
}

/// WebSocket connection model
#[derive(Debug, Clone, Serialize, Deserialize, FromRow, ToSchema)]
pub struct WebSocketConnection {
    /// Unique connection ID (UUID)
    pub id: Uuid,
    /// User ID
    pub user_id: Uuid,
    /// Connection identifier string
    pub connection_id: String,
    /// Connection establishment timestamp
    pub connected_at: DateTime<Utc>,
    /// Last ping timestamp
    pub last_ping_at: DateTime<Utc>,
}

// DTOs (Data Transfer Objects)

/// Create repository request
#[derive(Debug, Deserialize, ToSchema)]
pub struct CreateRepositoryRequest {
    /// GitHub repository full name (owner/name)
    pub full_name: String,
}

/// Execute agent request
#[derive(Debug, Deserialize, ToSchema)]
pub struct ExecuteAgentRequest {
    /// Repository ID
    pub repository_id: Uuid,
    /// GitHub issue number
    pub issue_number: i32,
    /// Agent type
    pub agent_type: AgentType,
}

/// Create workflow request
#[derive(Debug, Deserialize, ToSchema)]
pub struct CreateWorkflowRequest {
    /// Repository ID
    pub repository_id: Uuid,
    /// Workflow name
    pub name: String,
    /// Workflow description
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    /// DAG definition (JSON)
    pub dag_definition: serde_json::Value,
}

/// JWT claims
#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    /// Subject (user ID)
    pub sub: String,
    /// Expiration time
    pub exp: i64,
    /// Issued at
    pub iat: i64,
    /// GitHub user ID
    pub github_id: i64,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_execution_status_display() {
        assert_eq!(ExecutionStatus::Pending.to_string(), "pending");
        assert_eq!(ExecutionStatus::Running.to_string(), "running");
        assert_eq!(ExecutionStatus::Completed.to_string(), "completed");
    }

    #[test]
    fn test_agent_type_display() {
        assert_eq!(AgentType::Coordinator.to_string(), "coordinator");
        assert_eq!(AgentType::CodeGen.to_string(), "codegen");
        assert_eq!(AgentType::PR.to_string(), "pr");
    }
}
