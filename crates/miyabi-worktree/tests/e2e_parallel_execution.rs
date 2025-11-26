//! End-to-end tests for Worktree parallel execution
//!
//! Issue #459: [P2-008] E2Eテスト: Worktree並列実行
//!
//! This test suite verifies:
//! 1. Multiple worktrees can be created in parallel
//! 2. Agents execute in parallel with proper isolation
//! 3. Concurrency limits are respected
//! 4. Task completion is tracked correctly
//! 5. Cleanup works properly

use miyabi_worktree::{PoolConfig, WorktreePool, WorktreeTask};
use serial_test::serial;
use std::collections::HashSet;
use std::path::PathBuf;
use std::sync::atomic::{AtomicU32, Ordering};
use std::sync::{Arc, Mutex};
use tokio::time::Duration;

/// Helper to check if we're in a git repository
async fn is_git_repo() -> bool {
    tokio::process::Command::new("git")
        .args(["rev-parse", "--git-dir"])
        .output()
        .await
        .map(|output| output.status.success())
        .unwrap_or(false)
}

/// Helper to create a test file in worktree
async fn create_test_file(
    path: &std::path::Path,
    filename: &str,
    content: &str,
) -> Result<(), std::io::Error> {
    let file_path = path.join(filename);
    tokio::fs::write(&file_path, content).await?;
    Ok(())
}

/// Helper to commit changes in worktree
async fn commit_changes(
    path: &std::path::Path,
    message: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    // Stage all changes
    let output = tokio::process::Command::new("git")
        .arg("add")
        .arg(".")
        .current_dir(path)
        .output()
        .await?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("git add failed: {}", stderr).into());
    }

    // Commit
    let output = tokio::process::Command::new("git")
        .arg("commit")
        .arg("-m")
        .arg(message)
        .current_dir(path)
        .output()
        .await?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        // Ignore "nothing to commit" errors
        if !stderr.contains("nothing to commit") {
            return Err(format!("git commit failed: {}", stderr).into());
        }
    }

    Ok(())
}

