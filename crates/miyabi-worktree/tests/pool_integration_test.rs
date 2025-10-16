//! Integration tests for WorktreePool with concurrency control
//!
//! Tests parallel execution with various concurrency limits

use miyabi_worktree::{PoolConfig, WorktreePool};
use serial_test::serial;
use std::path::PathBuf;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::Arc;
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
    std::fs::write(repo_path.join("README.md"), "# Test Repo\n")
        .expect("Failed to write README");

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
async fn test_pool_concurrency_limit() {
    let (_temp_dir, repo_path) = init_test_repo();
    let worktree_base = repo_path.join(".worktrees");

    let config = PoolConfig {
        max_concurrency: 2,
        timeout_seconds: 30,
        fail_fast: false,
        auto_cleanup: true,
    };

    let pool = WorktreePool::new_with_path(&repo_path, &worktree_base, config)
        .expect("Failed to create pool");

    // Track maximum concurrent executions
    let concurrent_count = Arc::new(AtomicUsize::new(0));
    let max_concurrent = Arc::new(AtomicUsize::new(0));

    let issue_numbers = vec![1, 2, 3, 4];

    let result = pool
        .execute_simple(issue_numbers, {
            let concurrent_count = concurrent_count.clone();
            let max_concurrent = max_concurrent.clone();
            move |_path, _issue| {
                let concurrent_count = concurrent_count.clone();
                let max_concurrent = max_concurrent.clone();
                async move {
                    // Increment concurrent count
                    let current = concurrent_count.fetch_add(1, Ordering::SeqCst) + 1;

                    // Update max if needed
                    let mut max = max_concurrent.load(Ordering::SeqCst);
                    while current > max {
                        match max_concurrent.compare_exchange_weak(
                            max,
                            current,
                            Ordering::SeqCst,
                            Ordering::SeqCst,
                        ) {
                            Ok(_) => break,
                            Err(new_max) => max = new_max,
                        }
                    }

                    // Simulate work
                    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;

                    // Decrement concurrent count
                    concurrent_count.fetch_sub(1, Ordering::SeqCst);

                    Ok(())
                }
            }
        })
        .await;

    // Verify concurrency was respected
    let max = max_concurrent.load(Ordering::SeqCst);
    assert!(
        max <= 2,
        "Max concurrent executions {} exceeded limit 2",
        max
    );

    // Verify all tasks completed
    assert_eq!(result.total_tasks, 4);
}

#[tokio::test]
#[serial]
async fn test_pool_execution_success() {
    let (_temp_dir, repo_path) = init_test_repo();
    let worktree_base = repo_path.join(".worktrees");

    let config = PoolConfig {
        max_concurrency: 3,
        timeout_seconds: 30,
        fail_fast: false,
        auto_cleanup: true,
    };

    let pool = WorktreePool::new_with_path(&repo_path, &worktree_base, config)
        .expect("Failed to create pool");

    let issue_numbers = vec![10, 11, 12];

    let result = pool
        .execute_simple(issue_numbers, |path, issue| async move {
            // Create a test file in the worktree
            let test_file = path.join(format!("test-{}.txt", issue));
            tokio::fs::write(&test_file, format!("Test for issue #{}", issue))
                .await
                .map_err(|e| miyabi_types::error::MiyabiError::Io(e))?;

            Ok(())
        })
        .await;

    // Verify results
    assert_eq!(result.total_tasks, 3);
    assert_eq!(result.success_count, 3);
    assert_eq!(result.failed_count, 0);
    assert!(result.all_successful());
    assert_eq!(result.success_rate(), 100.0);
}

#[tokio::test]
#[serial]
async fn test_pool_execution_with_failures() {
    let (_temp_dir, repo_path) = init_test_repo();
    let worktree_base = repo_path.join(".worktrees");

    let config = PoolConfig {
        max_concurrency: 2,
        timeout_seconds: 30,
        fail_fast: false,
        auto_cleanup: true,
    };

    let pool = WorktreePool::new_with_path(&repo_path, &worktree_base, config)
        .expect("Failed to create pool");

    let issue_numbers = vec![20, 21, 22];

    let result = pool
        .execute_simple(issue_numbers, |_path, issue| async move {
            // Fail on issue #21
            if issue == 21 {
                return Err(miyabi_types::error::MiyabiError::Unknown(
                    "Simulated failure".to_string(),
                ));
            }
            Ok(())
        })
        .await;

    // Verify results
    assert_eq!(result.total_tasks, 3);
    assert_eq!(result.success_count, 2);
    assert_eq!(result.failed_count, 1);
    assert!(!result.all_successful());
    assert!((result.success_rate() - 66.66666666666667).abs() < 0.0001);
}

