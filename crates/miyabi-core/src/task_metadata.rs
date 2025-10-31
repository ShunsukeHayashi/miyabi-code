// Task metadata persistence system for Miyabi
//
// This module provides functionality to persist task execution metadata,
// including execution history, success/failure status, and execution time.
//
// Based on KAMUI 4D's `data/tasks-state.json` design, adapted for Miyabi's
// Git Worktree-based workflow.

use anyhow::{Context, Result};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use std::time::Duration;

/// Task execution status
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum TaskStatus {
    /// Task is pending (not started yet)
    Pending,
    /// Task is currently running
    Running,
    /// Task completed successfully
    Success,
    /// Task failed with an error
    Failed,
    /// Task was cancelled
    Cancelled,
}

/// Task metadata structure
///
/// Stores all information about a task's execution, including:
/// - Task identification (ID, issue number, title)
/// - Git information (worktree path, branch names)
/// - Execution timing (created, started, completed)
/// - Agent assignment
/// - Success/failure status
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskMetadata {
    /// Unique task ID
    pub id: String,

    /// GitHub issue number (if applicable)
    pub issue_number: Option<u64>,

    /// Task title
    pub title: String,

    /// Project root directory
    pub project_root: PathBuf,

    /// Git Worktree path (if created)
    pub worktree_path: Option<PathBuf>,

    /// Branch name for this task
    pub branch_name: Option<String>,

    /// Base branch (usually "main")
    pub base_branch: String,

    /// Current task status
    pub status: TaskStatus,

    /// Assigned agent (e.g., "CoordinatorAgent", "CodeGenAgent")
    pub agent: Option<String>,

    /// Task creation timestamp
    pub created_at: DateTime<Utc>,

    /// Task start timestamp
    pub started_at: Option<DateTime<Utc>>,

    /// Task completion timestamp
    pub completed_at: Option<DateTime<Utc>>,

    /// Execution duration (in seconds)
    pub duration_secs: Option<u64>,

    /// Whether the task succeeded
    pub success: Option<bool>,

    /// Error message (if failed)
    pub error_message: Option<String>,
}

impl TaskMetadata {
    /// Create a new TaskMetadata
    pub fn new(
        id: String,
        issue_number: Option<u64>,
        title: String,
        project_root: PathBuf,
        base_branch: String,
    ) -> Self {
        Self {
            id,
            issue_number,
            title,
            project_root,
            worktree_path: None,
            branch_name: None,
            base_branch,
            status: TaskStatus::Pending,
            agent: None,
            created_at: Utc::now(),
            started_at: None,
            completed_at: None,
            duration_secs: None,
            success: None,
            error_message: None,
        }
    }

    /// Mark task as started
    pub fn start(&mut self) {
        self.status = TaskStatus::Running;
        self.started_at = Some(Utc::now());
    }

    /// Mark task as completed successfully
    pub fn complete_success(&mut self) {
        self.status = TaskStatus::Success;
        self.success = Some(true);
        self.complete_common();
    }

    /// Mark task as failed
    pub fn complete_failure(&mut self, error: Option<String>) {
        self.status = TaskStatus::Failed;
        self.success = Some(false);
        self.error_message = error;
        self.complete_common();
    }

    /// Mark task as cancelled
    pub fn cancel(&mut self) {
        self.status = TaskStatus::Cancelled;
        self.complete_common();
    }

    /// Common completion logic
    fn complete_common(&mut self) {
        self.completed_at = Some(Utc::now());

        // Calculate duration
        if let Some(started) = self.started_at {
            if let Some(completed) = self.completed_at {
                let duration = completed.signed_duration_since(started);
                self.duration_secs = Some(duration.num_seconds() as u64);
            }
        }
    }

    /// Get execution duration
    pub fn get_duration(&self) -> Option<Duration> {
        self.duration_secs.map(Duration::from_secs)
    }
}

/// Task metadata manager
///
/// Handles persistence of task metadata to `.miyabi/tasks/*.json`
pub struct TaskMetadataManager {
    /// Base directory (`.miyabi/tasks/`)
    tasks_dir: PathBuf,
}

impl TaskMetadataManager {
    /// Create a new TaskMetadataManager
    ///
    /// # Arguments
    /// * `project_root` - Project root directory
    pub fn new(project_root: &Path) -> Result<Self> {
        let tasks_dir = project_root.join(".miyabi").join("tasks");

        // Create tasks directory if it doesn't exist
        if !tasks_dir.exists() {
            fs::create_dir_all(&tasks_dir).context("Failed to create .miyabi/tasks directory")?;
        }

        Ok(Self { tasks_dir })
    }

