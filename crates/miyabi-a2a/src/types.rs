//! Type definitions for A2A Protocol
//!
//! This module provides core types used throughout the A2A system.

use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

// Re-export from task module
pub use crate::task::{TaskStatus, TaskType};

/// Agent card for A2A Protocol
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentCard {
    pub name: String,
    pub description: Option<String>,
    pub version: String,
    pub capabilities: Vec<String>,
    pub auth_methods: Vec<String>,
    pub url: String,
}

/// Task representation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Task {
    pub id: String,
    pub status: TaskStatus,
    pub input: TaskInput,
    pub output: Option<TaskOutput>,
    pub context_id: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl Task {
    pub fn new(prompt: String) -> Self {
        let now = Utc::now();
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            status: TaskStatus::Submitted,
            input: TaskInput {
                prompt,
                params: serde_json::Value::Object(serde_json::Map::new()),
            },
            output: None,
            context_id: None,
            created_at: now,
            updated_at: now,
        }
    }

    pub fn set_status(&mut self, status: TaskStatus) {
        self.status = status;
        self.updated_at = Utc::now();
    }

    pub fn is_terminal(&self) -> bool {
        matches!(
            self.status,
            TaskStatus::Completed | TaskStatus::Failed | TaskStatus::Cancelled
        )
    }
}

/// Task input
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskInput {
    pub prompt: String,
    pub params: serde_json::Value,
}

/// Task output
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskOutput {
    pub result: serde_json::Value,
    pub error: Option<String>,
}

/// Message role
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Role {
    User,
    Agent,
    System,
}

/// Message representation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Message {
    pub role: Role,
    pub parts: Vec<Part>,
}

/// Message part
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum Part {
    #[serde(rename = "text")]
    Text { content: String },
    #[serde(rename = "image")]
    Image { url: String },
    #[serde(rename = "data")]
    Data {
        content: Vec<u8>,
        mime_type: String,
    },
}

impl Part {
    pub fn text(content: impl Into<String>) -> Self {
        Part::Text {
            content: content.into(),
        }
    }
}

/// Artifact type
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ArtifactType {
    Code,
    Document,
    Image,
    Data,
}

/// Artifact representation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Artifact {
    pub id: String,
    pub artifact_type: ArtifactType,
    pub content: String,
    pub metadata: Option<serde_json::Value>,
}
