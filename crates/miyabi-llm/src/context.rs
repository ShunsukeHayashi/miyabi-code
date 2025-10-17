//! LLM Execution Context Management
//!
//! Manages the context for LLM execution including task details,
//! file contents, git diffs, test results, and custom metrics.
//!
//! # Example
//!
//! ```rust
//! use miyabi_llm::context::LLMContext;
//! use miyabi_types::{Task, task::TaskType};
//! use std::path::PathBuf;
//!
//! # async fn example() -> anyhow::Result<()> {
//! let task = Task {
//!     id: "example-task".to_string(),
//!     title: "Example Task".to_string(),
//!     description: "An example task for demonstration".to_string(),
//!     task_type: TaskType::Feature,
//!     priority: 1,
//!     severity: None,
//!     impact: None,
//!     assigned_agent: None,
//!     dependencies: vec![],
//!     estimated_duration: Some(60),
//!     status: None,
//!     start_time: None,
//!     end_time: None,
//!     metadata: None,
//! };
//! let mut context = LLMContext::from_task(&task);
//!
//! // Load related files
//! context.load_files(&[
//!     PathBuf::from("src/main.rs"),
//!     PathBuf::from("Cargo.toml"),
//! ]).await?;
//!
//! // Load git diff
//! context.load_git_diff().await?;
//!
//! // Convert to prompt variables
//! let vars = context.to_prompt_variables();
//! # Ok(())
//! # }
//! ```

use crate::error::{LLMError, Result};
use miyabi_types::Task;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use tokio::process::Command;

/// Test execution results
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TestResults {
    /// Total number of tests
    pub total: usize,
    /// Number of passing tests
    pub passed: usize,
    /// Number of failing tests
    pub failed: usize,
    /// Number of ignored tests
    pub ignored: usize,
    /// Test output
    pub output: String,
}

impl TestResults {
    /// Create new test results
    pub fn new(total: usize, passed: usize, failed: usize, ignored: usize, output: String) -> Self {
        Self {
            total,
            passed,
            failed,
            ignored,
            output,
        }
    }

    /// Check if all tests passed
    pub fn all_passed(&self) -> bool {
        self.failed == 0 && self.total > 0
    }

    /// Get success rate (0.0 - 1.0)
    pub fn success_rate(&self) -> f64 {
        if self.total == 0 {
            return 0.0;
        }
        self.passed as f64 / self.total as f64
    }
}

/// LLM Execution Context
///
/// Contains all contextual information needed for LLM execution:
/// - Task details
/// - Related file contents
/// - Git diff
/// - Test results
/// - Custom metrics
#[derive(Debug, Clone)]
pub struct LLMContext {
    /// The task being executed
    pub task: Task,

    /// File contents (path → content)
    pub file_contents: HashMap<PathBuf, String>,

    /// Current git diff (if available)
    pub git_diff: Option<String>,

    /// Test results (if available)
    pub test_results: Option<TestResults>,

    /// Custom metrics (key → JSON value)
    pub metrics: HashMap<String, serde_json::Value>,
}

impl LLMContext {
    /// Create context from a task
    pub fn from_task(task: &Task) -> Self {
        Self {
            task: task.clone(),
            file_contents: HashMap::new(),
            git_diff: None,
            test_results: None,
            metrics: HashMap::new(),
        }
    }

    /// Load file contents into context
    ///
    /// # Arguments
    /// * `paths` - List of file paths to load
    ///
    /// # Errors
    /// Returns error if file cannot be read
    pub async fn load_files(&mut self, paths: &[PathBuf]) -> Result<()> {
        for path in paths {
            let content = tokio::fs::read_to_string(path)
                .await
                .map_err(|e| LLMError::Unknown(format!("Failed to read file {:?}: {}", path, e)))?;

            self.file_contents.insert(path.clone(), content);
        }

        Ok(())
    }

    /// Load git diff from current working directory
    ///
    /// # Errors
    /// Returns error if git command fails
    pub async fn load_git_diff(&mut self) -> Result<()> {
        let output = Command::new("git")
            .args(["diff", "--staged"])
            .output()
            .await
            .map_err(|e| LLMError::Unknown(format!("Failed to run git diff: {}", e)))?;

        if !output.status.success() {
            return Err(LLMError::Unknown(format!(
                "Git diff failed: {}",
                String::from_utf8_lossy(&output.stderr)
            )));
        }

        self.git_diff = Some(String::from_utf8_lossy(&output.stdout).to_string());

        Ok(())
    }

