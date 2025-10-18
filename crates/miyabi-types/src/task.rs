//! Task type definitions

use crate::agent::{AgentStatus, AgentType, ImpactLevel, Severity};
use crate::issue::Issue;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Task type
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum TaskType {
    Feature,
    Bug,
    Refactor,
    Docs,
    Test,
    Deployment,
}

/// Task definition
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Task {
    pub id: String,
    pub title: String,
    pub description: String,
    #[serde(rename = "type")]
    pub task_type: TaskType,
    /// Priority level (1-10, where 1 is highest)
    pub priority: u8,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub severity: Option<Severity>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub impact: Option<ImpactLevel>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub assigned_agent: Option<AgentType>,
    #[serde(default)]
    pub dependencies: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub estimated_duration: Option<u32>, // minutes
    #[serde(skip_serializing_if = "Option::is_none")]
    pub status: Option<AgentStatus>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub start_time: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub end_time: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<HashMap<String, serde_json::Value>>,
}

impl Task {
    /// Minimum priority value (highest priority)
    pub const MIN_PRIORITY: u8 = 1;

    /// Maximum priority value (lowest priority)
    pub const MAX_PRIORITY: u8 = 10;

    /// Validate priority value
    pub fn validate_priority(priority: u8) -> Result<(), crate::error::MiyabiError> {
        if !(Self::MIN_PRIORITY..=Self::MAX_PRIORITY).contains(&priority) {
            return Err(crate::error::MiyabiError::Validation(format!(
                "Task priority must be {}-{}, got {}",
                Self::MIN_PRIORITY,
                Self::MAX_PRIORITY,
                priority
            )));
        }
        Ok(())
    }

    /// Create a new Task with validated priority
    pub fn new(
        id: String,
        title: String,
        description: String,
        task_type: TaskType,
        priority: u8,
    ) -> Result<Self, crate::error::MiyabiError> {
        // Validate priority
        Self::validate_priority(priority)?;

        Ok(Self {
            id,
            title,
            description,
            task_type,
            priority,
            severity: None,
            impact: None,
            assigned_agent: None,
            dependencies: Vec::new(),
            estimated_duration: None,
            status: None,
            start_time: None,
            end_time: None,
            metadata: None,
        })
    }

    /// Set priority with validation
    pub fn set_priority(&mut self, priority: u8) -> Result<(), crate::error::MiyabiError> {
        Self::validate_priority(priority)?;
        self.priority = priority;
        Ok(())
    }
}

/// Task decomposition result from CoordinatorAgent
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskDecomposition {
    pub original_issue: Issue,
    pub tasks: Vec<Task>,
    pub dag: super::workflow::DAG,
    pub estimated_total_duration: u32,
    pub has_cycles: bool,
    pub recommendations: Vec<String>,
}

/// Task execution result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskResult {
    pub task_id: String,
    pub status: AgentStatus,
    pub agent_type: AgentType,
    pub duration_ms: u64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub result: Option<crate::agent::AgentResult>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

/// Task grouping for parallel execution
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskGroup {
    pub group_id: String,
    pub tasks: Vec<Task>,
    pub agent: AgentType,
    pub priority: u8,
    pub estimated_duration_ms: u64,
    pub worktree_path: String,
    pub level: usize, // DAG level for dependency ordering
}

/// Grouping configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GroupingConfig {
    pub min_group_size: usize,        // Default: 3
    pub max_group_size: usize,        // Default: 10
    pub max_concurrent_groups: usize, // Default: 5
    pub priority_weight: f32,         // Default: 0.3
    pub duration_weight: f32,         // Default: 0.4
    pub agent_weight: f32,            // Default: 0.3
}

impl Default for GroupingConfig {
    fn default() -> Self {
        Self {
            min_group_size: 3,
            max_group_size: 10,
            max_concurrent_groups: 5,
            priority_weight: 0.3,
            duration_weight: 0.4,
            agent_weight: 0.3,
        }
    }
}