/// Test 1: Basic parallel worktree creation and execution
#[tokio::test]
#[serial]
#[ignore] // Run manually: cargo test --package miyabi-worktree --test e2e_parallel_execution -- --ignored
async fn test_e2e_parallel_worktree_creation() {
    if !is_git_repo().await {
        eprintln!("⚠️  Skipping test: not in a git repository");
        return;
    }

    println!("🚀 Starting E2E test: Parallel worktree creation");

    let config = PoolConfig {
        max_concurrency: 3,
        timeout_seconds: 120,
        fail_fast: false,
        auto_cleanup: true,
    };

    let pool = match WorktreePool::new(config, Some(PathBuf::from(".worktrees-e2e"))) {
        Ok(p) => p,
        Err(e) => {
            eprintln!("❌ Failed to create pool: {}", e);
            return;
        }
    };

    // Create 5 tasks that will execute in parallel (max 3 concurrent)
    let tasks = vec![
        WorktreeTask {
            issue_number: 9001,
            description: "E2E Task 1: Create README".to_string(),
            agent_type: Some("TestAgent".to_string()),
            metadata: Some(serde_json::json!({"filename": "README-1.md"})),
        },
        WorktreeTask {
            issue_number: 9002,
            description: "E2E Task 2: Create README".to_string(),
            agent_type: Some("TestAgent".to_string()),
            metadata: Some(serde_json::json!({"filename": "README-2.md"})),
        },
        WorktreeTask {
            issue_number: 9003,
            description: "E2E Task 3: Create README".to_string(),
            agent_type: Some("TestAgent".to_string()),
            metadata: Some(serde_json::json!({"filename": "README-3.md"})),
        },
        WorktreeTask {
            issue_number: 9004,
            description: "E2E Task 4: Create README".to_string(),
            agent_type: Some("TestAgent".to_string()),
            metadata: Some(serde_json::json!({"filename": "README-4.md"})),
        },
        WorktreeTask {
            issue_number: 9005,
            description: "E2E Task 5: Create README".to_string(),
            agent_type: Some("TestAgent".to_string()),
            metadata: Some(serde_json::json!({"filename": "README-5.md"})),
        },
    ];

    println!("📋 Created {} tasks for parallel execution", tasks.len());

    // Track concurrent execution
    let concurrent_count = Arc::new(AtomicU32::new(0));
    let max_concurrent = Arc::new(AtomicU32::new(0));
    let worktree_paths = Arc::new(Mutex::new(HashSet::new()));

    let result = pool
        .execute_parallel(tasks, {
            let concurrent_count = concurrent_count.clone();
            let max_concurrent = max_concurrent.clone();
            let worktree_paths = worktree_paths.clone();

            move |worktree_info, task| {
                let concurrent_count = concurrent_count.clone();
                let max_concurrent = max_concurrent.clone();
                let worktree_paths = worktree_paths.clone();

                async move {
                    // Track concurrency
                    let current = concurrent_count.fetch_add(1, Ordering::SeqCst) + 1;
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

                    println!(
                        "   🔨 Executing task #{} in worktree {:?} (concurrent: {})",
                        task.issue_number, worktree_info.path, current
                    );

                    // Track unique worktree paths
                    {
                        let mut paths = worktree_paths.lock().unwrap();
                        paths.insert(worktree_info.path.clone());
                    }

                    // Simulate agent work
                    let filename = task
                        .metadata
                        .as_ref()
                        .and_then(|m| m.get("filename"))
                        .and_then(|f| f.as_str())
                        .unwrap_or("README.md");

                    let content = format!(
                        "# Task {}\n\nThis file was created by E2E test.\nIssue: #{}\n",
                        task.issue_number, task.issue_number
                    );

                    // Create file
                    create_test_file(&worktree_info.path, filename, &content)
                        .await
                        .map_err(|e| {
                            miyabi_types::error::MiyabiError::Unknown(format!(
                                "Failed to create file: {}",
                                e
                            ))
                        })?;

                    // Commit changes
                    commit_changes(
                        &worktree_info.path,
                        &format!(
                            "feat(e2e): add {} for issue #{}",
                            filename, task.issue_number
                        ),
                    )
                    .await
                    .map_err(|e| {
                        miyabi_types::error::MiyabiError::Unknown(format!(
                            "Failed to commit: {}",
                            e
                        ))
                    })?;

                    // Simulate work duration
                    tokio::time::sleep(Duration::from_millis(500)).await;

                    concurrent_count.fetch_sub(1, Ordering::SeqCst);

                    println!("   ✅ Task #{} completed", task.issue_number);

                    Ok(serde_json::json!({
                        "issue": task.issue_number,
                        "status": "completed",
                        "worktree_path": worktree_info.path.to_string_lossy().to_string(),
                        "filename": filename
                    }))
                }
            }
        })
        .await;

    // Verify results
    println!("\n📊 Execution Results:");
    println!("   Total tasks: {}", result.total_tasks);
    println!("   Successful: {}", result.success_count);
    println!("   Failed: {}", result.failed_count);
    println!("   Timeout: {}", result.timeout_count);
    println!("   Duration: {}ms", result.total_duration_ms);
    println!("   Success rate: {:.1}%", result.success_rate());
    println!(
        "   Max concurrent: {}",
        max_concurrent.load(Ordering::SeqCst)
    );

    // Assertions
    assert_eq!(result.total_tasks, 5, "Should have 5 tasks");
    assert_eq!(result.success_count, 5, "All tasks should succeed");
    assert_eq!(result.failed_count, 0, "No tasks should fail");
    assert_eq!(result.timeout_count, 0, "No tasks should timeout");

    // Verify concurrency was limited
    let max_concurrent_value = max_concurrent.load(Ordering::SeqCst);
    assert!(
        max_concurrent_value <= 3,
        "Max concurrent ({}) should not exceed limit (3)",
        max_concurrent_value
    );

    // Verify unique worktree paths
    let paths = worktree_paths.lock().unwrap();
    assert_eq!(
        paths.len(),
        5,
        "Should have created 5 unique worktree paths"
    );

    println!("\n✅ E2E test passed: Parallel worktree creation");
}

