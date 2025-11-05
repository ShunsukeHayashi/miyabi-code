//! Integration tests for types ↔ core interaction
//! Tests the interaction between miyabi-types and miyabi-core crates

use miyabi_core::Config;
use miyabi_types::{AgentConfig, AgentType, Issue, Task, TaskType};
use std::env;
use std::fs;
use tempfile::TempDir;

#[test]
fn test_agent_config_from_core_config() {
    let temp_dir = TempDir::new().unwrap();
    let config_path = temp_dir.path().join(".miyabi.yml");

    let config_content = r#"
github_token: ghp_test_token
device_identifier: test-device
repo_owner: test-owner
repo_name: test-repo
log_directory: "./logs"
report_directory: "./reports"
use_task_tool: true
use_worktree: true
"#;

    fs::write(&config_path, config_content).unwrap();
    env::set_current_dir(temp_dir.path()).unwrap();

    let core_config = Config::from_file(config_path.to_str().unwrap()).unwrap();

    // Convert core Config to AgentConfig
    let agent_config = AgentConfig {
        device_identifier: core_config.device_identifier.clone(),
        github_token: core_config.github_token.clone(),
        repo_owner: core_config.repo_owner.clone(),
        repo_name: core_config.repo_name.clone(),
        use_task_tool: core_config.use_task_tool,
        use_worktree: core_config.use_worktree,
        worktree_base_path: core_config.worktree_base_path.clone(),
        log_directory: core_config.log_directory.clone(),
        report_directory: core_config.report_directory.clone(),
        tech_lead_github_username: core_config.tech_lead_github_username.clone(),
        ciso_github_username: core_config.ciso_github_username.clone(),
        po_github_username: core_config.po_github_username.clone(),
        firebase_production_project: core_config.firebase_production_project.clone(),
        firebase_staging_project: core_config.firebase_staging_project.clone(),
        production_url: core_config.production_url.clone(),
        staging_url: core_config.staging_url.clone(),
    };

    assert_eq!(agent_config.device_identifier, "test-device");
    assert_eq!(agent_config.github_token, "ghp_test_token");
    assert_eq!(agent_config.repo_owner, Some("test-owner".to_string()));
    assert_eq!(agent_config.repo_name, Some("test-repo".to_string()));
    assert!(agent_config.use_task_tool);
    assert!(agent_config.use_worktree);
}

#[test]
fn test_issue_serialization_with_config() {
    let issue = Issue {
        number: 418,
        title: "Test integration".to_string(),
        body: "Test integration body".to_string(),
        state: miyabi_types::issue::IssueStateGithub::Open,
        labels: vec!["type:test".to_string()],
        assignee: None,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
        url: "https://github.com/test/repo/issues/418".to_string(),
    };

    // Test JSON serialization
    let json = serde_json::to_string(&issue).unwrap();
    assert!(json.contains("418"));
    assert!(json.contains("Test integration"));

    // Test deserialization
    let deserialized: Issue = serde_json::from_str(&json).unwrap();
    assert_eq!(deserialized.number, 418);
    assert_eq!(deserialized.title, "Test integration");
}

#[test]
fn test_task_creation_from_issue() {
    let issue = Issue {
        number: 418,
        title: "Expand integration test coverage".to_string(),
        body: "Add more integration tests".to_string(),
        state: miyabi_types::issue::IssueStateGithub::Open,
        labels: vec!["type:test".to_string()],
        assignee: None,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
        url: "https://github.com/test/repo/issues/418".to_string(),
    };

    // Create task from issue
    let task = Task {
        id: format!("task-{}", issue.number),
        title: issue.title.clone(),
        description: issue.body.clone(),
        task_type: TaskType::Test,
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
    };

    assert_eq!(task.id, "task-418");
    assert_eq!(task.title, issue.title);
    assert_eq!(task.task_type, TaskType::Test);
}

#[test]
fn test_agent_type_serialization() {
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
        // Test JSON serialization
        let json = serde_json::to_string(&agent_type).unwrap();
        assert!(!json.is_empty());

        // Test round-trip
        let parsed: AgentType = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed, agent_type);
    }
}

#[test]
fn test_config_validation_with_types() {
    let temp_dir = TempDir::new().unwrap();
    let config_path = temp_dir.path().join(".miyabi.yml");

    // Invalid config - missing required fields
    let invalid_config = r#"
log_level: info
"#;

    fs::write(&config_path, invalid_config).unwrap();
    env::set_current_dir(temp_dir.path()).unwrap();

    let result = Config::from_file(config_path.to_str().unwrap());

    // Should fail due to missing required fields
    assert!(result.is_err());
}
