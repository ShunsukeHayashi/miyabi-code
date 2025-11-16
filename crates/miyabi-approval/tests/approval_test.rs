//! Integration tests for approval system

use miyabi_approval::{ApprovalGate, ApprovalStatus, ApprovalStore};
use tempfile::TempDir;

#[tokio::test]
async fn test_create_approval() {
    let temp_dir = TempDir::new().unwrap();

    let gate = ApprovalGate::new("test-gate")
        .required_approvers(vec!["alice".to_string(), "bob".to_string()])
        .timeout_seconds(3600)
        .store_path(temp_dir.path().to_str().unwrap())
        .build()
        .unwrap();

    let approval_id = gate.create_approval("workflow-123").await.unwrap();

    let state = gate.get_state(&approval_id).await.unwrap().unwrap();
    assert_eq!(state.workflow_id, "workflow-123");
    assert_eq!(state.gate_id, "test-gate");
    assert_eq!(state.required_approvers.len(), 2);
    assert_eq!(state.status, ApprovalStatus::Pending);
}

#[tokio::test]
async fn test_single_approver() {
    let temp_dir = TempDir::new().unwrap();

    let gate = ApprovalGate::new("test-gate")
        .required_approvers(vec!["alice".to_string()])
        .timeout_seconds(3600)
        .store_path(temp_dir.path().to_str().unwrap())
        .build()
        .unwrap();

    let approval_id = gate.create_approval("workflow-123").await.unwrap();

    // Approve
    let state = gate.approve(&approval_id, "alice", Some("LGTM".to_string())).await.unwrap();

    assert_eq!(state.status, ApprovalStatus::Approved);
    assert_eq!(state.approval_count(), 1);
    assert!(state.is_completed());
}

#[tokio::test]
async fn test_multiple_approvers() {
    let temp_dir = TempDir::new().unwrap();

    let gate = ApprovalGate::new("test-gate")
        .required_approvers(vec!["alice".to_string(), "bob".to_string()])
        .timeout_seconds(3600)
        .store_path(temp_dir.path().to_str().unwrap())
        .build()
        .unwrap();

    let approval_id = gate.create_approval("workflow-123").await.unwrap();

    // First approval (still pending)
    let state1 = gate.approve(&approval_id, "alice", Some("LGTM".to_string())).await.unwrap();
    assert_eq!(state1.status, ApprovalStatus::Pending);
    assert_eq!(state1.approval_count(), 1);

    // Second approval (approved)
    let state2 = gate.approve(&approval_id, "bob", Some("LGTM".to_string())).await.unwrap();
    assert_eq!(state2.status, ApprovalStatus::Approved);
    assert_eq!(state2.approval_count(), 2);
    assert!(state2.is_completed());
}

#[tokio::test]
async fn test_rejection() {
    let temp_dir = TempDir::new().unwrap();

    let gate = ApprovalGate::new("test-gate")
        .required_approvers(vec!["alice".to_string(), "bob".to_string()])
        .timeout_seconds(3600)
        .store_path(temp_dir.path().to_str().unwrap())
        .build()
        .unwrap();

    let approval_id = gate.create_approval("workflow-123").await.unwrap();

    // Reject
    let state = gate
        .reject(&approval_id, "alice", Some("Security concerns".to_string()))
        .await
        .unwrap();

    assert_eq!(state.status, ApprovalStatus::Rejected);
    assert_eq!(state.rejection_count(), 1);
    assert!(state.is_completed());
}

#[tokio::test]
async fn test_unauthorized_approver() {
    let temp_dir = TempDir::new().unwrap();

    let gate = ApprovalGate::new("test-gate")
        .required_approvers(vec!["alice".to_string()])
        .timeout_seconds(3600)
        .store_path(temp_dir.path().to_str().unwrap())
        .build()
        .unwrap();

    let approval_id = gate.create_approval("workflow-123").await.unwrap();

    // Try to approve as unauthorized user
    let result = gate.approve(&approval_id, "charlie", Some("LGTM".to_string())).await;

    assert!(result.is_err());
}

