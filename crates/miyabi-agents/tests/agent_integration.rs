//! Integration tests for Agent system

use miyabi_agents::base::BaseAgent;
use miyabi_agents::codegen::CodeGenAgent;
use miyabi_agents::coordinator::CoordinatorAgent;
use miyabi_types::{AgentConfig, AgentType, Issue, Task};
use std::collections::HashMap;

fn create_test_config() -> AgentConfig {
    AgentConfig {
        device_identifier: "test-device".to_string(),
        github_token: "ghp_test_token".to_string(),
        use_task_tool: false,
        use_worktree: false,
        worktree_base_path: None,
        log_directory: "./logs".to_string(),
        report_directory: "./reports".to_string(),
        tech_lead_github_username: None,
        ciso_github_username: None,
        po_github_username: None,
        firebase_production_project: None,
        firebase_staging_project: None,
        production_url: None,
        staging_url: None,
    }
}

fn create_test_issue() -> Issue {
    Issue {
        number: 123,
        title: "Test issue".to_string(),
        body: "Test issue body".to_string(),
        state: miyabi_types::issue::IssueStateGithub::Open,
        labels: vec!["type:feature".to_string()],
        assignee: None,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
        url: "https://github.com/test/repo/issues/123".to_string(),
    }
}

#[tokio::test]
async fn test_coordinator_workflow() {
    let config = create_test_config();
    let agent = CoordinatorAgent::new(config);
    let issue = create_test_issue();

    // Decompose issue into tasks
    let result = agent.decompose_issue(&issue).await;
    assert!(result.is_ok());

    let decomposition = result.unwrap();

    // Verify task decomposition
    assert_eq!(decomposition.tasks.len(), 4);
    assert!(!decomposition.has_cycles);
    assert!(decomposition.estimated_total_duration > 0);

    // Verify DAG structure
    assert_eq!(decomposition.dag.levels.len(), 4);
    assert_eq!(decomposition.dag.nodes.len(), 4);
    assert_eq!(decomposition.dag.edges.len(), 3);
}

#[tokio::test]
async fn test_codegen_workflow() {
    let config = create_test_config();
    let agent = CodeGenAgent::new(config);

    let task = Task {
        id: "test-task-1".to_string(),
        title: "Implement feature X".to_string(),
        description: "Implement feature X with tests".to_string(),
        task_type: miyabi_types::task::TaskType::Feature,
        priority: 1,
        severity: None,
        impact: None,
        assigned_agent: Some(AgentType::CodeGenAgent),
        dependencies: vec![],
        estimated_duration: Some(30),
        status: None,
        start_time: None,
        end_time: None,
        metadata: None,
    };

    // Execute task
    let result = agent.execute(&task).await;
    assert!(result.is_ok());

    let agent_result = result.unwrap();
    assert_eq!(agent_result.status, miyabi_types::agent::ResultStatus::Success);
    assert!(agent_result.metrics.is_some());
}

#[tokio::test]
async fn test_agent_type_identification() {
    let config = create_test_config();

    let coordinator = CoordinatorAgent::new(config.clone());
    assert_eq!(coordinator.agent_type(), AgentType::CoordinatorAgent);

    let codegen = CodeGenAgent::new(config.clone());
    assert_eq!(codegen.agent_type(), AgentType::CodeGenAgent);
}

#[tokio::test]
async fn test_coordinator_execute() {
    let config = create_test_config();
    let agent = CoordinatorAgent::new(config);

    let task = Task {
        id: "coordinator-task-1".to_string(),
        title: "Coordinate issue #123".to_string(),
        description: "Decompose issue into tasks".to_string(),
        task_type: miyabi_types::task::TaskType::Feature,
        priority: 0,
        severity: None,
        impact: None,
        assigned_agent: Some(AgentType::CoordinatorAgent),
        dependencies: vec![],
        estimated_duration: Some(5),
        status: None,
        start_time: None,
        end_time: None,
        metadata: Some(HashMap::from([
            ("issue_number".to_string(), serde_json::json!(123)),
        ])),
    };

    let result = agent.execute(&task).await;
    assert!(result.is_ok());

    let agent_result = result.unwrap();
    assert_eq!(agent_result.status, miyabi_types::agent::ResultStatus::Success);
    assert!(agent_result.data.is_some());
    assert!(agent_result.metrics.is_some());
}

#[tokio::test]
async fn test_codegen_invalid_task_type() {
    let config = create_test_config();
    let agent = CodeGenAgent::new(config);

    let task = Task {
        id: "test-task-docs".to_string(),
        title: "Write documentation".to_string(),
        description: "Documentation task".to_string(),
        task_type: miyabi_types::task::TaskType::Docs, // Invalid for CodeGen
        priority: 1,
        severity: None,
        impact: None,
        assigned_agent: Some(AgentType::CodeGenAgent),
        dependencies: vec![],
        estimated_duration: Some(10),
        status: None,
        start_time: None,
        end_time: None,
        metadata: None,
    };

    // Should fail with validation error
    let result = agent.generate_code(&task).await;
    assert!(result.is_err());
}

#[tokio::test]
async fn test_coordinator_with_different_labels() {
    let config = create_test_config();
    let agent = CoordinatorAgent::new(config);

    // Test with bug label
    let mut issue = create_test_issue();
    issue.labels = vec!["type:bug".to_string()];

    let result = agent.decompose_issue(&issue).await;
    assert!(result.is_ok());

    let decomposition = result.unwrap();
    // Task type should be Bug
    assert!(decomposition.tasks.iter().any(|t| t.task_type == miyabi_types::task::TaskType::Bug));
}
