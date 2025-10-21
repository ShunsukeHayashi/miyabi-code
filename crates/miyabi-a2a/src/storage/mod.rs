//! Task storage abstraction

use crate::task::{A2ATask, TaskStatus};
use async_trait::async_trait;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

pub mod github;

/// Task storage backend trait
///
/// This trait defines the interface for persisting and retrieving
/// A2A tasks. Implementations can use different backends (GitHub Issues,
/// databases, etc.)
#[async_trait]
pub trait TaskStorage: Send + Sync {
    /// Save a new task
    ///
    /// # Returns
    /// The assigned task ID
    async fn save_task(&self, task: A2ATask) -> Result<u64, StorageError>;

    /// Get a task by ID
    ///
    /// # Returns
    /// `Some(task)` if found, `None` if not found
    async fn get_task(&self, id: u64) -> Result<Option<A2ATask>, StorageError>;

    /// List tasks with optional filters
    ///
    /// # Arguments
    /// * `filter` - Optional filtering criteria
    ///
    /// # Returns
    /// List of tasks matching the filter
    async fn list_tasks(&self, filter: TaskFilter) -> Result<Vec<A2ATask>, StorageError>;

    /// Update an existing task
    ///
    /// # Arguments
    /// * `id` - Task ID to update
    /// * `update` - Fields to update (only provided fields are updated)
    ///
    /// # Returns
    /// Ok(()) on success
    async fn update_task(&self, id: u64, update: TaskUpdate) -> Result<(), StorageError>;

    /// Delete a task
    ///
    /// # Arguments
    /// * `id` - Task ID to delete
    ///
    /// # Returns
    /// Ok(()) on success
    async fn delete_task(&self, id: u64) -> Result<(), StorageError>;
}

/// Task filter for list_tasks()
#[derive(Default, Debug, Clone)]
pub struct TaskFilter {
    /// Filter by context ID
    pub context_id: Option<String>,

    /// Filter by status
    pub status: Option<TaskStatus>,

    /// Filter by agent
    pub agent: Option<String>,

    /// Filter by tasks updated after this timestamp
    pub last_updated_after: Option<DateTime<Utc>>,

    /// Maximum number of results
    pub limit: Option<usize>,

    /// Pagination cursor
    pub cursor: Option<String>,
}

/// Task update for update_task()
#[derive(Default, Debug, Clone, Serialize, Deserialize)]
pub struct TaskUpdate {
    /// Update status
    pub status: Option<TaskStatus>,

    /// Update description
    pub description: Option<String>,

    /// Update assigned agent
    pub agent: Option<String>,

    /// Update priority
    pub priority: Option<u8>,
}

/// Storage error types
#[derive(Debug, thiserror::Error)]
pub enum StorageError {
    #[error("Task not found: {0}")]
    NotFound(u64),

    #[error("Network error: {0}")]
    Network(String),

    #[error("Authentication error: {0}")]
    Auth(String),

    #[error("Serialization error: {0}")]
    Serialization(String),

    #[error("Storage error: {0}")]
    Other(String),
}

impl From<octocrab::Error> for StorageError {
    fn from(err: octocrab::Error) -> Self {
        StorageError::Network(err.to_string())
    }
}

impl From<serde_json::Error> for StorageError {
    fn from(err: serde_json::Error) -> Self {
        StorageError::Serialization(err.to_string())
    }
}
