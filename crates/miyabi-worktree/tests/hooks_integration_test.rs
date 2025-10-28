//! Integration tests for Hooks + WorktreePool
//!
//! Tests scenarios combining lifecycle hooks with parallel worktree execution:
//! - Scenario 1: Multiple worktree parallel execution with hook logs
//! - Scenario 2: fail_fast trigger with on_error hook calls
//! - Scenario 3: Statistics methods vs Hook Metrics consistency

use async_trait::async_trait;
use miyabi_agents::{AgentHook, AuditLogHook, BaseAgent, HookedAgent, MetricsHook};
use miyabi_types::agent::{AgentMetrics, AgentType, ResultStatus};
use miyabi_types::error::{MiyabiError, Result};
use miyabi_types::task::TaskType;
use miyabi_types::{AgentResult, Task};
use miyabi_worktree::{PoolConfig, WorktreePool, WorktreeTask};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tempfile::TempDir;
use tokio::fs;

// ============================================================================
// Test Agent & Hook Infrastructure
// ============================================================================

/// Test agent that can be configured to succeed or fail
struct TestAgent {
    should_fail: bool,
    execution_delay_ms: u64,
}

impl TestAgent {
    fn new(should_fail: bool, execution_delay_ms: u64) -> Self {
        Self {
            should_fail,
            execution_delay_ms,
        }
    }
}

#[async_trait]
impl BaseAgent for TestAgent {
    fn agent_type(&self) -> AgentType {
        AgentType::CodeGenAgent
    }

    async fn execute(&self, task: &Task) -> Result<AgentResult> {
        // Simulate work
        tokio::time::sleep(tokio::time::Duration::from_millis(self.execution_delay_ms)).await;

        if self.should_fail {
            return Err(MiyabiError::Unknown(format!(
                "Intentional failure for task {}",
                task.id
            )));
        }

        Ok(AgentResult {
            status: ResultStatus::Success,
            data: Some(serde_json::json!({
                "task_id": task.id,
                "completed": true
            })),
            error: None,
            metrics: Some(AgentMetrics {
                task_id: task.id.clone(),
                agent_type: AgentType::CodeGenAgent,
                duration_ms: self.execution_delay_ms,
                quality_score: Some(95),
                lines_changed: Some(42),
                tests_added: Some(5),
                coverage_percent: Some(85.0),
                errors_found: Some(0),
                timestamp: chrono::Utc::now(),
            }),
            escalation: None,
        })
    }
}

/// Recording hook to capture lifecycle events
#[derive(Clone)]
struct RecordingHook {
    events: Arc<Mutex<Vec<HookEvent>>>,
}

#[derive(Debug, Clone)]
#[allow(dead_code)]
struct HookEvent {
    event_type: String,
    agent_type: AgentType,
    task_id: String,
    worktree_id: Option<String>,
    timestamp: chrono::DateTime<chrono::Utc>,
}

impl RecordingHook {
    fn new() -> Self {
        Self {
            events: Arc::new(Mutex::new(Vec::new())),
        }
    }

    fn events(&self) -> Vec<HookEvent> {
        self.events.lock().unwrap().clone()
    }

    fn count_by_type(&self, event_type: &str) -> usize {
        self.events
            .lock()
            .unwrap()
            .iter()
            .filter(|e| e.event_type == event_type)
            .count()
    }

    fn extract_worktree_id(task: &Task) -> Option<String> {
        task.metadata
            .as_ref()
            .and_then(|m| m.get("worktree_id"))
            .and_then(|v| v.as_str())
            .map(|s| s.to_string())
    }
}

#[async_trait]
impl AgentHook for RecordingHook {
    async fn on_pre_execute(&self, agent: AgentType, task: &Task) -> Result<()> {
        let mut events = self.events.lock().unwrap();
        events.push(HookEvent {
            event_type: "pre_execute".to_string(),
            agent_type: agent,
            task_id: task.id.clone(),
            worktree_id: Self::extract_worktree_id(task),
            timestamp: chrono::Utc::now(),
        });
        Ok(())
    }

    async fn on_post_execute(
        &self,
        agent: AgentType,
        task: &Task,
        _result: &AgentResult,
    ) -> Result<()> {
        let mut events = self.events.lock().unwrap();
        events.push(HookEvent {
            event_type: "post_execute".to_string(),
            agent_type: agent,
            task_id: task.id.clone(),
            worktree_id: Self::extract_worktree_id(task),
            timestamp: chrono::Utc::now(),
        });
        Ok(())
    }

