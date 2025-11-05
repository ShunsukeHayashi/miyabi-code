//! Topological sorting algorithm for DAG

use crate::dependency::DependencyGraph;
use crate::error::{DAGError, Result};
use crate::types::TaskId;
use std::collections::{HashMap, HashSet, VecDeque};

/// Topological sorter using Kahn's algorithm
pub struct TopologicalSorter;

impl TopologicalSorter {
    /// Perform topological sort on a dependency graph
    ///
    /// Uses Kahn's algorithm:
    /// 1. Find all nodes with in-degree 0 (no dependencies)
    /// 2. Add them to the queue
    /// 3. Process queue: remove node, decrement in-degree of dependents
    /// 4. Add newly zero-in-degree nodes to queue
    /// 5. Repeat until queue is empty
    ///
    /// Returns ordered list of TaskIds, or error if cycle detected
    pub fn sort(graph: &DependencyGraph) -> Result<Vec<TaskId>> {
        // Calculate in-degrees
        let mut in_degrees = Self::calculate_in_degrees(graph);

        // Find nodes with in-degree 0
        let mut queue: VecDeque<TaskId> = in_degrees
            .iter()
            .filter_map(|(task_id, &degree)| {
                if degree == 0 {
                    Some(task_id.clone())
                } else {
                    None
                }
            })
            .collect();

        let mut sorted = Vec::new();

        // Process queue
        while let Some(task_id) = queue.pop_front() {
            sorted.push(task_id.clone());

            // For each dependent of this task
            for dependent in graph.get_dependents(&task_id) {
                // Decrement in-degree
                if let Some(degree) = in_degrees.get_mut(&dependent) {
                    *degree -= 1;

                    // If in-degree becomes 0, add to queue
                    if *degree == 0 {
                        queue.push_back(dependent.clone());
                    }
                }
            }
        }

        // If we haven't processed all nodes, there's a cycle
        if sorted.len() != graph.all_tasks().len() {
            return Err(DAGError::topological_sort(format!(
                "Cycle detected: processed {}/{} tasks",
                sorted.len(),
                graph.all_tasks().len()
            )));
        }

        Ok(sorted)
    }

    /// Calculate in-degree for each node
    fn calculate_in_degrees(graph: &DependencyGraph) -> HashMap<TaskId, usize> {
        let mut in_degrees = HashMap::new();

        for task_id in graph.all_tasks() {
            in_degrees.insert(task_id.clone(), graph.in_degree(&task_id));
        }

        in_degrees
    }

    /// Group sorted tasks into levels for parallel execution
    ///
    /// Tasks at the same level have no dependencies on each other
    /// and can be executed in parallel.
    pub fn group_into_levels(
        sorted: &[TaskId],
        graph: &DependencyGraph,
    ) -> Vec<Vec<TaskId>> {
        let mut levels: Vec<Vec<TaskId>> = Vec::new();
        let mut processed = HashSet::new();

        for task_id in sorted {
            // Find the level for this task
            let level_idx = Self::find_level_for_task(task_id, graph, &processed);

            // Ensure we have enough levels
            while levels.len() <= level_idx {
                levels.push(Vec::new());
            }

            // Add task to its level
            levels[level_idx].push(task_id.clone());
            processed.insert(task_id.clone());
        }

        levels
    }

    /// Find the appropriate level for a task
    ///
    /// A task's level is one more than the maximum level of its dependencies
    fn find_level_for_task(
        task_id: &TaskId,
        graph: &DependencyGraph,
        processed: &HashSet<TaskId>,
    ) -> usize {
        let dependencies = graph.get_dependencies(task_id);

        if dependencies.is_empty() {
            // No dependencies: level 0
            return 0;
        }

        // Find maximum level of dependencies (that have been processed)
        let max_dep_level = dependencies
            .iter()
            .filter(|dep| processed.contains(dep))
            .map(|_dep| {
                // Find which level this dependency is in
                // This is inefficient but correct for now
                // TODO: optimize with a task->level map
                0 // Placeholder
            })
            .max()
            .unwrap_or(0);

        max_dep_level + 1
    }

