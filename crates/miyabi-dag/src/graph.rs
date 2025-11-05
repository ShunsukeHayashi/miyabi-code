//! Task graph data structure

use crate::types::{Task, TaskId, TaskNode};
use crate::{DAGError, Result};
use indexmap::IndexMap;
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};

/// A level in the task graph (tasks that can run in parallel)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskLevel {
    /// Level number (0 = root level, no dependencies)
    pub level: usize,
    /// Tasks at this level (can all run in parallel)
    pub tasks: Vec<Task>,
}

impl TaskLevel {
    /// Create a new task level
    pub fn new(level: usize) -> Self {
        Self {
            level,
            tasks: Vec::new(),
        }
    }

    /// Add a task to this level
    pub fn add_task(&mut self, task: Task) {
        self.tasks.push(task);
    }

    /// Get number of tasks at this level
    pub fn task_count(&self) -> usize {
        self.tasks.len()
    }

    /// Check if level is empty
    pub fn is_empty(&self) -> bool {
        self.tasks.is_empty()
    }
}

/// Directed Acyclic Graph of tasks
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskGraph {
    /// All nodes in the graph
    nodes: IndexMap<TaskId, TaskNode>,
    /// Task levels (for parallel execution)
    levels: Vec<TaskLevel>,
    /// Maximum parallelism allowed
    max_parallelism: usize,
}

impl TaskGraph {
    /// Create a new empty task graph
    pub fn new(max_parallelism: usize) -> Self {
        Self {
            nodes: IndexMap::new(),
            levels: Vec::new(),
            max_parallelism,
        }
    }

    /// Add a task node to the graph
    pub fn add_node(&mut self, node: TaskNode) {
        self.nodes.insert(node.id, node);
    }

    /// Add a dependency edge (from_task depends on to_task)
    pub fn add_dependency(&mut self, from_task: TaskId, to_task: TaskId) -> Result<()> {
        // Check both nodes exist
        if !self.nodes.contains_key(&from_task) {
            return Err(DAGError::TaskNotFound(from_task.to_string()));
        }
        if !self.nodes.contains_key(&to_task) {
            return Err(DAGError::TaskNotFound(to_task.to_string()));
        }

        // Add dependency to from_task
        if let Some(node) = self.nodes.get_mut(&from_task) {
            node.add_dependency(to_task);
        }

        // Add dependent to to_task
        if let Some(node) = self.nodes.get_mut(&to_task) {
            node.add_dependent(from_task);
        }

        Ok(())
    }

    /// Get a task node by ID
    pub fn get_node(&self, id: &TaskId) -> Option<&TaskNode> {
        self.nodes.get(id)
    }

    /// Get all nodes
    pub fn nodes(&self) -> impl Iterator<Item = &TaskNode> {
        self.nodes.values()
    }

    /// Get all task IDs
    pub fn task_ids(&self) -> Vec<TaskId> {
        self.nodes.keys().copied().collect()
    }

    /// Find root nodes (nodes with no dependencies)
    pub fn find_roots(&self) -> Vec<TaskId> {
        self.nodes
            .values()
            .filter(|node| node.is_root())
            .map(|node| node.id)
            .collect()
    }

    /// Perform topological sort using Kahn's algorithm
    ///
    /// Returns sorted task IDs or error if cycle detected
    pub fn topological_sort(&self) -> Result<Vec<TaskId>> {
        // Count in-degrees for all nodes
        let mut indegree: HashMap<TaskId, usize> = HashMap::new();
        for node in self.nodes.values() {
            indegree.insert(node.id, node.indegree());
        }

        // Start with nodes that have zero in-degree
        let mut queue: Vec<TaskId> = self
            .nodes
            .values()
            .filter(|node| node.indegree() == 0)
            .map(|node| node.id)
            .collect();

        let mut sorted = Vec::new();

        while let Some(task_id) = queue.pop() {
            sorted.push(task_id);

            // Get the node
            if let Some(node) = self.nodes.get(&task_id) {
                // Decrease in-degree for all dependents
                for &dependent_id in &node.dependents {
                    if let Some(degree) = indegree.get_mut(&dependent_id) {
                        *degree -= 1;
                        if *degree == 0 {
                            queue.push(dependent_id);
                        }
                    }
                }
            }
        }

        // If not all nodes were processed, there's a cycle
        if sorted.len() != self.nodes.len() {
            return Err(DAGError::CircularDependency(
                "Cycle detected in task graph".to_string(),
            ));
        }

        Ok(sorted)
    }

    /// Build task levels from topologically sorted tasks
    ///
    /// Groups independent tasks into levels for parallel execution
    pub fn build_levels(&mut self) -> Result<()> {
        let sorted = self.topological_sort()?;

        // Track which tasks have been assigned to levels
        let mut assigned: HashSet<TaskId> = HashSet::new();
        let mut current_level = 0;

        while assigned.len() < sorted.len() {
            let mut level = TaskLevel::new(current_level);

            // Find tasks whose dependencies are all assigned
            for &task_id in &sorted {
                if assigned.contains(&task_id) {
                    continue;
                }

                if let Some(node) = self.nodes.get(&task_id) {
                    // Check if all dependencies are assigned
                    let all_deps_assigned = node
                        .dependencies
                        .iter()
                        .all(|dep_id| assigned.contains(dep_id));

                    if all_deps_assigned {
                        level.add_task(node.task.clone());
                        assigned.insert(task_id);

                        // Respect max parallelism
                        if level.task_count() >= self.max_parallelism {
                            break;
                        }
                    }
                }
            }

            if level.is_empty() {
                // No progress made, but not all tasks assigned - indicates a bug
                return Err(DAGError::InvalidGraph(
                    "Unable to assign all tasks to levels".to_string(),
                ));
            }

            self.levels.push(level);
            current_level += 1;
        }

        Ok(())
    }

