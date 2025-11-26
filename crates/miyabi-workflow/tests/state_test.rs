//! Integration tests for workflow state persistence

use miyabi_workflow::{ExecutionState, StateStore, StepOutput, WorkflowStatus};
use std::collections::HashMap;
use tempfile::TempDir;

fn create_test_state(workflow_id: &str, status: WorkflowStatus) -> ExecutionState {
    ExecutionState {
        workflow_id: workflow_id.to_string(),
        session_id: format!("session-{}", workflow_id),
        current_step: Some("step-1".to_string()),
        completed_steps: vec!["step-0".to_string()],
        failed_steps: vec![],
        step_results: HashMap::new(),
        status,
        created_at: 1234567890,
        updated_at: 1234567900,
    }
}

#[test]
fn test_state_store_creation() {
    let temp_dir = TempDir::new().unwrap();
    let _store = StateStore::with_path(temp_dir.path()).unwrap();

    // Store should be created successfully
    assert!(temp_dir.path().exists());
}

#[test]
fn test_save_and_load_execution_state() {
    let temp_dir = TempDir::new().unwrap();
    let store = StateStore::with_path(temp_dir.path()).unwrap();

    let state = create_test_state("workflow-1", WorkflowStatus::Running);

    // Save state
    store.save_execution(&state).unwrap();

    // Load state
    let loaded = store.load_execution("workflow-1").unwrap().unwrap();

    assert_eq!(loaded.workflow_id, "workflow-1");
    assert_eq!(loaded.session_id, "session-workflow-1");
    assert_eq!(loaded.current_step, Some("step-1".to_string()));
    assert_eq!(loaded.completed_steps.len(), 1);
    assert_eq!(loaded.status, WorkflowStatus::Running);
}

#[test]
fn test_load_nonexistent_execution() {
    let temp_dir = TempDir::new().unwrap();
    let store = StateStore::with_path(temp_dir.path()).unwrap();

    let result = store.load_execution("nonexistent").unwrap();
    assert!(result.is_none());
}

#[test]
fn test_delete_execution_state() {
    let temp_dir = TempDir::new().unwrap();
    let store = StateStore::with_path(temp_dir.path()).unwrap();

    let state = create_test_state("workflow-delete", WorkflowStatus::Completed);

    // Save then delete
    store.save_execution(&state).unwrap();
    assert!(store.load_execution("workflow-delete").unwrap().is_some());

    store.delete_execution("workflow-delete").unwrap();
    assert!(store.load_execution("workflow-delete").unwrap().is_none());
}

#[test]
fn test_list_active_workflows() {
    let temp_dir = TempDir::new().unwrap();
    let store = StateStore::with_path(temp_dir.path()).unwrap();

    // Create multiple workflows with different statuses
    let running = create_test_state("workflow-running", WorkflowStatus::Running);
    let paused = create_test_state("workflow-paused", WorkflowStatus::Paused);
    let completed = create_test_state("workflow-completed", WorkflowStatus::Completed);
    let failed = create_test_state("workflow-failed", WorkflowStatus::Failed);

    store.save_execution(&running).unwrap();
    store.save_execution(&paused).unwrap();
    store.save_execution(&completed).unwrap();
    store.save_execution(&failed).unwrap();

    // List active (Running or Paused only)
    let active = store.list_active().unwrap();

    assert_eq!(active.len(), 2);
    assert!(active.iter().any(|s| s.workflow_id == "workflow-running"));
    assert!(active.iter().any(|s| s.workflow_id == "workflow-paused"));
    assert!(!active.iter().any(|s| s.workflow_id == "workflow-completed"));
    assert!(!active.iter().any(|s| s.workflow_id == "workflow-failed"));
}