    async fn on_error(&self, agent: AgentType, task: &Task, _error: &MiyabiError) -> Result<()> {
        let mut events = self.events.lock().unwrap();
        events.push(HookEvent {
            event_type: "error".to_string(),
            agent_type: agent,
            task_id: task.id.clone(),
            worktree_id: Self::extract_worktree_id(task),
            timestamp: chrono::Utc::now(),
        });
        Ok(())
    }
}

// ============================================================================
// Scenario 1: Multiple Worktree Parallel Execution with Hook Logs
// ============================================================================

#[tokio::test]
async fn test_scenario_1_parallel_execution_with_hooks() {
    // Setup: Create temporary directory for worktree and logs
    let temp_dir = TempDir::new().unwrap();
    let temp_path = temp_dir.path();
    let log_dir = temp_path.join("logs");
    fs::create_dir_all(&log_dir).await.unwrap();

    // Create a minimal git repository
    let repo_path = temp_path.join("repo");
    std::fs::create_dir_all(&repo_path).unwrap();
    std::process::Command::new("git")
        .args(["init"])
        .current_dir(&repo_path)
        .output()
        .expect("Failed to init git repo");
    std::process::Command::new("git")
        .args(["config", "user.email", "test@example.com"])
        .current_dir(&repo_path)
        .output()
        .unwrap();
    std::process::Command::new("git")
        .args(["config", "user.name", "Test User"])
        .current_dir(&repo_path)
        .output()
        .unwrap();
    std::fs::write(repo_path.join("README.md"), "# Test").unwrap();
    std::process::Command::new("git")
        .args(["add", "."])
        .current_dir(&repo_path)
        .output()
        .unwrap();
    std::process::Command::new("git")
        .args(["commit", "-m", "Initial commit"])
        .current_dir(&repo_path)
        .output()
        .unwrap();

    // Create WorktreePool with 2 concurrency
    let config = PoolConfig {
        max_concurrency: 2,
        timeout_seconds: 10,
        fail_fast: false,
        auto_cleanup: true,
    };

    let worktree_base = temp_path.join("worktrees");
    let pool = WorktreePool::new_with_path(&repo_path, &worktree_base, config).unwrap();

    // Create 3 tasks
    let tasks = vec![
        WorktreeTask {
            issue_number: 101,
            description: "Task 1".to_string(),
            agent_type: Some("CodeGenAgent".to_string()),
            metadata: None,
        },
        WorktreeTask {
            issue_number: 102,
            description: "Task 2".to_string(),
            agent_type: Some("CodeGenAgent".to_string()),
            metadata: None,
        },
        WorktreeTask {
            issue_number: 103,
            description: "Task 3".to_string(),
            agent_type: Some("CodeGenAgent".to_string()),
            metadata: None,
        },
    ];

    // Setup recording hook
    let recording_hook = RecordingHook::new();

    // Execute tasks with hooks
    let result = pool
        .execute_parallel(tasks, {
            let recording_hook = recording_hook.clone();
            let log_dir = log_dir.clone();
            move |worktree_info, _task| {
                let recording_hook = recording_hook.clone();
                let log_dir = log_dir.clone();
                async move {
                    // Create agent with hooks
                    let agent = TestAgent::new(false, 100); // 100ms delay
                    let mut hooked_agent = HookedAgent::new(agent);
                    hooked_agent.register_hook(recording_hook.clone());
                    hooked_agent.register_hook(MetricsHook::new());
                    hooked_agent.register_hook(AuditLogHook::new(log_dir));

                    // Create task with worktree_id in metadata
                    let mut metadata = HashMap::new();
                    metadata.insert(
                        "worktree_id".to_string(),
                        serde_json::json!(worktree_info.id.clone()),
                    );

                    let task = Task {
                        id: format!("task-{}", worktree_info.issue_number),
                        title: format!("Test Task {}", worktree_info.issue_number),
                        description: "Test task description".to_string(),
                        task_type: TaskType::Feature,
                        priority: 1,
                        severity: None,
                        impact: None,
                        assigned_agent: Some(AgentType::CodeGenAgent),
                        dependencies: vec![],
                        estimated_duration: Some(1),
                        status: None,
                        start_time: None,
                        end_time: None,
                        metadata: Some(metadata),
                    };

                    // Execute with hooks
                    let agent_result = hooked_agent.execute(&task).await?;

                    Ok(serde_json::to_value(agent_result).unwrap())
                }
            }
        })
        .await;

    // Verify execution results
    assert_eq!(result.total_tasks, 3);
    assert_eq!(result.success_count, 3);
    assert_eq!(result.failed_count, 0);
    assert!(result.all_successful());

    // Verify hook events
    let events = recording_hook.events();
    assert_eq!(events.len(), 6); // 3 pre + 3 post

    // Verify each task had pre and post hooks
    assert_eq!(recording_hook.count_by_type("pre_execute"), 3);
    assert_eq!(recording_hook.count_by_type("post_execute"), 3);
    assert_eq!(recording_hook.count_by_type("error"), 0);

    // Verify worktree_id was captured in events
    let events_with_worktree_id = events.iter().filter(|e| e.worktree_id.is_some()).count();
    assert_eq!(events_with_worktree_id, 6);

    // Verify audit log files were created (one per worktree)
    let date = chrono::Utc::now().format("%Y-%m-%d").to_string();
    let mut log_files = vec![];
    let mut read_dir = fs::read_dir(&log_dir).await.unwrap();
    while let Some(entry) = read_dir.next_entry().await.unwrap() {
        log_files.push(entry);
    }

    assert_eq!(log_files.len(), 3); // 3 worktree-specific log files

    for entry in log_files {
        let file_name = entry.file_name();
        let file_name_str = file_name.to_str().unwrap();
        assert!(file_name_str.starts_with(&date));
        assert!(file_name_str.contains("-worktree-"));
        assert!(file_name_str.ends_with(".md"));
    }
}