    /// Save task metadata to disk
    ///
    /// Saves metadata as `.miyabi/tasks/{task_id}.json`
    pub fn save(&self, metadata: &TaskMetadata) -> Result<PathBuf> {
        let file_path = self.tasks_dir.join(format!("{}.json", metadata.id));

        let json =
            serde_json::to_string_pretty(metadata).context("Failed to serialize task metadata")?;

        fs::write(&file_path, json).context("Failed to write task metadata to disk")?;

        Ok(file_path)
    }

    /// Load task metadata from disk
    pub fn load(&self, task_id: &str) -> Result<TaskMetadata> {
        let file_path = self.tasks_dir.join(format!("{}.json", task_id));

        let json =
            fs::read_to_string(&file_path).context("Failed to read task metadata from disk")?;

        let metadata: TaskMetadata =
            serde_json::from_str(&json).context("Failed to deserialize task metadata")?;

        Ok(metadata)
    }

    /// List all task metadata files
    pub fn list_all(&self) -> Result<Vec<TaskMetadata>> {
        let mut tasks = Vec::new();

        if !self.tasks_dir.exists() {
            return Ok(tasks);
        }

        for entry in fs::read_dir(&self.tasks_dir)? {
            let entry = entry?;
            let path = entry.path();

            if path.extension().and_then(|s| s.to_str()) == Some("json") {
                if let Ok(metadata) = self.load_from_path(&path) {
                    tasks.push(metadata);
                }
            }
        }

        // Sort by creation time (newest first)
        tasks.sort_by(|a, b| b.created_at.cmp(&a.created_at));

        Ok(tasks)
    }

    /// Load task metadata from a specific path
    fn load_from_path(&self, path: &Path) -> Result<TaskMetadata> {
        let json = fs::read_to_string(path)?;
        let metadata: TaskMetadata = serde_json::from_str(&json)?;
        Ok(metadata)
    }

    /// Find tasks by issue number
    pub fn find_by_issue(&self, issue_number: u64) -> Result<Vec<TaskMetadata>> {
        let all_tasks = self.list_all()?;
        Ok(all_tasks
            .into_iter()
            .filter(|task| task.issue_number == Some(issue_number))
            .collect())
    }

    /// Find tasks by status
    pub fn find_by_status(&self, status: TaskStatus) -> Result<Vec<TaskMetadata>> {
        let all_tasks = self.list_all()?;
        Ok(all_tasks
            .into_iter()
            .filter(|task| task.status == status)
            .collect())
    }

    /// Delete task metadata
    pub fn delete(&self, task_id: &str) -> Result<()> {
        let file_path = self.tasks_dir.join(format!("{}.json", task_id));

        if file_path.exists() {
            fs::remove_file(&file_path).context("Failed to delete task metadata")?;
        }

        Ok(())
    }

    /// Get statistics about all tasks
    pub fn get_statistics(&self) -> Result<TaskStatistics> {
        let tasks = self.list_all()?;

        let total = tasks.len();
        let pending = tasks
            .iter()
            .filter(|t| t.status == TaskStatus::Pending)
            .count();
        let running = tasks
            .iter()
            .filter(|t| t.status == TaskStatus::Running)
            .count();
        let success = tasks
            .iter()
            .filter(|t| t.status == TaskStatus::Success)
            .count();
        let failed = tasks
            .iter()
            .filter(|t| t.status == TaskStatus::Failed)
            .count();
        let cancelled = tasks
            .iter()
            .filter(|t| t.status == TaskStatus::Cancelled)
            .count();

        // Calculate average duration for completed tasks
        let completed_tasks: Vec<_> = tasks.iter().filter(|t| t.duration_secs.is_some()).collect();

        let avg_duration_secs = if !completed_tasks.is_empty() {
            let total_duration: u64 = completed_tasks.iter().filter_map(|t| t.duration_secs).sum();
            Some(total_duration / completed_tasks.len() as u64)
        } else {
            None
        };

        Ok(TaskStatistics {
            total,
            pending,
            running,
            success,
            failed,
            cancelled,
            success_rate: if success + failed > 0 {
                Some((success as f64 / (success + failed) as f64) * 100.0)
            } else {
                None
            },
            avg_duration_secs,
        })
    }
}

