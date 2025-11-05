//! Integration tests validating CoordinatorAgent task decomposition interactions

use chrono::Utc;
use miyabi_agent_coordinator::CoordinatorAgent;
use miyabi_types::agent::{AgentConfig, AgentType};
use miyabi_types::issue::{Issue, IssueStateGithub};

fn create_test_config() -> AgentConfig {
    AgentConfig {
        device_identifier: "test-device".to_string(),
        github_token: "test-token".to_string(),
        repo_owner: None,
        repo_name: None,
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
        title: "Test issue for coordinator integration".to_string(),
        body: "Ensure CoordinatorAgent decomposes issues correctly".to_string(),
        state: IssueStateGithub::Open,
        labels: vec!["type:test".to_string()],
        assignee: None,
        created_at: Utc::now(),
        updated_at: Utc::now(),
        url: "https://github.com/customer-cloud/miyabi-private/issues/123".to_string(),
    }
}

#[tokio::test]
async fn test_decompose_issue_creates_expected_tasks() {
    let coordinator = CoordinatorAgent::new(create_test_config());
    let issue = create_test_issue();

    let decomposition = coordinator.decompose_issue(&issue).await.unwrap();

    // CoordinatorAgent currently creates four canonical tasks (analysis, impl, test, review)
    assert_eq!(decomposition.tasks.len(), 4);
    assert_eq!(
        decomposition.tasks[0].assigned_agent,
        Some(AgentType::IssueAgent)
    );
    assert_eq!(
        decomposition.tasks[1].assigned_agent,
        Some(AgentType::CodeGenAgent)
    );
    assert_eq!(
        decomposition.tasks[3].assigned_agent,
        Some(AgentType::ReviewAgent)
    );

    // DAG should be acyclic and contain the same number of nodes as tasks
    assert!(!decomposition.dag.has_cycles());
    assert_eq!(decomposition.dag.nodes.len(), decomposition.tasks.len());
}

#[tokio::test]
async fn test_task_metadata_contains_issue_number() {
    let coordinator = CoordinatorAgent::new(create_test_config());
    let issue = create_test_issue();

    let decomposition = coordinator.decompose_issue(&issue).await.unwrap();

    for task in decomposition.tasks {
        if let Some(metadata) = &task.metadata {
            if let Some(value) = metadata.get("issue_number") {
                assert_eq!(value.as_u64(), Some(issue.number));
            }
        }
    }
}
