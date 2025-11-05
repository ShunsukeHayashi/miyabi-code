//! DAG builder - main entry point for θ₃ Allocation Phase

use crate::dependency::{DependencyAnalyzer, DependencyGraph};
use crate::error::{DAGError, Result};
use crate::graph::{TaskGraph, TaskLevel, TaskNode};
use crate::topological::TopologicalSorter;
use crate::types::{GeneratedCode, TaskId};
use tracing::{debug, info, warn};

/// DAG Builder - transforms GeneratedCode into TaskGraph
///
/// Implements the θ₃ (Allocation Phase) of the Omega System:
/// - Analyzes dependencies between code files
/// - Performs topological sort to determine execution order
/// - Groups independent tasks for parallel execution
/// - Constructs TaskGraph with resource allocation
pub struct DAGBuilder {
    /// Maximum parallelism allowed
    max_parallelism: usize,
    /// Command template for task execution
    command_template: String,
}

impl DAGBuilder {
    /// Create a new DAGBuilder with specified max parallelism
    pub fn new(max_parallelism: usize) -> Self {
        Self {
            max_parallelism,
            command_template: "cargo check --package {package}".to_string(),
        }
    }

    /// Set custom command template
    ///
    /// Template can use placeholders:
    /// - `{package}`: Package name
    /// - `{file}`: File path
    /// - `{module}`: Module path
    pub fn with_command_template(mut self, template: impl Into<String>) -> Self {
        self.command_template = template.into();
        self
    }

    /// Build TaskGraph from GeneratedCode
    ///
    /// # Algorithm
    /// 1. Analyze dependencies → DependencyGraph
    /// 2. Topological sort → ordered TaskIds
    /// 3. Group into levels → parallel execution groups
    /// 4. Create TaskNodes with commands
    /// 5. Construct TaskGraph
    pub fn build(&self, code: &GeneratedCode) -> Result<TaskGraph> {
        info!(
            "Building task graph from {} code files",
            code.files.len()
        );

        // Step 1: Analyze dependencies
        debug!("Step 1: Analyzing dependencies");
        let dep_graph = DependencyAnalyzer::analyze(code)?;
        info!(
            "Dependency analysis complete: {} tasks, {} entry points",
            dep_graph.all_tasks().len(),
            dep_graph.get_entry_tasks().len()
        );

        // Step 2: Check for empty graph
        if dep_graph.all_tasks().is_empty() {
            warn!("No tasks found in generated code");
            return Err(DAGError::empty_graph());
        }

        // Step 3: Topological sort and group into levels
        debug!("Step 2: Performing topological sort and grouping into levels");
        let task_id_levels = TopologicalSorter::group_into_levels_optimized(&dep_graph)?;
        info!("Created {} levels for parallel execution", task_id_levels.len());

        // Step 4: Create TaskNodes for each level
        debug!("Step 3: Creating task nodes with commands");
        let task_levels = self.create_task_levels(&task_id_levels, &dep_graph, code)?;

        // Step 5: Construct TaskGraph
        debug!("Step 4: Constructing task graph");
        let graph = TaskGraph::from_levels(task_levels, self.max_parallelism);

        // Step 6: Validate graph
        debug!("Step 5: Validating task graph");
        graph.validate().map_err(DAGError::invalid_graph)?;

        info!(
            "Task graph built successfully: {} tasks across {} levels",
            graph.task_count(),
            graph.level_count()
        );

        Ok(graph)
    }

    /// Create TaskLevels with TaskNodes
    fn create_task_levels(
        &self,
        task_id_levels: &[Vec<TaskId>],
        dep_graph: &DependencyGraph,
        code: &GeneratedCode,
    ) -> Result<Vec<TaskLevel>> {
        let mut levels = Vec::new();

        for (level_idx, task_ids) in task_id_levels.iter().enumerate() {
            let mut level = TaskLevel::new(level_idx);

            for task_id in task_ids {
                // Get dependencies for this task
                let dependencies = dep_graph.get_dependencies(task_id);

                // Create TaskNode
                let mut node = TaskNode::new(task_id.clone());
                node.dependencies = dependencies;

                // Set command
                if let Some(file) = code.find_by_task_id(task_id) {
                    let command = self.generate_command(file.module_path.as_str());
                    node = node.with_command(command);
                    node = node.with_workdir(file.path.parent().and_then(|p| p.to_str()).unwrap_or("."));
                }

                level.add_task(node);
            }

            levels.push(level);
        }

        Ok(levels)
    }

    /// Generate command from template
    fn generate_command(&self, module_path: &str) -> String {
        // Extract package name from module path
        // e.g., "crate::miyabi_core::utils" -> "miyabi_core"
        let package = module_path
            .split("::")
            .nth(1)
            .unwrap_or("unknown")
            .replace('_', "-");

        self.command_template
            .replace("{package}", &package)
            .replace("{module}", module_path)
    }

    /// Get max parallelism setting
    pub fn max_parallelism(&self) -> usize {
        self.max_parallelism
    }
}

impl Default for DAGBuilder {
    fn default() -> Self {
        Self::new(4) // Default: 4 parallel tasks
    }
}

/// Builder pattern for DAGBuilder configuration
pub struct DAGBuilderConfig {
    max_parallelism: usize,
    command_template: String,
}

impl DAGBuilderConfig {
    /// Create new configuration
    pub fn new() -> Self {
        Self {
            max_parallelism: 4,
            command_template: "cargo check --package {package}".to_string(),
        }
    }

