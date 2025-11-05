//! Core types for DAG task graph

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use std::str::FromStr;
use uuid::Uuid;

/// Unique identifier for a task
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct TaskId(Uuid);

impl TaskId {
    /// Create a new task ID
    pub fn new() -> Self {
        Self(Uuid::new_v4())
    }

    /// Create from UUID
    pub fn from_uuid(uuid: Uuid) -> Self {
        Self(uuid)
    }

    /// Get the underlying UUID
    pub fn as_uuid(&self) -> &Uuid {
        &self.0
    }
}

impl Default for TaskId {
    fn default() -> Self {
        Self::new()
    }
}

impl std::fmt::Display for TaskId {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}

/// A code file with content and metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CodeFile {
    /// File path
    pub path: PathBuf,
    /// File content
    pub content: String,
    /// Module path (e.g., "crate::module::submodule")
    pub module_path: ModulePath,
}

impl CodeFile {
    /// Create a new code file
    pub fn new(path: PathBuf, content: String, module_path: ModulePath) -> Self {
        Self {
            path,
            content,
            module_path,
        }
    }
}

/// Module path in Rust-style notation
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct ModulePath(Vec<String>);

impl ModulePath {
    /// Create a new module path
    pub fn new(segments: Vec<String>) -> Self {
        Self(segments)
    }

    /// Get segments
    pub fn segments(&self) -> &[String] {
        &self.0
    }

    /// Check if this path starts with another path
    pub fn starts_with(&self, other: &ModulePath) -> bool {
        if other.0.len() > self.0.len() {
            return false;
        }
        self.0[..other.0.len()] == other.0[..]
    }

    /// Get parent module path
    pub fn parent(&self) -> Option<ModulePath> {
        if self.0.len() <= 1 {
            None
        } else {
            Some(ModulePath(self.0[..self.0.len() - 1].to_vec()))
        }
    }
}

impl std::fmt::Display for ModulePath {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0.join("::"))
    }
}

impl FromStr for ModulePath {
    type Err = std::convert::Infallible;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        Ok(Self(s.split("::").map(|seg| seg.to_string()).collect()))
    }
}

/// Generated code from θ₂ (Generation Phase)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GeneratedCode {
    /// All generated files
    pub files: Vec<CodeFile>,
    /// Metadata
    pub metadata: HashMap<String, String>,
}

impl GeneratedCode {
    /// Create from files
    pub fn from_files(files: Vec<CodeFile>) -> Self {
        Self {
            files,
            metadata: HashMap::new(),
        }
    }

    /// Add metadata
    pub fn with_metadata(mut self, key: String, value: String) -> Self {
        self.metadata.insert(key, value);
        self
    }

    /// Get file by path
    pub fn get_file(&self, path: &PathBuf) -> Option<&CodeFile> {
        self.files.iter().find(|f| &f.path == path)
    }
}

/// A task to be executed
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Task {
    /// Task ID
    pub id: TaskId,
    /// Task name/description
    pub name: String,
    /// File to process
    pub file: CodeFile,
    /// Worktree path (assigned during allocation)
    pub worktree: Option<PathBuf>,
    /// Estimated execution time in seconds
    pub estimated_time: Option<u64>,
}

impl Task {
    /// Create a new task
    pub fn new(id: TaskId, name: String, file: CodeFile) -> Self {
        Self {
            id,
            name,
            file,
            worktree: None,
            estimated_time: None,
        }
    }

    /// Assign worktree
    pub fn with_worktree(mut self, worktree: PathBuf) -> Self {
        self.worktree = Some(worktree);
        self
    }

    /// Set estimated time
    pub fn with_estimated_time(mut self, seconds: u64) -> Self {
        self.estimated_time = Some(seconds);
        self
    }
}

/// A node in the task graph
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskNode {
    /// Task ID
    pub id: TaskId,
    /// Task details
    pub task: Task,
    /// Dependencies (tasks that must complete before this one)
    pub dependencies: Vec<TaskId>,
    /// Dependents (tasks that depend on this one)
    pub dependents: Vec<TaskId>,
}

impl TaskNode {
    /// Create a new task node
    pub fn new(task: Task) -> Self {
        Self {
            id: task.id,
            task,
            dependencies: Vec::new(),
            dependents: Vec::new(),
        }
    }

    /// Add a dependency
    pub fn add_dependency(&mut self, dep_id: TaskId) {
        if !self.dependencies.contains(&dep_id) {
            self.dependencies.push(dep_id);
        }
    }

    /// Add a dependent
    pub fn add_dependent(&mut self, dependent_id: TaskId) {
        if !self.dependents.contains(&dependent_id) {
            self.dependents.push(dependent_id);
        }
    }

    /// Check if task has no dependencies
    pub fn is_root(&self) -> bool {
        self.dependencies.is_empty()
    }

    /// Get number of dependencies
    pub fn indegree(&self) -> usize {
        self.dependencies.len()
    }

    /// Get number of dependents
    pub fn outdegree(&self) -> usize {
        self.dependents.len()
    }
}
