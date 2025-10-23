//! Integration tests for miyabi-feedback-loop

use miyabi_feedback_loop::{
    GoalManager, GoalStatus, InfiniteLoopOrchestrator, LoopConfig, LoopStatus,
};

#[tokio::test]
async fn test_orchestrator_basic_flow() {
    // Create orchestrator with small max_iterations for testing
    let config = LoopConfig {
        max_iterations: Some(5),
        convergence_threshold: 1.0, // Low threshold to prevent early convergence
        min_iterations_before_convergence: 3,
        auto_refinement_enabled: false,
        timeout_ms: 5000,
        max_retries: 2,
        iteration_delay_ms: 0, // No delay in tests
    };

    let mut orchestrator = InfiniteLoopOrchestrator::new(config);

    // Start loop
    let result = orchestrator.start_loop("test-goal-1").await;
    assert!(result.is_ok());

    let feedback_loop = result.unwrap();
    assert_eq!(feedback_loop.goal_id, "test-goal-1");
    // May converge or reach max iterations
    // Note: iteration counter is incremented before execution, so max_iterations=5 results in 5 executions but iteration=6
    assert!(feedback_loop.results.len() >= 3);
    assert!(feedback_loop.results.len() <= 5);
    assert!(
        feedback_loop.status == LoopStatus::MaxIterationsReached
            || feedback_loop.status == LoopStatus::Completed
    );
}

#[tokio::test]
async fn test_orchestrator_convergence() {
    // Create orchestrator that should converge
    let config = LoopConfig {
        max_iterations: Some(20),
        convergence_threshold: 10.0, // High threshold for easier convergence
        min_iterations_before_convergence: 3,
        auto_refinement_enabled: false,
        timeout_ms: 5000,
        max_retries: 2,
        iteration_delay_ms: 0,
    };

    let mut orchestrator = InfiniteLoopOrchestrator::new(config);

    let result = orchestrator.start_loop("test-goal-convergence").await;
    assert!(result.is_ok());

    let feedback_loop = result.unwrap();
    assert!(feedback_loop.iterations >= 3); // At least min iterations
    assert!(feedback_loop.iterations <= 20); // Should converge before max

    // Check that convergence metrics exist
    assert!(!feedback_loop.convergence_metrics.is_empty());
}

#[tokio::test]
async fn test_orchestrator_auto_refinement() {
    // Create orchestrator with auto-refinement enabled
    let config = LoopConfig {
        max_iterations: Some(10),
        convergence_threshold: 1.0, // Low threshold to allow more iterations
        min_iterations_before_convergence: 3,
        auto_refinement_enabled: true, // Enable auto-refinement
        timeout_ms: 5000,
        max_retries: 2,
        iteration_delay_ms: 0,
    };

    let mut orchestrator = InfiniteLoopOrchestrator::new(config);

    let result = orchestrator.start_loop("test-goal-refinement").await;
    assert!(result.is_ok());

    let feedback_loop = result.unwrap();
    assert_eq!(feedback_loop.goal_id, "test-goal-refinement");
    assert!(feedback_loop.iterations >= 3);
    assert!(feedback_loop.iterations <= 10);
}

#[tokio::test]
async fn test_orchestrator_cancel_loop() {
    let config = LoopConfig {
        max_iterations: Some(10),
        convergence_threshold: 5.0,
        min_iterations_before_convergence: 3,
        auto_refinement_enabled: false,
        timeout_ms: 5000,
        max_retries: 2,
        iteration_delay_ms: 0,
    };

    let mut orchestrator = InfiniteLoopOrchestrator::new(config);

    // Create a goal first
    let _ = orchestrator.start_loop("test-goal-cancel").await;

    // Cancel the loop
    let cancel_result = orchestrator.cancel_loop("test-goal-cancel");
    assert!(cancel_result.is_ok());

    // Check status
    let status = orchestrator.get_loop_status("test-goal-cancel");
    assert_eq!(status, Some(LoopStatus::Cancelled));
}

#[tokio::test]
async fn test_orchestrator_nonexistent_goal() {
    let config = LoopConfig::default();
    let orchestrator = InfiniteLoopOrchestrator::new(config);

    // Try to get status of nonexistent goal
    let status = orchestrator.get_loop_status("nonexistent-goal");
    assert_eq!(status, None);
}

#[tokio::test]
async fn test_multiple_goals_sequentially() {
    let config = LoopConfig {
        max_iterations: Some(3),
        convergence_threshold: 5.0,
        min_iterations_before_convergence: 2,
        auto_refinement_enabled: false,
        timeout_ms: 5000,
        max_retries: 2,
        iteration_delay_ms: 0,
    };

    let mut orchestrator = InfiniteLoopOrchestrator::new(config);

    // Process multiple goals
    let goal1_result = orchestrator.start_loop("goal-1").await;
    assert!(goal1_result.is_ok());
    assert_eq!(goal1_result.unwrap().goal_id, "goal-1");

    let goal2_result = orchestrator.start_loop("goal-2").await;
    assert!(goal2_result.is_ok());
    assert_eq!(goal2_result.unwrap().goal_id, "goal-2");

    let goal3_result = orchestrator.start_loop("goal-3").await;
    assert!(goal3_result.is_ok());
    assert_eq!(goal3_result.unwrap().goal_id, "goal-3");
}

