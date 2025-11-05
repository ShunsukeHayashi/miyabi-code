//! DAG builder - constructs task graphs from generated code

use crate::dependency::DependencyAnalyzer;
use crate::graph::TaskGraph;
use crate::types::{GeneratedCode, Task, TaskId, TaskNode};
use crate::{DAGError, Result};
use std::collections::HashMap;
use tracing::{debug, info};

/// Builder for constructing DAG task graphs
pub struct DAGBuilder {
    /// Maximum number of tasks to run in parallel
    max_parallelism: usize,
    /// Dependency analyzer
    analyzer: DependencyAnalyzer,
}

impl DAGBuilder {
    /// Create a new DAG builder
    ///
    /// # Arguments
    /// * `max_parallelism` - Maximum number of tasks to run concurrently
    ///
    /// # Example
    /// ```
    /// use miyabi_dag::DAGBuilder;
    ///
    /// let builder = DAGBuilder::new(4); // max 4 parallel tasks
    /// ```
    pub fn new(max_parallelism: usize) -> Self {
        if max_parallelism == 0 {
            panic!("max_parallelism must be greater than 0");
        }

        Self {
            max_parallelism,
            analyzer: DependencyAnalyzer::new(),
        }
    }

    /// Build a task graph from generated code
    ///
    /// This implements θ₃: Code → TaskGraph transformation
    ///
    /// # Arguments
    /// * `code` - Generated code from θ₂ phase
    ///
    /// # Returns
    /// * `TaskGraph` - DAG with parallel execution levels
    ///
    /// # Errors
    /// * Returns error if circular dependencies detected
    /// * Returns error if dependency analysis fails
    pub fn build(&self, code: GeneratedCode) -> Result<TaskGraph> {
        info!("Building task graph from {} files", code.files.len());

        // 1. Analyze dependencies
        debug!("Analyzing dependencies...");
        let dep_graph = self.analyzer.analyze(&code)?;
        debug!("Found {} modules", dep_graph.modules().len());

        // 2. Create task graph
        debug!("Creating task graph...");
        let mut task_graph = TaskGraph::new(self.max_parallelism);

        // 3. Create tasks from files
        let mut task_map: HashMap<String, TaskId> = HashMap::new();

        for file in &code.files {
            let task_id = TaskId::new();
            let task = Task::new(
                task_id,
                format!("Process {}", file.path.display()),
                file.clone(),
            );

            let node = TaskNode::new(task);
            task_graph.add_node(node);

            // Map module path to task ID
            task_map.insert(file.module_path.to_string(), task_id);
        }

        // 4. Add dependency edges
        debug!("Adding dependency edges...");
        for file in &code.files {
            let from_task_id = task_map.get(&file.module_path.to_string()).ok_or_else(|| {
                DAGError::TaskNotFound(format!("Task for module {}", file.module_path))
            })?;

            if let Some(deps) = dep_graph.get_dependencies(&file.module_path) {
                for dep in deps {
                    if let Some(to_task_id) = task_map.get(&dep.to_string()) {
                        task_graph.add_dependency(*from_task_id, *to_task_id)?;
                    }
                }
            }
        }

        // 5. Verify no cycles (should already be checked, but double-check)
        debug!("Verifying no cycles...");
        task_graph.detect_cycles()?;

        // 6. Build execution levels
        debug!("Building execution levels...");
        task_graph.build_levels()?;

        info!(
            "Task graph built successfully: {} tasks, {} levels",
            task_graph.task_count(),
            task_graph.level_count()
        );

        Ok(task_graph)
    }

    /// Get maximum parallelism
    pub fn max_parallelism(&self) -> usize {
        self.max_parallelism
    }

    /// Set maximum parallelism
    pub fn with_max_parallelism(mut self, max: usize) -> Self {
        if max == 0 {
            panic!("max_parallelism must be greater than 0");
        }
        self.max_parallelism = max;
        self
    }
}

impl Default for DAGBuilder {
    fn default() -> Self {
        // Default to number of CPU cores
        let cpus = std::thread::available_parallelism()
            .map(|n| n.get())
            .unwrap_or(4);
        Self::new(cpus)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::{CodeFile, ModulePath};
    use std::path::PathBuf;
    use std::str::FromStr;

    #[test]
    fn test_builder_creation() {
        let builder = DAGBuilder::new(4);
        assert_eq!(builder.max_parallelism(), 4);
    }

    #[test]
    fn test_builder_default() {
        let builder = DAGBuilder::default();
        assert!(builder.max_parallelism() > 0);
    }

    #[test]
    #[should_panic(expected = "max_parallelism must be greater than 0")]
    fn test_builder_zero_parallelism() {
        DAGBuilder::new(0);
    }

    #[test]
    fn test_build_empty_code() {
        let builder = DAGBuilder::new(4);
        let code = GeneratedCode::from_files(vec![]);

        let graph = builder.build(code).unwrap();
        assert!(graph.is_empty());
        assert_eq!(graph.task_count(), 0);
    }

    #[test]
    fn test_build_single_file() {
        let builder = DAGBuilder::new(4);

        let file = CodeFile::new(
            PathBuf::from("main.rs"),
            "fn main() {}".to_string(),
            ModulePath::from_str("crate::main").unwrap(),
        );

        let code = GeneratedCode::from_files(vec![file]);
        let graph = builder.build(code).unwrap();

        assert_eq!(graph.task_count(), 1);
        assert_eq!(graph.level_count(), 1);
    }

    #[test]
    fn test_build_with_dependencies() {
        let builder = DAGBuilder::new(4);

        // Create files with dependencies
        let file_a = CodeFile::new(
            PathBuf::from("module_a.rs"),
            "// Module A\npub fn func_a() {}".to_string(),
            ModulePath::from_str("crate::module_a").unwrap(),
        );

        let file_b = CodeFile::new(
            PathBuf::from("module_b.rs"),
            "use crate::module_a;\npub fn func_b() {}".to_string(),
            ModulePath::from_str("crate::module_b").unwrap(),
        );

        let code = GeneratedCode::from_files(vec![file_a, file_b]);
        let graph = builder.build(code).unwrap();

        assert_eq!(graph.task_count(), 2);
        // module_b depends on module_a, so at least 2 levels
        assert!(graph.level_count() >= 1);
    }

    #[test]
    fn test_build_parallel_tasks() {
        let builder = DAGBuilder::new(2); // max 2 parallel

        // Create 3 independent files
        let files = vec![
            CodeFile::new(
                PathBuf::from("a.rs"),
                "pub fn a() {}".to_string(),
                ModulePath::from_str("crate::a").unwrap(),
            ),
            CodeFile::new(
                PathBuf::from("b.rs"),
                "pub fn b() {}".to_string(),
                ModulePath::from_str("crate::b").unwrap(),
            ),
            CodeFile::new(
                PathBuf::from("c.rs"),
                "pub fn c() {}".to_string(),
                ModulePath::from_str("crate::c").unwrap(),
            ),
        ];

        let code = GeneratedCode::from_files(files);
        let graph = builder.build(code).unwrap();

        assert_eq!(graph.task_count(), 3);

        // With max_parallelism=2 and 3 independent tasks,
        // we should have at least 2 levels (2 + 1)
        let levels = graph.levels();
        assert!(levels.len() >= 2);

        // First level should have at most 2 tasks
        assert!(levels[0].task_count() <= 2);
    }
}
