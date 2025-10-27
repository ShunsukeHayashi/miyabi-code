//! Integration tests for parallel worktree execution
//!
//! These tests verify that multiple worktrees can execute in parallel
//! with proper concurrency control and cleanup.

use miyabi_worktree::{PoolConfig, WorktreePool, WorktreeTask};
use serial_test::serial;
use std::sync::atomic::{AtomicU32, Ordering};
use std::sync::Arc;
use tokio::time::Duration;

/// Helper function to cleanup stale worktrees before test execution
async fn cleanup_stale_worktrees() {
    use tokio::process::Command;

    // List all worktrees
    let output = Command::new("git")
        .args(&["worktree", "list", "--porcelain"])
        .output()
        .await;

    if let Ok(output) = output {
        if output.status.success() {
            let list_output = String::from_utf8_lossy(&output.stdout);

            // Extract worktree paths that match test patterns
            for line in list_output.lines() {
                if line.starts_with("worktree ") {
                    let path = line.strip_prefix("worktree ").unwrap();
                    // Remove test worktrees (issue-* pattern in .worktrees/)
                    if path.contains(".worktrees/issue-") {
                        let _ = Command::new("git")
                            .args(&["worktree", "remove", path, "--force"])
                            .output()
                            .await;
                    }
                }
            }
        }
    }
}

/// Test simple parallel execution with mock tasks
#[tokio::test]
#[serial]
async fn test_parallel_execution_basic() {
    // Skip if not in a git repository
    if !is_git_repo().await {
        eprintln!("Skipping test: not in a git repository");
        return;
    }

    // Cleanup stale worktrees from previous test runs
    cleanup_stale_worktrees().await;

    let config = PoolConfig {
        max_concurrency: 3,
        timeout_seconds: 60,
        fail_fast: false,
        auto_cleanup: true,
    };

    let pool = match WorktreePool::new(config, None) {
        Ok(p) => p,
        Err(e) => {
            eprintln!("Failed to create pool: {}", e);
            return;
        }
    };

    // Create 5 mock tasks
    let tasks = vec![
        WorktreeTask {
            issue_number: 1001,
            description: "Mock task 1".to_string(),
            agent_type: Some("MockAgent".to_string()),
            metadata: None,
        },
        WorktreeTask {
            issue_number: 1002,
            description: "Mock task 2".to_string(),
            agent_type: Some("MockAgent".to_string()),
            metadata: None,
        },
        WorktreeTask {
            issue_number: 1003,
            description: "Mock task 3".to_string(),
            agent_type: Some("MockAgent".to_string()),
            metadata: None,
        },
        WorktreeTask {
            issue_number: 1004,
            description: "Mock task 4".to_string(),
            agent_type: Some("MockAgent".to_string()),
            metadata: None,
        },
        WorktreeTask {
            issue_number: 1005,
            description: "Mock task 5".to_string(),
            agent_type: Some("MockAgent".to_string()),
            metadata: None,
        },
    ];

    // Track concurrent execution
    let concurrent_count = Arc::new(AtomicU32::new(0));
    let max_concurrent = Arc::new(AtomicU32::new(0));

    let result = pool
        .execute_parallel(tasks, {
            let concurrent_count = concurrent_count.clone();
            let max_concurrent = max_concurrent.clone();

            move |worktree_info, task| {
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
                            Err(x) => max = x,
                        }
                    }

                    eprintln!(
                        "[Test] Executing task for issue #{} in worktree {:?} (concurrent: {})",
                        task.issue_number, worktree_info.path, current
                    );

                    // Simulate work
                    tokio::time::sleep(Duration::from_millis(500)).await;

                    // Decrement concurrent count
                    concurrent_count.fetch_sub(1, Ordering::SeqCst);

                    Ok(serde_json::json!({
                        "issue": task.issue_number,
                        "status": "completed",
                        "worktree_path": worktree_info.path.to_string_lossy().to_string()
                    }))
                }
            }
        })
        .await;

    // Verify results
    eprintln!("[Test] Execution completed");
    eprintln!("[Test]   Total tasks: {}", result.total_tasks);
    eprintln!("[Test]   Successful: {}", result.success_count);
    eprintln!("[Test]   Failed: {}", result.failed_count);
    eprintln!("[Test]   Timeout: {}", result.timeout_count);
    eprintln!("[Test]   Total duration: {}ms", result.total_duration_ms);
    eprintln!("[Test]   Success rate: {:.1}%", result.success_rate());
    eprintln!(
        "[Test]   Average duration: {:.1}ms",
        result.average_duration_ms()
    );
    eprintln!(
        "[Test]   Max concurrent: {}",
        max_concurrent.load(Ordering::SeqCst)
    );

    assert_eq!(result.total_tasks, 5);
    assert_eq!(result.success_count, 5);
    assert_eq!(result.failed_count, 0);
    assert_eq!(result.timeout_count, 0);

    // Verify concurrency was limited
    let max_concurrent_value = max_concurrent.load(Ordering::SeqCst);
    assert!(
        max_concurrent_value <= 3,
        "Max concurrent execution ({}) exceeded configured limit (3)",
        max_concurrent_value
    );
    assert!(
        max_concurrent_value >= 2,
        "Max concurrent execution ({}) too low (expected >= 2 for 5 tasks)",
        max_concurrent_value
    );
}