#[tokio::test]
async fn test_goal_manager_integration() {
    let mut manager = GoalManager::new();

    // Create multiple goals
    let goal1 = manager.create_goal("integration-1", "Test integration 1");
    assert_eq!(goal1.id, "integration-1");
    assert_eq!(goal1.description, "Test integration 1");

    let goal2 = manager.create_goal("integration-2", "Test integration 2");
    assert_eq!(goal2.id, "integration-2");

    // Update status
    manager
        .update_status("integration-1", GoalStatus::Active)
        .unwrap();

    // Get active goals
    let active = manager.active_goals();
    assert_eq!(active.len(), 1);
    assert_eq!(active[0].id, "integration-1");

    // Increment iteration
    let iter1 = manager.increment_iteration("integration-1").unwrap();
    assert_eq!(iter1, 1);

    let iter2 = manager.increment_iteration("integration-1").unwrap();
    assert_eq!(iter2, 2);

    // Refine goal
    manager
        .refine_goal("integration-1", "Refinement feedback 1")
        .unwrap();
    manager
        .refine_goal("integration-1", "Refinement feedback 2")
        .unwrap();

    let goal = manager.get_goal("integration-1").unwrap();
    assert_eq!(goal.refinements.len(), 2);
    assert_eq!(goal.refinements[0], "Refinement feedback 1");
    assert_eq!(goal.refinements[1], "Refinement feedback 2");
}

#[tokio::test]
async fn test_config_validation_integration() {
    // Valid config
    let valid_config = LoopConfig {
        max_iterations: Some(10),
        convergence_threshold: 5.0,
        min_iterations_before_convergence: 3,
        auto_refinement_enabled: true,
        timeout_ms: 300_000,
        max_retries: 3,
        iteration_delay_ms: 1000,
    };
    assert!(valid_config.validate().is_ok());

    // Invalid config: negative threshold
    let invalid_config1 = LoopConfig {
        convergence_threshold: -1.0,
        ..valid_config.clone()
    };
    assert!(invalid_config1.validate().is_err());

    // Invalid config: zero min_iterations
    let invalid_config2 = LoopConfig {
        min_iterations_before_convergence: 0,
        ..valid_config.clone()
    };
    assert!(invalid_config2.validate().is_err());

    // Invalid config: zero timeout
    let invalid_config3 = LoopConfig {
        timeout_ms: 0,
        ..valid_config.clone()
    };
    assert!(invalid_config3.validate().is_err());

    // Invalid config: zero retries
    let invalid_config4 = LoopConfig {
        max_retries: 0,
        ..valid_config
    };
    assert!(invalid_config4.validate().is_err());
}

#[tokio::test]
async fn test_feedback_loop_metrics() {
    let config = LoopConfig {
        max_iterations: Some(5),
        convergence_threshold: 1.0, // Low threshold to prevent early convergence
        min_iterations_before_convergence: 3,
        auto_refinement_enabled: false,
        timeout_ms: 5000,
        max_retries: 2,
        iteration_delay_ms: 0,
    };

    let mut orchestrator = InfiniteLoopOrchestrator::new(config);
    let result = orchestrator.start_loop("test-metrics").await.unwrap();

    // Verify iteration results
    let num_results = result.results.len();
    assert!(num_results >= 3);
    assert!(num_results <= 5);
    for (i, iter_result) in result.results.iter().enumerate() {
        assert_eq!(iter_result.iteration, i + 1);
        assert!(iter_result.score >= 70.0); // Mock scores start at 70.0
        // duration_ms might be 0 for fast mock execution
        assert!(iter_result.success);
        assert!(!iter_result.feedback.is_empty());
    }

    // Verify convergence metrics match number of results
    assert_eq!(result.convergence_metrics.len(), num_results);
    for score in result.convergence_metrics.iter() {
        assert!(*score >= 70.0);
        assert!(*score <= 95.0); // Mock scores max at 95.0
    }

    // Total duration should be non-negative (always true for u64, but explicit check for documentation)
    let _duration = result.total_duration_ms; // Acknowledge the field exists
}

#[tokio::test]
async fn test_orchestrator_infinite_mode() {
    // Note: This test doesn't actually run infinitely
    // It just verifies that infinite mode (max_iterations = None) is accepted
    let config = LoopConfig {
        max_iterations: None, // Infinite mode
        convergence_threshold: 5.0,
        min_iterations_before_convergence: 3,
        auto_refinement_enabled: false,
        timeout_ms: 5000,
        max_retries: 2,
        iteration_delay_ms: 0,
    };

    assert!(config.validate().is_ok());

    // For testing, we'll use the infinite() helper
    let infinite_config = LoopConfig::infinite();
    assert_eq!(infinite_config.max_iterations, None);
}