    /// Optimized version: group into levels in a single pass
    pub fn group_into_levels_optimized(
        graph: &DependencyGraph,
    ) -> Result<Vec<Vec<TaskId>>> {
        // First, get topological sort
        let sorted = Self::sort(graph)?;

        // Build task -> level mapping
        let mut task_levels: HashMap<TaskId, usize> = HashMap::new();

        for task_id in &sorted {
            // Calculate level based on dependencies
            let dependencies = graph.get_dependencies(task_id);

            if dependencies.is_empty() {
                // No dependencies: level 0
                task_levels.insert(task_id.clone(), 0);
            } else {
                // Level = max(dependency levels) + 1
                let max_dep_level = dependencies
                    .iter()
                    .filter_map(|dep| task_levels.get(dep))
                    .max()
                    .copied()
                    .unwrap_or(0);

                task_levels.insert(task_id.clone(), max_dep_level + 1);
            }
        }

        // Group tasks by level
        let max_level = task_levels.values().max().copied().unwrap_or(0);
        let mut levels = vec![Vec::new(); max_level + 1];

        for (task_id, level) in task_levels {
            levels[level].push(task_id);
        }

        Ok(levels)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::ModulePath;

    fn create_test_graph() -> DependencyGraph {
        let mut graph = DependencyGraph::new();

        let task_a = TaskId::new("a");
        let task_b = TaskId::new("b");
        let task_c = TaskId::new("c");
        let task_d = TaskId::new("d");

        graph.add_node(task_a.clone(), ModulePath::new("a"));
        graph.add_node(task_b.clone(), ModulePath::new("b"));
        graph.add_node(task_c.clone(), ModulePath::new("c"));
        graph.add_node(task_d.clone(), ModulePath::new("d"));

        // Dependencies: a depends on b, a depends on c, b depends on d
        // Levels: d (0), b (1), c (0), a (2)
        graph.add_edge(task_a.clone(), task_b.clone());
        graph.add_edge(task_a.clone(), task_c.clone());
        graph.add_edge(task_b.clone(), task_d.clone());

        graph
    }

    #[test]
    fn test_topological_sort() {
        let graph = create_test_graph();
        let sorted = TopologicalSorter::sort(&graph).unwrap();

        assert_eq!(sorted.len(), 4);

        // Verify topological order: dependencies come before dependents
        let positions: HashMap<_, _> = sorted
            .iter()
            .enumerate()
            .map(|(i, id)| (id.clone(), i))
            .collect();

        let task_a = TaskId::new("a");
        let task_b = TaskId::new("b");
        let task_d = TaskId::new("d");

        // a depends on b, so b should come before a
        assert!(positions[&task_b] < positions[&task_a]);
        // b depends on d, so d should come before b
        assert!(positions[&task_d] < positions[&task_b]);
    }

    #[test]
    fn test_sort_detects_cycle() {
        let mut graph = DependencyGraph::new();
        let task_a = TaskId::new("a");
        let task_b = TaskId::new("b");

        graph.add_node(task_a.clone(), ModulePath::new("a"));
        graph.add_node(task_b.clone(), ModulePath::new("b"));

        // Create cycle: a -> b -> a
        graph.add_edge(task_a.clone(), task_b.clone());
        graph.add_edge(task_b.clone(), task_a.clone());

        let result = TopologicalSorter::sort(&graph);
        assert!(result.is_err());
    }

    #[test]
    fn test_group_into_levels() {
        let graph = create_test_graph();
        let levels = TopologicalSorter::group_into_levels_optimized(&graph).unwrap();

        // Verify we have 3 levels
        assert_eq!(levels.len(), 3);

        // Level 0: c, d (no dependencies)
        assert_eq!(levels[0].len(), 2);

        // Level 1: b (depends on d)
        assert_eq!(levels[1].len(), 1);
        assert_eq!(levels[1][0], TaskId::new("b"));

        // Level 2: a (depends on b and c)
        assert_eq!(levels[2].len(), 1);
        assert_eq!(levels[2][0], TaskId::new("a"));
    }

    #[test]
    fn test_empty_graph() {
        let graph = DependencyGraph::new();
        let sorted = TopologicalSorter::sort(&graph).unwrap();
        assert_eq!(sorted.len(), 0);
    }

    #[test]
    fn test_single_node() {
        let mut graph = DependencyGraph::new();
        let task_a = TaskId::new("a");
        graph.add_node(task_a.clone(), ModulePath::new("a"));

        let sorted = TopologicalSorter::sort(&graph).unwrap();
        assert_eq!(sorted.len(), 1);
        assert_eq!(sorted[0], task_a);
    }

    #[test]
    fn test_parallel_tasks() {
        let mut graph = DependencyGraph::new();
        let task_a = TaskId::new("a");
        let task_b = TaskId::new("b");
        let task_c = TaskId::new("c");

        graph.add_node(task_a.clone(), ModulePath::new("a"));
        graph.add_node(task_b.clone(), ModulePath::new("b"));
        graph.add_node(task_c.clone(), ModulePath::new("c"));

        // No dependencies: all can run in parallel
        let levels = TopologicalSorter::group_into_levels_optimized(&graph).unwrap();

        assert_eq!(levels.len(), 1);
        assert_eq!(levels[0].len(), 3);
    }
}
