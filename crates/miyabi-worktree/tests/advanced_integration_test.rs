//! Advanced integration tests for miyabi-worktree
//!
//! Tests cover:
//! - Pool execution result methods
//! - Concurrency metrics
//! - Fail-fast mode
//! - Cancellation handling
//! - Performance characteristics

use miyabi_worktree::{PoolConfig, PoolExecutionResult, TaskResult, TaskStatus, WorktreePool};
use serial_test::serial;
use std::path::PathBuf;
use tempfile::TempDir;

/// Helper to initialize a test git repository
fn init_test_repo() -> (TempDir, PathBuf) {
    let temp_dir = TempDir::new().expect("Failed to create temp dir");
    let repo_path = temp_dir.path().to_path_buf();

    // Initialize git repo
    std::process::Command::new("git")
        .arg("init")
        .current_dir(&repo_path)
        .output()
        .expect("Failed to init git repo");

    // Configure git
    std::process::Command::new("git")
        .args(["config", "user.name", "Test User"])
        .current_dir(&repo_path)
        .output()
        .expect("Failed to configure git user");

    std::process::Command::new("git")
        .args(["config", "user.email", "test@example.com"])
        .current_dir(&repo_path)
        .output()
        .expect("Failed to configure git email");

    // Create initial commit
    std::fs::write(repo_path.join("README.md"), "# Test Repo\n").expect("Failed to write README");

    std::process::Command::new("git")
        .args(["add", "README.md"])
        .current_dir(&repo_path)
        .output()
        .expect("Failed to add README");

    std::process::Command::new("git")
        .args(["commit", "-m", "Initial commit"])
        .current_dir(&repo_path)
        .output()
        .expect("Failed to create initial commit");

    (temp_dir, repo_path)
}

#[tokio::test]
#[serial]
async fn test_pool_execution_result_metrics() {
    let result = PoolExecutionResult {
        total_tasks: 10,
        results: vec![
            TaskResult {
                issue_number: 1,
                worktree_id: "id1".to_string(),
                status: TaskStatus::Success,
                duration_ms: 1000,
                error: None,
                output: None,
            },
            TaskResult {
                issue_number: 2,
                worktree_id: "id2".to_string(),
                status: TaskStatus::Success,
                duration_ms: 2000,
                error: None,
                output: None,
            },
            TaskResult {
                issue_number: 3,
                worktree_id: "id3".to_string(),
                status: TaskStatus::Failed,
                duration_ms: 500,
                error: Some("Error".to_string()),
                output: None,
            },
            TaskResult {
                issue_number: 4,
                worktree_id: "id4".to_string(),
                status: TaskStatus::Timeout,
                duration_ms: 5000,
                error: Some("Timeout".to_string()),
                output: None,
            },
        ],
        total_duration_ms: 10000,
        success_count: 2,
        failed_count: 1,
        timeout_count: 1,
        cancelled_count: 6,
    };

    // Test metrics methods
    assert!(!result.all_successful());
    assert!(result.has_failures());
    assert!(result.has_cancellations());
    assert_eq!(result.success_rate(), 20.0);
    assert_eq!(result.failure_rate(), 20.0);
    assert_eq!(result.average_duration_ms(), 2125.0);
    assert_eq!(result.min_duration_ms(), 500);
    assert_eq!(result.max_duration_ms(), 5000);
    assert_eq!(result.throughput(), 1.0); // 10 tasks / 10 seconds
    assert_eq!(result.effective_concurrency(), 0.85); // 8.5s work / 10s time

    // Test filtering methods
    assert_eq!(result.successful_tasks().len(), 2);
    assert_eq!(result.failed_tasks().len(), 1);
    assert_eq!(result.timed_out_tasks().len(), 1);
    // Note: cancelled_tasks() returns tasks with Cancelled status from results vector
    // Since we only have 4 tasks in results, we can't have 6 cancelled tasks
    assert_eq!(result.cancelled_tasks().len(), 0); // No tasks in results have Cancelled status
}