#[tokio::test]
#[serial]
async fn test_pool_timeout_handling() {
    let (_temp_dir, repo_path) = init_test_repo();
    let worktree_base = repo_path.join(".worktrees");

    let config = PoolConfig {
        max_concurrency: 2,
        timeout_seconds: 1, // Short timeout
        fail_fast: false,
        auto_cleanup: true,
    };

    let pool = WorktreePool::new_with_path(&repo_path, &worktree_base, config)
        .expect("Failed to create pool");

    let issue_numbers = vec![30, 31];

    let result = pool
        .execute_simple(issue_numbers, |_path, issue| async move {
            // Make issue #31 timeout
            if issue == 31 {
                tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;
            }
            Ok(())
        })
        .await;

    // Verify timeout was handled
    assert_eq!(result.total_tasks, 2);
    assert!(result.timeout_count >= 1, "Expected at least 1 timeout");
}

#[tokio::test]
#[serial]
async fn test_pool_stats() {
    let (_temp_dir, repo_path) = init_test_repo();
    let worktree_base = repo_path.join(".worktrees");

    let config = PoolConfig {
        max_concurrency: 3,
        timeout_seconds: 30,
        fail_fast: false,
        auto_cleanup: false, // Don't cleanup to check stats
    };

    let pool = WorktreePool::new_with_path(&repo_path, &worktree_base, config)
        .expect("Failed to create pool");

    // Get initial stats
    let stats_before = pool.stats().await;
    assert_eq!(stats_before.max_concurrency, 3);
    assert_eq!(stats_before.active_tasks, 0);

    // Execute tasks
    let issue_numbers = vec![40, 41];
    let _result = pool
        .execute_simple(issue_numbers, |_path, _issue| async move { Ok(()) })
        .await;

    // Get stats after execution
    let stats_after = pool.stats().await;
    assert_eq!(stats_after.max_concurrency, 3);

    // Cleanup
    pool.manager().cleanup_all().await.ok();
}

#[tokio::test]
#[serial]
async fn test_pool_with_different_concurrency_levels() {
    let (_temp_dir, repo_path) = init_test_repo();
    let worktree_base = repo_path.join(".worktrees");

    // Test with concurrency = 1 (sequential)
    let config_seq = PoolConfig {
        max_concurrency: 1,
        timeout_seconds: 30,
        fail_fast: false,
        auto_cleanup: true,
    };

    let pool_seq = WorktreePool::new_with_path(&repo_path, &worktree_base, config_seq)
        .expect("Failed to create sequential pool");

    let issue_numbers = vec![50, 51, 52];
    let result_seq = pool_seq
        .execute_simple(issue_numbers.clone(), |_path, _issue| async move { Ok(()) })
        .await;

    assert_eq!(result_seq.total_tasks, 3);
    assert_eq!(result_seq.success_count, 3);

    // Test with concurrency = 5 (high parallelism)
    let config_par = PoolConfig {
        max_concurrency: 5,
        timeout_seconds: 30,
        fail_fast: false,
        auto_cleanup: true,
    };

    let pool_par = WorktreePool::new_with_path(&repo_path, &worktree_base, config_par)
        .expect("Failed to create parallel pool");

    let result_par = pool_par
        .execute_simple(issue_numbers, |_path, _issue| async move { Ok(()) })
        .await;

    assert_eq!(result_par.total_tasks, 3);
    assert_eq!(result_par.success_count, 3);

    // Parallel execution should be faster (though not guaranteed in tests)
    // Just verify both completed successfully
}

#[test]
fn test_pool_config_default() {
    let config = PoolConfig::default();
    assert_eq!(config.max_concurrency, 3);
    assert_eq!(config.timeout_seconds, 1800);
    assert!(!config.fail_fast);
    assert!(config.auto_cleanup);
}

#[test]
fn test_pool_config_custom() {
    let config = PoolConfig {
        max_concurrency: 10,
        timeout_seconds: 300,
        fail_fast: true,
        auto_cleanup: false,
    };
    assert_eq!(config.max_concurrency, 10);
    assert_eq!(config.timeout_seconds, 300);
    assert!(config.fail_fast);
    assert!(!config.auto_cleanup);
}
