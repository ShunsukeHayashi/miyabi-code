//! Task graph structures

use crate::types::TaskId;
use serde::{Deserialize, Serialize};
use std::collections::HashSet;

/// A node in the task graph representing a single executable task
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskNode {
    /// Unique task identifier
    pub id: TaskId,
    /// Task dependencies (tasks this task depends on)
    pub dependencies: HashSet<TaskId>,
    /// Task command to execute
    pub command: String,
    /// Working directory for execution
    pub workdir: Option<String>,
    /// Environment variables
    pub env: Vec<(String, String)>,
}

impl TaskNode {
    /// Create a new TaskNode
    pub fn new(id: TaskId) -> Self {
        Self {
            id,
            dependencies: HashSet::new(),
            command: String::new(),
            workdir: None,
            env: Vec::new(),
        }
    }

    /// Add a dependency to this task
    pub fn add_dependency(&mut self, dep: TaskId) {
        self.dependencies.insert(dep);
    }

    /// Set the command to execute
    pub fn with_command(mut self, command: impl Into<String>) -> Self {
        self.command = command.into();
        self
    }

    /// Set the working directory
    pub fn with_workdir(mut self, workdir: impl Into<String>) -> Self {
        self.workdir = Some(workdir.into());
        self
    }

    /// Add an environment variable
    pub fn with_env(mut self, key: impl Into<String>, value: impl Into<String>) -> Self {
        self.env.push((key.into(), value.into()));
        self
    }

    /// Check if this task has no dependencies
    pub fn is_entry_task(&self) -> bool {
        self.dependencies.is_empty()
    }

    /// Get the number of dependencies
    pub fn dependency_count(&self) -> usize {
        self.dependencies.len()
    }
}

/// A level in the task graph containing tasks that can execute in parallel
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskLevel {
    /// Level number (0-indexed)
    pub level: usize,
    /// Tasks at this level
    pub tasks: Vec<TaskNode>,
}

impl TaskLevel {
    /// Create a new TaskLevel
    pub fn new(level: usize) -> Self {
        Self {
            level,
            tasks: Vec::new(),
        }
    }

    /// Add a task to this level
    pub fn add_task(&mut self, task: TaskNode) {
        self.tasks.push(task);
    }

    /// Get the number of tasks at this level
    pub fn task_count(&self) -> usize {
        self.tasks.len()
    }

    /// Check if this level is empty
    pub fn is_empty(&self) -> bool {
        self.tasks.is_empty()
    }

    /// Get maximum parallelism at this level
    pub fn max_parallelism(&self) -> usize {
        self.tasks.len()
    }
}

/// Complete task graph with levels for parallel execution
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskGraph {
    /// Task levels (0 = entry tasks, increasing dependencies)
    pub levels: Vec<TaskLevel>,
    /// Maximum allowed parallelism across all levels
    pub max_parallelism: usize,
    /// Metadata about the graph
    pub metadata: GraphMetadata,
}

/// Metadata about the task graph
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GraphMetadata {
    /// Total number of tasks in the graph
    pub total_tasks: usize,
    /// Total number of levels
    pub total_levels: usize,
    /// Maximum parallelism across all levels
    pub max_parallel_tasks: usize,
    /// Average tasks per level
    pub avg_tasks_per_level: f64,
    /// Graph construction timestamp
    pub created_at: Option<String>,
}

impl TaskGraph {
    /// Create a new TaskGraph
    pub fn new(max_parallelism: usize) -> Self {
        Self {
            levels: Vec::new(),
            max_parallelism,
            metadata: GraphMetadata {
                total_tasks: 0,
                total_levels: 0,
                max_parallel_tasks: 0,
                avg_tasks_per_level: 0.0,
                created_at: None,
            },
        }
    }

    /// Create TaskGraph from task levels
    pub fn from_levels(levels: Vec<TaskLevel>, max_parallelism: usize) -> Self {
        let total_tasks = levels.iter().map(|l| l.task_count()).sum();
        let total_levels = levels.len();
        let max_parallel_tasks = levels
            .iter()
            .map(|l| l.max_parallelism())
            .max()
            .unwrap_or(0);
        let avg_tasks_per_level = if total_levels > 0 {
            total_tasks as f64 / total_levels as f64
        } else {
            0.0
        };

        Self {
            levels,
            max_parallelism,
            metadata: GraphMetadata {
                total_tasks,
                total_levels,
                max_parallel_tasks,
                avg_tasks_per_level,
                created_at: Some(chrono::Utc::now().to_rfc3339()),
            },
        }
    }

    /// Get the levels of the graph
    pub fn levels(&self) -> &[TaskLevel] {
        &self.levels
    }

    /// Get the number of levels
    pub fn level_count(&self) -> usize {
        self.levels.len()
    }

    /// Get the total number of tasks
    pub fn task_count(&self) -> usize {
        self.metadata.total_tasks
    }