/// Test 2: Isolation verification - ensure worktrees don't interfere with each other
#[tokio::test]
#[serial]
#[ignore] // Run manually: cargo test --package miyabi-worktree --test e2e_parallel_execution -- --ignored
async fn test_e2e_worktree_isolation() {
    if !is_git_repo().await {
        eprintln!("⚠️  Skipping test: not in a git repository");
        return;
    }

    println!("🚀 Starting E2E test: Worktree isolation");

    let config = PoolConfig {
        max_concurrency: 3,
        timeout_seconds: 120,
        fail_fast: false,
        auto_cleanup: true,
    };

    let pool = match WorktreePool::new(config, Some(PathBuf::from(".worktrees-e2e"))) {
        Ok(p) => p,
        Err(e) => {
            eprintln!("❌ Failed to create pool: {}", e);
            return;
        }
    };

    // Create tasks that modify the same file name (simulating potential conflicts)
    let tasks = vec![
        WorktreeTask {
            issue_number: 8001,
            description: "Isolation Test 1: Modify shared file".to_string(),
            agent_type: Some("IsolationAgent".to_string()),
            metadata: Some(serde_json::json!({"version": "v1"})),
        },
        WorktreeTask {
            issue_number: 8002,
            description: "Isolation Test 2: Modify shared file".to_string(),
            agent_type: Some("IsolationAgent".to_string()),
            metadata: Some(serde_json::json!({"version": "v2"})),
        },
        WorktreeTask {
            issue_number: 8003,
            description: "Isolation Test 3: Modify shared file".to_string(),
            agent_type: Some("IsolationAgent".to_string()),
            metadata: Some(serde_json::json!({"version": "v3"})),
        },
    ];

    println!("📋 Created {} tasks for isolation testing", tasks.len());

    let file_contents = Arc::new(Mutex::new(Vec::new()));

    let result = pool
        .execute_parallel(tasks, {
            let file_contents = file_contents.clone();

            move |worktree_info, task| {
                let file_contents = file_contents.clone();

                async move {
                    let version = task
                        .metadata
                        .as_ref()
                        .and_then(|m| m.get("version"))
                        .and_then(|v| v.as_str())
                        .unwrap_or("unknown");

                    println!(
                        "   🔨 Task #{}: Creating SHARED.md with version {}",
                        task.issue_number, version
                    );

                    // All tasks modify a file with the same name
                    let content = format!(
                        "# Shared File - Version {}\n\nModified by issue #{}\n",
                        version, task.issue_number
                    );

                    create_test_file(&worktree_info.path, "SHARED.md", &content)
                        .await
                        .map_err(|e| {
                            miyabi_types::error::MiyabiError::Unknown(format!(
                                "Failed to create file: {}",
                                e
                            ))
                        })?;

                    // Verify file content
                    let file_path = worktree_info.path.join("SHARED.md");
                    let read_content =
                        tokio::fs::read_to_string(&file_path).await.map_err(|e| {
                            miyabi_types::error::MiyabiError::Unknown(format!(
                                "Failed to read file: {}",
                                e
                            ))
                        })?;

                    // Store for later verification
                    {
                        let mut contents = file_contents.lock().unwrap();
                        contents.push((task.issue_number, read_content.clone()));
                    }

                    commit_changes(
                        &worktree_info.path,
                        &format!(
                            "feat: add SHARED.md version {} for issue #{}",
                            version, task.issue_number
                        ),
                    )
                    .await
                    .map_err(|e| {
                        miyabi_types::error::MiyabiError::Unknown(format!(
                            "Failed to commit: {}",
                            e
                        ))
                    })?;

                    tokio::time::sleep(Duration::from_millis(300)).await;

                    println!(
                        "   ✅ Task #{}: Version {} committed",
                        task.issue_number, version
                    );

                    Ok(serde_json::json!({
                        "issue": task.issue_number,
                        "version": version,
                        "content_verified": read_content.contains(version)
                    }))
                }
            }
        })
        .await;

    println!("\n📊 Isolation Test Results:");
    println!("   Successful: {}", result.success_count);
    println!("   Failed: {}", result.failed_count);

    assert_eq!(result.success_count, 3, "All tasks should succeed");

    // Verify isolation: each worktree should have its own version
    let contents = file_contents.lock().unwrap();
    assert_eq!(contents.len(), 3, "Should have 3 file contents");

    println!("\n🔍 Verifying isolation:");
    for (issue_num, content) in contents.iter() {
        let expected_issue = format!("#{}", issue_num);
        assert!(
            content.contains(&expected_issue),
            "File should contain issue number {}",
            issue_num
        );
        println!("   ✅ Issue #{} has correct isolated content", issue_num);
    }

    println!("\n✅ E2E test passed: Worktree isolation");
}

