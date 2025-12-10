//! Miyabi Society Entities
//! Created: 2025-12-05
//! Issue: #970

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Agent entity
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Agent {
    pub id: Uuid,
    pub name: String,
    pub agent_type: String,
    pub society: Option<String>,
    pub status: AgentStatus,
    pub config: serde_json::Value,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "lowercase")]
pub enum AgentStatus {
    #[default]
    Active,
    Inactive,
    Busy,
    Error,
}

/// Task entity
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Task {
    pub id: Uuid,
    pub title: String,
    pub description: Option<String>,
    pub agent_id: Option<Uuid>,
    pub status: TaskStatus,
    pub priority: TaskPriority,
    pub issue_number: Option<i32>,
    pub result: Option<serde_json::Value>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "lowercase")]
pub enum TaskStatus {
    #[default]
    Pending,
    InProgress,
    Completed,
    Failed,
    Cancelled,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "lowercase")]
pub enum TaskPriority {
    Critical,
    High,
    #[default]
    Medium,
    Low,
}

/// Session entity
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Session {
    pub id: Uuid,
    pub name: Option<String>,
    pub status: SessionStatus,
    pub agents_count: i32,
    pub metadata: serde_json::Value,
    pub started_at: DateTime<Utc>,
    pub ended_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "lowercase")]
pub enum SessionStatus {
    #[default]
    Active,
    Completed,
    Failed,
}

/// Message entity (A2A communication)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Message {
    pub id: Uuid,
    pub session_id: Option<Uuid>,
    pub from_agent: Option<Uuid>,
    pub to_agent: Option<Uuid>,
    pub message_type: MessageType,
    pub content: serde_json::Value,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum MessageType {
    Signal,
    Alert,
    Data,
    Report,
    Sync,
    Command,
    Response,
}

impl Agent {
    pub fn new(name: String, agent_type: String, society: Option<String>) -> Self {
        Self {
            id: Uuid::new_v4(),
            name,
            agent_type,
            society,
            status: AgentStatus::Active,
            config: serde_json::json!({}),
            created_at: Utc::now(),
            updated_at: Utc::now(),
        }
    }
}

impl Task {
    pub fn new(title: String, issue_number: Option<i32>) -> Self {
        Self {
            id: Uuid::new_v4(),
            title,
            description: None,
            agent_id: None,
            status: TaskStatus::Pending,
            priority: TaskPriority::Medium,
            issue_number,
            result: None,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        }
    }
}
