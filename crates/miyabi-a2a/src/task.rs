//! A2A Task definitions

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// A2A Task - Agent-to-Agent communication task
///
/// This represents a task that can be exchanged between agents
/// for collaborative work. Tasks are stored as GitHub Issues
/// for persistence and visibility.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct A2ATask {
    /// Unique task ID (GitHub Issue number)
    pub id: u64,

    /// Task title
    pub title: String,

    /// Task description (markdown)
    pub description: String,

    /// Task status
    pub status: TaskStatus,

    /// Task type
    pub task_type: TaskType,

    /// Assigned agent type (optional)
    pub agent: Option<String>,

    /// Context ID for filtering related tasks
    pub context_id: Option<String>,

    /// Priority (0-5, higher = more urgent)
    pub priority: u8,

    /// Number of retry attempts (for failed tasks)
    #[serde(default)]
    pub retry_count: u32,

    /// Created timestamp
    pub created_at: DateTime<Utc>,

    /// Updated timestamp
    pub updated_at: DateTime<Utc>,

    /// GitHub Issue URL
    pub issue_url: String,
}

/// Task status lifecycle (aligned with A2A Protocol)
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum TaskStatus {
    /// Task submitted, awaiting processing
    Submitted,
    /// Task currently being worked on
    Working,
    /// Task successfully completed
    Completed,
    /// Task failed with errors
    Failed,
    /// Task cancelled by user
    Cancelled,
}

impl TaskStatus {
    /// Convert to GitHub label format
    ///
    /// # Examples
    /// ```
    /// use miyabi_a2a::TaskStatus;
    ///
    /// assert_eq!(TaskStatus::Submitted.to_label(), "a2a:submitted");
    /// assert_eq!(TaskStatus::Working.to_label(), "a2a:working");
    /// ```
    pub fn to_label(&self) -> String {
        format!("a2a:{}", self.to_string().to_lowercase())
    }
}

impl std::fmt::Display for TaskStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            TaskStatus::Submitted => write!(f, "submitted"),
            TaskStatus::Working => write!(f, "working"),
            TaskStatus::Completed => write!(f, "completed"),
            TaskStatus::Failed => write!(f, "failed"),
            TaskStatus::Cancelled => write!(f, "cancelled"),
        }
    }
}

/// Task type classification
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum TaskType {
    /// Code generation task
    CodeGeneration,
    /// Code review task
    CodeReview,
    /// Testing task
    Testing,
    /// Deployment task
    Deployment,
    /// Documentation task
    Documentation,
    /// Analysis task
    Analysis,
}

impl TaskType {
    /// Convert to GitHub label format
    ///
    /// # Examples
    /// ```
    /// use miyabi_a2a::TaskType;
    ///
    /// assert_eq!(TaskType::CodeGeneration.to_label(), "a2a:codegen");
    /// assert_eq!(TaskType::CodeReview.to_label(), "a2a:review");
    /// ```
    pub fn to_label(&self) -> String {
        format!("a2a:{}", self.to_string().to_lowercase())
    }
}

impl std::fmt::Display for TaskType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            TaskType::CodeGeneration => write!(f, "codegen"),
            TaskType::CodeReview => write!(f, "review"),
            TaskType::Testing => write!(f, "testing"),
            TaskType::Deployment => write!(f, "deployment"),
            TaskType::Documentation => write!(f, "documentation"),
            TaskType::Analysis => write!(f, "analysis"),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_task_status_label() {
        assert_eq!(TaskStatus::Submitted.to_label(), "a2a:submitted");
        assert_eq!(TaskStatus::Working.to_label(), "a2a:working");
        assert_eq!(TaskStatus::Completed.to_label(), "a2a:completed");
    }

    #[test]
    fn test_task_type_label() {
        assert_eq!(TaskType::CodeGeneration.to_label(), "a2a:codegen");
        assert_eq!(TaskType::CodeReview.to_label(), "a2a:review");
    }

    #[test]
    fn test_task_status_display() {
        assert_eq!(TaskStatus::Submitted.to_string(), "submitted");
        assert_eq!(TaskStatus::Working.to_string(), "working");
    }
}