    /// Get task levels
    pub fn levels(&self) -> &[TaskLevel] {
        &self.levels
    }

    /// Get maximum parallelism
    pub fn max_parallelism(&self) -> usize {
        self.max_parallelism
    }

    /// Get total number of tasks
    pub fn task_count(&self) -> usize {
        self.nodes.len()
    }

    /// Get total number of levels
    pub fn level_count(&self) -> usize {
        self.levels.len()
    }

    /// Check if graph is empty
    pub fn is_empty(&self) -> bool {
        self.nodes.is_empty()
    }

    /// Detect cycles in the graph
    ///
    /// Returns Ok(()) if no cycles, Err with cycle path if found
    pub fn detect_cycles(&self) -> Result<()> {
        // Use topological sort to detect cycles
        self.topological_sort().map(|_| ())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::{CodeFile, ModulePath, Task};
    use std::path::PathBuf;
    use std::str::FromStr;

    fn create_test_task(name: &str) -> Task {
        let id = TaskId::new();
        let file = CodeFile::new(
            PathBuf::from(name),
            String::new(),
            ModulePath::from_str("test::module").unwrap(),
        );
        Task::new(id, name.to_string(), file)
    }

    #[test]
    fn test_empty_graph() {
        let graph = TaskGraph::new(4);
        assert!(graph.is_empty());
        assert_eq!(graph.task_count(), 0);
        assert_eq!(graph.level_count(), 0);
    }

    #[test]
    fn test_add_nodes() {
        let mut graph = TaskGraph::new(4);

        let task1 = create_test_task("task1");
        let node1 = TaskNode::new(task1);
        graph.add_node(node1.clone());

        assert_eq!(graph.task_count(), 1);
        assert!(graph.get_node(&node1.id).is_some());
    }

    #[test]
    fn test_find_roots() {
        let mut graph = TaskGraph::new(4);

        let task1 = create_test_task("task1");
        let task2 = create_test_task("task2");
        let node1 = TaskNode::new(task1);
        let node2 = TaskNode::new(task2);

        let id1 = node1.id;
        let id2 = node2.id;

        graph.add_node(node1);
        graph.add_node(node2);

        let roots = graph.find_roots();
        assert_eq!(roots.len(), 2);
        assert!(roots.contains(&id1));
        assert!(roots.contains(&id2));
    }

    #[test]
    fn test_topological_sort_simple() {
        let mut graph = TaskGraph::new(4);

        // Create linear dependency: task1 -> task2 -> task3
        let task1 = create_test_task("task1");
        let task2 = create_test_task("task2");
        let task3 = create_test_task("task3");

        let id1 = task1.id;
        let id2 = task2.id;
        let id3 = task3.id;

        graph.add_node(TaskNode::new(task1));
        graph.add_node(TaskNode::new(task2));
        graph.add_node(TaskNode::new(task3));

        graph.add_dependency(id2, id1).unwrap(); // task2 depends on task1
        graph.add_dependency(id3, id2).unwrap(); // task3 depends on task2

        let sorted = graph.topological_sort().unwrap();
        assert_eq!(sorted.len(), 3);

        // task1 should come before task2, task2 before task3
        let pos1 = sorted.iter().position(|&id| id == id1).unwrap();
        let pos2 = sorted.iter().position(|&id| id == id2).unwrap();
        let pos3 = sorted.iter().position(|&id| id == id3).unwrap();

        assert!(pos1 < pos2);
        assert!(pos2 < pos3);
    }

    #[test]
    fn test_build_levels() {
        let mut graph = TaskGraph::new(2); // max 2 parallel

        // Create diamond dependency:
        //     task1
        //    /     \
        // task2   task3
        //    \     /
        //     task4

        let task1 = create_test_task("task1");
        let task2 = create_test_task("task2");
        let task3 = create_test_task("task3");
        let task4 = create_test_task("task4");

        let id1 = task1.id;
        let id2 = task2.id;
        let id3 = task3.id;
        let id4 = task4.id;

        graph.add_node(TaskNode::new(task1));
        graph.add_node(TaskNode::new(task2));
        graph.add_node(TaskNode::new(task3));
        graph.add_node(TaskNode::new(task4));

        graph.add_dependency(id2, id1).unwrap();
        graph.add_dependency(id3, id1).unwrap();
        graph.add_dependency(id4, id2).unwrap();
        graph.add_dependency(id4, id3).unwrap();

        graph.build_levels().unwrap();

        let levels = graph.levels();
        assert!(levels.len() >= 2); // At least 2 levels
        assert!(levels.len() <= 4); // At most 4 levels (one per task)

        // First level should have at least one task (root)
        assert!(levels[0].task_count() >= 1);
        assert!(levels[0].task_count() <= graph.max_parallelism());

        // Last level should have at least task4
        let last_level = levels.last().unwrap();
        assert!(last_level.task_count() >= 1);
    }
}
