// Task Metadata Persistence System
// Inspired by KAMUI 4D's data/tasks-state.json design

use chrono::{DateTime, Duration, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};

/// Task execution status
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum TaskStatus {
    /// Task created but not started
    Pending,
    /// Task currently executing
    Running,
    /// Task completed successfully
    Completed,
    /// Task failed with error
    Failed,
    /// Task paused (waiting for dependencies)
    Paused,
}

/// Task metadata - stored in .miyabi/tasks/{id}.json
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskMetadata {
    /// Unique task identifier (e.g., "issue-270")
    pub id: String,

    /// GitHub Issue number (if applicable)
    pub issue_number: Option<u64>,

    /// Task title/description
    pub title: String,

    /// Project root directory
    pub project_root: PathBuf,

    /// Worktree path (if using git worktree)
    pub worktree_path: Option<PathBuf>,

    /// Git branch name
    pub branch_name: Option<String>,

    /// Base branch (usually "main")
    pub base_branch: String,

    /// Current task status
    pub status: TaskStatus,

    /// Assigned Agent name
    pub agent: Option<String>,

    /// Task creation timestamp
    pub created_at: DateTime<Utc>,

    /// Task start timestamp
    pub started_at: Option<DateTime<Utc>>,

    /// Task completion timestamp
    pub completed_at: Option<DateTime<Utc>>,

    /// Execution duration
    #[serde(
        serialize_with = "serialize_duration",
        deserialize_with = "deserialize_duration",
        skip_serializing_if = "Option::is_none",
        default
    )]
    pub duration: Option<Duration>,

    /// Success/failure flag
    pub success: Option<bool>,

    /// Error message (if failed)
    pub error_message: Option<String>,
}

// Custom serialization for Duration
fn serialize_duration<S>(duration: &Option<Duration>, serializer: S) -> Result<S::Ok, S::Error>
where
    S: serde::Serializer,
{
    match duration {
        Some(d) => serializer.serialize_i64(d.num_seconds()),
        None => serializer.serialize_none(),
    }
}

fn deserialize_duration<'de, D>(deserializer: D) -> Result<Option<Duration>, D::Error>
where
    D: serde::Deserializer<'de>,
{
    let seconds: Option<i64> = Option::deserialize(deserializer)?;
    Ok(seconds.map(Duration::seconds))
}

impl TaskMetadata {
    /// Create new task metadata
    pub fn new(id: String, title: String, project_root: PathBuf) -> Self {
        Self {
            id,
            issue_number: None,
            title,
            project_root,
            worktree_path: None,
            branch_name: None,
            base_branch: "main".to_string(),
            status: TaskStatus::Pending,
            agent: None,
            created_at: Utc::now(),
            started_at: None,
            completed_at: None,
            duration: None,
            success: None,
            error_message: None,
        }
    }

    /// Mark task as started
    pub fn start(&mut self, agent: Option<String>) {
        self.status = TaskStatus::Running;
        self.started_at = Some(Utc::now());
        self.agent = agent;
    }

    /// Mark task as completed
    pub fn complete(&mut self, success: bool) {
        self.status = if success {
            TaskStatus::Completed
        } else {
            TaskStatus::Failed
        };
        self.completed_at = Some(Utc::now());
        self.success = Some(success);

        // Calculate duration
        if let Some(started) = self.started_at {
            let completed = self.completed_at.unwrap();
            self.duration = Some(completed.signed_duration_since(started));
        }
    }

    /// Mark task as failed with error message
    pub fn fail(&mut self, error_message: String) {
        self.complete(false);
        self.error_message = Some(error_message);
    }
}

/// Task statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskStatistics {
    pub total_tasks: usize,
    pub completed_tasks: usize,
    pub failed_tasks: usize,
    pub running_tasks: usize,
    pub avg_duration: Option<Duration>,
    pub success_rate: f64,
}

/// Task metadata manager
pub struct TaskMetadataManager {
    tasks_dir: PathBuf,
}

impl TaskMetadataManager {
    /// Create new task metadata manager
    pub fn new(project_root: &Path) -> anyhow::Result<Self> {
        let tasks_dir = project_root.join(".miyabi").join("tasks");
        fs::create_dir_all(&tasks_dir)?;

        Ok(Self { tasks_dir })
    }