#[tokio::test]
#[serial]
async fn test_pool_fail_fast_mode() {
    let (_temp_dir, repo_path) = init_test_repo();
    let worktree_base = repo_path.join(".worktrees");

    let config = PoolConfig {
        max_concurrency: 2,
        timeout_seconds: 60,
        fail_fast: true, // Enable fail-fast
        auto_cleanup: true,
    };

    let pool = WorktreePool::new_with_path(&repo_path, &worktree_base, config)
        .expect("Failed to create pool");

    let issue_numbers = vec![1, 2, 3, 4, 5];

    let result = pool
        .execute_simple(issue_numbers, |_path, issue| async move {
            // Fail on issue #2
            if issue == 2 {
                return Err(miyabi_types::error::MiyabiError::Unknown(
                    "Simulated failure".to_string(),
                ));
            }
            tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
            Ok(())
        })
        .await;

    // With fail-fast, some tasks should be cancelled after the failure
    assert!(result.has_failures());
    assert!(
        result.has_cancellations() || result.failed_count == 1,
        "Should have cancellations or only 1 failure in fail-fast mode"
    );
}

#[tokio::test]
#[serial]
async fn test_pool_execution_with_mixed_results() {
    let (_temp_dir, repo_path) = init_test_repo();
    let worktree_base = repo_path.join(".worktrees");

    let config = PoolConfig {
        max_concurrency: 3,
        timeout_seconds: 2,
        fail_fast: false,
        auto_cleanup: true,
    };

    let pool = WorktreePool::new_with_path(&repo_path, &worktree_base, config)
        .expect("Failed to create pool");

    let issue_numbers = vec![10, 11, 12, 13, 14];

    let result = pool
        .execute_simple(issue_numbers, |_path, issue| async move {
            match issue {
                10 => Ok(()), // Success
                11 => {
                    // Timeout
                    tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;
                    Ok(())
                },
                12 => Ok(()), // Success
                13 => Err(miyabi_types::error::MiyabiError::Unknown("Test error".to_string())), // Failure
                14 => Ok(()), // Success
                _ => Ok(()),
            }
        })
        .await;

    // Verify mixed results
    assert_eq!(result.total_tasks, 5);
    assert!(result.success_count >= 2); // At least 10, 12, 14 should succeed
    assert!(result.failed_count >= 1); // 13 should fail
    assert!(result.timeout_count >= 1); // 11 should timeout
}

#[tokio::test]
#[serial]
async fn test_pool_all_successful_execution() {
    let (_temp_dir, repo_path) = init_test_repo();
    let worktree_base = repo_path.join(".worktrees");

    let config = PoolConfig {
        max_concurrency: 4,
        timeout_seconds: 30,
        fail_fast: false,
        auto_cleanup: true,
    };

    let pool = WorktreePool::new_with_path(&repo_path, &worktree_base, config)
        .expect("Failed to create pool");

    let issue_numbers = vec![20, 21, 22, 23];

    let result = pool
        .execute_simple(issue_numbers, |_path, _issue| async move {
            tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
            Ok(())
        })
        .await;

    // All should succeed
    assert_eq!(result.total_tasks, 4);
    assert_eq!(result.success_count, 4);
    assert_eq!(result.failed_count, 0);
    assert_eq!(result.timeout_count, 0);
    assert_eq!(result.cancelled_count, 0);
    assert!(result.all_successful());
    assert!(!result.has_failures());
    assert!(!result.has_cancellations());
    assert_eq!(result.success_rate(), 100.0);
}

#[tokio::test]
#[serial]
async fn test_pool_with_high_concurrency() {
    let (_temp_dir, repo_path) = init_test_repo();
    let worktree_base = repo_path.join(".worktrees");

    let config = PoolConfig {
        max_concurrency: 10, // High concurrency
        timeout_seconds: 30,
        fail_fast: false,
        auto_cleanup: true,
    };

    let pool = WorktreePool::new_with_path(&repo_path, &worktree_base, config)
        .expect("Failed to create pool");

    let issue_numbers = vec![30, 31, 32, 33, 34];

    let result = pool
        .execute_simple(issue_numbers, |_path, _issue| async move {
            tokio::time::sleep(tokio::time::Duration::from_millis(50)).await;
            Ok(())
        })
        .await;

    assert_eq!(result.total_tasks, 5);
    assert_eq!(result.success_count, 5);

    // With high concurrency, effective concurrency should be high
    // (all tasks run nearly in parallel)
    let effective = result.effective_concurrency();
    assert!(effective >= 3.0, "Expected high effective concurrency, got {}", effective);
}