/// Task statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskStatistics {
    pub total: usize,
    pub pending: usize,
    pub running: usize,
    pub success: usize,
    pub failed: usize,
    pub cancelled: usize,
    pub success_rate: Option<f64>,
    pub avg_duration_secs: Option<u64>,
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::thread;
    use std::time::Duration as StdDuration;
    use tempfile::TempDir;

    #[test]
    fn test_task_metadata_new() {
        let metadata = TaskMetadata::new(
            "task-123".to_string(),
            Some(42),
            "Test task".to_string(),
            PathBuf::from("/project"),
            "main".to_string(),
        );

        assert_eq!(metadata.id, "task-123");
        assert_eq!(metadata.issue_number, Some(42));
        assert_eq!(metadata.title, "Test task");
        assert_eq!(metadata.status, TaskStatus::Pending);
        assert!(metadata.success.is_none());
    }

    #[test]
    fn test_task_metadata_start() {
        let mut metadata = TaskMetadata::new(
            "task-123".to_string(),
            None,
            "Test".to_string(),
            PathBuf::from("/project"),
            "main".to_string(),
        );

        metadata.start();
        assert_eq!(metadata.status, TaskStatus::Running);
        assert!(metadata.started_at.is_some());
    }

    #[test]
    fn test_task_metadata_complete_success() {
        let mut metadata = TaskMetadata::new(
            "task-123".to_string(),
            None,
            "Test".to_string(),
            PathBuf::from("/project"),
            "main".to_string(),
        );

        metadata.start();
        thread::sleep(StdDuration::from_millis(10));
        metadata.complete_success();

        assert_eq!(metadata.status, TaskStatus::Success);
        assert_eq!(metadata.success, Some(true));
        assert!(metadata.completed_at.is_some());
        assert!(metadata.duration_secs.is_some());
    }

    #[test]
    fn test_task_metadata_complete_failure() {
        let mut metadata = TaskMetadata::new(
            "task-123".to_string(),
            None,
            "Test".to_string(),
            PathBuf::from("/project"),
            "main".to_string(),
        );

        metadata.start();
        metadata.complete_failure(Some("Test error".to_string()));

        assert_eq!(metadata.status, TaskStatus::Failed);
        assert_eq!(metadata.success, Some(false));
        assert_eq!(metadata.error_message, Some("Test error".to_string()));
    }

    #[test]
    fn test_task_metadata_manager_save_and_load() {
        let temp_dir = TempDir::new().unwrap();
        let manager = TaskMetadataManager::new(temp_dir.path()).unwrap();

        let metadata = TaskMetadata::new(
            "task-456".to_string(),
            Some(99),
            "Save test".to_string(),
            temp_dir.path().to_path_buf(),
            "main".to_string(),
        );

        let saved_path = manager.save(&metadata).unwrap();
        assert!(saved_path.exists());

        let loaded = manager.load("task-456").unwrap();
        assert_eq!(loaded.id, "task-456");
        assert_eq!(loaded.issue_number, Some(99));
        assert_eq!(loaded.title, "Save test");
    }

    #[test]
    fn test_task_metadata_manager_list_all() {
        let temp_dir = TempDir::new().unwrap();
        let manager = TaskMetadataManager::new(temp_dir.path()).unwrap();

        // Create multiple tasks
        for i in 1..=3 {
            let metadata = TaskMetadata::new(
                format!("task-{}", i),
                Some(i as u64),
                format!("Task {}", i),
                temp_dir.path().to_path_buf(),
                "main".to_string(),
            );
            manager.save(&metadata).unwrap();
        }

        let all_tasks = manager.list_all().unwrap();
        assert_eq!(all_tasks.len(), 3);
    }

    #[test]
    fn test_task_metadata_manager_find_by_issue() {
        let temp_dir = TempDir::new().unwrap();
        let manager = TaskMetadataManager::new(temp_dir.path()).unwrap();

        let metadata = TaskMetadata::new(
            "task-789".to_string(),
            Some(100),
            "Find test".to_string(),
            temp_dir.path().to_path_buf(),
            "main".to_string(),
        );
        manager.save(&metadata).unwrap();

        let found = manager.find_by_issue(100).unwrap();
        assert_eq!(found.len(), 1);
        assert_eq!(found[0].id, "task-789");
    }

    #[test]
    fn test_task_metadata_manager_statistics() {
        let temp_dir = TempDir::new().unwrap();
        let manager = TaskMetadataManager::new(temp_dir.path()).unwrap();

        // Create tasks with different statuses
        let mut task1 = TaskMetadata::new(
            "task-s1".to_string(),
            None,
            "Success 1".to_string(),
            temp_dir.path().to_path_buf(),
            "main".to_string(),
        );
        task1.start();
        task1.complete_success();
        manager.save(&task1).unwrap();

        let mut task2 = TaskMetadata::new(
            "task-f1".to_string(),
            None,
            "Failed 1".to_string(),
            temp_dir.path().to_path_buf(),
            "main".to_string(),
        );
        task2.start();
        task2.complete_failure(None);
        manager.save(&task2).unwrap();

        let stats = manager.get_statistics().unwrap();
        assert_eq!(stats.total, 2);
        assert_eq!(stats.success, 1);
        assert_eq!(stats.failed, 1);
        assert!(stats.success_rate.is_some());
    }
}