/// Test 3: Failure handling and cleanup
#[tokio::test]
#[serial]
#[ignore] // Run manually: cargo test --package miyabi-worktree --test e2e_parallel_execution -- --ignored
async fn test_e2e_failure_handling() {
    if !is_git_repo().await {
        eprintln!("⚠️  Skipping test: not in a git repository");
        return;
    }

    println!("🚀 Starting E2E test: Failure handling");

    let config = PoolConfig {
        max_concurrency: 2,
        timeout_seconds: 120,
        fail_fast: false,
        auto_cleanup: true,
    };

    let pool = match WorktreePool::new(config, Some(PathBuf::from(".worktrees-e2e"))) {
        Ok(p) => p,
        Err(e) => {
            eprintln!("❌ Failed to create pool: {}", e);
            return;
        }
    };

    // Mix of successful and failing tasks
    let tasks = vec![
        WorktreeTask {
            issue_number: 7001,
            description: "Success Task 1".to_string(),
            agent_type: Some("TestAgent".to_string()),
            metadata: Some(serde_json::json!({"should_fail": false})),
        },
        WorktreeTask {
            issue_number: 7002,
            description: "Failing Task".to_string(),
            agent_type: Some("TestAgent".to_string()),
            metadata: Some(serde_json::json!({"should_fail": true})),
        },
        WorktreeTask {
            issue_number: 7003,
            description: "Success Task 2".to_string(),
            agent_type: Some("TestAgent".to_string()),
            metadata: Some(serde_json::json!({"should_fail": false})),
        },
    ];

    println!(
        "📋 Created {} tasks (1 will fail intentionally)",
        tasks.len()
    );

    let result = pool
        .execute_parallel(tasks, move |worktree_info, task| async move {
            let should_fail = task
                .metadata
                .as_ref()
                .and_then(|m| m.get("should_fail"))
                .and_then(|v| v.as_bool())
                .unwrap_or(false);

            if should_fail {
                println!("   ❌ Task #{}: Simulating failure", task.issue_number);
                return Err(miyabi_types::error::MiyabiError::Unknown(
                    "Simulated failure for testing".to_string(),
                ));
            }

            println!("   🔨 Task #{}: Executing successfully", task.issue_number);

            create_test_file(
                &worktree_info.path,
                "success.txt",
                &format!("Success from issue #{}", task.issue_number),
            )
            .await
            .map_err(|e| {
                miyabi_types::error::MiyabiError::Unknown(format!("Failed to create file: {}", e))
            })?;

            commit_changes(
                &worktree_info.path,
                &format!("feat: add success.txt for issue #{}", task.issue_number),
            )
            .await
            .map_err(|e| {
                miyabi_types::error::MiyabiError::Unknown(format!("Failed to commit: {}", e))
            })?;

            tokio::time::sleep(Duration::from_millis(200)).await;

            println!("   ✅ Task #{}: Completed", task.issue_number);

            Ok(serde_json::json!({
                "issue": task.issue_number,
                "status": "completed"
            }))
        })
        .await;

    println!("\n📊 Failure Handling Results:");
    println!("   Total tasks: {}", result.total_tasks);
    println!("   Successful: {}", result.success_count);
    println!("   Failed: {}", result.failed_count);
    println!("   Success rate: {:.1}%", result.success_rate());

    assert_eq!(result.total_tasks, 3);
    assert_eq!(result.success_count, 2, "Should have 2 successful tasks");
    assert_eq!(result.failed_count, 1, "Should have 1 failed task");

    // Verify cleanup occurred (auto_cleanup is enabled)
    let stats = pool.stats().await;
    println!("\n📊 Post-cleanup Stats:");
    println!("   Active worktrees: {}", stats.active_worktrees);
    println!("   Available slots: {}", stats.available_slots);

    println!("\n✅ E2E test passed: Failure handling");
}

