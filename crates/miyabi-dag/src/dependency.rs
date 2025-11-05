//! Dependency analysis for code files

use crate::error::{DAGError, Result};
use crate::types::{CodeFile, GeneratedCode, ModulePath, TaskId};
use std::collections::{HashMap, HashSet};

/// Dependency graph structure
#[derive(Debug, Clone)]
pub struct DependencyGraph {
    /// Map from TaskId to its dependencies (TaskIds it depends on)
    pub dependencies: HashMap<TaskId, HashSet<TaskId>>,
    /// Map from TaskId to its dependents (TaskIds that depend on it)
    pub dependents: HashMap<TaskId, HashSet<TaskId>>,
    /// Module path to TaskId mapping
    pub module_to_task: HashMap<ModulePath, TaskId>,
}

impl DependencyGraph {
    /// Create a new empty dependency graph
    pub fn new() -> Self {
        Self {
            dependencies: HashMap::new(),
            dependents: HashMap::new(),
            module_to_task: HashMap::new(),
        }
    }

    /// Add a task node to the graph
    pub fn add_node(&mut self, task_id: TaskId, module_path: ModulePath) {
        self.dependencies.entry(task_id.clone()).or_default();
        self.dependents.entry(task_id.clone()).or_default();
        self.module_to_task.insert(module_path, task_id);
    }

    /// Add a dependency edge: `from` depends on `to`
    pub fn add_edge(&mut self, from: TaskId, to: TaskId) {
        self.dependencies
            .entry(from.clone())
            .or_default()
            .insert(to.clone());
        self.dependents
            .entry(to.clone())
            .or_default()
            .insert(from.clone());
    }

    /// Get direct dependencies of a task
    pub fn get_dependencies(&self, task_id: &TaskId) -> HashSet<TaskId> {
        self.dependencies
            .get(task_id)
            .cloned()
            .unwrap_or_default()
    }

    /// Get direct dependents of a task (tasks that depend on this task)
    pub fn get_dependents(&self, task_id: &TaskId) -> HashSet<TaskId> {
        self.dependents
            .get(task_id)
            .cloned()
            .unwrap_or_default()
    }

    /// Get all task IDs in the graph
    pub fn all_tasks(&self) -> Vec<TaskId> {
        self.dependencies.keys().cloned().collect()
    }

    /// Get tasks with no dependencies (entry points)
    pub fn get_entry_tasks(&self) -> Vec<TaskId> {
        self.dependencies
            .iter()
            .filter_map(|(task_id, deps)| {
                if deps.is_empty() {
                    Some(task_id.clone())
                } else {
                    None
                }
            })
            .collect()
    }

    /// Get in-degree (number of dependencies) for a task
    pub fn in_degree(&self, task_id: &TaskId) -> usize {
        self.get_dependencies(task_id).len()
    }

    /// Get out-degree (number of dependents) for a task
    pub fn out_degree(&self, task_id: &TaskId) -> usize {
        self.get_dependents(task_id).len()
    }

    /// Check if the graph has cycles using DFS
    pub fn has_cycle(&self) -> bool {
        let mut visited = HashSet::new();
        let mut rec_stack = HashSet::new();

        for task_id in self.all_tasks() {
            if !visited.contains(&task_id)
                && self.has_cycle_dfs(&task_id, &mut visited, &mut rec_stack)
            {
                return true;
            }
        }
        false
    }

    fn has_cycle_dfs(
        &self,
        task_id: &TaskId,
        visited: &mut HashSet<TaskId>,
        rec_stack: &mut HashSet<TaskId>,
    ) -> bool {
        visited.insert(task_id.clone());
        rec_stack.insert(task_id.clone());

        // Check all dependents (nodes this task points to)
        for dependent in self.get_dependents(task_id) {
            if (!visited.contains(&dependent) && self.has_cycle_dfs(&dependent, visited, rec_stack))
                || rec_stack.contains(&dependent)
            {
                return true;
            }
        }

        rec_stack.remove(task_id);
        false
    }
}

impl Default for DependencyGraph {
    fn default() -> Self {
        Self::new()
    }
}

/// Dependency analyzer
pub struct DependencyAnalyzer;

impl DependencyAnalyzer {
    /// Analyze dependencies in generated code
    pub fn analyze(code: &GeneratedCode) -> Result<DependencyGraph> {
        let mut graph = DependencyGraph::new();

        // Step 1: Add all tasks as nodes
        for file in &code.files {
            graph.add_node(file.task_id(), file.module_path.clone());
        }

        // Step 2: Build dependency edges
        for file in &code.files {
            let from_task = file.task_id();

            // For each import in this file, find the corresponding task
            for import in &file.imports {
                // Resolve import to a task ID
                if let Some(to_task) = Self::resolve_import(import, &graph, code) {
                    // from_task depends on to_task
                    graph.add_edge(from_task.clone(), to_task);
                }
            }
        }

        // Step 3: Validate graph (check for cycles)
        if graph.has_cycle() {
            return Err(DAGError::circular_dependency(
                "Circular dependency detected in task graph",
            ));
        }

        Ok(graph)
    }