impl Task {
    /// Validate task fields and return detailed errors
    ///
    /// # Returns
    /// * `Ok(())` if all validations pass
    /// * `Err(String)` with detailed error message if validation fails
    ///
    /// # Examples
    /// ```
    /// use miyabi_types::task::{Task, TaskType};
    ///
    /// let task = Task {
    ///     id: "task-1".to_string(),
    ///     title: "Valid task".to_string(),
    ///     description: "Description".to_string(),
    ///     task_type: TaskType::Feature,
    ///     priority: 1,
    ///     severity: None,
    ///     impact: None,
    ///     assigned_agent: None,
    ///     dependencies: vec![],
    ///     estimated_duration: Some(60),
    ///     status: None,
    ///     start_time: None,
    ///     end_time: None,
    ///     metadata: None,
    /// };
    ///
    /// assert!(task.validate().is_ok());
    /// ```
    pub fn validate(&self) -> Result<(), String> {
        // Validate ID
        if self.id.is_empty() {
            return Err(
                "Task ID cannot be empty. \
                Hint: Use format 'task-{number}' or '{feature}-{number}'"
                    .to_string(),
            );
        }

        if self.id.len() > 100 {
            return Err(format!(
                "Task ID too long ({} characters). Maximum 100 characters allowed. \
                Hint: Use shorter, descriptive IDs like 'task-123' or 'feature-xyz'",
                self.id.len()
            ));
        }

        // Validate title
        if self.title.is_empty() {
            return Err(
                "Task title cannot be empty. \
                Hint: Provide a clear, concise title describing the task"
                    .to_string(),
            );
        }

        if self.title.len() > 200 {
            return Err(format!(
                "Task title too long ({} characters). Maximum 200 characters allowed. \
                Hint: Keep titles concise and move details to description",
                self.title.len()
            ));
        }

        // Validate description
        if self.description.is_empty() {
            return Err(
                "Task description cannot be empty. \
                Hint: Provide context, requirements, and acceptance criteria"
                    .to_string(),
            );
        }

        // Validate priority range (0-3)
        if self.priority > 3 {
            return Err(format!(
                "Invalid priority {}. Must be 0 (P0-Critical), 1 (P1-High), 2 (P2-Medium), or 3 (P3-Low). \
                Hint: P0=Critical/Urgent, P1=High, P2=Medium, P3=Low",
                self.priority
            ));
        }

        // Validate estimated_duration if present
        if let Some(duration) = self.estimated_duration {
            if duration == 0 {
                return Err(
                    "Estimated duration cannot be 0. \
                    Hint: Provide realistic estimate in minutes, or omit if unknown"
                        .to_string(),
                );
            }

            if duration > 10080 {
                // 7 days in minutes
                return Err(format!(
                    "Estimated duration too long ({} minutes = {:.1} days). Consider splitting into smaller tasks. \
                    Hint: Tasks should typically be < 1 day (1440 minutes)",
                    duration,
                    duration as f64 / 1440.0
                ));
            }
        }

        // Validate timestamps if both present
        if let (Some(start), Some(end)) = (self.start_time, self.end_time) {
            if end < start {
                return Err(format!(
                    "Invalid time range: end_time ({}) < start_time ({}). \
                    Hint: Ensure end_time is after start_time",
                    end, start
                ));
            }
        }

        // Validate dependencies don't include self
        if self.dependencies.contains(&self.id) {
            return Err(format!(
                "Task cannot depend on itself (ID: {}). \
                Hint: Remove self-reference from dependencies list",
                self.id
            ));
        }

        Ok(())
    }

    /// Check if task is ready to be executed (all dependencies met)
    pub fn is_ready(&self, completed_tasks: &[String]) -> bool {
        self.dependencies
            .iter()
            .all(|dep| completed_tasks.contains(dep))
    }

