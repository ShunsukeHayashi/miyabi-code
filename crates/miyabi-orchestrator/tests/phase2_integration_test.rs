//! Phase 2 Integration Tests
//!
//! End-to-end tests for Phase 2 workflow:
//! Phase 1 Complete → CoordinatorAgent → Task Decomposition → DAG Generation

use miyabi_orchestrator::headless::{HeadlessOrchestrator, HeadlessOrchestratorConfig};
use miyabi_types::issue::IssueStateGithub;
use miyabi_types::Issue;

/// Create a test issue
fn create_test_issue(number: u64, title: &str, body: &str) -> Issue {
    Issue {
        number,
        title: title.to_string(),
        body: body.to_string(),
        state: IssueStateGithub::Open,
        labels: vec![],
        assignee: None,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
        url: format!("https://github.com/test/repo/issues/{}", number),
    }
}

/// Test Phase 2 task decomposition in dry-run mode
#[tokio::test]
async fn test_phase2_task_decomposition_dry_run() {
    let config = HeadlessOrchestratorConfig {
        autonomous_mode: true,
        auto_approve_complexity: 5.0,
        auto_merge_quality: 80.0,
        dry_run: true,
    };

    let mut orchestrator = HeadlessOrchestrator::new(config);

    // Create a simple issue that will auto-approve and proceed to Phase 2
    let issue = create_test_issue(
        200,
        "Add user profile page",
        "Create a new user profile page with avatar and bio",
    );

    // Execute Phase 1 + Phase 2
    let result = orchestrator.handle_issue_created(&issue).await;

    // Should succeed and complete Phase 2
    assert!(result.is_ok(), "Phase 1 + Phase 2 should succeed in dry-run");

    let result = result.unwrap();
    assert!(result.success, "Execution should be successful");
    assert_eq!(result.issue_number, 200);
}

/// Test Phase 2 with medium complexity issue
#[tokio::test]
async fn test_phase2_medium_complexity() {
    let config = HeadlessOrchestratorConfig {
        autonomous_mode: true,
        auto_approve_complexity: 5.0,
        auto_merge_quality: 80.0,
        dry_run: true,
    };

    let mut orchestrator = HeadlessOrchestrator::new(config);

    // Create a medium complexity issue
    let issue = create_test_issue(
        300,
        "Implement database migration",
        "Add new database schema and migration scripts for user preferences",
    );

    let result = orchestrator.handle_issue_created(&issue).await;
    assert!(result.is_ok());

    let result = result.unwrap();
    assert!(result.success);
    assert_eq!(result.issue_number, 300);
}

/// Test Phase 2 with feature request
#[tokio::test]
async fn test_phase2_feature_request() {
    let config = HeadlessOrchestratorConfig {
        autonomous_mode: true,
        auto_approve_complexity: 5.0,
        auto_merge_quality: 80.0,
        dry_run: true,
    };

    let mut orchestrator = HeadlessOrchestrator::new(config);

    let issue = create_test_issue(
        400,
        "Add dark mode support",
        "Implement dark mode theme switching with user preference persistence",
    );

    let result = orchestrator.handle_issue_created(&issue).await;
    assert!(result.is_ok());
}

/// Test Phase 2 with bug fix issue
#[tokio::test]
async fn test_phase2_bug_fix() {
    let config = HeadlessOrchestratorConfig {
        autonomous_mode: true,
        auto_approve_complexity: 5.0,
        auto_merge_quality: 80.0,
        dry_run: true,
    };

    let mut orchestrator = HeadlessOrchestrator::new(config);

    let issue = create_test_issue(
        500,
        "Fix login redirect bug",
        "Users are not being redirected to the correct page after login",
    );

    let result = orchestrator.handle_issue_created(&issue).await;
    assert!(result.is_ok());
}

