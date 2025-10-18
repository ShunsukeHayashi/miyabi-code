//! Workflow and execution types

use crate::agent::{AgentMetrics, EscalationInfo};
use crate::task::{Task, TaskResult};
use serde::{Deserialize, Serialize};

/// Directed Acyclic Graph (DAG) for task dependencies
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DAG {
    pub nodes: Vec<Task>,
    pub edges: Vec<Edge>,
    pub levels: Vec<Vec<String>>, // Topologically sorted levels
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Edge {
    pub from: String,
    pub to: String,
}

impl DAG {
    /// Check if DAG has cycles
    pub fn has_cycles(&self) -> bool {
        // Simple cycle detection: check if all nodes are in levels
        let total_nodes = self.nodes.len();
        let nodes_in_levels: usize = self.levels.iter().map(|level| level.len()).sum();
        nodes_in_levels != total_nodes
    }

    /// Get critical path (longest path in DAG)
    pub fn critical_path(&self) -> Vec<String> {
        // Find the level with maximum total duration
        // This is a simplified version - full implementation would calculate actual longest path
        self.levels
            .iter()
            .max_by_key(|level| level.len())
            .cloned()
            .unwrap_or_default()
    }
}

/// Execution plan from CoordinatorAgent
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecutionPlan {
    pub session_id: String,
    pub device_identifier: String,
    /// Concurrency level (1-100)
    pub concurrency: usize,
    pub tasks: Vec<Task>,
    pub dag: DAG,
    pub estimated_duration: u32,
    pub start_time: u64,
}

impl ExecutionPlan {
    /// Minimum concurrency value
    pub const MIN_CONCURRENCY: usize = 1;

    /// Maximum concurrency value
    pub const MAX_CONCURRENCY: usize = 100;

    /// Validate concurrency value
    pub fn validate_concurrency(concurrency: usize) -> Result<(), crate::error::MiyabiError> {
        if !(Self::MIN_CONCURRENCY..=Self::MAX_CONCURRENCY).contains(&concurrency) {
            return Err(crate::error::MiyabiError::Validation(format!(
                "Concurrency must be {}-{}, got {}",
                Self::MIN_CONCURRENCY,
                Self::MAX_CONCURRENCY,
                concurrency
            )));
        }
        Ok(())
    }

    /// Create a new ExecutionPlan with validated concurrency
    pub fn new(
        session_id: String,
        device_identifier: String,
        concurrency: usize,
        tasks: Vec<Task>,
        dag: DAG,
        estimated_duration: u32,
    ) -> Result<Self, crate::error::MiyabiError> {
        // Validate concurrency
        Self::validate_concurrency(concurrency)?;

        Ok(Self {
            session_id,
            device_identifier,
            concurrency,
            tasks,
            dag,
            estimated_duration,
            start_time: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
        })
    }

    /// Set concurrency with validation
    pub fn set_concurrency(&mut self, concurrency: usize) -> Result<(), crate::error::MiyabiError> {
        Self::validate_concurrency(concurrency)?;
        self.concurrency = concurrency;
        Ok(())
    }
}

/// Execution report
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecutionReport {
    pub session_id: String,
    pub device_identifier: String,
    pub start_time: u64,
    pub end_time: u64,
    pub total_duration_ms: u64,
    pub summary: ExecutionSummary,
    pub tasks: Vec<TaskResult>,
    pub metrics: Vec<AgentMetrics>,
    pub escalations: Vec<EscalationInfo>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecutionSummary {
    pub total: u32,
    pub completed: u32,
    pub failed: u32,
    pub escalated: u32,
    pub success_rate: f32,
}

/// Worker pool for parallel execution
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkerPool {
    pub max_concurrency: usize,
    pub active_workers: usize,
    pub queue: Vec<Task>,
    // Note: HashMap doesn't serialize well, so we use Vec of tuples
    pub running: Vec<(String, Task)>,
    pub completed: Vec<(String, TaskResult)>,
    pub failed: Vec<(String, TaskResult)>,
}

/// Progress status
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProgressStatus {
    pub total: u32,
    pub completed: u32,
    pub running: u32,
    pub waiting: u32,
    pub failed: u32,
    pub percentage: f32,
}

impl ProgressStatus {
    /// Calculate percentage complete
    pub fn calculate_percentage(completed: u32, total: u32) -> f32 {
        if total == 0 {
            0.0
        } else {
            (completed as f32 / total as f32) * 100.0
        }
    }

    /// Create from counts
    pub fn from_counts(completed: u32, running: u32, waiting: u32, failed: u32) -> Self {
        let total = completed + running + waiting + failed;
        let percentage = Self::calculate_percentage(completed, total);
        Self {
            total,
            completed,
            running,
            waiting,
            failed,
            percentage,
        }
    }
}

/// Execution options
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecutionOptions {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub issues: Option<Vec<u64>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub todos: Option<Vec<String>>,
    pub concurrency: usize,
    #[serde(default)]
    pub dry_run: bool,
    #[serde(default)]
    pub ignore_dependencies: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub timeout: Option<u32>, // minutes
}

impl Default for ExecutionOptions {
    fn default() -> Self {
        Self {
            issues: None,
            todos: None,
            concurrency: 3,
            dry_run: false,
            ignore_dependencies: false,
            timeout: None,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // ========================================================================
    // Edge Tests
    // ========================================================================

    #[test]
    fn test_edge_serialization() {
        let edge = Edge {
            from: "task-1".to_string(),
            to: "task-2".to_string(),
        };

        let json = serde_json::to_string(&edge).unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed["from"], "task-1");
        assert_eq!(parsed["to"], "task-2");
    }

    #[test]
    fn test_edge_roundtrip() {
        let edge = Edge {
            from: "task-a".to_string(),
            to: "task-b".to_string(),
        };

        let json = serde_json::to_string(&edge).unwrap();
        let deserialized: Edge = serde_json::from_str(&json).unwrap();
        assert_eq!(edge.from, deserialized.from);
        assert_eq!(edge.to, deserialized.to);
    }

    // ========================================================================
    // DAG Tests
    // ========================================================================

    #[test]
    fn test_dag_has_cycles_false() {
        use crate::task::{Task, TaskType};

        let task1 = Task {
            id: "task-1".to_string(),
            title: "Task 1".to_string(),
            description: "".to_string(),
            task_type: TaskType::Feature,
            priority: 1,
            severity: None,
            impact: None,
            assigned_agent: None,
            dependencies: vec![],
            estimated_duration: None,
            status: None,
            start_time: None,
            end_time: None,
            metadata: None,
        };

        let task2 = Task {
            id: "task-2".to_string(),
            title: "Task 2".to_string(),
            description: "".to_string(),
            task_type: TaskType::Feature,
            priority: 1,
            severity: None,
            impact: None,
            assigned_agent: None,
            dependencies: vec!["task-1".to_string()],
            estimated_duration: None,
            status: None,
            start_time: None,
            end_time: None,
            metadata: None,
        };

        let dag = DAG {
            nodes: vec![task1, task2],
            edges: vec![Edge {
                from: "task-1".to_string(),
                to: "task-2".to_string(),
            }],
            levels: vec![vec!["task-1".to_string()], vec!["task-2".to_string()]],
        };

        assert!(!dag.has_cycles());
    }

    #[test]
    fn test_dag_has_cycles_true() {
        use crate::task::{Task, TaskType};

        let task1 = Task {
            id: "task-1".to_string(),
            title: "Task 1".to_string(),
            description: "".to_string(),
            task_type: TaskType::Feature,
            priority: 1,
            severity: None,
            impact: None,
            assigned_agent: None,
            dependencies: vec![],
            estimated_duration: None,
            status: None,
            start_time: None,
            end_time: None,
            metadata: None,
        };

        let dag = DAG {
            nodes: vec![task1.clone(), task1],
            edges: vec![],
            levels: vec![vec!["task-1".to_string()]], // Only 1 node in levels, but 2 in nodes
        };

        assert!(dag.has_cycles());
    }

    #[test]
    fn test_dag_critical_path() {
        use crate::task::{Task, TaskType};

        let task1 = Task {
            id: "task-1".to_string(),
            title: "Task 1".to_string(),
            description: "".to_string(),
            task_type: TaskType::Feature,
            priority: 1,
            severity: None,
            impact: None,
            assigned_agent: None,
            dependencies: vec![],
            estimated_duration: None,
            status: None,
            start_time: None,
            end_time: None,
            metadata: None,
        };

        let dag = DAG {
            nodes: vec![task1],
            edges: vec![],
            levels: vec![vec!["task-1".to_string(), "task-2".to_string()]],
        };

        let critical_path = dag.critical_path();
        assert_eq!(critical_path.len(), 2);
    }

    // ========================================================================
    // ExecutionPlan Tests
    // ========================================================================

    #[test]
    fn test_execution_plan_serialization() {
        use crate::task::{Task, TaskType};

        let task = Task {
            id: "task-1".to_string(),
            title: "Test task".to_string(),
            description: "".to_string(),
            task_type: TaskType::Feature,
            priority: 1,
            severity: None,
            impact: None,
            assigned_agent: None,
            dependencies: vec![],
            estimated_duration: Some(30),
            status: None,
            start_time: None,
            end_time: None,
            metadata: None,
        };

        let dag = DAG {
            nodes: vec![task.clone()],
            edges: vec![],
            levels: vec![vec!["task-1".to_string()]],
        };

        let plan = ExecutionPlan {
            session_id: "session-123".to_string(),
            device_identifier: "MacBook-Pro".to_string(),
            concurrency: 3,
            tasks: vec![task],
            dag,
            estimated_duration: 30,
            start_time: 1234567890,
        };

        let json = serde_json::to_string(&plan).unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed["session_id"], "session-123");
        assert_eq!(parsed["concurrency"], 3);
        assert_eq!(parsed["estimated_duration"], 30);
    }

    // ========================================================================
    // ExecutionSummary Tests
    // ========================================================================

    #[test]
    fn test_execution_summary_serialization() {
        let summary = ExecutionSummary {
            total: 10,
            completed: 8,
            failed: 1,
            escalated: 1,
            success_rate: 80.0,
        };

        let json = serde_json::to_string(&summary).unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed["total"], 10);
        assert_eq!(parsed["completed"], 8);
        assert_eq!(parsed["success_rate"], 80.0);
    }

    // ========================================================================
    // ExecutionReport Tests
    // ========================================================================

    #[test]
    fn test_execution_report_serialization() {
        use crate::task::TaskResult;

        let summary = ExecutionSummary {
            total: 5,
            completed: 5,
            failed: 0,
            escalated: 0,
            success_rate: 100.0,
        };

        let task_result = TaskResult {
            task_id: "task-1".to_string(),
            status: crate::agent::AgentStatus::Completed,
            agent_type: crate::agent::AgentType::CodeGenAgent,
            duration_ms: 5000,
            result: None,
            error: None,
        };

        let report = ExecutionReport {
            session_id: "session-456".to_string(),
            device_identifier: "GitHub-Actions".to_string(),
            start_time: 1000000,
            end_time: 1005000,
            total_duration_ms: 5000,
            summary,
            tasks: vec![task_result],
            metrics: vec![],
            escalations: vec![],
        };

        let json = serde_json::to_string(&report).unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed["session_id"], "session-456");
        assert_eq!(parsed["total_duration_ms"], 5000);
        assert_eq!(parsed["summary"]["success_rate"], 100.0);
    }

    // ========================================================================
    // WorkerPool Tests
    // ========================================================================

    #[test]
    fn test_worker_pool_serialization() {
        use crate::task::{Task, TaskType};

        let task = Task {
            id: "task-1".to_string(),
            title: "Queued task".to_string(),
            description: "".to_string(),
            task_type: TaskType::Feature,
            priority: 1,
            severity: None,
            impact: None,
            assigned_agent: None,
            dependencies: vec![],
            estimated_duration: None,
            status: None,
            start_time: None,
            end_time: None,
            metadata: None,
        };

        let pool = WorkerPool {
            max_concurrency: 5,
            active_workers: 2,
            queue: vec![task],
            running: vec![],
            completed: vec![],
            failed: vec![],
        };

        let json = serde_json::to_string(&pool).unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed["max_concurrency"], 5);
        assert_eq!(parsed["active_workers"], 2);
        assert_eq!(parsed["queue"].as_array().unwrap().len(), 1);
    }

    // ========================================================================
    // ProgressStatus Tests
    // ========================================================================

    #[test]
    fn test_progress_status_calculation() {
        let progress = ProgressStatus::from_counts(5, 2, 3, 0);
        assert_eq!(progress.total, 10);
        assert_eq!(progress.completed, 5);
        assert_eq!(progress.percentage, 50.0);
    }

    #[test]
    fn test_progress_status_zero_total() {
        let progress = ProgressStatus::from_counts(0, 0, 0, 0);
        assert_eq!(progress.percentage, 0.0);
    }

    #[test]
    fn test_progress_status_serialization() {
        let progress = ProgressStatus {
            total: 20,
            completed: 15,
            running: 3,
            waiting: 2,
            failed: 0,
            percentage: 75.0,
        };

        let json = serde_json::to_string(&progress).unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed["total"], 20);
        assert_eq!(parsed["completed"], 15);
        assert_eq!(parsed["percentage"], 75.0);
    }

    #[test]
    fn test_progress_status_calculate_percentage() {
        assert_eq!(ProgressStatus::calculate_percentage(50, 100), 50.0);
        assert_eq!(ProgressStatus::calculate_percentage(0, 100), 0.0);
        assert_eq!(ProgressStatus::calculate_percentage(100, 100), 100.0);
        assert_eq!(ProgressStatus::calculate_percentage(0, 0), 0.0);
    }

    // ========================================================================
    // ExecutionOptions Tests
    // ========================================================================

    #[test]
    fn test_execution_options_default() {
        let options = ExecutionOptions::default();
        assert_eq!(options.concurrency, 3);
        assert!(!options.dry_run);
        assert!(!options.ignore_dependencies);
        assert!(options.issues.is_none());
        assert!(options.timeout.is_none());
    }

    #[test]
    fn test_execution_options_serialization() {
        let options = ExecutionOptions {
            issues: Some(vec![1, 2, 3]),
            todos: Some(vec!["task-1".to_string(), "task-2".to_string()]),
            concurrency: 5,
            dry_run: true,
            ignore_dependencies: false,
            timeout: Some(60),
        };

        let json = serde_json::to_string(&options).unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed["concurrency"], 5);
        assert_eq!(parsed["dry_run"], true);
        assert_eq!(parsed["timeout"], 60);
        assert_eq!(parsed["issues"].as_array().unwrap().len(), 3);
    }

    #[test]
    fn test_execution_options_skip_none() {
        let options = ExecutionOptions {
            issues: None,
            todos: None,
            concurrency: 3,
            dry_run: false,
            ignore_dependencies: false,
            timeout: None,
        };

        let json = serde_json::to_string(&options).unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&json).unwrap();
        assert!(parsed.get("issues").is_none());
        assert!(parsed.get("timeout").is_none());
    }

    #[test]
    fn test_execution_options_roundtrip() {
        let options = ExecutionOptions {
            issues: Some(vec![100, 200]),
            todos: None,
            concurrency: 4,
            dry_run: true,
            ignore_dependencies: true,
            timeout: Some(120),
        };

        let json = serde_json::to_string(&options).unwrap();
        let deserialized: ExecutionOptions = serde_json::from_str(&json).unwrap();
        assert_eq!(options.concurrency, deserialized.concurrency);
        assert_eq!(options.dry_run, deserialized.dry_run);
        assert_eq!(options.timeout, deserialized.timeout);
    }

    // ========================================================================
    // ExecutionPlan Concurrency Validation Tests (Issue #202 - Priority 1.3)
    // ========================================================================

    #[test]
    fn test_concurrency_validation() {
        // Valid concurrency (1-100)
        assert!(ExecutionPlan::validate_concurrency(1).is_ok());
        assert!(ExecutionPlan::validate_concurrency(50).is_ok());
        assert!(ExecutionPlan::validate_concurrency(100).is_ok());

        // Invalid concurrency
        assert!(ExecutionPlan::validate_concurrency(0).is_err());
        assert!(ExecutionPlan::validate_concurrency(101).is_err());
        assert!(ExecutionPlan::validate_concurrency(1000).is_err());
    }

    #[test]
    fn test_execution_plan_new_with_valid_concurrency() {
        let dag = DAG {
            nodes: vec![],
            edges: vec![],
            levels: vec![],
        };

        let result = ExecutionPlan::new(
            "session-1".to_string(),
            "device-1".to_string(),
            5,
            vec![],
            dag,
            60,
        );

        assert!(result.is_ok());
        let plan = result.unwrap();
        assert_eq!(plan.concurrency, 5);
    }

    #[test]
    fn test_execution_plan_new_with_invalid_concurrency() {
        let dag = DAG {
            nodes: vec![],
            edges: vec![],
            levels: vec![],
        };

        // Concurrency too low
        let result = ExecutionPlan::new(
            "session-1".to_string(),
            "device-1".to_string(),
            0,
            vec![],
            dag.clone(),
            60,
        );
        assert!(result.is_err());

        // Concurrency too high
        let result = ExecutionPlan::new(
            "session-1".to_string(),
            "device-1".to_string(),
            101,
            vec![],
            dag,
            60,
        );
        assert!(result.is_err());
    }

    #[test]
    fn test_execution_plan_set_concurrency() {
        let dag = DAG {
            nodes: vec![],
            edges: vec![],
            levels: vec![],
        };

        let mut plan = ExecutionPlan::new(
            "session-1".to_string(),
            "device-1".to_string(),
            5,
            vec![],
            dag,
            60,
        )
        .unwrap();

        // Valid concurrency change
        assert!(plan.set_concurrency(10).is_ok());
        assert_eq!(plan.concurrency, 10);

        // Invalid concurrency change
        assert!(plan.set_concurrency(0).is_err());
        assert_eq!(plan.concurrency, 10); // Concurrency unchanged
    }
}