    /// Get task urgency score (0.0 - 1.0) based on priority and severity
    pub fn urgency_score(&self) -> f64 {
        let priority_score = 1.0 - (self.priority as f64 / 3.0);

        let severity_mult = match self.severity {
            Some(crate::agent::Severity::Critical) => 1.5,
            Some(crate::agent::Severity::High) => 1.25,
            Some(crate::agent::Severity::Medium) => 1.0,
            Some(crate::agent::Severity::Low) => 0.75,
            Some(crate::agent::Severity::Trivial) => 0.5,
            None => 1.0,
        };

        (priority_score * severity_mult).min(1.0)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // ========================================================================
    // TaskType Tests
    // ========================================================================

    #[test]
    fn test_task_type_serialization() {
        let task_type = TaskType::Feature;
        let json = serde_json::to_string(&task_type).unwrap();
        assert_eq!(json, "\"feature\"");

        let task_type = TaskType::Bug;
        let json = serde_json::to_string(&task_type).unwrap();
        assert_eq!(json, "\"bug\"");

        let task_type = TaskType::Deployment;
        let json = serde_json::to_string(&task_type).unwrap();
        assert_eq!(json, "\"deployment\"");
    }

    #[test]
    fn test_task_type_deserialization() {
        let json = "\"feature\"";
        let task_type: TaskType = serde_json::from_str(json).unwrap();
        assert_eq!(task_type, TaskType::Feature);

        let json = "\"refactor\"";
        let task_type: TaskType = serde_json::from_str(json).unwrap();
        assert_eq!(task_type, TaskType::Refactor);
    }

    #[test]
    fn test_task_type_roundtrip() {
        let types = vec![
            TaskType::Feature,
            TaskType::Bug,
            TaskType::Refactor,
            TaskType::Docs,
            TaskType::Test,
            TaskType::Deployment,
        ];

        for task_type in types {
            let json = serde_json::to_string(&task_type).unwrap();
            let deserialized: TaskType = serde_json::from_str(&json).unwrap();
            assert_eq!(task_type, deserialized);
        }
    }

    // ========================================================================
    // Task Tests
    // ========================================================================

    #[test]
    fn test_task_minimal() {
        let task = Task {
            id: "task-001".to_string(),
            title: "Implement feature X".to_string(),
            description: "Add new feature".to_string(),
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

        let json = serde_json::to_string(&task).unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed["id"], "task-001");
        assert_eq!(parsed["type"], "feature");
        assert_eq!(parsed["priority"], 1);
    }

    #[test]
    fn test_task_with_all_fields() {
        let mut metadata = HashMap::new();
        metadata.insert("pr_number".to_string(), serde_json::json!(123));

        let task = Task {
            id: "task-002".to_string(),
            title: "Fix critical bug".to_string(),
            description: "Fix security issue".to_string(),
            task_type: TaskType::Bug,
            priority: 0,
            severity: Some(Severity::Critical),
            impact: Some(ImpactLevel::Critical),
            assigned_agent: Some(AgentType::CodeGenAgent),
            dependencies: vec!["task-001".to_string()],
            estimated_duration: Some(120),
            status: Some(AgentStatus::Running),
            start_time: Some(1234567890),
            end_time: Some(1234567990),
            metadata: Some(metadata),
        };

        let json = serde_json::to_string(&task).unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed["id"], "task-002");
        assert_eq!(parsed["severity"], "Sev.1-Critical");
        assert_eq!(parsed["assigned_agent"], "CodeGenAgent");
        assert_eq!(parsed["dependencies"][0], "task-001");
        assert_eq!(parsed["metadata"]["pr_number"], 123);
    }

    #[test]
    fn test_task_serialization_skip_none() {
        let task = Task {
            id: "task-003".to_string(),
            title: "Write docs".to_string(),
            description: "Documentation".to_string(),
            task_type: TaskType::Docs,
            priority: 2,
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

        let json = serde_json::to_string(&task).unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&json).unwrap();
        assert!(parsed.get("severity").is_none());
        assert!(parsed.get("impact").is_none());
        assert!(parsed.get("assigned_agent").is_none());
    }

    #[test]
    fn test_task_roundtrip() {
        let task = Task {
            id: "task-004".to_string(),
            title: "Refactor code".to_string(),
            description: "Clean up".to_string(),
            task_type: TaskType::Refactor,
            priority: 3,
            severity: Some(Severity::Low),
            impact: Some(ImpactLevel::Low),
            assigned_agent: Some(AgentType::ReviewAgent),
            dependencies: vec!["task-002".to_string(), "task-003".to_string()],
            estimated_duration: Some(60),
            status: Some(AgentStatus::Completed),
            start_time: None,
            end_time: None,
            metadata: None,
        };

        let json = serde_json::to_string(&task).unwrap();
        let deserialized: Task = serde_json::from_str(&json).unwrap();
        assert_eq!(task.id, deserialized.id);
        assert_eq!(task.title, deserialized.title);
        assert_eq!(task.task_type, deserialized.task_type);
        assert_eq!(task.dependencies.len(), deserialized.dependencies.len());
    }