    /// Set max parallelism
    pub fn max_parallelism(mut self, max: usize) -> Self {
        self.max_parallelism = max;
        self
    }

    /// Set command template
    pub fn command_template(mut self, template: impl Into<String>) -> Self {
        self.command_template = template.into();
        self
    }

    /// Build DAGBuilder
    pub fn build(self) -> DAGBuilder {
        DAGBuilder {
            max_parallelism: self.max_parallelism,
            command_template: self.command_template,
        }
    }
}

impl Default for DAGBuilderConfig {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::{CodeFile, ModulePath};
    use std::path::PathBuf;

    fn create_test_code_simple() -> GeneratedCode {
        let file_a = CodeFile::new(
            PathBuf::from("src/a.rs"),
            "use crate::b;\n".to_string(),
            ModulePath::new("crate::a"),
            vec![ModulePath::new("crate::b")],
        );

        let file_b = CodeFile::new(
            PathBuf::from("src/b.rs"),
            "".to_string(),
            ModulePath::new("crate::b"),
            vec![],
        );

        GeneratedCode::from_files(vec![file_a, file_b])
    }

    fn create_test_code_complex() -> GeneratedCode {
        let file_a = CodeFile::new(
            PathBuf::from("src/a.rs"),
            "use crate::b;\nuse crate::c;\n".to_string(),
            ModulePath::new("crate::a"),
            vec![ModulePath::new("crate::b"), ModulePath::new("crate::c")],
        );

        let file_b = CodeFile::new(
            PathBuf::from("src/b.rs"),
            "use crate::d;\n".to_string(),
            ModulePath::new("crate::b"),
            vec![ModulePath::new("crate::d")],
        );

        let file_c = CodeFile::new(
            PathBuf::from("src/c.rs"),
            "".to_string(),
            ModulePath::new("crate::c"),
            vec![],
        );

        let file_d = CodeFile::new(
            PathBuf::from("src/d.rs"),
            "".to_string(),
            ModulePath::new("crate::d"),
            vec![],
        );

        GeneratedCode::from_files(vec![file_a, file_b, file_c, file_d])
    }

    #[test]
    fn test_builder_creation() {
        let builder = DAGBuilder::new(4);
        assert_eq!(builder.max_parallelism(), 4);
    }

    #[test]
    fn test_builder_with_custom_command() {
        let builder = DAGBuilder::new(4)
            .with_command_template("cargo test --package {package}");
        assert_eq!(builder.command_template, "cargo test --package {package}");
    }

    #[test]
    fn test_build_simple_graph() {
        let code = create_test_code_simple();
        let builder = DAGBuilder::new(4);
        let graph = builder.build(&code).unwrap();

        // Should have 2 levels: b (no deps), a (depends on b)
        assert_eq!(graph.level_count(), 2);
        assert_eq!(graph.task_count(), 2);

        // Level 0 should have 1 task (b)
        assert_eq!(graph.levels[0].task_count(), 1);

        // Level 1 should have 1 task (a)
        assert_eq!(graph.levels[1].task_count(), 1);
    }

    #[test]
    fn test_build_complex_graph() {
        let code = create_test_code_complex();
        let builder = DAGBuilder::new(4);
        let graph = builder.build(&code).unwrap();

        // Should have 3 levels:
        // - Level 0: c, d (no deps)
        // - Level 1: b (depends on d)
        // - Level 2: a (depends on b, c)
        assert_eq!(graph.level_count(), 3);
        assert_eq!(graph.task_count(), 4);

        // Level 0 should have 2 tasks
        assert_eq!(graph.levels[0].task_count(), 2);

        // Level 1 should have 1 task
        assert_eq!(graph.levels[1].task_count(), 1);

        // Level 2 should have 1 task
        assert_eq!(graph.levels[2].task_count(), 1);
    }

    #[test]
    fn test_empty_code() {
        let code = GeneratedCode::from_files(vec![]);
        let builder = DAGBuilder::new(4);
        let result = builder.build(&code);

        assert!(result.is_err());
        match result {
            Err(DAGError::EmptyGraph) => {}
            _ => panic!("Expected EmptyGraph error"),
        }
    }

    #[test]
    fn test_builder_config() {
        let builder = DAGBuilderConfig::new()
            .max_parallelism(8)
            .command_template("custom command")
            .build();

        assert_eq!(builder.max_parallelism(), 8);
        assert_eq!(builder.command_template, "custom command");
    }

    #[test]
    fn test_parallel_tasks() {
        // Create 3 files with no dependencies
        let files = vec![
            CodeFile::new(
                PathBuf::from("src/a.rs"),
                "".to_string(),
                ModulePath::new("crate::a"),
                vec![],
            ),
            CodeFile::new(
                PathBuf::from("src/b.rs"),
                "".to_string(),
                ModulePath::new("crate::b"),
                vec![],
            ),
            CodeFile::new(
                PathBuf::from("src/c.rs"),
                "".to_string(),
                ModulePath::new("crate::c"),
                vec![],
            ),
        ];

        let code = GeneratedCode::from_files(files);
        let builder = DAGBuilder::new(4);
        let graph = builder.build(&code).unwrap();

        // All 3 tasks should be in level 0 (parallel execution)
        assert_eq!(graph.level_count(), 1);
        assert_eq!(graph.levels[0].task_count(), 3);
    }

    #[test]
    fn test_graph_validation() {
        let code = create_test_code_simple();
        let builder = DAGBuilder::new(4);
        let graph = builder.build(&code).unwrap();

        // Graph should be valid
        assert!(graph.validate().is_ok());
    }
}
