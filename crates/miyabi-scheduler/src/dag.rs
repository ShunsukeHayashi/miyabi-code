//! DAG operations and task readiness tracking

use crate::error::{Result, SchedulerError};
use miyabi_types::task::Task;
use miyabi_types::workflow::DAG;
use std::collections::{HashMap, HashSet};
use tracing::debug;

/// Task ID type alias
pub type TaskId = String;

/// DAG operations for scheduling
pub struct DAGOperations {
    dag: DAG,
}

impl DAGOperations {
    /// Create DAGOperations from an existing DAG
    pub fn new(dag: DAG) -> Result<Self> {
        // Validate DAG
        dag.validate()
            .map_err(|e| SchedulerError::InvalidConfig(format!("Invalid DAG: {}", e)))?;

        Ok(Self { dag })
    }

    /// Get tasks that are ready to execute (no pending dependencies)
    ///
    /// # Arguments
    ///
    /// * `completed` - Set of completed task IDs
    ///
    /// # Returns
    ///
    /// Returns a vector of task IDs that are ready to execute
    pub fn get_ready_tasks(&self, completed: &HashSet<TaskId>) -> Vec<TaskId> {
        let mut ready = Vec::new();

        // Build dependency map: task_id -> Vec<dependency_ids>
        let mut dependencies: HashMap<TaskId, Vec<TaskId>> = HashMap::new();
        for node in &self.dag.nodes {
            dependencies.insert(node.id.clone(), node.dependencies.clone());
        }

        // Check each node
        for node in &self.dag.nodes {
            // Skip if already completed
            if completed.contains(&node.id) {
                continue;
            }

            // Check if all dependencies are completed
            let all_deps_completed = node
                .dependencies
                .iter()
                .all(|dep_id| completed.contains(dep_id));

            if all_deps_completed {
                ready.push(node.id.clone());
            }
        }

        debug!(
            "Ready tasks: {} (completed: {}, total: {})",
            ready.len(),
            completed.len(),
            self.dag.nodes.len()
        );

        ready
    }

    /// Get all parallel execution levels
    ///
    /// Returns pre-computed levels from DAG
    pub fn get_levels(&self) -> &Vec<Vec<TaskId>> {
        &self.dag.levels
    }

    /// Get task by ID
    pub fn get_task(&self, task_id: &str) -> Option<&Task> {
        self.dag.nodes.iter().find(|t| t.id == task_id)
    }

    /// Get all tasks
    pub fn get_tasks(&self) -> &[Task] {
        &self.dag.nodes
    }

    /// Check if all tasks are completed
    pub fn is_complete(&self, completed: &HashSet<TaskId>) -> bool {
        self.dag.nodes.len() == completed.len()
    }

    /// Get task count
    pub fn task_count(&self) -> usize {
        self.dag.nodes.len()
    }

