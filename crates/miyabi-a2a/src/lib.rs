//! Miyabi A2A - Agent-to-Agent Task Storage and Communication
//!
//! This crate provides task storage and communication infrastructure
//! for agent-to-agent (A2A) collaboration in the Miyabi framework.
//!
//! # Overview
//!
//! A2A enables multiple agents to coordinate work by sharing tasks through
//! a persistent storage backend. The primary implementation uses GitHub Issues
//! as the storage layer, providing:
//!
//! - Natural task visualization (github.com UI)
//! - Built-in authentication and access control
//! - Webhook integration for real-time updates
//! - No additional infrastructure required
//!
//! # Examples
//!
//! ```no_run
//! use miyabi_a2a::{GitHubTaskStorage, TaskStorage, A2ATask, TaskStatus, TaskType};
//! use chrono::Utc;
//!
//! #[tokio::main]
//! async fn main() -> Result<(), Box<dyn std::error::Error>> {
//!     // Create storage backend
//!     let storage = GitHubTaskStorage::new(
//!         std::env::var("GITHUB_TOKEN")?,
//!         "owner".to_string(),
//!         "repo".to_string(),
//!     )?;
//!
//!     // Create a new task
//!     let task = A2ATask {
//!         id: 0, // Will be assigned by storage
//!         title: "Implement feature X".to_string(),
//!         description: "Details...".to_string(),
//!         status: TaskStatus::Pending,
//!         task_type: TaskType::CodeGeneration,
//!         agent: None,
//!         context_id: Some("project-123".to_string()),
//!         priority: 3,
//!         created_at: Utc::now(),
//!         updated_at: Utc::now(),
//!         issue_url: String::new(),
//!     };
//!
//!     // Save task
//!     let task_id = storage.save_task(task).await?;
//!     println!("Created task #{}", task_id);
//!
//!     // Retrieve task
//!     if let Some(task) = storage.get_task(task_id).await? {
//!         println!("Task: {}", task.title);
//!     }
//!
//!     Ok(())
//! }
//! ```

pub mod storage;
pub mod task;

// Re-export main types
pub use storage::{
    github::GitHubTaskStorage, StorageError, TaskFilter, TaskStorage, TaskUpdate,
};
pub use task::{A2ATask, TaskStatus, TaskType};