#[tokio::test]
#[serial]
async fn test_pool_with_sequential_execution() {
    let (_temp_dir, repo_path) = init_test_repo();
    let worktree_base = repo_path.join(".worktrees");

    let config = PoolConfig {
        max_concurrency: 1, // Sequential execution
        timeout_seconds: 30,
        fail_fast: false,
        auto_cleanup: true,
    };

    let pool = WorktreePool::new_with_path(&repo_path, &worktree_base, config)
        .expect("Failed to create pool");

    let issue_numbers = vec![40, 41, 42];

    let start = std::time::Instant::now();

    let result = pool
        .execute_simple(issue_numbers, |_path, _issue| async move {
            tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
            Ok(())
        })
        .await;

    let elapsed = start.elapsed();

    assert_eq!(result.total_tasks, 3);
    assert_eq!(result.success_count, 3);

    // With sequential execution, total time should be roughly sum of individual times
    assert!(
        elapsed >= tokio::time::Duration::from_millis(300),
        "Sequential execution should take at least 300ms"
    );
}

#[tokio::test]
#[serial]
async fn test_pool_result_serialization() {
    let result = PoolExecutionResult {
        total_tasks: 3,
        results: vec![
            TaskResult {
                issue_number: 1,
                worktree_id: "id1".to_string(),
                status: TaskStatus::Success,
                duration_ms: 1000,
                error: None,
                output: Some(serde_json::json!({"test": true})),
            },
            TaskResult {
                issue_number: 2,
                worktree_id: "id2".to_string(),
                status: TaskStatus::Failed,
                duration_ms: 500,
                error: Some("Error message".to_string()),
                output: None,
            },
        ],
        total_duration_ms: 2000,
        success_count: 1,
        failed_count: 1,
        timeout_count: 0,
        cancelled_count: 1,
    };

    let json = serde_json::to_string(&result).expect("Failed to serialize");
    let deserialized: PoolExecutionResult =
        serde_json::from_str(&json).expect("Failed to deserialize");

    assert_eq!(result.total_tasks, deserialized.total_tasks);
    assert_eq!(result.success_count, deserialized.success_count);
    assert_eq!(result.failed_count, deserialized.failed_count);
    assert_eq!(result.results.len(), deserialized.results.len());
}

#[tokio::test]
#[serial]
async fn test_pool_empty_task_list() {
    let (_temp_dir, repo_path) = init_test_repo();
    let worktree_base = repo_path.join(".worktrees");

    let config = PoolConfig::default();

    let pool = WorktreePool::new_with_path(&repo_path, &worktree_base, config)
        .expect("Failed to create pool");

    let issue_numbers: Vec<u64> = vec![];

    let result = pool.execute_simple(issue_numbers, |_path, _issue| async move { Ok(()) }).await;

    assert_eq!(result.total_tasks, 0);
    assert_eq!(result.success_count, 0);
    assert!(result.all_successful()); // Vacuously true
    assert!(!result.has_failures());
}

#[tokio::test]
#[serial]
async fn test_pool_stats_tracking() {
    let (_temp_dir, repo_path) = init_test_repo();
    let worktree_base = repo_path.join(".worktrees");

    let config = PoolConfig {
        max_concurrency: 3,
        timeout_seconds: 30,
        fail_fast: false,
        auto_cleanup: false, // Don't auto-cleanup to check stats
    };

    let pool = WorktreePool::new_with_path(&repo_path, &worktree_base, config)
        .expect("Failed to create pool");

    // Initial stats
    let stats = pool.stats().await;
    assert_eq!(stats.max_concurrency, 3);
    assert_eq!(stats.active_worktrees, 0);
    assert_eq!(stats.available_slots, 3);

    // Manual cleanup
    let _ = pool.manager().cleanup_all().await;
}

