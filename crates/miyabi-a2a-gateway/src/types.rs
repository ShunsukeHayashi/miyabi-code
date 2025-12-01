//! Core types for A2A communication

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use uuid::Uuid;

/// Unique identifier for an agent
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct AgentId(pub String);

impl AgentId {
    pub fn new() -> Self {
        Self(Uuid::new_v4().to_string())
    }

    pub fn from_name(name: &str) -> Self {
        Self(name.to_string())
    }
}

impl Default for AgentId {
    fn default() -> Self {
        Self::new()
    }
}

/// Unique identifier for a task
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct TaskId(pub String);

impl TaskId {
    pub fn new() -> Self {
        Self(Uuid::new_v4().to_string())
    }
}

impl Default for TaskId {
    fn default() -> Self {
        Self::new()
    }
}

/// Agent Card - describes agent capabilities (A2A Protocol standard)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentCard {
    pub name: String,
    pub description: String,
    pub version: String,
    pub protocol_version: String,
    pub url: String,
    pub capabilities: AgentCapabilities,
    pub skills: Vec<Skill>,
    pub default_input_modes: Vec<String>,
    pub default_output_modes: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub authentication: Option<Authentication>,
}

impl Default for AgentCard {
    fn default() -> Self {
        Self {
            name: String::new(),
            description: String::new(),
            version: "1.0.0".to_string(),
            protocol_version: "0.2.6".to_string(),
            url: String::new(),
            capabilities: AgentCapabilities::default(),
            skills: vec![],
            default_input_modes: vec!["text/plain".to_string()],
            default_output_modes: vec!["application/json".to_string()],
            authentication: None,
        }
    }
}

/// Agent capabilities
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentCapabilities {
    pub streaming: bool,
    pub push_notifications: bool,
    pub state_transition_history: bool,
}

impl Default for AgentCapabilities {
    fn default() -> Self {
        Self { streaming: true, push_notifications: false, state_transition_history: true }
    }
}

/// Skill definition
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Skill {
    pub id: String,
    pub name: String,
    pub description: String,
    pub input_modes: Vec<String>,
    pub output_modes: Vec<String>,
}

impl Default for Skill {
    fn default() -> Self {
        Self {
            id: String::new(),
            name: String::new(),
            description: String::new(),
            input_modes: vec!["text/plain".to_string()],
            output_modes: vec!["application/json".to_string()],
        }
    }
}

/// Authentication configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Authentication {
    pub schemes: Vec<String>,
}

/// Task status
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum TaskStatus {
    Pending,
    InProgress,
    Completed,
    Failed,
    Cancelled,
}

/// Task priority
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize, Default)]
pub enum Priority {
    Low = 1,
    #[default]
    Medium = 2,
    High = 3,
    Critical = 4,
}

/// Message in A2A communication
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Message {
    pub role: String,
    pub parts: Vec<Part>,
}

impl Message {
    pub fn user(text: &str) -> Self {
        Self { role: "user".to_string(), parts: vec![Part::Text(text.to_string())] }
    }

    pub fn get_text(&self) -> Option<String> {
        self.parts
            .iter()
            .find_map(|p| if let Part::Text(t) = p { Some(t.clone()) } else { None })
    }
}

/// Message part
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "content")]
pub enum Part {
    #[serde(rename = "text")]
    Text(String),
    #[serde(rename = "file")]
    File { name: String, data: String },
    #[serde(rename = "data")]
    Data(serde_json::Value),
}

/// Task for inter-agent communication
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Task {
    pub id: TaskId,
    pub from: AgentId,
    pub to: AgentId,
    pub message: Message,
    pub priority: Priority,
    pub status: TaskStatus,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub timeout_secs: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub idempotency_key: Option<String>,
    pub metadata: HashMap<String, String>,
}

impl Task {
    pub fn new(from: AgentId, to: AgentId, message: Message) -> Self {
        let now = Utc::now();
        Self {
            id: TaskId::new(),
            from,
            to,
            message,
            priority: Priority::default(),
            status: TaskStatus::Pending,
            created_at: now,
            updated_at: now,
            timeout_secs: Some(300),
            idempotency_key: None,
            metadata: HashMap::new(),
        }
    }

    pub fn with_priority(mut self, priority: Priority) -> Self {
        self.priority = priority;
        self
    }

    pub fn with_timeout(mut self, secs: u64) -> Self {
        self.timeout_secs = Some(secs);
        self
    }
}

/// Artifact produced by task execution
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Artifact {
    pub content_type: String,
    pub content: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
}

impl Artifact {
    pub fn text(content: String) -> Self {
        Self { content_type: "text/plain".to_string(), content, name: None }
    }

    pub fn json(value: serde_json::Value) -> Self {
        Self { content_type: "application/json".to_string(), content: value.to_string(), name: None }
    }
}

/// Task result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TaskResult {
    Success(Vec<Artifact>),
    Failure(String),
}

/// Delivery guarantee level
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum DeliveryGuarantee {
    /// Fire and forget
    AtMostOnce,
    /// Retry until acknowledged
    #[default]
    AtLeastOnce,
    /// Deduplicate
    ExactlyOnce,
}

/// Agent status
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum AgentStatus {
    Active,
    Inactive,
    Busy,
    Error,
}

/// Registered agent in the gateway
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RegisteredAgent {
    pub id: AgentId,
    pub card: AgentCard,
    pub status: AgentStatus,
    pub last_heartbeat: DateTime<Utc>,
    pub endpoint: String,
}