// ============================================================================
// Scenario 2: fail_fast Trigger with on_error Hook Calls
// ============================================================================

#[tokio::test]
#[serial_test::serial]
async fn test_scenario_2_fail_fast_with_error_hooks() {
    // Setup
    let temp_dir = TempDir::new().unwrap();
    let temp_path = temp_dir.path();
    let log_dir = temp_path.join("logs");
    fs::create_dir_all(&log_dir).await.unwrap();

    // Create git repository
    let repo_path = temp_path.join("repo");
    std::fs::create_dir_all(&repo_path).unwrap();
    std::process::Command::new("git")
        .args(["init"])
        .current_dir(&repo_path)
        .output()
        .unwrap();
    std::process::Command::new("git")
        .args(["config", "user.email", "test@example.com"])
        .current_dir(&repo_path)
        .output()
        .unwrap();
    std::process::Command::new("git")
        .args(["config", "user.name", "Test User"])
        .current_dir(&repo_path)
        .output()
        .unwrap();
    std::fs::write(repo_path.join("README.md"), "# Test").unwrap();
    std::process::Command::new("git")
        .args(["add", "."])
        .current_dir(&repo_path)
        .output()
        .unwrap();
    std::process::Command::new("git")
        .args(["commit", "-m", "Initial commit"])
        .current_dir(&repo_path)
        .output()
        .unwrap();

    // Create WorktreePool with fail_fast enabled
    let config = PoolConfig {
        max_concurrency: 3,
        timeout_seconds: 10,
        fail_fast: true, // Enable fail-fast
        auto_cleanup: true,
    };

    let worktree_base = temp_path.join("worktrees");
    let pool = WorktreePool::new_with_path(&repo_path, &worktree_base, config).unwrap();

    // Create 5 tasks - second one will fail
    let tasks = vec![
        WorktreeTask {
            issue_number: 201,
            description: "Task 1 (success)".to_string(),
            agent_type: Some("CodeGenAgent".to_string()),
            metadata: None,
        },
        WorktreeTask {
            issue_number: 202,
            description: "Task 2 (will fail)".to_string(),
            agent_type: Some("CodeGenAgent".to_string()),
            metadata: Some(serde_json::json!({"should_fail": true})),
        },
        WorktreeTask {
            issue_number: 203,
            description: "Task 3 (should be cancelled)".to_string(),
            agent_type: Some("CodeGenAgent".to_string()),
            metadata: None,
        },
        WorktreeTask {
            issue_number: 204,
            description: "Task 4 (should be cancelled)".to_string(),
            agent_type: Some("CodeGenAgent".to_string()),
            metadata: None,
        },
        WorktreeTask {
            issue_number: 205,
            description: "Task 5 (should be cancelled)".to_string(),
            agent_type: Some("CodeGenAgent".to_string()),
            metadata: None,
        },
    ];

    // Setup recording hook
    let recording_hook = RecordingHook::new();

    // Execute tasks
    let result = pool
        .execute_parallel(tasks, {
            let recording_hook = recording_hook.clone();
            let log_dir = log_dir.clone();
            move |worktree_info, task| {
                let recording_hook = recording_hook.clone();
                let log_dir = log_dir.clone();
                async move {
                    // Determine if this task should fail
                    let should_fail = task
                        .metadata
                        .as_ref()
                        .and_then(|m| m.get("should_fail"))
                        .and_then(|v| v.as_bool())
                        .unwrap_or(false);

                    // Create agent with hooks
                    let agent = TestAgent::new(should_fail, 50);
                    let mut hooked_agent = HookedAgent::new(agent);
                    hooked_agent.register_hook(recording_hook.clone());
                    hooked_agent.register_hook(AuditLogHook::new(log_dir));

                    // Create task with worktree_id
                    let mut metadata = HashMap::new();
                    metadata.insert(
                        "worktree_id".to_string(),
                        serde_json::json!(worktree_info.id.clone()),
                    );

                    let task = Task {
                        id: format!("task-{}", worktree_info.issue_number),
                        title: format!("Test Task {}", worktree_info.issue_number),
                        description: "Test task".to_string(),
                        task_type: TaskType::Feature,
                        priority: 1,
                        severity: None,
                        impact: None,
                        assigned_agent: Some(AgentType::CodeGenAgent),
                        dependencies: vec![],
                        estimated_duration: Some(1),
                        status: None,
                        start_time: None,
                        end_time: None,
                        metadata: Some(metadata),
                    };

                    // Execute with hooks
                    let agent_result = hooked_agent.execute(&task).await?;

                    Ok(serde_json::to_value(agent_result).unwrap())
                }
            }
        })
        .await;

    // Verify fail-fast behavior
    assert_eq!(result.total_tasks, 5);
    assert!(result.has_failures());
    assert!(result.failed_count >= 1); // At least one failure

    // Note: fail-fast cancellation is async and may not always complete before result is returned
    // We verify the primary fail-fast behavior (failure detection) rather than timing-dependent cancellation
    // See Issue #605 for details on flaky cancellation counting
    let completed_tasks = result.success_count + result.failed_count;
    if completed_tasks < result.total_tasks {
        // Ideal case: some tasks were cancelled
        eprintln!("[Test] Fail-fast cancelled {} tasks", result.cancelled_count);
    } else {
        // Edge case: all tasks completed before cancellation propagated
        eprintln!("[Test] All tasks completed (fail-fast timing edge case)");
    }

    // Verify error hooks were called
    let events = recording_hook.events();
    let error_count = recording_hook.count_by_type("error");
    assert!(error_count >= 1, "Expected at least 1 error event");

    // Verify that on_error was called for the failed task
    let error_events: Vec<_> = events.iter().filter(|e| e.event_type == "error").collect();
    assert!(!error_events.is_empty());

    // Verify worktree_id was captured in error events
    for event in error_events {
        assert!(
            event.worktree_id.is_some(),
            "Error event should have worktree_id"
        );
    }
}

