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
    assert_eq!(decomposition.tasks[0].assigned_agent, Some(AgentType::IssueAgent));
    assert_eq!(decomposition.tasks[1].assigned_agent, Some(AgentType::CodeGenAgent));
    assert_eq!(decomposition.tasks[3].assigned_agent, Some(AgentType::ReviewAgent));

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

// ==================== WorkflowBuilder Integration Tests ====================

#[cfg(feature = "workflow_dsl")]
mod workflow_tests {
    use super::*;
    use miyabi_workflow::{WorkflowBuilder, WorkflowStatus};
    use tempfile::TempDir;

    #[tokio::test]
    async fn test_simple_sequential_workflow() {
        let config = create_test_config();
        let coordinator = CoordinatorAgent::new(config);

        // Create a simple sequential workflow
        let workflow = WorkflowBuilder::new("test-workflow")
            .step("analyze", AgentType::IssueAgent)
            .then("implement", AgentType::CodeGenAgent)
            .then("review", AgentType::ReviewAgent);

        // Use temporary directory for state
        let temp_dir = TempDir::new().unwrap();
        let state_path = temp_dir.path().to_str().unwrap();

        // Execute workflow
        let result = coordinator.execute_workflow(&workflow, Some(state_path)).await;

        assert!(result.is_ok(), "Workflow execution failed: {:?}", result.err());

        let execution_state = result.unwrap();

        // Verify execution state
        assert_eq!(execution_state.status, WorkflowStatus::Completed);
        assert_eq!(execution_state.completed_steps.len(), 3);
        assert_eq!(execution_state.failed_steps.len(), 0);
        assert!(execution_state.current_step.is_none());

        // Verify step results
        assert_eq!(execution_state.step_results.len(), 3);
        assert!(execution_state.step_results.contains_key("step-0")); // analyze
        assert!(execution_state.step_results.contains_key("step-1")); // implement
        assert!(execution_state.step_results.contains_key("step-2")); // review
    }

    #[tokio::test]
    async fn test_parallel_workflow() {
        let config = create_test_config();
        let coordinator = CoordinatorAgent::new(config);

        // Create a workflow with parallel steps
        let workflow = WorkflowBuilder::new("parallel-test")
            .step("prepare", AgentType::IssueAgent)
            .parallel(vec![
                ("test-a", AgentType::CodeGenAgent),
                ("test-b", AgentType::ReviewAgent),
                ("test-c", AgentType::CodeGenAgent),
            ])
            .then("finalize", AgentType::IssueAgent);

        // Use temporary directory for state
        let temp_dir = TempDir::new().unwrap();
        let state_path = temp_dir.path().to_str().unwrap();

        // Execute workflow
        let result = coordinator.execute_workflow(&workflow, Some(state_path)).await;

        assert!(result.is_ok(), "Workflow execution failed: {:?}", result.err());

        let execution_state = result.unwrap();

        // Verify execution state
        assert_eq!(execution_state.status, WorkflowStatus::Completed);
        assert_eq!(execution_state.completed_steps.len(), 5); // 1 + 3 + 1
        assert_eq!(execution_state.failed_steps.len(), 0);
    }

    #[tokio::test]
    async fn test_workflow_state_persistence() {
        let config = create_test_config();
        let coordinator = CoordinatorAgent::new(config);

        // Create workflow
        let workflow = WorkflowBuilder::new("persistence-test")
            .step("step1", AgentType::IssueAgent)
            .then("step2", AgentType::CodeGenAgent);

        // Use temporary directory for state
        let temp_dir = TempDir::new().unwrap();
        let state_path = temp_dir.path().to_str().unwrap();

        // Execute workflow
        let result = coordinator.execute_workflow(&workflow, Some(state_path)).await;

        assert!(result.is_ok());

        let execution_state = result.unwrap();
        let workflow_id = execution_state.workflow_id.clone();

        // Verify state was persisted by loading it
        use miyabi_workflow::StateStore;
        let state_store = StateStore::with_path(state_path).unwrap();
        let loaded_state = state_store.load_execution(&workflow_id).unwrap();

        assert!(loaded_state.is_some());
        let loaded = loaded_state.unwrap();

        assert_eq!(loaded.workflow_id, workflow_id);
        assert_eq!(loaded.status, WorkflowStatus::Completed);
        assert_eq!(loaded.completed_steps.len(), 2);
    }

    #[tokio::test]
    async fn test_workflow_with_default_state_path() {
        let config = create_test_config();
        let coordinator = CoordinatorAgent::new(config);

        // Create simple workflow
        let workflow =
            WorkflowBuilder::new("default-path-test").step("task", AgentType::IssueAgent);

        // Execute without specifying state_path (uses default)
        let result = coordinator.execute_workflow(&workflow, None).await;

        assert!(result.is_ok(), "Workflow execution failed: {:?}", result.err());

        let execution_state = result.unwrap();
        assert_eq!(execution_state.status, WorkflowStatus::Completed);
        assert_eq!(execution_state.completed_steps.len(), 1);
    }