/// Test execution with task failures
#[tokio::test]
#[serial]
async fn test_parallel_execution_with_failures() {
    if !is_git_repo().await {
        eprintln!("Skipping test: not in a git repository");
        return;
    }

    // Cleanup stale worktrees from previous test runs
    cleanup_stale_worktrees().await;

    let config = PoolConfig {
        max_concurrency: 2,
        timeout_seconds: 60,
        fail_fast: false,
        auto_cleanup: true,
    };

    let pool = match WorktreePool::new(config, None) {
        Ok(p) => p,
        Err(e) => {
            eprintln!("Failed to create pool: {}", e);
            return;
        }
    };

    let tasks = vec![
        WorktreeTask {
            issue_number: 2001,
            description: "Success task".to_string(),
            agent_type: None,
            metadata: None,
        },
        WorktreeTask {
            issue_number: 2002,
            description: "Failure task".to_string(),
            agent_type: None,
            metadata: Some(serde_json::json!({"should_fail": true})),
        },
        WorktreeTask {
            issue_number: 2003,
            description: "Success task".to_string(),
            agent_type: None,
            metadata: None,
        },
    ];

    let result = pool
        .execute_parallel(tasks, move |_worktree_info, task| async move {
            // Check if this task should fail
            if let Some(metadata) = &task.metadata {
                if metadata.get("should_fail").and_then(|v| v.as_bool()) == Some(true) {
                    return Err(miyabi_types::error::MiyabiError::Unknown(
                        "Simulated failure".to_string(),
                    ));
                }
            }

            tokio::time::sleep(Duration::from_millis(200)).await;

            Ok(serde_json::json!({
                "issue": task.issue_number,
                "status": "completed"
            }))
        })
        .await;

    eprintln!("[Test] Execution with failures completed");
    eprintln!("[Test]   Successful: {}", result.success_count);
    eprintln!("[Test]   Failed: {}", result.failed_count);

    assert_eq!(result.total_tasks, 3);
    assert_eq!(result.success_count, 2);
    assert_eq!(result.failed_count, 1);
    assert_eq!(result.success_rate(), 66.66666666666666);
}

/// Test execution with timeout
#[tokio::test]
#[serial]
async fn test_parallel_execution_with_timeout() {
    if !is_git_repo().await {
        eprintln!("Skipping test: not in a git repository");
        return;
    }

    // Cleanup stale worktrees from previous test runs
    cleanup_stale_worktrees().await;

    let config = PoolConfig {
        max_concurrency: 2,
        timeout_seconds: 1, // Very short timeout
        fail_fast: false,
        auto_cleanup: true,
    };

    let pool = match WorktreePool::new(config, None) {
        Ok(p) => p,
        Err(e) => {
            eprintln!("Failed to create pool: {}", e);
            return;
        }
    };

    let tasks = vec![
        WorktreeTask {
            issue_number: 3001,
            description: "Fast task".to_string(),
            agent_type: None,
            metadata: None,
        },
        WorktreeTask {
            issue_number: 3002,
            description: "Slow task (will timeout)".to_string(),
            agent_type: None,
            metadata: Some(serde_json::json!({"slow": true})),
        },
    ];

    let result = pool
        .execute_parallel(tasks, move |_worktree_info, task| async move {
            // Check if this is a slow task
            if let Some(metadata) = &task.metadata {
                if metadata.get("slow").and_then(|v| v.as_bool()) == Some(true) {
                    // Sleep longer than timeout
                    tokio::time::sleep(Duration::from_secs(3)).await;
                }
            } else {
                tokio::time::sleep(Duration::from_millis(200)).await;
            }

            Ok(serde_json::json!({
                "issue": task.issue_number,
                "status": "completed"
            }))
        })
        .await;

    eprintln!("[Test] Execution with timeout completed");
    eprintln!("[Test]   Successful: {}", result.success_count);
    eprintln!("[Test]   Timeout: {}", result.timeout_count);

    assert_eq!(result.total_tasks, 2);
    assert_eq!(result.success_count, 1);
    assert_eq!(result.timeout_count, 1);
}