    /// Get task file path
    fn get_task_path(&self, id: &str) -> PathBuf {
        self.tasks_dir.join(format!("{}.json", id))
    }

    /// Create new task
    pub fn create_task(&self, metadata: TaskMetadata) -> anyhow::Result<()> {
        let path = self.get_task_path(&metadata.id);
        let json = serde_json::to_string_pretty(&metadata)?;
        fs::write(path, json)?;
        Ok(())
    }

    /// Update existing task
    pub fn update_task(&self, id: &str, metadata: TaskMetadata) -> anyhow::Result<()> {
        let path = self.get_task_path(id);
        let json = serde_json::to_string_pretty(&metadata)?;
        fs::write(path, json)?;
        Ok(())
    }

    /// Load task by ID
    pub fn load_task(&self, id: &str) -> anyhow::Result<Option<TaskMetadata>> {
        let path = self.get_task_path(id);
        if !path.exists() {
            return Ok(None);
        }

        let json = fs::read_to_string(path)?;
        let metadata: TaskMetadata = serde_json::from_str(&json)?;
        Ok(Some(metadata))
    }

    /// List all tasks
    pub fn list_tasks(&self) -> anyhow::Result<Vec<TaskMetadata>> {
        let mut tasks: Vec<TaskMetadata> = Vec::new();

        for entry in fs::read_dir(&self.tasks_dir)? {
            let entry = entry?;
            let path = entry.path();

            if path.extension().and_then(|s| s.to_str()) == Some("json") {
                let json = fs::read_to_string(path)?;
                if let Ok(metadata) = serde_json::from_str(&json) {
                    tasks.push(metadata);
                }
            }
        }

        // Sort by created_at (newest first)
        tasks.sort_by(|a, b| b.created_at.cmp(&a.created_at));

        Ok(tasks)
    }

    /// Delete task
    pub fn delete_task(&self, id: &str) -> anyhow::Result<()> {
        let path = self.get_task_path(id);
        if path.exists() {
            fs::remove_file(path)?;
        }
        Ok(())
    }

    /// Get task statistics
    pub fn get_statistics(&self) -> anyhow::Result<TaskStatistics> {
        let tasks = self.list_tasks()?;
        let total_tasks = tasks.len();

        let completed_tasks = tasks.iter().filter(|t| t.status == TaskStatus::Completed).count();
        let failed_tasks = tasks.iter().filter(|t| t.status == TaskStatus::Failed).count();
        let running_tasks = tasks.iter().filter(|t| t.status == TaskStatus::Running).count();

        let success_rate = if total_tasks > 0 {
            completed_tasks as f64 / total_tasks as f64
        } else {
            0.0
        };

        // Calculate average duration for completed tasks
        let durations: Vec<Duration> = tasks
            .iter()
            .filter_map(|t| t.duration)
            .collect();

        let avg_duration = if !durations.is_empty() {
            let total_seconds: i64 = durations.iter().map(|d| d.num_seconds()).sum();
            Some(Duration::seconds(total_seconds / durations.len() as i64))
        } else {
            None
        };

        Ok(TaskStatistics {
            total_tasks,
            completed_tasks,
            failed_tasks,
            running_tasks,
            avg_duration,
            success_rate,
        })
    }

    /// Get tasks by status
    pub fn get_tasks_by_status(&self, status: TaskStatus) -> anyhow::Result<Vec<TaskMetadata>> {
        let tasks = self.list_tasks()?;
        Ok(tasks.into_iter().filter(|t| t.status == status).collect())
    }

    /// Get tasks by agent
    pub fn get_tasks_by_agent(&self, agent_name: &str) -> anyhow::Result<Vec<TaskMetadata>> {
        let tasks = self.list_tasks()?;
        Ok(tasks
            .into_iter()
            .filter(|t| t.agent.as_deref() == Some(agent_name))
            .collect())
    }
}

/// Task index - cached list of all tasks for fast lookup
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskIndex {
    pub tasks: HashMap<String, TaskMetadataIndex>,
    pub last_updated: DateTime<Utc>,
}

/// Lightweight task metadata for index
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskMetadataIndex {
    pub id: String,
    pub title: String,
    pub status: TaskStatus,
    pub created_at: DateTime<Utc>,
    pub agent: Option<String>,
}