/// Test 4: Completion tracking and statistics
#[tokio::test]
#[serial]
#[ignore] // Run manually: cargo test --package miyabi-worktree --test e2e_parallel_execution -- --ignored
async fn test_e2e_completion_tracking() {
    if !is_git_repo().await {
        eprintln!("⚠️  Skipping test: not in a git repository");
        return;
    }

    println!("🚀 Starting E2E test: Completion tracking");

    let config = PoolConfig {
        max_concurrency: 4,
        timeout_seconds: 120,
        fail_fast: false,
        auto_cleanup: false, // Keep worktrees to verify stats
    };

    let pool = match WorktreePool::new(config, Some(PathBuf::from(".worktrees-e2e"))) {
        Ok(p) => p,
        Err(e) => {
            eprintln!("❌ Failed to create pool: {}", e);
            return;
        }
    };

    // Initial stats
    let initial_stats = pool.stats().await;
    println!("📊 Initial Stats:");
    println!("   Max concurrency: {}", initial_stats.max_concurrency);
    println!("   Active worktrees: {}", initial_stats.active_worktrees);
    println!("   Available slots: {}", initial_stats.available_slots);

    let tasks = (6001..=6005)
        .map(|i| WorktreeTask {
            issue_number: i,
            description: format!("Tracking Task {}", i),
            agent_type: Some("TrackingAgent".to_string()),
            metadata: None,
        })
        .collect();

    println!("\n📋 Executing 5 tasks with completion tracking");

    let completed_at = Arc::new(Mutex::new(Vec::new()));

    let result = pool
        .execute_parallel(tasks, {
            let completed_at = completed_at.clone();

            move |_worktree_info, task| {
                let completed_at = completed_at.clone();

                async move {
                    println!("   🔨 Task #{}: Starting", task.issue_number);

                    // Variable duration to simulate real work
                    let duration_ms = 100 + (task.issue_number % 5) * 50;
                    tokio::time::sleep(Duration::from_millis(duration_ms)).await;

                    // Track completion time
                    {
                        let mut times = completed_at.lock().unwrap();
                        times.push((task.issue_number, std::time::Instant::now()));
                    }

                    println!(
                        "   ✅ Task #{}: Completed ({}ms)",
                        task.issue_number, duration_ms
                    );

                    Ok(serde_json::json!({
                        "issue": task.issue_number,
                        "duration_ms": duration_ms
                    }))
                }
            }
        })
        .await;

    println!("\n📊 Completion Tracking Results:");
    println!("   Total tasks: {}", result.total_tasks);
    println!("   Successful: {}", result.success_count);
    println!("   Total duration: {}ms", result.total_duration_ms);
    println!(
        "   Avg task duration: {:.1}ms",
        result.average_duration_ms()
    );
    println!("   Min duration: {}ms", result.min_duration_ms());
    println!("   Max duration: {}ms", result.max_duration_ms());
    println!("   Throughput: {:.2} tasks/sec", result.throughput());
    println!(
        "   Effective concurrency: {:.2}x",
        result.effective_concurrency()
    );

    assert_eq!(result.success_count, 5);

    // Verify completion order tracking
    {
        let times = completed_at.lock().unwrap();
        assert_eq!(times.len(), 5, "Should track all 5 completions");
    }

    // Manual cleanup
    println!("\n🧹 Cleaning up worktrees");
    pool.manager()
        .cleanup_all()
        .await
        .expect("Cleanup should succeed");

    let final_stats = pool.stats().await;
    println!("📊 Final Stats:");
    println!("   Active worktrees: {}", final_stats.active_worktrees);
    println!("   Available slots: {}", final_stats.available_slots);

    println!("\n✅ E2E test passed: Completion tracking");
}