    /// Get maximum parallel tasks across all levels
    pub fn max_parallel_tasks(&self) -> usize {
        self.metadata.max_parallel_tasks
    }

    /// Get average tasks per level
    pub fn avg_tasks_per_level(&self) -> f64 {
        self.metadata.avg_tasks_per_level
    }

    /// Get entry tasks (level 0)
    pub fn entry_tasks(&self) -> Vec<&TaskNode> {
        self.levels
            .first()
            .map(|level| level.tasks.iter().collect())
            .unwrap_or_default()
    }

    /// Find a task by ID
    pub fn find_task(&self, task_id: &TaskId) -> Option<&TaskNode> {
        for level in &self.levels {
            for task in &level.tasks {
                if &task.id == task_id {
                    return Some(task);
                }
            }
        }
        None
    }

    /// Check if the graph is empty
    pub fn is_empty(&self) -> bool {
        self.levels.is_empty() || self.metadata.total_tasks == 0
    }

    /// Validate graph properties
    pub fn validate(&self) -> Result<(), String> {
        // Check if empty
        if self.is_empty() {
            return Err("Graph is empty".to_string());
        }

        // Check if max_parallelism is exceeded
        for level in &self.levels {
            if level.task_count() > self.max_parallelism {
                return Err(format!(
                    "Level {} exceeds max parallelism: {} > {}",
                    level.level,
                    level.task_count(),
                    self.max_parallelism
                ));
            }
        }

        // Check level numbering
        for (i, level) in self.levels.iter().enumerate() {
            if level.level != i {
                return Err(format!(
                    "Level numbering inconsistency: expected {}, got {}",
                    i, level.level
                ));
            }
        }

        Ok(())
    }

    /// Get execution summary as a string
    pub fn execution_summary(&self) -> String {
        let mut summary = String::new();
        summary.push_str("Task Graph Execution Summary\n");
        summary.push_str("==========================\n");
        summary.push_str(&format!("Total Tasks: {}\n", self.task_count()));
        summary.push_str(&format!("Total Levels: {}\n", self.level_count()));
        summary.push_str(&format!(
            "Max Parallel Tasks: {}\n",
            self.max_parallel_tasks()
        ));
        summary.push_str(&format!(
            "Avg Tasks/Level: {:.2}\n",
            self.avg_tasks_per_level()
        ));
        summary.push_str(&format!("Max Parallelism: {}\n", self.max_parallelism));
        summary.push_str("\nLevel Breakdown:\n");

        for level in &self.levels {
            summary.push_str(&format!(
                "  Level {}: {} tasks\n",
                level.level,
                level.task_count()
            ));
        }

        summary
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_task_node_creation() {
        let node = TaskNode::new(TaskId::new("test-task"))
            .with_command("cargo build")
            .with_workdir("/path/to/workdir")
            .with_env("RUST_LOG", "debug");

        assert_eq!(node.id.as_str(), "test-task");
        assert_eq!(node.command, "cargo build");
        assert_eq!(node.workdir, Some("/path/to/workdir".to_string()));
        assert_eq!(node.env.len(), 1);
    }

    #[test]
    fn test_task_level_creation() {
        let mut level = TaskLevel::new(0);
        level.add_task(TaskNode::new(TaskId::new("task1")));
        level.add_task(TaskNode::new(TaskId::new("task2")));

        assert_eq!(level.level, 0);
        assert_eq!(level.task_count(), 2);
        assert!(!level.is_empty());
    }

    #[test]
    fn test_task_graph_creation() {
        let mut level0 = TaskLevel::new(0);
        level0.add_task(TaskNode::new(TaskId::new("task1")));
        level0.add_task(TaskNode::new(TaskId::new("task2")));

        let mut level1 = TaskLevel::new(1);
        level1.add_task(TaskNode::new(TaskId::new("task3")));

        let graph = TaskGraph::from_levels(vec![level0, level1], 4);

        assert_eq!(graph.level_count(), 2);
        assert_eq!(graph.task_count(), 3);
        assert_eq!(graph.max_parallel_tasks(), 2);
    }

    #[test]
    fn test_empty_graph() {
        let graph = TaskGraph::new(4);
        assert!(graph.is_empty());
    }

    #[test]
    fn test_find_task() {
        let mut level0 = TaskLevel::new(0);
        let task_id = TaskId::new("task1");
        level0.add_task(TaskNode::new(task_id.clone()));

        let graph = TaskGraph::from_levels(vec![level0], 4);

        let found = graph.find_task(&task_id);
        assert!(found.is_some());
        assert_eq!(found.unwrap().id, task_id);
    }

    #[test]
    fn test_validate_graph() {
        let mut level0 = TaskLevel::new(0);
        level0.add_task(TaskNode::new(TaskId::new("task1")));

        let graph = TaskGraph::from_levels(vec![level0], 4);
        assert!(graph.validate().is_ok());
    }

    #[test]
    fn test_validate_empty_graph() {
        let graph = TaskGraph::new(4);
        assert!(graph.validate().is_err());
    }
}