    /// Load git diff from specific directory
    ///
    /// # Arguments
    /// * `dir` - Directory to run git diff in
    ///
    /// # Errors
    /// Returns error if git command fails
    pub async fn load_git_diff_from(&mut self, dir: &Path) -> Result<()> {
        let output = Command::new("git")
            .args(["diff", "--staged"])
            .current_dir(dir)
            .output()
            .await
            .map_err(|e| {
                LLMError::Unknown(format!("Failed to run git diff in {:?}: {}", dir, e))
            })?;

        if !output.status.success() {
            return Err(LLMError::Unknown(format!(
                "Git diff failed in {:?}: {}",
                dir,
                String::from_utf8_lossy(&output.stderr)
            )));
        }

        self.git_diff = Some(String::from_utf8_lossy(&output.stdout).to_string());

        Ok(())
    }

    /// Add custom metric
    pub fn add_metric(&mut self, key: impl Into<String>, value: serde_json::Value) {
        self.metrics.insert(key.into(), value);
    }

    /// Get metric value
    pub fn get_metric(&self, key: &str) -> Option<&serde_json::Value> {
        self.metrics.get(key)
    }

    /// Convert context to prompt variables for template rendering
    ///
    /// # Returns
    /// HashMap of variable names to string values suitable for LLMPromptTemplate
    pub fn to_prompt_variables(&self) -> HashMap<String, String> {
        let mut vars = HashMap::new();

        // Task information
        vars.insert("task_id".to_string(), self.task.id.clone());
        vars.insert("task_title".to_string(), self.task.title.clone());
        vars.insert(
            "task_description".to_string(),
            self.task.description.clone(),
        );
        vars.insert(
            "task_type".to_string(),
            format!("{:?}", self.task.task_type),
        );
        vars.insert("task_priority".to_string(), self.task.priority.to_string());

        // Optional task fields
        if let Some(ref severity) = self.task.severity {
            vars.insert("task_severity".to_string(), format!("{:?}", severity));
        }

        if let Some(ref impact) = self.task.impact {
            vars.insert("task_impact".to_string(), format!("{:?}", impact));
        }

        if let Some(duration) = self.task.estimated_duration {
            vars.insert("task_duration".to_string(), duration.to_string());
        }

        // Dependencies
        if !self.task.dependencies.is_empty() {
            vars.insert(
                "task_dependencies".to_string(),
                self.task.dependencies.join(", "),
            );
        }

        // File contents
        if !self.file_contents.is_empty() {
            let files_summary = self
                .file_contents
                .iter()
                .map(|(path, content)| {
                    format!(
                        "File: {}\nLines: {}\n---\n{}\n",
                        path.display(),
                        content.lines().count(),
                        content
                    )
                })
                .collect::<Vec<_>>()
                .join("\n\n");

            vars.insert("file_contents".to_string(), files_summary);
            vars.insert(
                "file_count".to_string(),
                self.file_contents.len().to_string(),
            );
        }

        // Git diff
        if let Some(ref diff) = self.git_diff {
            vars.insert("git_diff".to_string(), diff.clone());
            vars.insert("has_diff".to_string(), "true".to_string());
        } else {
            vars.insert("has_diff".to_string(), "false".to_string());
        }

        // Test results
        if let Some(ref results) = self.test_results {
            vars.insert("test_total".to_string(), results.total.to_string());
            vars.insert("test_passed".to_string(), results.passed.to_string());
            vars.insert("test_failed".to_string(), results.failed.to_string());
            vars.insert("test_ignored".to_string(), results.ignored.to_string());
            vars.insert(
                "test_success_rate".to_string(),
                format!("{:.2}%", results.success_rate() * 100.0),
            );
            vars.insert("test_output".to_string(), results.output.clone());
        }

        // Custom metrics (serialize to JSON strings)
        for (key, value) in &self.metrics {
            vars.insert(
                format!("metric_{}", key),
                serde_json::to_string(value).unwrap_or_default(),
            );
        }

        vars
    }

    /// Get file content by path
    pub fn get_file_content(&self, path: &Path) -> Option<&String> {
        self.file_contents.get(path)
    }

    /// Get all loaded file paths
    pub fn loaded_files(&self) -> Vec<&PathBuf> {
        self.file_contents.keys().collect()
    }