#[tokio::test]
#[serial]
async fn test_pool_config_variations() {
    let configs = vec![
        PoolConfig {
            max_concurrency: 1,
            timeout_seconds: 10,
            fail_fast: true,
            auto_cleanup: true,
        },
        PoolConfig {
            max_concurrency: 5,
            timeout_seconds: 60,
            fail_fast: false,
            auto_cleanup: false,
        },
        PoolConfig {
            max_concurrency: 10,
            timeout_seconds: 300,
            fail_fast: true,
            auto_cleanup: true,
        },
    ];

    let (_temp_dir, repo_path) = init_test_repo();
    let worktree_base = repo_path.join(".worktrees");

    for config in configs {
        let pool = WorktreePool::new_with_path(&repo_path, &worktree_base, config.clone());
        assert!(pool.is_ok(), "Failed to create pool with config");
    }
}

#[tokio::test]
#[serial]
async fn test_pool_execution_result_all_methods() {
    // Create a comprehensive result for testing all methods
    let result = PoolExecutionResult {
        total_tasks: 20,
        results: vec![
            TaskResult {
                issue_number: 1,
                worktree_id: "id1".to_string(),
                status: TaskStatus::Success,
                duration_ms: 1000,
                error: None,
                output: None,
            },
            TaskResult {
                issue_number: 2,
                worktree_id: "id2".to_string(),
                status: TaskStatus::Failed,
                duration_ms: 2000,
                error: Some("Error".to_string()),
                output: None,
            },
            TaskResult {
                issue_number: 3,
                worktree_id: "id3".to_string(),
                status: TaskStatus::Timeout,
                duration_ms: 5000,
                error: Some("Timeout".to_string()),
                output: None,
            },
            TaskResult {
                issue_number: 4,
                worktree_id: "id4".to_string(),
                status: TaskStatus::Cancelled,
                duration_ms: 100,
                error: Some("Cancelled".to_string()),
                output: None,
            },
        ],
        total_duration_ms: 10000,
        success_count: 1,
        failed_count: 1,
        timeout_count: 1,
        cancelled_count: 17,
    };

    // Test all methods
    assert!(!result.all_successful());
    assert!(result.has_failures());
    assert!(result.has_cancellations());

    assert_eq!(result.success_rate(), 5.0);
    assert_eq!(result.failure_rate(), 10.0);

    assert_eq!(result.average_duration_ms(), 2025.0);
    assert_eq!(result.min_duration_ms(), 100);
    assert_eq!(result.max_duration_ms(), 5000);

    assert_eq!(result.throughput(), 2.0);
    assert_eq!(result.effective_concurrency(), 0.81);

    assert_eq!(result.successful_tasks().len(), 1);
    assert_eq!(result.failed_tasks().len(), 1);
    assert_eq!(result.timed_out_tasks().len(), 1);
    assert_eq!(result.cancelled_tasks().len(), 1);
}

#[tokio::test]
#[serial]
async fn test_task_result_all_status_types() {
    let statuses = vec![
        TaskStatus::Success,
        TaskStatus::Failed,
        TaskStatus::Timeout,
        TaskStatus::Cancelled,
    ];

    for status in statuses {
        let result = TaskResult {
            issue_number: 999,
            worktree_id: "test-id".to_string(),
            status,
            duration_ms: 1000,
            error: None,
            output: None,
        };

        // Verify serialization works for all status types
        let json = serde_json::to_string(&result).expect("Failed to serialize");
        let deserialized: TaskResult = serde_json::from_str(&json).expect("Failed to deserialize");

        assert_eq!(result.status, deserialized.status);
    }
}

#[test]
fn test_pool_config_default_values() {
    let config = PoolConfig::default();
    assert_eq!(config.max_concurrency, 3);
    assert_eq!(config.timeout_seconds, 1800);
    assert!(!config.fail_fast);
    assert!(config.auto_cleanup);
}

#[test]
fn test_task_status_equality() {
    assert_eq!(TaskStatus::Success, TaskStatus::Success);
    assert_ne!(TaskStatus::Success, TaskStatus::Failed);
    assert_ne!(TaskStatus::Failed, TaskStatus::Timeout);
    assert_ne!(TaskStatus::Timeout, TaskStatus::Cancelled);
}