#[tokio::test]
async fn test_already_responded() {
    let temp_dir = TempDir::new().unwrap();

    let gate = ApprovalGate::new("test-gate")
        .required_approvers(vec!["alice".to_string(), "bob".to_string()])
        .timeout_seconds(3600)
        .store_path(temp_dir.path().to_str().unwrap())
        .build()
        .unwrap();

    let approval_id = gate.create_approval("workflow-123").await.unwrap();

    // First approval
    gate.approve(&approval_id, "alice", Some("LGTM".to_string())).await.unwrap();

    // Try to approve again
    let result = gate.approve(&approval_id, "alice", Some("Still LGTM".to_string())).await;

    assert!(result.is_err());
}

#[tokio::test]
async fn test_list_pending() {
    let temp_dir = TempDir::new().unwrap();

    let gate = ApprovalGate::new("test-gate")
        .required_approvers(vec!["alice".to_string()])
        .timeout_seconds(3600)
        .store_path(temp_dir.path().to_str().unwrap())
        .build()
        .unwrap();

    // Create multiple approvals
    gate.create_approval("workflow-1").await.unwrap();
    gate.create_approval("workflow-2").await.unwrap();

    let pending = gate.list_pending().await.unwrap();
    assert_eq!(pending.len(), 2);
}

#[tokio::test]
async fn test_list_pending_for_approver() {
    let temp_dir = TempDir::new().unwrap();

    let gate = ApprovalGate::new("test-gate")
        .required_approvers(vec!["alice".to_string(), "bob".to_string()])
        .timeout_seconds(3600)
        .store_path(temp_dir.path().to_str().unwrap())
        .build()
        .unwrap();

    let approval_id = gate.create_approval("workflow-1").await.unwrap();

    // Alice approves
    gate.approve(&approval_id, "alice", None).await.unwrap();

    // Check pending for Alice (should be 0)
    let pending_alice = gate.list_pending_for_approver("alice").await.unwrap();
    assert_eq!(pending_alice.len(), 0);

    // Check pending for Bob (should be 1)
    let pending_bob = gate.list_pending_for_approver("bob").await.unwrap();
    assert_eq!(pending_bob.len(), 1);
}

#[tokio::test]
async fn test_approval_persistence() {
    let temp_dir = TempDir::new().unwrap();
    let store_path = temp_dir.path().to_str().unwrap();

    // Create approval in first gate instance
    {
        let gate = ApprovalGate::new("test-gate")
            .required_approvers(vec!["alice".to_string()])
            .timeout_seconds(3600)
            .store_path(store_path)
            .build()
            .unwrap();

        gate.create_approval("workflow-123").await.unwrap();
    }

    // Load from store with second gate instance
    {
        let gate = ApprovalGate::new("test-gate")
            .required_approvers(vec!["alice".to_string()])
            .timeout_seconds(3600)
            .store_path(store_path)
            .build()
            .unwrap();

        let pending = gate.list_pending().await.unwrap();
        assert_eq!(pending.len(), 1);
        assert_eq!(pending[0].workflow_id, "workflow-123");
    }
}

#[tokio::test]
async fn test_approval_store_queries() {
    let temp_dir = TempDir::new().unwrap();
    let store = ApprovalStore::with_path(temp_dir.path()).unwrap();

    // Create test approvals
    use miyabi_approval::ApprovalState;

    let state1 =
        ApprovalState::new("approval-1", "workflow-1", "gate-1", vec!["alice".to_string()], 3600);

    let mut state2 =
        ApprovalState::new("approval-2", "workflow-2", "gate-1", vec!["bob".to_string()], 3600);

    // Approve state2
    use chrono::Utc;
    use miyabi_approval::ApprovalResponse;
    let response = ApprovalResponse {
        approver: "bob".to_string(),
        approved: true,
        comment: None,
        responded_at: Utc::now(),
    };
    state2.add_response(response);

    store.save(&state1).unwrap();
    store.save(&state2).unwrap();

    // Test list_pending
    let pending = store.list_pending().unwrap();
    assert_eq!(pending.len(), 1);
    assert_eq!(pending[0].approval_id, "approval-1");

    // Test list_by_status
    let approved = store.list_by_status(ApprovalStatus::Approved).unwrap();
    assert_eq!(approved.len(), 1);
    assert_eq!(approved[0].approval_id, "approval-2");

    // Test list_by_workflow
    let workflow1 = store.list_by_workflow("workflow-1").unwrap();
    assert_eq!(workflow1.len(), 1);
    assert_eq!(workflow1[0].approval_id, "approval-1");
}