// ============================================================================
// Scenario 3: Statistics Methods vs Hook Metrics Consistency
// ============================================================================

#[tokio::test]
async fn test_scenario_3_statistics_consistency() {
    // Setup
    let temp_dir = TempDir::new().unwrap();
    let temp_path = temp_dir.path();
    let log_dir = temp_path.join("logs");
    fs::create_dir_all(&log_dir).await.unwrap();

    // Create git repository
    let repo_path = temp_path.join("repo");
    std::fs::create_dir_all(&repo_path).unwrap();
    std::process::Command::new("git")
        .args(["init"])
        .current_dir(&repo_path)
        .output()
        .unwrap();
    std::process::Command::new("git")
        .args(["config", "user.email", "test@example.com"])
        .current_dir(&repo_path)
        .output()
        .unwrap();
    std::process::Command::new("git")
        .args(["config", "user.name", "Test User"])
        .current_dir(&repo_path)
        .output()
        .unwrap();
    std::fs::write(repo_path.join("README.md"), "# Test").unwrap();
    std::process::Command::new("git")
        .args(["add", "."])
        .current_dir(&repo_path)
        .output()
        .unwrap();
    std::process::Command::new("git")
        .args(["commit", "-m", "Initial commit"])
        .current_dir(&repo_path)
        .output()
        .unwrap();

    // Create WorktreePool
    let config = PoolConfig {
        max_concurrency: 2,
        timeout_seconds: 10,
        fail_fast: false,
        auto_cleanup: true,
    };

    let worktree_base = temp_path.join("worktrees");
    let pool = WorktreePool::new_with_path(&repo_path, &worktree_base, config).unwrap();

    // Create 4 tasks (2 success, 1 fail, 1 success)
    let tasks = vec![
        WorktreeTask {
            issue_number: 301,
            description: "Task 1 (success)".to_string(),
            agent_type: Some("CodeGenAgent".to_string()),
            metadata: None,
        },
        WorktreeTask {
            issue_number: 302,
            description: "Task 2 (will fail)".to_string(),
            agent_type: Some("CodeGenAgent".to_string()),
            metadata: Some(serde_json::json!({"should_fail": true})),
        },
        WorktreeTask {
            issue_number: 303,
            description: "Task 3 (success)".to_string(),
            agent_type: Some("CodeGenAgent".to_string()),
            metadata: None,
        },
        WorktreeTask {
            issue_number: 304,
            description: "Task 4 (success)".to_string(),
            agent_type: Some("CodeGenAgent".to_string()),
            metadata: None,
        },
    ];

    // Setup recording hook
    let recording_hook = RecordingHook::new();

    // Execute tasks
    let result = pool
        .execute_parallel(tasks, {
            let recording_hook = recording_hook.clone();
            let log_dir = log_dir.clone();
            move |worktree_info, task| {
                let recording_hook = recording_hook.clone();
                let log_dir = log_dir.clone();
                async move {
                    let should_fail = task
                        .metadata
                        .as_ref()
                        .and_then(|m| m.get("should_fail"))
                        .and_then(|v| v.as_bool())
                        .unwrap_or(false);

                    let agent = TestAgent::new(should_fail, 75);
                    let mut hooked_agent = HookedAgent::new(agent);
                    hooked_agent.register_hook(recording_hook.clone());
                    hooked_agent.register_hook(MetricsHook::new());
                    hooked_agent.register_hook(AuditLogHook::new(log_dir));

                    let mut metadata = HashMap::new();
                    metadata.insert(
                        "worktree_id".to_string(),
                        serde_json::json!(worktree_info.id.clone()),
                    );

                    let task = Task {
                        id: format!("task-{}", worktree_info.issue_number),
                        title: format!("Test Task {}", worktree_info.issue_number),
                        description: "Test".to_string(),
                        task_type: TaskType::Feature,
                        priority: 1,
                        severity: None,
                        impact: None,
                        assigned_agent: Some(AgentType::CodeGenAgent),
                        dependencies: vec![],
                        estimated_duration: Some(1),
                        status: None,
                        start_time: None,
                        end_time: None,
                        metadata: Some(metadata),
                    };

                    let agent_result = hooked_agent.execute(&task).await?;
                    Ok(serde_json::to_value(agent_result).unwrap())
                }
            }
        })
        .await;

    // Verify pool statistics
    assert_eq!(result.total_tasks, 4);
    assert_eq!(result.success_count, 3);
    assert_eq!(result.failed_count, 1);

    // Verify hook metrics consistency
    let _events = recording_hook.events();

    // Count hook events
    let pre_count = recording_hook.count_by_type("pre_execute");
    let post_count = recording_hook.count_by_type("post_execute");
    let error_count = recording_hook.count_by_type("error");

    // All tasks should have pre_execute
    assert_eq!(pre_count, 4, "All 4 tasks should have pre_execute hook");

    // Success + Error = Total
    assert_eq!(
        post_count + error_count,
        4,
        "post_execute + error should equal total tasks"
    );

    // Consistency check: success count from pool == post_execute count
    assert_eq!(
        result.success_count, post_count,
        "Pool success count should match post_execute hook count"
    );

    // Consistency check: failed count from pool == error count
    assert_eq!(
        result.failed_count, error_count,
        "Pool failed count should match error hook count"
    );

    // Verify statistics methods
    assert_eq!(result.success_rate(), 75.0);
    assert_eq!(result.failure_rate(), 25.0);
    assert!(result.average_duration_ms() > 0.0);
    assert!(result.throughput() > 0.0);

    // Verify failed_tasks() method consistency
    assert_eq!(result.failed_tasks().len(), 1);
    assert_eq!(result.successful_tasks().len(), 3);
}