/// Test simple execution interface
#[tokio::test]
#[serial]
async fn test_execute_simple() {
    if !is_git_repo().await {
        eprintln!("Skipping test: not in a git repository");
        return;
    }

    let config = PoolConfig {
        max_concurrency: 2,
        timeout_seconds: 60,
        fail_fast: false,
        auto_cleanup: true,
    };

    let pool = match WorktreePool::new(config, None) {
        Ok(p) => p,
        Err(e) => {
            eprintln!("Failed to create pool: {}", e);
            return;
        }
    };

    let issue_numbers = vec![4001, 4002, 4003];

    let result = pool
        .execute_simple(
            issue_numbers,
            move |worktree_path, issue_number| async move {
                eprintln!(
                    "[Test] Processing issue #{} in worktree {:?}",
                    issue_number, worktree_path
                );

                tokio::time::sleep(Duration::from_millis(200)).await;

                Ok(())
            },
        )
        .await;

    eprintln!("[Test] Simple execution completed");
    eprintln!("[Test]   Successful: {}", result.success_count);

    assert_eq!(result.total_tasks, 3);
    assert_eq!(result.success_count, 3);
    assert_eq!(result.failed_count, 0);
}

/// Test pool statistics
#[tokio::test]
#[serial]
async fn test_pool_statistics() {
    if !is_git_repo().await {
        eprintln!("Skipping test: not in a git repository");
        return;
    }

    let config = PoolConfig {
        max_concurrency: 3,
        timeout_seconds: 60,
        fail_fast: false,
        auto_cleanup: false, // Don't cleanup to check stats
    };

    let pool = match WorktreePool::new(config, None) {
        Ok(p) => p,
        Err(e) => {
            eprintln!("Failed to create pool: {}", e);
            return;
        }
    };

    // Get initial stats
    let stats = pool.stats().await;
    eprintln!("[Test] Initial stats:");
    eprintln!("[Test]   Max concurrency: {}", stats.max_concurrency);
    eprintln!("[Test]   Active worktrees: {}", stats.active_worktrees);
    eprintln!("[Test]   Available slots: {}", stats.available_slots);

    assert_eq!(stats.max_concurrency, 3);
    assert_eq!(stats.active_worktrees, 0);
    assert_eq!(stats.available_slots, 3);

    // Cleanup
    let _ = pool.manager().cleanup_all().await;
}

/// Helper function to check if we're in a git repository
async fn is_git_repo() -> bool {
    tokio::process::Command::new("git")
        .args(["rev-parse", "--git-dir"])
        .output()
        .await
        .map(|output| output.status.success())
        .unwrap_or(false)
}

/// Benchmark test for parallel execution performance
#[tokio::test]
#[serial]
#[ignore] // Run with: cargo test --package miyabi-worktree --test parallel_execution_test -- test_parallel_execution_benchmark --ignored
async fn test_parallel_execution_benchmark() {
    if !is_git_repo().await {
        eprintln!("Skipping test: not in a git repository");
        return;
    }

    let config = PoolConfig {
        max_concurrency: 5,
        timeout_seconds: 300,
        fail_fast: false,
        auto_cleanup: true,
    };

    let max_concurrency = config.max_concurrency;

    let pool = match WorktreePool::new(config, None) {
        Ok(p) => p,
        Err(e) => {
            eprintln!("Failed to create pool: {}", e);
            return;
        }
    };

    // Create 10 tasks
    let tasks: Vec<WorktreeTask> = (5001..=5010)
        .map(|i| WorktreeTask {
            issue_number: i,
            description: format!("Benchmark task {}", i),
            agent_type: Some("BenchmarkAgent".to_string()),
            metadata: None,
        })
        .collect();

    eprintln!("[Benchmark] Starting execution of {} tasks", tasks.len());
    eprintln!("[Benchmark] Max concurrency: {}", max_concurrency);

    let start = std::time::Instant::now();

    let result = pool
        .execute_parallel(tasks, move |_worktree_info, task| async move {
            // Simulate realistic work (1-2 seconds per task)
            tokio::time::sleep(Duration::from_millis(1000 + (task.issue_number % 1000))).await;

            Ok(serde_json::json!({
                "issue": task.issue_number,
                "status": "completed"
            }))
        })
        .await;

    let elapsed = start.elapsed();

    eprintln!("\n[Benchmark] Results:");
    eprintln!("  Total tasks: {}", result.total_tasks);
    eprintln!("  Successful: {}", result.success_count);
    eprintln!("  Failed: {}", result.failed_count);
    eprintln!("  Wall time: {:.2}s", elapsed.as_secs_f64());
    eprintln!("  Total duration: {}ms", result.total_duration_ms);
    eprintln!("  Success rate: {:.1}%", result.success_rate());
    eprintln!("  Avg task duration: {:.1}ms", result.average_duration_ms());
    eprintln!(
        "  Theoretical sequential time: {:.1}s",
        result.average_duration_ms() * result.total_tasks as f64 / 1000.0
    );
    eprintln!(
        "  Speedup: {:.2}x",
        (result.average_duration_ms() * result.total_tasks as f64)
            / result.total_duration_ms as f64
    );

    assert_eq!(result.success_count, 10);
    assert_eq!(result.failed_count, 0);
}
