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
}