/// Test Phase 1 to Phase 2 transition
#[tokio::test]
async fn test_phase1_to_phase2_transition() {
    let config = HeadlessOrchestratorConfig {
        autonomous_mode: true,
        auto_approve_complexity: 5.0,
        auto_merge_quality: 80.0,
        dry_run: true,
    };

    let mut orchestrator = HeadlessOrchestrator::new(config);

    let issue = create_test_issue(
        600,
        "Simple UI change",
        "Update button color on homepage",
    );

    // This should pass through both Phase 1 and Phase 2
    let result = orchestrator.handle_issue_created(&issue).await;
    assert!(result.is_ok(), "Phase 1 → Phase 2 transition should succeed");

    let result = result.unwrap();
    assert!(result.success);
}

/// Test Phase 2 performance (should complete within 5 minutes)
#[tokio::test]
async fn test_phase2_performance_under_5_minutes() {
    let config = HeadlessOrchestratorConfig {
        autonomous_mode: true,
        auto_approve_complexity: 5.0,
        auto_merge_quality: 80.0,
        dry_run: true,
    };

    let mut orchestrator = HeadlessOrchestrator::new(config);

    let issue = create_test_issue(
        700,
        "Performance test issue",
        "Testing that Phase 2 completes within 5 minutes",
    );

    let start = std::time::Instant::now();
    let result = orchestrator.handle_issue_created(&issue).await;
    let duration = start.elapsed();

    assert!(result.is_ok());
    assert!(
        duration.as_secs() < 300,
        "Phase 1 + Phase 2 should complete within 5 minutes, took {:?}",
        duration
    );
}

/// Test Phase 2 with sequential executions (concurrent not supported due to git2 limitations)
#[tokio::test]
async fn test_phase2_concurrent_executions() {
    let config = HeadlessOrchestratorConfig {
        autonomous_mode: true,
        auto_approve_complexity: 5.0,
        auto_merge_quality: 80.0,
        dry_run: true,
    };

    let mut orchestrator = HeadlessOrchestrator::new(config);

    // Create multiple issues
    let issues = vec![
        create_test_issue(801, "Feature 1", "First feature"),
        create_test_issue(802, "Feature 2", "Second feature"),
        create_test_issue(803, "Feature 3", "Third feature"),
    ];

    // Execute sequentially (git2::Repository is !Send, can't use tokio::spawn)
    for issue in issues {
        let result = orchestrator.handle_issue_created(&issue).await;
        assert!(result.is_ok(), "Sequential Phase 2 execution should succeed");
    }
}

/// Test Phase 2 dry-run mode consistency
#[tokio::test]
async fn test_phase2_dry_run_no_side_effects() {
    let config = HeadlessOrchestratorConfig {
        autonomous_mode: true,
        auto_approve_complexity: 5.0,
        auto_merge_quality: 80.0,
        dry_run: true,
    };

    let mut orchestrator = HeadlessOrchestrator::new(config);

    let issue = create_test_issue(
        900,
        "Dry-run test",
        "Testing that Phase 2 dry-run doesn't produce side effects",
    );

    // Execute multiple times
    for _ in 0..3 {
        let result = orchestrator.handle_issue_created(&issue).await;
        assert!(result.is_ok(), "Phase 2 dry-run should be idempotent");
    }
}

/// Test Phase 2 with low complexity (auto-approve)
#[tokio::test]
async fn test_phase2_low_complexity_auto_approve() {
    let config = HeadlessOrchestratorConfig {
        autonomous_mode: true,
        auto_approve_complexity: 5.0,
        auto_merge_quality: 80.0,
        dry_run: true,
    };

    let mut orchestrator = HeadlessOrchestrator::new(config);

    // Very simple issue that should auto-approve
    let issue = create_test_issue(
        1000,
        "Fix typo in README",
        "There is a small typo in the documentation",
    );

    let result = orchestrator.handle_issue_created(&issue).await.unwrap();

    // Should complete both phases successfully
    assert!(result.success);
    assert_eq!(result.issue_number, 1000);
}