impl TaskIndex {
    pub fn new() -> Self {
        Self {
            tasks: HashMap::new(),
            last_updated: Utc::now(),
        }
    }

    pub fn update(&mut self, tasks: Vec<TaskMetadata>) {
        self.tasks.clear();
        for task in tasks {
            let index = TaskMetadataIndex {
                id: task.id.clone(),
                title: task.title.clone(),
                status: task.status,
                created_at: task.created_at,
                agent: task.agent.clone(),
            };
            self.tasks.insert(task.id.clone(), index);
        }
        self.last_updated = Utc::now();
    }

    pub fn save(&self, path: &Path) -> anyhow::Result<()> {
        let json = serde_json::to_string_pretty(self)?;
        fs::write(path, json)?;
        Ok(())
    }

    pub fn load(path: &Path) -> anyhow::Result<Option<Self>> {
        if !path.exists() {
            return Ok(None);
        }
        let json = fs::read_to_string(path)?;
        let index = serde_json::from_str(&json)?;
        Ok(Some(index))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[test]
    fn test_task_metadata_creation() {
        let metadata = TaskMetadata::new(
            "task-001".to_string(),
            "Test task".to_string(),
            PathBuf::from("/tmp/project"),
        );

        assert_eq!(metadata.id, "task-001");
        assert_eq!(metadata.title, "Test task");
        assert_eq!(metadata.status, TaskStatus::Pending);
        assert!(metadata.started_at.is_none());
        assert!(metadata.completed_at.is_none());
    }

    #[test]
    fn test_task_lifecycle() {
        let mut metadata = TaskMetadata::new(
            "task-002".to_string(),
            "Test task".to_string(),
            PathBuf::from("/tmp/project"),
        );

        // Start task
        metadata.start(Some("TestAgent".to_string()));
        assert_eq!(metadata.status, TaskStatus::Running);
        assert!(metadata.started_at.is_some());
        assert_eq!(metadata.agent.as_deref(), Some("TestAgent"));

        // Complete task
        std::thread::sleep(std::time::Duration::from_millis(100));
        metadata.complete(true);
        assert_eq!(metadata.status, TaskStatus::Completed);
        assert!(metadata.completed_at.is_some());
        assert_eq!(metadata.success, Some(true));
        assert!(metadata.duration.is_some());
    }

    #[test]
    fn test_task_manager() -> anyhow::Result<()> {
        let temp_dir = TempDir::new()?;
        let project_root = temp_dir.path();

        let manager = TaskMetadataManager::new(project_root)?;

        // Create task
        let metadata = TaskMetadata::new(
            "task-003".to_string(),
            "Test task".to_string(),
            project_root.to_path_buf(),
        );
        manager.create_task(metadata.clone())?;

        // Load task
        let loaded = manager.load_task("task-003")?;
        assert!(loaded.is_some());
        assert_eq!(loaded.unwrap().id, "task-003");

        // List tasks
        let tasks = manager.list_tasks()?;
        assert_eq!(tasks.len(), 1);

        // Delete task
        manager.delete_task("task-003")?;
        let tasks = manager.list_tasks()?;
        assert_eq!(tasks.len(), 0);

        Ok(())
    }

    #[test]
    fn test_task_statistics() -> anyhow::Result<()> {
        let temp_dir = TempDir::new()?;
        let project_root = temp_dir.path();

        let manager = TaskMetadataManager::new(project_root)?;

        // Create completed task
        let mut task1 = TaskMetadata::new(
            "task-004".to_string(),
            "Completed task".to_string(),
            project_root.to_path_buf(),
        );
        task1.start(Some("Agent1".to_string()));
        task1.complete(true);
        manager.create_task(task1)?;

        // Create failed task
        let mut task2 = TaskMetadata::new(
            "task-005".to_string(),
            "Failed task".to_string(),
            project_root.to_path_buf(),
        );
        task2.start(Some("Agent2".to_string()));
        task2.fail("Error message".to_string());
        manager.create_task(task2)?;

        // Get statistics
        let stats = manager.get_statistics()?;
        assert_eq!(stats.total_tasks, 2);
        assert_eq!(stats.completed_tasks, 1);
        assert_eq!(stats.failed_tasks, 1);
        assert_eq!(stats.success_rate, 0.5);

        Ok(())
    }
}