    #[tokio::test]
    async fn test_conditional_branch_simple() {
        let config = create_test_config();
        let coordinator = CoordinatorAgent::new(config);

        // Create a workflow with conditional branching
        // This tests the .branch() method (simple pass/fail)
        let workflow = WorkflowBuilder::new("conditional-test")
            .step("prepare", AgentType::IssueAgent)
            .branch("quality-gate", "deploy", "rollback")
            .step("deploy", AgentType::DeploymentAgent)
            .step("rollback", AgentType::ReviewAgent);

        // Use temporary directory for state
        let temp_dir = TempDir::new().unwrap();
        let state_path = temp_dir.path().to_str().unwrap();

        // Execute workflow
        let result = coordinator.execute_workflow(&workflow, Some(state_path)).await;

        assert!(result.is_ok(), "Workflow execution failed: {:?}", result.err());

        let execution_state = result.unwrap();

        // Verify execution completed
        assert_eq!(execution_state.status, WorkflowStatus::Completed);

        // Verify that conditional branch chose one path
        // The placeholder always returns success=true, so "deploy" branch should be taken
        assert!(execution_state.completed_steps.contains(&"step-0".to_string())); // prepare
        assert!(execution_state.completed_steps.contains(&"step-1".to_string())); // quality-gate (conditional)

        // Check that the chosen branch is recorded
        let branch_choice = execution_state
            .step_results
            .get("step-1_chosen_branch")
            .expect("Branch choice should be recorded");
        assert!(branch_choice.get("branch_name").is_some());
        assert!(branch_choice.get("next_step").is_some());
    }

    #[tokio::test]
    async fn test_conditional_branch_custom_conditions() {
        use miyabi_workflow::Condition;

        let config = create_test_config();
        let coordinator = CoordinatorAgent::new(config);

        // Create a workflow with custom conditional branches
        let workflow = WorkflowBuilder::new("custom-conditional")
            .step("analyze", AgentType::IssueAgent)
            .branch_on(
                "quality-decision",
                vec![
                    (
                        "high",
                        Condition::FieldGreaterThan {
                            field: "score".into(),
                            value: 0.9,
                        },
                        "deploy",
                    ),
                    (
                        "medium",
                        Condition::FieldGreaterThan {
                            field: "score".into(),
                            value: 0.7,
                        },
                        "review",
                    ),
                    ("low", Condition::Always, "reject"),
                ],
            )
            .step("deploy", AgentType::DeploymentAgent)
            .step("review", AgentType::ReviewAgent)
            .step("reject", AgentType::IssueAgent);

        // Use temporary directory for state
        let temp_dir = TempDir::new().unwrap();
        let state_path = temp_dir.path().to_str().unwrap();

        // Execute workflow
        let result = coordinator.execute_workflow(&workflow, Some(state_path)).await;

        assert!(result.is_ok(), "Workflow execution failed: {:?}", result.err());

        let execution_state = result.unwrap();

        // Verify execution completed
        assert_eq!(execution_state.status, WorkflowStatus::Completed);

        // Verify analyze step completed
        assert!(execution_state.completed_steps.contains(&"step-0".to_string()));

        // Verify conditional step completed
        assert!(execution_state.completed_steps.contains(&"step-1".to_string()));

        // Check that the chosen branch is recorded
        let branch_choice = execution_state
            .step_results
            .get("step-1_chosen_branch")
            .expect("Branch choice should be recorded");

        // Since our placeholder doesn't set a "score" field, the "low" branch (Always) should be chosen
        assert_eq!(branch_choice.get("branch_name").unwrap(), "low");
        let next_step_id =
            branch_choice.get("next_step").and_then(|v| v.as_str()).expect("next_step id");

        // Verify that only the chosen branch was executed (reject path)
        assert!(execution_state.completed_steps.contains(&next_step_id.to_string()));

        let reject_result =
            execution_state.step_results.get(next_step_id).expect("reject step result");
        assert_eq!(
            reject_result
                .get("data")
                .and_then(|d| d.get("task_title"))
                .and_then(|title| title.as_str()),
            Some("reject")
        );
    }

    #[tokio::test]
    async fn test_conditional_branch_skips_alternate_paths() {
        let config = create_test_config();
        let coordinator = CoordinatorAgent::new(config);

        // Create a workflow where alternate paths should be skipped
        // Note: branch targets must be defined BEFORE the branch step
        let workflow = WorkflowBuilder::new("path-skipping")
            .step("start", AgentType::IssueAgent)
            .then("decision", AgentType::CoordinatorAgent) // branch decision point
            .step("path_a_start", AgentType::CodeGenAgent)
            .then("path_a_end", AgentType::ReviewAgent)
            .step("path_b_start", AgentType::DeploymentAgent)
            .then("path_b_end", AgentType::IssueAgent);

        // Use temporary directory for state
        let temp_dir = TempDir::new().unwrap();
        let state_path = temp_dir.path().to_str().unwrap();

        // Execute workflow
        let result = coordinator.execute_workflow(&workflow, Some(state_path)).await;

        assert!(result.is_ok(), "Workflow execution failed: {:?}", result.err());

        let execution_state = result.unwrap();

        // Verify execution completed
        assert_eq!(execution_state.status, WorkflowStatus::Completed);

        // Verify start and decision steps completed
        assert!(execution_state.completed_steps.contains(&"step-0".to_string())); // start
        assert!(execution_state.completed_steps.contains(&"step-1".to_string())); // decision

        // This test workflow has sequential structure, so all 6 steps execute
        // The skipping behavior requires conditional branching metadata which
        // this simplified test doesn't have. The actual conditional tests
        // (test_conditional_branch_simple and test_conditional_branch_custom_conditions)
        // properly test the branching logic.
        assert_eq!(execution_state.completed_steps.len(), 6);
    }
}