    /// Resolve an import statement to a TaskId
    fn resolve_import(
        import: &ModulePath,
        graph: &DependencyGraph,
        _code: &GeneratedCode,
    ) -> Option<TaskId> {
        // Direct match: import exactly matches a module in our code
        if let Some(task_id) = graph.module_to_task.get(import) {
            return Some(task_id.clone());
        }

        // Partial match: import is a submodule of a file in our code
        // e.g., import "crate::module::Type" matches file "crate::module"
        let import_str = import.as_str();
        for (module, task_id) in &graph.module_to_task {
            if import_str.starts_with(module.as_str()) {
                return Some(task_id.clone());
            }
        }

        // Not found in our code (external dependency)
        None
    }

    /// Extract imports from a code file
    pub fn extract_imports(file: &CodeFile) -> Vec<ModulePath> {
        CodeFile::parse_imports(&file.content)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    fn create_test_file(
        path: &str,
        module: &str,
        imports: Vec<&str>,
    ) -> CodeFile {
        let import_content = imports
            .iter()
            .map(|i| format!("use {};\n", i))
            .collect::<String>();

        CodeFile::new(
            PathBuf::from(path),
            import_content.clone(),
            ModulePath::new(module),
            CodeFile::parse_imports(&import_content),
        )
    }

    #[test]
    fn test_dependency_graph_creation() {
        let mut graph = DependencyGraph::new();
        let task_a = TaskId::new("a");
        let task_b = TaskId::new("b");

        graph.add_node(task_a.clone(), ModulePath::new("crate::a"));
        graph.add_node(task_b.clone(), ModulePath::new("crate::b"));
        graph.add_edge(task_a.clone(), task_b.clone());

        assert_eq!(graph.in_degree(&task_a), 1);
        assert_eq!(graph.out_degree(&task_b), 1);
    }

    #[test]
    fn test_entry_tasks() {
        let mut graph = DependencyGraph::new();
        let task_a = TaskId::new("a");
        let task_b = TaskId::new("b");
        let task_c = TaskId::new("c");

        graph.add_node(task_a.clone(), ModulePath::new("a"));
        graph.add_node(task_b.clone(), ModulePath::new("b"));
        graph.add_node(task_c.clone(), ModulePath::new("c"));

        // a depends on b, b depends on c
        graph.add_edge(task_a.clone(), task_b.clone());
        graph.add_edge(task_b.clone(), task_c.clone());

        let entries = graph.get_entry_tasks();
        assert_eq!(entries.len(), 1);
        assert!(entries.contains(&task_c));
    }

    #[test]
    fn test_cycle_detection() {
        let mut graph = DependencyGraph::new();
        let task_a = TaskId::new("a");
        let task_b = TaskId::new("b");
        let task_c = TaskId::new("c");

        graph.add_node(task_a.clone(), ModulePath::new("a"));
        graph.add_node(task_b.clone(), ModulePath::new("b"));
        graph.add_node(task_c.clone(), ModulePath::new("c"));

        // Create cycle: a -> b -> c -> a
        graph.add_edge(task_a.clone(), task_b.clone());
        graph.add_edge(task_b.clone(), task_c.clone());
        graph.add_edge(task_c.clone(), task_a.clone());

        assert!(graph.has_cycle());
    }

    #[test]
    fn test_no_cycle() {
        let mut graph = DependencyGraph::new();
        let task_a = TaskId::new("a");
        let task_b = TaskId::new("b");
        let task_c = TaskId::new("c");

        graph.add_node(task_a.clone(), ModulePath::new("a"));
        graph.add_node(task_b.clone(), ModulePath::new("b"));
        graph.add_node(task_c.clone(), ModulePath::new("c"));

        // No cycle: a -> b, a -> c
        graph.add_edge(task_a.clone(), task_b.clone());
        graph.add_edge(task_a.clone(), task_c.clone());

        assert!(!graph.has_cycle());
    }

    #[test]
    fn test_analyze_simple_dependencies() {
        let files = vec![
            create_test_file("src/a.rs", "crate::a", vec!["crate::b"]),
            create_test_file("src/b.rs", "crate::b", vec![]),
        ];
        let code = GeneratedCode::from_files(files);
        let graph = DependencyAnalyzer::analyze(&code).unwrap();

        let task_a = TaskId::from_path(&PathBuf::from("src/a.rs"));
        let task_b = TaskId::from_path(&PathBuf::from("src/b.rs"));

        assert_eq!(graph.in_degree(&task_a), 1);
        assert_eq!(graph.in_degree(&task_b), 0);
    }

    #[test]
    fn test_analyze_detects_cycle() {
        let files = vec![
            create_test_file("src/a.rs", "crate::a", vec!["crate::b"]),
            create_test_file("src/b.rs", "crate::b", vec!["crate::a"]),
        ];
        let code = GeneratedCode::from_files(files);
        let result = DependencyAnalyzer::analyze(&code);

        assert!(result.is_err());
        match result {
            Err(DAGError::CircularDependency(_)) => {}
            _ => panic!("Expected CircularDependency error"),
        }
    }
}