    // ========================================================================
    // TaskDecomposition Tests
    // ========================================================================

    #[test]
    fn test_task_decomposition_structure() {
        use crate::issue::IssueStateGithub;
        use crate::workflow::DAG;

        let issue = Issue {
            number: 1,
            title: "Test issue".to_string(),
            body: "Description".to_string(),
            state: IssueStateGithub::Open,
            labels: vec![],
            assignee: None,
            created_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
            url: "https://github.com/user/repo/issues/1".to_string(),
        };

        let task = Task {
            id: "task-1".to_string(),
            title: "Subtask".to_string(),
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

        let decomposition = TaskDecomposition {
            original_issue: issue,
            tasks: vec![task],
            dag,
            estimated_total_duration: 30,
            has_cycles: false,
            recommendations: vec!["Run tests".to_string()],
        };

        let json = serde_json::to_string(&decomposition).unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed["estimated_total_duration"], 30);
        assert_eq!(parsed["has_cycles"], false);
        assert_eq!(parsed["recommendations"][0], "Run tests");
    }

    // ========================================================================
    // TaskResult Tests
    // ========================================================================

    #[test]
    fn test_task_result_serialization() {
        let result = TaskResult {
            task_id: "task-101".to_string(),
            status: AgentStatus::Completed,
            agent_type: AgentType::CodeGenAgent,
            duration_ms: 5000,
            result: None,
            error: None,
        };

        let json = serde_json::to_string(&result).unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed["task_id"], "task-101");
        assert_eq!(parsed["status"], "completed");
        assert_eq!(parsed["agent_type"], "CodeGenAgent");
        assert_eq!(parsed["duration_ms"], 5000);
    }

    #[test]
    fn test_task_result_with_error() {
        let result = TaskResult {
            task_id: "task-102".to_string(),
            status: AgentStatus::Failed,
            agent_type: AgentType::DeploymentAgent,
            duration_ms: 1000,
            result: None,
            error: Some("Deployment failed".to_string()),
        };

        let json = serde_json::to_string(&result).unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed["error"], "Deployment failed");
    }

    #[test]
    fn test_task_result_roundtrip() {
        let result = TaskResult {
            task_id: "task-103".to_string(),
            status: AgentStatus::Running,
            agent_type: AgentType::ReviewAgent,
            duration_ms: 3000,
            result: None,
            error: None,
        };

        let json = serde_json::to_string(&result).unwrap();
        let deserialized: TaskResult = serde_json::from_str(&json).unwrap();
        assert_eq!(result.task_id, deserialized.task_id);
        assert_eq!(result.status, deserialized.status);
    }

    // ========================================================================
    // TaskGroup Tests
    // ========================================================================

    #[test]
    fn test_task_group_serialization() {
        let task = Task {
            id: "task-201".to_string(),
            title: "Group task".to_string(),
            description: "".to_string(),
            task_type: TaskType::Test,
            priority: 1,
            severity: None,
            impact: None,
            assigned_agent: None,
            dependencies: vec![],
            estimated_duration: Some(10),
            status: None,
            start_time: None,
            end_time: None,
            metadata: None,
        };

        let group = TaskGroup {
            group_id: "group-1".to_string(),
            tasks: vec![task],
            agent: AgentType::CodeGenAgent,
            priority: 1,
            estimated_duration_ms: 600000,
            worktree_path: ".worktrees/group-1".to_string(),
            level: 0,
        };

        let json = serde_json::to_string(&group).unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed["group_id"], "group-1");
        assert_eq!(parsed["agent"], "CodeGenAgent");
        assert_eq!(parsed["level"], 0);
    }

    #[test]
    fn test_task_group_roundtrip() {
        let group = TaskGroup {
            group_id: "group-2".to_string(),
            tasks: vec![],
            agent: AgentType::ReviewAgent,
            priority: 2,
            estimated_duration_ms: 300000,
            worktree_path: ".worktrees/group-2".to_string(),
            level: 1,
        };

        let json = serde_json::to_string(&group).unwrap();
        let deserialized: TaskGroup = serde_json::from_str(&json).unwrap();
        assert_eq!(group.group_id, deserialized.group_id);
        assert_eq!(group.agent, deserialized.agent);
        assert_eq!(group.level, deserialized.level);
    }

    // ========================================================================
    // GroupingConfig Tests
    // ========================================================================

    #[test]
    fn test_grouping_config_default() {
        let config = GroupingConfig::default();
        assert_eq!(config.min_group_size, 3);
        assert_eq!(config.max_group_size, 10);
        assert_eq!(config.max_concurrent_groups, 5);
        assert_eq!(config.priority_weight, 0.3);
        assert_eq!(config.duration_weight, 0.4);
        assert_eq!(config.agent_weight, 0.3);
    }

    #[test]
    fn test_grouping_config_serialization() {
        let config = GroupingConfig::default();
        let json = serde_json::to_string(&config).unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed["min_group_size"], 3);
        assert_eq!(parsed["max_group_size"], 10);
    }

    #[test]
    fn test_grouping_config_custom() {
        let config = GroupingConfig {
            min_group_size: 5,
            max_group_size: 15,
            max_concurrent_groups: 8,
            priority_weight: 0.5,
            duration_weight: 0.3,
            agent_weight: 0.2,
        };

        let json = serde_json::to_string(&config).unwrap();
        let deserialized: GroupingConfig = serde_json::from_str(&json).unwrap();
        assert_eq!(config.min_group_size, deserialized.min_group_size);
        assert_eq!(config.priority_weight, deserialized.priority_weight);
    }

    #[test]
    fn test_grouping_config_roundtrip() {
        let config = GroupingConfig {
            min_group_size: 2,
            max_group_size: 20,
            max_concurrent_groups: 10,
            priority_weight: 0.25,
            duration_weight: 0.5,
            agent_weight: 0.25,
        };

        let json = serde_json::to_string(&config).unwrap();
        let deserialized: GroupingConfig = serde_json::from_str(&json).unwrap();
        assert_eq!(config.min_group_size, deserialized.min_group_size);
        assert_eq!(
            config.max_concurrent_groups,
            deserialized.max_concurrent_groups
        );
    }

    // ========================================================================
    // Task Validation Tests
    // ========================================================================

    fn create_valid_task() -> Task {
        Task {
            id: "task-1".to_string(),
            title: "Valid task title".to_string(),
            description: "Valid description with context".to_string(),
            task_type: TaskType::Feature,
            priority: 1,
            severity: Some(Severity::Medium),
            impact: None,
            assigned_agent: None,
            dependencies: vec![],
            estimated_duration: Some(60),
            status: None,
            start_time: None,
            end_time: None,
            metadata: None,
        }
    }

    #[test]
    fn test_task_validate_valid() {
        let task = create_valid_task();
        assert!(task.validate().is_ok());
    }

    #[test]
    fn test_task_validate_empty_id() {
        let mut task = create_valid_task();
        task.id = "".to_string();
        let result = task.validate();
        assert!(result.is_err());
        let err_msg = result.unwrap_err();
        assert!(err_msg.contains("Task ID cannot be empty"));
        assert!(err_msg.contains("Hint:"));
    }

    #[test]
    fn test_task_validate_long_id() {
        let mut task = create_valid_task();
        task.id = "a".repeat(101);
        let result = task.validate();
        assert!(result.is_err());
        let err_msg = result.unwrap_err();
        assert!(err_msg.contains("Task ID too long"));
        assert!(err_msg.contains("101 characters"));
    }

    #[test]
    fn test_task_validate_empty_title() {
        let mut task = create_valid_task();
        task.title = "".to_string();
        let result = task.validate();
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Task title cannot be empty"));
    }

    #[test]
    fn test_task_validate_long_title() {
        let mut task = create_valid_task();
        task.title = "a".repeat(201);
        let result = task.validate();
        assert!(result.is_err());
        let err_msg = result.unwrap_err();
        assert!(err_msg.contains("Task title too long"));
        assert!(err_msg.contains("201 characters"));
    }

    #[test]
    fn test_task_validate_empty_description() {
        let mut task = create_valid_task();
        task.description = "".to_string();
        let result = task.validate();
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Task description cannot be empty"));
    }

    #[test]
    fn test_task_validate_invalid_priority() {
        let mut task = create_valid_task();
        task.priority = 4;
        let result = task.validate();
        assert!(result.is_err());
        let err_msg = result.unwrap_err();
        assert!(err_msg.contains("Invalid priority 4"));
        assert!(err_msg.contains("P0-Critical"));
        assert!(err_msg.contains("P3-Low"));
    }

    #[test]
    fn test_task_validate_zero_duration() {
        let mut task = create_valid_task();
        task.estimated_duration = Some(0);
        let result = task.validate();
        assert!(result.is_err());
        assert!(result
            .unwrap_err()
            .contains("Estimated duration cannot be 0"));
    }

    #[test]
    fn test_task_validate_long_duration() {
        let mut task = create_valid_task();
        task.estimated_duration = Some(10081); // > 7 days
        let result = task.validate();
        assert!(result.is_err());
        let err_msg = result.unwrap_err();
        assert!(err_msg.contains("Estimated duration too long"));
        assert!(err_msg.contains("10081 minutes"));
        assert!(err_msg.contains("days"));
    }

    #[test]
    fn test_task_validate_invalid_timestamps() {
        let mut task = create_valid_task();
        task.start_time = Some(1000);
        task.end_time = Some(500); // end < start
        let result = task.validate();
        assert!(result.is_err());
        let err_msg = result.unwrap_err();
        assert!(err_msg.contains("Invalid time range"));
        assert!(err_msg.contains("end_time (500) < start_time (1000)"));
    }

    #[test]
    fn test_task_validate_self_dependency() {
        let mut task = create_valid_task();
        task.dependencies = vec!["task-1".to_string()]; // self-reference
        let result = task.validate();
        assert!(result.is_err());
        let err_msg = result.unwrap_err();
        assert!(err_msg.contains("Task cannot depend on itself"));
        assert!(err_msg.contains("ID: task-1"));
    }

    #[test]
    fn test_task_validate_valid_timestamps() {
        let mut task = create_valid_task();
        task.start_time = Some(500);
        task.end_time = Some(1000);
        assert!(task.validate().is_ok());
    }

    #[test]
    fn test_task_validate_valid_priority_range() {
        for priority in 0..=3 {
            let mut task = create_valid_task();
            task.priority = priority;
            assert!(task.validate().is_ok());
        }
    }

    #[test]
    fn test_task_validate_valid_duration() {
        let mut task = create_valid_task();
        task.estimated_duration = Some(1440); // 1 day
        assert!(task.validate().is_ok());

        task.estimated_duration = Some(10080); // 7 days (max)
        assert!(task.validate().is_ok());
    }

    // ========================================================================
    // Task is_ready Tests
    // ========================================================================

    #[test]
    fn test_task_is_ready_no_dependencies() {
        let task = create_valid_task();
        assert!(task.is_ready(&[]));
        assert!(task.is_ready(&["task-2".to_string()]));
    }

    #[test]
    fn test_task_is_ready_with_dependencies() {
        let mut task = create_valid_task();
        task.dependencies = vec!["task-2".to_string(), "task-3".to_string()];

        // Not ready when dependencies incomplete
        assert!(!task.is_ready(&[]));
        assert!(!task.is_ready(&["task-2".to_string()]));

        // Ready when all dependencies complete
        assert!(task.is_ready(&["task-2".to_string(), "task-3".to_string()]));
        assert!(task.is_ready(&[
            "task-2".to_string(),
            "task-3".to_string(),
            "task-4".to_string()
        ]));
    }

    // ========================================================================
    // Task urgency_score Tests
    // ========================================================================

    #[test]
    fn test_task_urgency_score_priority_only() {
        let mut task = create_valid_task();

        // P0 (Critical) = 1.0
        task.priority = 0;
        task.severity = None;
        assert!((task.urgency_score() - 1.0).abs() < 0.01);

        // P1 (High) = 0.667
        task.priority = 1;
        assert!((task.urgency_score() - 0.667).abs() < 0.01);

        // P2 (Medium) = 0.333
        task.priority = 2;
        assert!((task.urgency_score() - 0.333).abs() < 0.01);

        // P3 (Low) = 0.0
        task.priority = 3;
        assert!(task.urgency_score() < 0.01);
    }

    #[test]
    fn test_task_urgency_score_with_severity() {
        let mut task = create_valid_task();
        task.priority = 1; // Base 0.667

        // Critical severity (1.5x multiplier)
        task.severity = Some(Severity::Critical);
        assert!(task.urgency_score() >= 1.0); // Capped at 1.0

        // High severity (1.25x multiplier)
        task.severity = Some(Severity::High);
        assert!((task.urgency_score() - 0.834).abs() < 0.01);

        // Medium severity (1.0x multiplier)
        task.severity = Some(Severity::Medium);
        assert!((task.urgency_score() - 0.667).abs() < 0.01);

        // Low severity (0.75x multiplier)
        task.severity = Some(Severity::Low);
        assert!((task.urgency_score() - 0.500).abs() < 0.01);
    }

    #[test]
    fn test_task_urgency_score_max_capped() {
        let mut task = create_valid_task();
        task.priority = 0; // Highest priority (1.0)
        task.severity = Some(Severity::Critical); // 1.5x multiplier

        // Should be capped at 1.0
        assert!((task.urgency_score() - 1.0).abs() < 0.01);
    }

    #[test]
    fn test_task_urgency_score_combinations() {
        let mut task = create_valid_task();

        // P0 + Critical = 1.0 (capped)
        task.priority = 0;
        task.severity = Some(Severity::Critical);
        assert_eq!(task.urgency_score(), 1.0);

        // P2 + High = 0.417
        task.priority = 2;
        task.severity = Some(Severity::High);
        assert!((task.urgency_score() - 0.417).abs() < 0.01);

        // P3 + Low = 0.0
        task.priority = 3;
        task.severity = Some(Severity::Low);
        assert!(task.urgency_score() < 0.01);
    }

    // ========================================================================
    // Task Priority Validation Tests (Issue #202 - Priority 1.2)
    // ========================================================================

    #[test]
    fn test_task_priority_validation() {
        // Valid priorities (1-10)
        assert!(Task::validate_priority(1).is_ok());
        assert!(Task::validate_priority(5).is_ok());
        assert!(Task::validate_priority(10).is_ok());

        // Invalid priorities
        assert!(Task::validate_priority(0).is_err());
        assert!(Task::validate_priority(11).is_err());
        assert!(Task::validate_priority(255).is_err());
    }

    #[test]
    fn test_task_new_with_valid_priority() {
        let result = Task::new(
            "task-1".to_string(),
            "Test Task".to_string(),
            "Description".to_string(),
            TaskType::Feature,
            5,
        );

        assert!(result.is_ok());
        let task = result.unwrap();
        assert_eq!(task.priority, 5);
        assert_eq!(task.id, "task-1");
    }

    #[test]
    fn test_task_new_with_invalid_priority() {
        // Priority too low
        let result = Task::new(
            "task-1".to_string(),
            "Test Task".to_string(),
            "Description".to_string(),
            TaskType::Feature,
            0,
        );
        assert!(result.is_err());

        // Priority too high
        let result = Task::new(
            "task-1".to_string(),
            "Test Task".to_string(),
            "Description".to_string(),
            TaskType::Feature,
            11,
        );
        assert!(result.is_err());
    }

    #[test]
    fn test_task_set_priority() {
        let mut task = Task::new(
            "task-1".to_string(),
            "Test Task".to_string(),
            "Description".to_string(),
            TaskType::Feature,
            5,
        )
        .unwrap();

        // Valid priority change
        assert!(task.set_priority(8).is_ok());
        assert_eq!(task.priority, 8);

        // Invalid priority change
        assert!(task.set_priority(0).is_err());
        assert_eq!(task.priority, 8); // Priority unchanged
    }
}

