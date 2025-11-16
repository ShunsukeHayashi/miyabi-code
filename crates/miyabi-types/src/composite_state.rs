//! Composite State Types
//!
//! Unified state management across Miyabi Agent OS, AIFactory, and AWS.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::aws::{AwsAccount, AwsResource, ServiceAgent};

/// Composite Service State
///
/// Represents the unified state across all systems:
/// - Agent State (from miyabi-a2a / GitHub)
/// - Business State (from PostgreSQL)
/// - User State (in-memory)
/// - AWS State (from AWS API)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompositeServiceState {
    pub agent_state: AgentState,
    pub business_state: BusinessState,
    pub user_state: UserState,
    pub aws_state: AwsState,
    pub last_updated: DateTime<Utc>,
    pub version: u64,
}

/// Agent State (from GitHub Issues / miyabi-a2a)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentState {
    pub active_agents: Vec<AgentInfo>,
    pub task_queue: Vec<TaskInfo>,
    pub github_state: GitHubState,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentInfo {
    pub id: u32,
    pub name: String,
    pub status: String,
    pub current_task: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskInfo {
    pub id: Uuid,
    pub description: String,
    pub assigned_agent: Option<u32>,
    pub priority: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitHubState {
    pub open_issues: u32,
    pub open_prs: u32,
    pub recent_commits: Vec<String>,
}

/// Business State (from PostgreSQL - AIFactory)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BusinessState {
    pub products: Vec<Product>,
    pub orders: Vec<Order>,
    pub ai_jobs: Vec<AiJob>,
    pub payments: Vec<Payment>,
    pub approvals: Vec<Approval>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Product {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub price: String,
    pub category: Option<String>,
    pub status: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Order {
    pub id: Uuid,
    pub product_id: Uuid,
    pub user_id: Uuid,
    pub quantity: i32,
    pub total_amount: String,
    pub status: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiJob {
    pub id: Uuid,
    pub job_type: String,
    pub input_data: serde_json::Value,
    pub output_data: Option<serde_json::Value>,
    pub status: String,
    pub agent_id: Option<i32>,
    pub error_message: Option<String>,
    pub started_at: Option<DateTime<Utc>>,
    pub completed_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Payment {
    pub id: Uuid,
    pub order_id: Uuid,
    pub amount: String,
    pub currency: String,
    pub payment_method: String,
    pub stripe_payment_id: Option<String>,
    pub status: String,
    pub paid_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Approval {
    pub id: Uuid,
    pub resource_type: String,
    pub resource_id: Uuid,
    pub requester_id: Uuid,
    pub approver_id: Option<Uuid>,
    pub status: String,
    pub comments: Option<String>,
    pub approved_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

/// User State (in-memory)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserState {
    pub logged_in_users: Vec<UserInfo>,
    pub active_sessions: Vec<SessionInfo>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserInfo {
    pub id: Uuid,
    pub email: String,
    pub name: String,
    pub role: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionInfo {
    pub session_id: Uuid,
    pub user_id: Uuid,
    pub expires_at: DateTime<Utc>,
}

/// AWS State (from AWS API)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AwsState {
    pub accounts: Vec<AwsAccount>,
    pub resources: Vec<AwsResource>,
    pub service_agents: Vec<ServiceAgent>,
}

impl Default for CompositeServiceState {
    fn default() -> Self {
        Self {
            agent_state: AgentState {
                active_agents: vec![],
                task_queue: vec![],
                github_state: GitHubState {
                    open_issues: 0,
                    open_prs: 0,
                    recent_commits: vec![],
                },
            },
            business_state: BusinessState {
                products: vec![],
                orders: vec![],
                ai_jobs: vec![],
                payments: vec![],
                approvals: vec![],
            },
            user_state: UserState {
                logged_in_users: vec![],
                active_sessions: vec![],
            },
            aws_state: AwsState {
                accounts: vec![],
                resources: vec![],
                service_agents: vec![],
            },
            last_updated: Utc::now(),
            version: 0,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_composite_state() {
        let state = CompositeServiceState::default();
        assert_eq!(state.version, 0);
        assert_eq!(state.agent_state.active_agents.len(), 0);
        assert_eq!(state.business_state.products.len(), 0);
    }
}