    /// Get total lines of code in loaded files
    pub fn total_lines(&self) -> usize {
        self.file_contents
            .values()
            .map(|content| content.lines().count())
            .sum()
    }

    /// Check if context has git diff
    pub fn has_diff(&self) -> bool {
        self.git_diff.is_some()
    }

    /// Check if context has test results
    pub fn has_test_results(&self) -> bool {
        self.test_results.is_some()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use miyabi_types::agent::AgentType;
    use miyabi_types::task::TaskType;

    fn create_test_task() -> Task {
        Task {
            id: "task-1".to_string(),
            title: "Test Task".to_string(),
            description: "Test description".to_string(),
            task_type: TaskType::Feature,
            priority: 1,
            severity: None,
            impact: None,
            assigned_agent: Some(AgentType::CodeGenAgent),
            dependencies: vec!["task-0".to_string()],
            estimated_duration: Some(30),
            status: None,
            start_time: None,
            end_time: None,
            metadata: None,
        }
    }

    #[test]
    fn test_context_from_task() {
        let task = create_test_task();
        let context = LLMContext::from_task(&task);

        assert_eq!(context.task.id, "task-1");
        assert_eq!(context.task.title, "Test Task");
        assert!(context.file_contents.is_empty());
        assert!(context.git_diff.is_none());
        assert!(context.test_results.is_none());
        assert!(context.metrics.is_empty());
    }

    #[tokio::test]
    async fn test_load_files() {
        let task = create_test_task();
        let mut context = LLMContext::from_task(&task);

        // Create temporary file
        let temp_dir = std::env::temp_dir();
        let test_file = temp_dir.join("test_context.txt");
        tokio::fs::write(&test_file, "test content").await.unwrap();

        // Load file
        context.load_files(std::slice::from_ref(&test_file)).await.unwrap();

        assert_eq!(context.file_contents.len(), 1);
        assert_eq!(
            context.get_file_content(&test_file),
            Some(&"test content".to_string())
        );

        // Cleanup
        tokio::fs::remove_file(&test_file).await.ok();
    }

    #[tokio::test]
    async fn test_load_multiple_files() {
        let task = create_test_task();
        let mut context = LLMContext::from_task(&task);

        let temp_dir = std::env::temp_dir();
        let file1 = temp_dir.join("test1.txt");
        let file2 = temp_dir.join("test2.txt");

        tokio::fs::write(&file1, "content 1").await.unwrap();
        tokio::fs::write(&file2, "content 2").await.unwrap();

        context
            .load_files(&[file1.clone(), file2.clone()])
            .await
            .unwrap();

        assert_eq!(context.file_contents.len(), 2);
        assert_eq!(
            context.get_file_content(&file1),
            Some(&"content 1".to_string())
        );
        assert_eq!(
            context.get_file_content(&file2),
            Some(&"content 2".to_string())
        );

        // Cleanup
        tokio::fs::remove_file(&file1).await.ok();
        tokio::fs::remove_file(&file2).await.ok();
    }

    #[test]
    fn test_add_metric() {
        let task = create_test_task();
        let mut context = LLMContext::from_task(&task);

        context.add_metric("complexity", serde_json::json!(42));
        context.add_metric("author", serde_json::json!("Alice"));

        assert_eq!(
            context.get_metric("complexity"),
            Some(&serde_json::json!(42))
        );
        assert_eq!(
            context.get_metric("author"),
            Some(&serde_json::json!("Alice"))
        );
    }

    #[test]
    fn test_to_prompt_variables_basic() {
        let task = create_test_task();
        let context = LLMContext::from_task(&task);

        let vars = context.to_prompt_variables();

        assert_eq!(vars.get("task_id"), Some(&"task-1".to_string()));
        assert_eq!(vars.get("task_title"), Some(&"Test Task".to_string()));
        assert_eq!(
            vars.get("task_description"),
            Some(&"Test description".to_string())
        );
        assert_eq!(vars.get("task_type"), Some(&"Feature".to_string()));
        assert_eq!(vars.get("task_priority"), Some(&"1".to_string()));
        assert_eq!(vars.get("task_duration"), Some(&"30".to_string()));
        assert_eq!(vars.get("task_dependencies"), Some(&"task-0".to_string()));
        assert_eq!(vars.get("has_diff"), Some(&"false".to_string()));
    }

    #[test]
    fn test_to_prompt_variables_with_files() {
        let task = create_test_task();
        let mut context = LLMContext::from_task(&task);

        context
            .file_contents
            .insert(PathBuf::from("test.rs"), "fn main() {}".to_string());

        let vars = context.to_prompt_variables();

        assert!(vars.contains_key("file_contents"));
        assert_eq!(vars.get("file_count"), Some(&"1".to_string()));

        let file_contents = vars.get("file_contents").unwrap();
        assert!(file_contents.contains("test.rs"));
        assert!(file_contents.contains("fn main() {}"));
    }

    #[test]
    fn test_to_prompt_variables_with_diff() {
        let task = create_test_task();
        let mut context = LLMContext::from_task(&task);

        context.git_diff = Some("+added line\n-removed line".to_string());

        let vars = context.to_prompt_variables();

        assert_eq!(
            vars.get("git_diff"),
            Some(&"+added line\n-removed line".to_string())
        );
        assert_eq!(vars.get("has_diff"), Some(&"true".to_string()));
    }

    #[test]
    fn test_to_prompt_variables_with_test_results() {
        let task = create_test_task();
        let mut context = LLMContext::from_task(&task);

        context.test_results = Some(TestResults::new(10, 8, 2, 0, "test output".to_string()));

        let vars = context.to_prompt_variables();

        assert_eq!(vars.get("test_total"), Some(&"10".to_string()));
        assert_eq!(vars.get("test_passed"), Some(&"8".to_string()));
        assert_eq!(vars.get("test_failed"), Some(&"2".to_string()));
        assert_eq!(vars.get("test_ignored"), Some(&"0".to_string()));
        assert_eq!(vars.get("test_success_rate"), Some(&"80.00%".to_string()));
        assert_eq!(vars.get("test_output"), Some(&"test output".to_string()));
    }

    #[test]
    fn test_to_prompt_variables_with_metrics() {
        let task = create_test_task();
        let mut context = LLMContext::from_task(&task);

        context.add_metric("complexity", serde_json::json!(42));
        context.add_metric("lines", serde_json::json!(1000));

        let vars = context.to_prompt_variables();

        assert_eq!(vars.get("metric_complexity"), Some(&"42".to_string()));
        assert_eq!(vars.get("metric_lines"), Some(&"1000".to_string()));
    }

    #[test]
    fn test_test_results_all_passed() {
        let results = TestResults::new(10, 10, 0, 0, "".to_string());
        assert!(results.all_passed());

        let results_with_failures = TestResults::new(10, 8, 2, 0, "".to_string());
        assert!(!results_with_failures.all_passed());

        let results_no_tests = TestResults::new(0, 0, 0, 0, "".to_string());
        assert!(!results_no_tests.all_passed());
    }

    #[test]
    fn test_test_results_success_rate() {
        let results = TestResults::new(10, 8, 2, 0, "".to_string());
        assert_eq!(results.success_rate(), 0.8);

        let results_all_pass = TestResults::new(10, 10, 0, 0, "".to_string());
        assert_eq!(results_all_pass.success_rate(), 1.0);

        let results_no_tests = TestResults::new(0, 0, 0, 0, "".to_string());
        assert_eq!(results_no_tests.success_rate(), 0.0);
    }

    #[test]
    fn test_loaded_files() {
        let task = create_test_task();
        let mut context = LLMContext::from_task(&task);

        context
            .file_contents
            .insert(PathBuf::from("test1.rs"), "content1".to_string());
        context
            .file_contents
            .insert(PathBuf::from("test2.rs"), "content2".to_string());

        let files = context.loaded_files();
        assert_eq!(files.len(), 2);
    }

    #[test]
    fn test_total_lines() {
        let task = create_test_task();
        let mut context = LLMContext::from_task(&task);

        context
            .file_contents
            .insert(PathBuf::from("test1.rs"), "line1\nline2\nline3".to_string());
        context
            .file_contents
            .insert(PathBuf::from("test2.rs"), "line1\nline2".to_string());

        assert_eq!(context.total_lines(), 5);
    }

    #[test]
    fn test_has_diff() {
        let task = create_test_task();
        let mut context = LLMContext::from_task(&task);

        assert!(!context.has_diff());

        context.git_diff = Some("diff".to_string());
        assert!(context.has_diff());
    }

    #[test]
    fn test_has_test_results() {
        let task = create_test_task();
        let mut context = LLMContext::from_task(&task);

        assert!(!context.has_test_results());

        context.test_results = Some(TestResults::new(10, 10, 0, 0, "".to_string()));
        assert!(context.has_test_results());
    }
}