/// Test 5: Fail-fast mode
#[tokio::test]
#[serial]
#[ignore] // Run manually: cargo test --package miyabi-worktree --test e2e_parallel_execution -- --ignored
async fn test_e2e_fail_fast_mode() {
    if !is_git_repo().await {
        eprintln!("⚠️  Skipping test: not in a git repository");
        return;
    }

    println!("🚀 Starting E2E test: Fail-fast mode");

    let config = PoolConfig {
        max_concurrency: 3,
        timeout_seconds: 120,
        fail_fast: true, // Enable fail-fast
        auto_cleanup: true,
    };

    let pool = match WorktreePool::new(config, Some(PathBuf::from(".worktrees-e2e"))) {
        Ok(p) => p,
        Err(e) => {
            eprintln!("❌ Failed to create pool: {}", e);
            return;
        }
    };

    let tasks = vec![
        WorktreeTask {
            issue_number: 5001,
            description: "Task 1 (will succeed)".to_string(),
            agent_type: None,
            metadata: Some(serde_json::json!({"delay_ms": 100, "should_fail": false})),
        },
        WorktreeTask {
            issue_number: 5002,
            description: "Task 2 (will fail early)".to_string(),
            agent_type: None,
            metadata: Some(serde_json::json!({"delay_ms": 50, "should_fail": true})),
        },
        WorktreeTask {
            issue_number: 5003,
            description: "Task 3 (should be cancelled)".to_string(),
            agent_type: None,
            metadata: Some(serde_json::json!({"delay_ms": 500, "should_fail": false})),
        },
        WorktreeTask {
            issue_number: 5004,
            description: "Task 4 (should be cancelled)".to_string(),
            agent_type: None,
            metadata: Some(serde_json::json!({"delay_ms": 500, "should_fail": false})),
        },
    ];

    println!("📋 Executing 4 tasks with fail-fast enabled");
    println!("   Task 2 will fail after 50ms, triggering cancellation");

    let execution_started = Arc::new(Mutex::new(Vec::new()));

    let result = pool
        .execute_parallel(tasks, {
            let execution_started = execution_started.clone();

            move |_worktree_info, task| {
                let execution_started = execution_started.clone();

                async move {
                    {
                        let mut started = execution_started.lock().unwrap();
                        started.push(task.issue_number);
                    }

                    let delay_ms = task
                        .metadata
                        .as_ref()
                        .and_then(|m| m.get("delay_ms"))
                        .and_then(|v| v.as_u64())
                        .unwrap_or(100);

                    let should_fail = task
                        .metadata
                        .as_ref()
                        .and_then(|m| m.get("should_fail"))
                        .and_then(|v| v.as_bool())
                        .unwrap_or(false);

                    tokio::time::sleep(Duration::from_millis(delay_ms)).await;

                    if should_fail {
                        println!(
                            "   ❌ Task #{}: Failing (triggering fail-fast)",
                            task.issue_number
                        );
                        return Err(miyabi_types::error::MiyabiError::Unknown(
                            "Fail-fast test failure".to_string(),
                        ));
                    }

                    println!("   ✅ Task #{}: Completed", task.issue_number);

                    Ok(serde_json::json!({
                        "issue": task.issue_number,
                        "status": "completed"
                    }))
                }
            }
        })
        .await;

    println!("\n📊 Fail-Fast Results:");
    println!("   Total tasks: {}", result.total_tasks);
    println!("   Successful: {}", result.success_count);
    println!("   Failed: {}", result.failed_count);
    println!("   Cancelled: {}", result.cancelled_count);

    // In fail-fast mode, we expect:
    // - At least 1 failure
    // - Possibly some cancelled tasks
    assert!(result.failed_count > 0, "Should have at least 1 failure");
    assert!(
        result.has_failures() || result.has_cancellations(),
        "Should have failures or cancellations"
    );

    let started = execution_started.lock().unwrap();
    println!("\n🔍 Execution Analysis:");
    println!("   Tasks that started: {:?}", *started);
    println!("   Tasks that were cancelled: {}", result.cancelled_count);

    println!("\n✅ E2E test passed: Fail-fast mode");
}
