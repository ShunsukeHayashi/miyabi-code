//! Integration tests for agent-core ↔ agents interaction
//! Tests the interaction between miyabi-agent-core and miyabi-agents

use miyabi_agent_codegen::CodeGenAgent;
use miyabi_agent_coordinator::CoordinatorAgent;
use miyabi_agent_core::BaseAgent;
use miyabi_agent_review::ReviewAgent;
use miyabi_types::{AgentConfig, AgentType, Issue, Task, TaskType};

/// Helper to create test agent config
fn create_test_agent_config() -> AgentConfig {
    AgentConfig {
        device_identifier: "test-device".to_string(),
        github_token: "ghp_test_token".to_string(),
        repo_owner: Some("test-owner".to_string()),
        repo_name: Some("test-repo".to_string()),
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

/// Helper to create test issue
fn create_test_issue(number: u64) -> Issue {
    Issue {
        number,
        title: format!("Test issue #{}", number),
        body: "Test issue body".to_string(),
        state: miyabi_types::issue::IssueStateGithub::Open,
        labels: vec!["type:feature".to_string()],
        assignee: None,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
        url: format!("https://github.com/test/repo/issues/{}", number),
    }
}

#[tokio::test]
async fn test_coordinator_agent_initialization() {
    let config = create_test_agent_config();
    let agent = CoordinatorAgent::new(config);

    assert_eq!(agent.agent_type(), AgentType::CoordinatorAgent);
    assert_eq!(agent.name(), "CoordinatorAgent");
}

#[tokio::test]
async fn test_codegen_agent_initialization() {
    let config = create_test_agent_config();
    let agent = CodeGenAgent::new(config);

    assert_eq!(agent.agent_type(), AgentType::CodeGenAgent);
    assert_eq!(agent.name(), "CodeGenAgent");
}

#[tokio::test]
async fn test_review_agent_initialization() {
    let config = create_test_agent_config();
    let agent = ReviewAgent::new(config);

    assert_eq!(agent.agent_type(), AgentType::ReviewAgent);
    assert_eq!(agent.name(), "ReviewAgent");
}

#[tokio::test]
async fn test_agent_config_propagation() {
    let config = create_test_agent_config();
    let device_id = config.device_identifier.clone();

    let agent = CoordinatorAgent::new(config);

    // Verify config was properly set
    assert_eq!(agent.config().device_identifier, device_id);
}

#[test]
fn test_agent_type_mapping() {
    let agent_types = vec![
        AgentType::CoordinatorAgent,
        AgentType::CodeGenAgent,
        AgentType::ReviewAgent,
        AgentType::IssueAgent,
        AgentType::PRAgent,
        AgentType::DeploymentAgent,
        AgentType::RefresherAgent,
    ];

    for agent_type in agent_types {
        let name = agent_type.to_string();
        assert!(!name.is_empty());
    }
}

#[test]
fn test_task_agent_assignment() {
    let task_types = vec![
        (TaskType::Feature, AgentType::CodeGenAgent),
        (TaskType::Bug, AgentType::CodeGenAgent),
        (TaskType::Refactor, AgentType::ReviewAgent),
        (TaskType::Test, AgentType::CodeGenAgent),
        (TaskType::Docs, AgentType::CodeGenAgent),
    ];

    for (task_type, expected_agent) in task_types {
        let task = Task {
            id: "test-task".to_string(),
            title: "Test task".to_string(),
            description: "Test description".to_string(),
            task_type,
            priority: 1,
            severity: None,
            impact: None,
            assigned_agent: Some(expected_agent),
            dependencies: vec![],
            estimated_duration: Some(60),
            status: None,
            start_time: None,
            end_time: None,
            metadata: None,
        };

        assert_eq!(task.assigned_agent, Some(expected_agent));
    }
}

#[tokio::test]
async fn test_agent_execution_context() {
    let config = create_test_agent_config();
    let agent = CodeGenAgent::new(config);
    let issue = create_test_issue(418);

    // Agent should be able to process issue
    assert_eq!(agent.agent_type(), AgentType::CodeGenAgent);
    assert!(issue.number > 0);
}

#[test]
fn test_agent_priority_ordering() {
    let tasks = vec![
        Task {
            id: "task-1".to_string(),
            title: "Low priority".to_string(),
            description: "".to_string(),
            task_type: TaskType::Feature,
            priority: 3,
            severity: None,
            impact: None,
            assigned_agent: Some(AgentType::CodeGenAgent),
            dependencies: vec![],
            estimated_duration: None,
            status: None,
            start_time: None,
            end_time: None,
            metadata: None,
        },
        Task {
            id: "task-2".to_string(),
            title: "High priority".to_string(),
            description: "".to_string(),
            task_type: TaskType::Bug,
            priority: 0,
            severity: None,
            impact: None,
            assigned_agent: Some(AgentType::CodeGenAgent),
            dependencies: vec![],
            estimated_duration: None,
            status: None,
            start_time: None,
            end_time: None,
            metadata: None,
        },
    ];

    // Lower priority number = higher priority
    assert!(tasks[1].priority < tasks[0].priority);
}

#[test]
fn test_agent_dependencies() {
    let task_with_deps = Task {
        id: "task-2".to_string(),
        title: "Dependent task".to_string(),
        description: "".to_string(),
        task_type: TaskType::Test,
        priority: 1,
        severity: None,
        impact: None,
        assigned_agent: Some(AgentType::CodeGenAgent),
        dependencies: vec!["task-1".to_string()],
        estimated_duration: None,
        status: None,
        start_time: None,
        end_time: None,
        metadata: None,
    };

    assert_eq!(task_with_deps.dependencies.len(), 1);
    assert_eq!(task_with_deps.dependencies[0], "task-1");
}

#[test]
fn test_agent_metadata_handling() {
    let mut metadata = std::collections::HashMap::new();
    metadata.insert("issue_number".to_string(), "418".to_string());

    let task = Task {
        id: "task-1".to_string(),
        title: "Task with metadata".to_string(),
        description: "".to_string(),
        task_type: TaskType::Feature,
        priority: 1,
        severity: None,
        impact: None,
        assigned_agent: Some(AgentType::CodeGenAgent),
        dependencies: vec![],
        estimated_duration: None,
        status: None,
        start_time: None,
        end_time: None,
        metadata: Some(metadata.clone()),
    };

    assert!(task.metadata.is_some());
    assert_eq!(task.metadata.unwrap().get("issue_number").unwrap(), "418");
}

#[tokio::test]
async fn test_multiple_agents_initialization() {
    let config1 = create_test_agent_config();
    let config2 = create_test_agent_config();
    let config3 = create_test_agent_config();

    let coordinator = CoordinatorAgent::new(config1);
    let codegen = CodeGenAgent::new(config2);
    let review = ReviewAgent::new(config3);

    assert_eq!(coordinator.agent_type(), AgentType::CoordinatorAgent);
    assert_eq!(codegen.agent_type(), AgentType::CodeGenAgent);
    assert_eq!(review.agent_type(), AgentType::ReviewAgent);
}

#[test]
fn test_agent_error_handling() {
    // Test with invalid config
    let mut config = create_test_agent_config();
    config.github_token = "".to_string();

    // Agent should still initialize but operations might fail
    let agent = CoordinatorAgent::new(config);
    assert_eq!(agent.agent_type(), AgentType::CoordinatorAgent);
}

#[test]
fn test_task_estimation() {
    let task = Task {
        id: "task-1".to_string(),
        title: "Estimated task".to_string(),
        description: "".to_string(),
        task_type: TaskType::Feature,
        priority: 1,
        severity: None,
        impact: None,
        assigned_agent: Some(AgentType::CodeGenAgent),
        dependencies: vec![],
        estimated_duration: Some(120), // 2 hours
        status: None,
        start_time: None,
        end_time: None,
        metadata: None,
    };

    assert_eq!(task.estimated_duration, Some(120));
}

#[test]
fn test_agent_config_serialization() {
    let config = create_test_agent_config();

    // Test JSON serialization
    let json = serde_json::to_string(&config).unwrap();
    assert!(json.contains("test-device"));
    assert!(json.contains("ghp_test_token"));

    // Test deserialization
    let deserialized: AgentConfig = serde_json::from_str(&json).unwrap();
    assert_eq!(deserialized.device_identifier, config.device_identifier);
}

#[test]
fn test_issue_to_tasks_conversion() {
    let issue = create_test_issue(418);

    // Convert issue to tasks
    let tasks = vec![
        Task {
            id: format!("task-{}-impl", issue.number),
            title: format!("Implement {}", issue.title),
            description: issue.body.clone(),
            task_type: TaskType::Feature,
            priority: 1,
            severity: None,
            impact: None,
            assigned_agent: Some(AgentType::CodeGenAgent),
            dependencies: vec![],
            estimated_duration: Some(60),
            status: None,
            start_time: None,
            end_time: None,
            metadata: None,
        },
        Task {
            id: format!("task-{}-test", issue.number),
            title: format!("Test {}", issue.title),
            description: "Add tests".to_string(),
            task_type: TaskType::Test,
            priority: 2,
            severity: None,
            impact: None,
            assigned_agent: Some(AgentType::CodeGenAgent),
            dependencies: vec![format!("task-{}-impl", issue.number)],
            estimated_duration: Some(30),
            status: None,
            start_time: None,
            end_time: None,
            metadata: None,
        },
    ];

    assert_eq!(tasks.len(), 2);
    assert_eq!(
        tasks[1].dependencies[0],
        format!("task-{}-impl", issue.number)
    );
}

#[test]
fn test_agent_worktree_config() {
    let mut config = create_test_agent_config();
    config.use_worktree = true;
    config.worktree_base_path = Some(".worktrees".into());

    let agent = CoordinatorAgent::new(config);

    assert!(agent.config().use_worktree);
    assert!(agent.config().worktree_base_path.is_some());
}

#[test]
fn test_agent_log_directory() {
    let config = create_test_agent_config();
    let agent = CodeGenAgent::new(config);

    assert!(!agent.config().log_directory.is_empty());
    assert_eq!(agent.config().log_directory, "./logs");
}

#[test]
fn test_agent_report_directory() {
    let config = create_test_agent_config();
    let agent = ReviewAgent::new(config);

    assert!(!agent.config().report_directory.is_empty());
    assert_eq!(agent.config().report_directory, "./reports");
}

#[test]
fn test_task_status_lifecycle() {
    use miyabi_types::TaskStatus;

    let statuses = vec![
        TaskStatus::Pending,
        TaskStatus::InProgress,
        TaskStatus::Completed,
        TaskStatus::Failed,
        TaskStatus::Blocked,
    ];

    for status in statuses {
        // Each status should have a valid string representation
        let status_str = format!("{:?}", status);
        assert!(!status_str.is_empty());
    }
}