    /// Topological sort (returns levels in order)
    ///
    /// This is already computed in `dag.levels`, so we just return a flattened version
    pub fn topological_sort(&self) -> Vec<TaskId> {
        self.dag
            .levels
            .iter()
            .flat_map(|level| level.clone())
            .collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use miyabi_types::task::TaskType;
    use miyabi_types::workflow::Edge;

    fn create_test_dag() -> DAG {
        // Create a simple DAG:
        //   task-1 (no deps)
        //   task-2 (depends on task-1)
        //   task-3 (depends on task-1)
        //   task-4 (depends on task-2, task-3)

        let task1 = Task::new(
            "task-1".to_string(),
            "Task 1".to_string(),
            "First task".to_string(),
            TaskType::Feature,
            1,
        )
        .unwrap();

        let mut task2 = Task::new(
            "task-2".to_string(),
            "Task 2".to_string(),
            "Second task".to_string(),
            TaskType::Feature,
            1,
        )
        .unwrap();
        task2.dependencies = vec!["task-1".to_string()];

        let mut task3 = Task::new(
            "task-3".to_string(),
            "Task 3".to_string(),
            "Third task".to_string(),
            TaskType::Feature,
            1,
        )
        .unwrap();
        task3.dependencies = vec!["task-1".to_string()];

        let mut task4 = Task::new(
            "task-4".to_string(),
            "Task 4".to_string(),
            "Fourth task".to_string(),
            TaskType::Feature,
            1,
        )
        .unwrap();
        task4.dependencies = vec!["task-2".to_string(), "task-3".to_string()];

        DAG {
            nodes: vec![task1, task2, task3, task4],
            edges: vec![
                Edge {
                    from: "task-1".to_string(),
                    to: "task-2".to_string(),
                },
                Edge {
                    from: "task-1".to_string(),
                    to: "task-3".to_string(),
                },
                Edge {
                    from: "task-2".to_string(),
                    to: "task-4".to_string(),
                },
                Edge {
                    from: "task-3".to_string(),
                    to: "task-4".to_string(),
                },
            ],
            levels: vec![
                vec!["task-1".to_string()],
                vec!["task-2".to_string(), "task-3".to_string()],
                vec!["task-4".to_string()],
            ],
        }
    }

    #[test]
    fn test_dag_operations_creation() {
        let dag = create_test_dag();
        let ops = DAGOperations::new(dag).unwrap();
        assert_eq!(ops.task_count(), 4);
    }

    #[test]
    fn test_get_ready_tasks_initial() {
        let dag = create_test_dag();
        let ops = DAGOperations::new(dag).unwrap();
        let completed = HashSet::new();

        let ready = ops.get_ready_tasks(&completed);
        assert_eq!(ready.len(), 1);
        assert_eq!(ready[0], "task-1");
    }

    #[test]
    fn test_get_ready_tasks_after_first() {
        let dag = create_test_dag();
        let ops = DAGOperations::new(dag).unwrap();
        let mut completed = HashSet::new();
        completed.insert("task-1".to_string());

        let ready = ops.get_ready_tasks(&completed);
        assert_eq!(ready.len(), 2);
        assert!(ready.contains(&"task-2".to_string()));
        assert!(ready.contains(&"task-3".to_string()));
    }

    #[test]
    fn test_get_ready_tasks_after_second_level() {
        let dag = create_test_dag();
        let ops = DAGOperations::new(dag).unwrap();
        let mut completed = HashSet::new();
        completed.insert("task-1".to_string());
        completed.insert("task-2".to_string());
        completed.insert("task-3".to_string());

        let ready = ops.get_ready_tasks(&completed);
        assert_eq!(ready.len(), 1);
        assert_eq!(ready[0], "task-4");
    }

    #[test]
    fn test_is_complete() {
        let dag = create_test_dag();
        let ops = DAGOperations::new(dag).unwrap();

        let mut completed = HashSet::new();
        assert!(!ops.is_complete(&completed));

        completed.insert("task-1".to_string());
        completed.insert("task-2".to_string());
        completed.insert("task-3".to_string());
        completed.insert("task-4".to_string());
        assert!(ops.is_complete(&completed));
    }

    #[test]
    fn test_get_levels() {
        let dag = create_test_dag();
        let ops = DAGOperations::new(dag).unwrap();

        let levels = ops.get_levels();
        assert_eq!(levels.len(), 3);
        assert_eq!(levels[0].len(), 1);
        assert_eq!(levels[1].len(), 2);
        assert_eq!(levels[2].len(), 1);
    }

    #[test]
    fn test_topological_sort() {
        let dag = create_test_dag();
        let ops = DAGOperations::new(dag).unwrap();

        let sorted = ops.topological_sort();
        assert_eq!(sorted.len(), 4);

        // task-1 must come before task-2 and task-3
        let task1_idx = sorted.iter().position(|t| t == "task-1").unwrap();
        let task2_idx = sorted.iter().position(|t| t == "task-2").unwrap();
        let task3_idx = sorted.iter().position(|t| t == "task-3").unwrap();
        assert!(task1_idx < task2_idx);
        assert!(task1_idx < task3_idx);

        // task-4 must come last
        assert_eq!(sorted[3], "task-4");
    }
}