#[test]
fn test_list_by_status() {
    let temp_dir = TempDir::new().unwrap();
    let store = StateStore::with_path(temp_dir.path()).unwrap();

    let running1 = create_test_state("workflow-r1", WorkflowStatus::Running);
    let running2 = create_test_state("workflow-r2", WorkflowStatus::Running);
    let completed = create_test_state("workflow-c1", WorkflowStatus::Completed);

    store.save_execution(&running1).unwrap();
    store.save_execution(&running2).unwrap();
    store.save_execution(&completed).unwrap();

    // List running workflows
    let running = store.list_by_status(WorkflowStatus::Running).unwrap();
    assert_eq!(running.len(), 2);

    // List completed workflows
    let completed_list = store.list_by_status(WorkflowStatus::Completed).unwrap();
    assert_eq!(completed_list.len(), 1);

    // List failed workflows (none)
    let failed = store.list_by_status(WorkflowStatus::Failed).unwrap();
    assert_eq!(failed.len(), 0);
}

#[test]
fn test_execution_state_update() {
    let temp_dir = TempDir::new().unwrap();
    let store = StateStore::with_path(temp_dir.path()).unwrap();

    let mut state = create_test_state("workflow-update", WorkflowStatus::Running);

    // Save initial state
    store.save_execution(&state).unwrap();

    // Update state
    state.current_step = Some("step-2".to_string());
    state.completed_steps.push("step-1".to_string());
    state.updated_at = 9999999999;

    // Save updated state
    store.save_execution(&state).unwrap();

    // Load and verify
    let loaded = store.load_execution("workflow-update").unwrap().unwrap();
    assert_eq!(loaded.current_step, Some("step-2".to_string()));
    assert_eq!(loaded.completed_steps.len(), 2);
    assert_eq!(loaded.updated_at, 9999999999);
}

#[test]
fn test_execution_state_with_results() {
    let temp_dir = TempDir::new().unwrap();
    let store = StateStore::with_path(temp_dir.path()).unwrap();

    let mut state = create_test_state("workflow-results", WorkflowStatus::Running);

    // Add step results
    state.step_results.insert(
        "step-0".to_string(),
        serde_json::json!({"output": "success"}),
    );

    store.save_execution(&state).unwrap();

    let loaded = store.load_execution("workflow-results").unwrap().unwrap();
    assert_eq!(loaded.step_results.len(), 1);
    assert!(loaded.step_results.contains_key("step-0"));
}

#[test]
fn test_save_and_load_step_output() {
    let temp_dir = TempDir::new().unwrap();
    let store = StateStore::with_path(temp_dir.path()).unwrap();

    let output = StepOutput::success("test data").unwrap();

    // Save step output
    store.save_step("workflow-1", "step-1", &output).unwrap();

    // Load step output
    let loaded = store.load_step("workflow-1", "step-1").unwrap().unwrap();
    assert!(loaded.success);
    assert_eq!(loaded.data, serde_json::json!("test data"));
}

#[test]
fn test_clear_workflow() {
    let temp_dir = TempDir::new().unwrap();
    let store = StateStore::with_path(temp_dir.path()).unwrap();

    let state = create_test_state("workflow-clear", WorkflowStatus::Running);
    let output = StepOutput::success("data").unwrap();

    // Save state and steps
    store.save_execution(&state).unwrap();
    store
        .save_step("workflow-clear", "step-1", &output)
        .unwrap();
    store
        .save_step("workflow-clear", "step-2", &output)
        .unwrap();

    // Verify data exists
    assert!(store.load_execution("workflow-clear").unwrap().is_some());
    assert!(store
        .load_step("workflow-clear", "step-1")
        .unwrap()
        .is_some());

    // Clear workflow - Note: This clears step data but not execution state
    // (execution state has different prefix "execution:")
    store.clear_workflow("workflow-clear").unwrap();

    // Step data should be cleared
    assert!(store
        .load_step("workflow-clear", "step-1")
        .unwrap()
        .is_none());
    assert!(store
        .load_step("workflow-clear", "step-2")
        .unwrap()
        .is_none());
}

#[test]
fn test_concurrent_workflow_states() {
    let temp_dir = TempDir::new().unwrap();
    let store = StateStore::with_path(temp_dir.path()).unwrap();

    // Create multiple concurrent workflows
    for i in 0..5 {
        let state = create_test_state(
            &format!("workflow-{}", i),
            if i % 2 == 0 {
                WorkflowStatus::Running
            } else {
                WorkflowStatus::Paused
            },
        );
        store.save_execution(&state).unwrap();
    }

    let active = store.list_active().unwrap();
    assert_eq!(active.len(), 5);
}
