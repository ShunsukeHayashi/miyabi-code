//! End-to-end integration test for Coordinator + Hooks + WorktreePool
//!
//! Tests the complete flow from CoordinatorAgent execution through
//! parallel WorktreePool execution with full hook lifecycle management.
//!
//! Test Flow:
//! 1. CoordinatorAgent execution (mock Issue decomposition)
//! 2. WorktreePool parallel execution (3 worktrees)
//! 3. fail_fast triggering (1 intentional failure)
//! 4. Audit log verification
//! 5. Statistics validation
//!
//! NOTE: Marked with #[ignore] as it requires significant setup.
//! Run with: cargo test --package miyabi-cli -- e2e_coordinator --ignored

use async_trait::async_trait;
use miyabi_agents::{AgentHook, AuditLogHook, BaseAgent, HookedAgent, MetricsHook};
use miyabi_types::agent::{AgentMetrics, AgentType, ResultStatus};
use miyabi_types::error::{MiyabiError, Result};
use miyabi_types::task::{Task, TaskType};
use miyabi_types::AgentResult;
use miyabi_worktree::{PoolConfig, WorktreePool, WorktreeTask};
use serial_test::serial;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tempfile::TempDir;
use tokio::fs;

// ============================================================================
// Mock Coordinator Agent
// ============================================================================

/// Mock CoordinatorAgent that simulates Issue decomposition
struct MockCoordinatorAgent {
    should_succeed: bool,
}

impl MockCoordinatorAgent {
    fn new(should_succeed: bool) -> Self {
        Self { should_succeed }
    }
}

#[async_trait]
impl BaseAgent for MockCoordinatorAgent {
    fn agent_type(&self) -> AgentType {
        AgentType::CoordinatorAgent
    }

    async fn execute(&self, task: &Task) -> Result<AgentResult> {
        // Simulate work
        tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;

        if !self.should_succeed {
            return Err(MiyabiError::Unknown("Coordinator execution failed".to_string()));
        }

        // Return mock task decomposition
        let decomposition = serde_json::json!({
            "tasks": [
                {
                    "id": "task-1",
                    "title": "Implement feature A",
                    "type": "feature",
                    "priority": 1,
                    "agent": "CodeGenAgent"
                },
                {
                    "id": "task-2",
                    "title": "Review code",
                    "type": "review",
                    "priority": 2,
                    "agent": "ReviewAgent"
                },
                {
                    "id": "task-3",
                    "title": "Deploy to staging",
                    "type": "deployment",
                    "priority": 3,
                    "agent": "DeploymentAgent"
                }
            ],
            "total_tasks": 3,
            "estimated_duration": 15
        });

        Ok(AgentResult {
            status: ResultStatus::Success,
            data: Some(decomposition),
            error: None,
            metrics: Some(AgentMetrics {
                task_id: task.id.clone(),
                agent_type: AgentType::CoordinatorAgent,
                duration_ms: 100,
                quality_score: None,
                lines_changed: None,
                tests_added: None,
                coverage_percent: None,
                errors_found: None,
                timestamp: chrono::Utc::now(),
            }),
            escalation: None,
        })
    }
}

// ============================================================================
// Mock Specialist Agent
// ============================================================================

/// Mock specialist agent (CodeGen/Review/Deployment)
struct MockSpecialistAgent {
    agent_type: AgentType,
    should_fail: bool,
    execution_delay_ms: u64,
}

impl MockSpecialistAgent {
    fn new(agent_type: AgentType, should_fail: bool, execution_delay_ms: u64) -> Self {
        Self {
            agent_type,
            should_fail,
            execution_delay_ms,
        }
    }
}

#[async_trait]
impl BaseAgent for MockSpecialistAgent {
    fn agent_type(&self) -> AgentType {
        self.agent_type
    }

    async fn execute(&self, task: &Task) -> Result<AgentResult> {
        tokio::time::sleep(tokio::time::Duration::from_millis(self.execution_delay_ms)).await;

        if self.should_fail {
            return Err(MiyabiError::Unknown(format!(
                "{:?} execution failed for task {}",
                self.agent_type, task.id
            )));
        }

        Ok(AgentResult {
            status: ResultStatus::Success,
            data: Some(serde_json::json!({
                "task_id": task.id,
                "agent": format!("{:?}", self.agent_type),
                "completed": true
            })),
            error: None,
            metrics: Some(AgentMetrics {
                task_id: task.id.clone(),
                agent_type: self.agent_type,
                duration_ms: self.execution_delay_ms,
                quality_score: Some(90),
                lines_changed: Some(50),
                tests_added: Some(3),
                coverage_percent: Some(80.0),
                errors_found: Some(0),
                timestamp: chrono::Utc::now(),
            }),
            escalation: None,
        })
    }
}

// ============================================================================
// Recording Hook for Verification
// ============================================================================

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

    fn count_by_agent(&self, agent_type: AgentType) -> usize {
        self.events
            .lock()
            .unwrap()
            .iter()
            .filter(|e| e.agent_type == agent_type)
            .count()
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
// E2E Test: Complete Flow
// ============================================================================

#[tokio::test]
#[serial]
#[ignore] // Requires setup - run with: cargo test -- --ignored
async fn test_e2e_coordinator_with_hooks_and_worktree_pool() {
    // ========================================================================
    // Step 1: Setup
    // ========================================================================

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
    std::fs::write(repo_path.join("README.md"), "# E2E Test").unwrap();
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

    // Setup recording hook (shared across all agents)
    let recording_hook = RecordingHook::new();

    // ========================================================================
    // Step 2: Execute CoordinatorAgent with Hooks
    // ========================================================================

    let coordinator = MockCoordinatorAgent::new(true);
    let mut hooked_coordinator = HookedAgent::new(coordinator);
    hooked_coordinator.register_hook(recording_hook.clone());
    hooked_coordinator.register_hook(MetricsHook::new());
    hooked_coordinator.register_hook(AuditLogHook::new(log_dir.clone()));

    let coordinator_task = Task {
        id: "coordinator-issue-270".to_string(),
        title: "Decompose Issue #270".to_string(),
        description: "Break down issue into executable tasks".to_string(),
        task_type: TaskType::Feature,
        priority: 0,
        severity: None,
        impact: None,
        assigned_agent: Some(AgentType::CoordinatorAgent),
        dependencies: vec![],
        estimated_duration: Some(5),
        status: None,
        start_time: None,
        end_time: None,
        metadata: None,
    };

    let coordinator_result = hooked_coordinator.execute(&coordinator_task).await.unwrap();
    assert_eq!(coordinator_result.status, ResultStatus::Success);

    // Verify coordinator hooks were called
    assert_eq!(recording_hook.count_by_agent(AgentType::CoordinatorAgent), 2); // pre + post

    // ========================================================================
    // Step 3: Execute WorktreePool with Specialist Agents
    // ========================================================================

    let config = PoolConfig {
        max_concurrency: 2,
        timeout_seconds: 10,
        fail_fast: true, // Enable fail-fast for error testing
        auto_cleanup: true,
    };

    let worktree_base = temp_path.join("worktrees");
    let pool = WorktreePool::new_with_path(&repo_path, &worktree_base, config).unwrap();

    // Create 3 tasks - task 2 will fail intentionally
    let tasks = vec![
        WorktreeTask {
            issue_number: 301,
            description: "Task 1 - CodeGen (success)".to_string(),
            agent_type: Some("CodeGenAgent".to_string()),
            metadata: None,
        },
        WorktreeTask {
            issue_number: 302,
            description: "Task 2 - Review (will fail)".to_string(),
            agent_type: Some("ReviewAgent".to_string()),
            metadata: Some(serde_json::json!({"should_fail": true})),
        },
        WorktreeTask {
            issue_number: 303,
            description: "Task 3 - Deploy (should be cancelled)".to_string(),
            agent_type: Some("DeploymentAgent".to_string()),
            metadata: None,
        },
    ];

    let result = pool
        .execute_parallel(tasks, {
            let recording_hook = recording_hook.clone();
            let log_dir = log_dir.clone();
            move |worktree_info, task| {
                let recording_hook = recording_hook.clone();
                let log_dir = log_dir.clone();
                async move {
                    // Determine agent type and failure
                    let agent_type = match task.issue_number {
                        301 => AgentType::CodeGenAgent,
                        302 => AgentType::ReviewAgent,
                        303 => AgentType::DeploymentAgent,
                        _ => AgentType::CodeGenAgent,
                    };

                    let should_fail = task
                        .metadata
                        .as_ref()
                        .and_then(|m| m.get("should_fail"))
                        .and_then(|v| v.as_bool())
                        .unwrap_or(false);

                    // Create specialist agent with hooks
                    let agent = MockSpecialistAgent::new(agent_type, should_fail, 75);
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
                        title: format!("Specialist Task {}", worktree_info.issue_number),
                        description: "Test task".to_string(),
                        task_type: TaskType::Feature,
                        priority: 1,
                        severity: None,
                        impact: None,
                        assigned_agent: Some(agent_type),
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

    // ========================================================================
    // Step 4: Verify Audit Logs
    // ========================================================================

    // Check that log files were created
    let date = chrono::Utc::now().format("%Y-%m-%d").to_string();
    let mut log_files = vec![];
    let mut read_dir = fs::read_dir(&log_dir).await.unwrap();
    while let Some(entry) = read_dir.next_entry().await.unwrap() {
        log_files.push(entry);
    }

    // Should have logs from coordinator + worktrees
    assert!(!log_files.is_empty(), "Expected at least 1 log file, got {}", log_files.len());

    // Read and verify coordinator log content
    let coordinator_log_found = log_files.iter().any(|entry| {
        let file_name = entry.file_name();
        file_name.to_str().unwrap().starts_with(&date)
            && !file_name.to_str().unwrap().contains("-worktree-")
    });
    assert!(coordinator_log_found, "Coordinator log file should exist without worktree ID");

    // Verify worktree-specific logs
    let worktree_logs = log_files
        .iter()
        .filter(|e| e.file_name().to_str().unwrap().contains("-worktree-"))
        .count();
    assert!(worktree_logs >= 1, "Expected at least 1 worktree log, got {}", worktree_logs);

    // ========================================================================
    // Step 5: Verify Statistics
    // ========================================================================

    // Verify pool execution results
    assert_eq!(result.total_tasks, 3);
    assert!(result.has_failures(), "Expected failures due to fail-fast");
    assert!(
        result.failed_count >= 1,
        "Expected at least 1 failure, got {}",
        result.failed_count
    );

    // Verify hook metrics consistency
    let events = recording_hook.events();

    // Count events by type
    let pre_count = recording_hook.count_by_type("pre_execute");
    let post_count = recording_hook.count_by_type("post_execute");
    let error_count = recording_hook.count_by_type("error");

    // Coordinator should have pre + post
    assert_eq!(
        recording_hook.count_by_agent(AgentType::CoordinatorAgent),
        2,
        "Coordinator should have 2 events (pre + post)"
    );

    // Specialist agents should have events (success + failures + cancellations)
    let specialist_events = pre_count - 1; // Subtract coordinator's pre
    assert!(
        specialist_events >= 2,
        "Expected at least 2 specialist agent events, got {}",
        specialist_events
    );

    // Should have at least one error event
    assert!(error_count >= 1, "Expected at least 1 error event, got {}", error_count);

    // Verify statistics methods
    assert!(result.success_rate() < 100.0);
    assert!(result.failure_rate() > 0.0);
    assert!(result.average_duration_ms() > 0.0);
    assert!(result.throughput() > 0.0);

    // Verify failed_tasks() consistency
    assert_eq!(result.failed_tasks().len(), result.failed_count);

    // ========================================================================
    // Step 6: Final Verification
    // ========================================================================

    println!("\n=== E2E Test Summary ===");
    println!("Total tasks: {}", result.total_tasks);
    println!("Success: {}", result.success_count);
    println!("Failed: {}", result.failed_count);
    println!("Cancelled: {}", result.cancelled_count);
    println!("Success rate: {:.1}%", result.success_rate());
    println!("Total duration: {}ms", result.total_duration_ms);
    println!("\nHook Events:");
    println!("  Pre-execute: {}", pre_count);
    println!("  Post-execute: {}", post_count);
    println!("  Errors: {}", error_count);
    println!("  Total events: {}", events.len());
    println!("\nLog Files:");
    println!("  Total: {}", log_files.len());
    println!("  Coordinator logs: {}", if coordinator_log_found { 1 } else { 0 });
    println!("  Worktree logs: {}", worktree_logs);
    println!("========================\n");
}

// ============================================================================
// Simplified E2E Test (No External Dependencies)
// ============================================================================

#[tokio::test]
async fn test_e2e_simplified_coordinator_hooks() {
    // Setup
    let temp_dir = TempDir::new().unwrap();
    let log_dir = temp_dir.path().join("logs");
    fs::create_dir_all(&log_dir).await.unwrap();

    let recording_hook = RecordingHook::new();

    // Execute coordinator
    let coordinator = MockCoordinatorAgent::new(true);
    let mut hooked_coordinator = HookedAgent::new(coordinator);
    hooked_coordinator.register_hook(recording_hook.clone());
    hooked_coordinator.register_hook(AuditLogHook::new(log_dir.clone()));

    let task = Task {
        id: "simplified-test".to_string(),
        title: "Simplified E2E Test".to_string(),
        description: "Test coordinator with hooks".to_string(),
        task_type: TaskType::Feature,
        priority: 1,
        severity: None,
        impact: None,
        assigned_agent: Some(AgentType::CoordinatorAgent),
        dependencies: vec![],
        estimated_duration: Some(1),
        status: None,
        start_time: None,
        end_time: None,
        metadata: None,
    };

    let result = hooked_coordinator.execute(&task).await.unwrap();

    // Verify
    assert_eq!(result.status, ResultStatus::Success);
    assert_eq!(recording_hook.count_by_type("pre_execute"), 1);
    assert_eq!(recording_hook.count_by_type("post_execute"), 1);
    assert_eq!(recording_hook.count_by_type("error"), 0);

    // Verify log file
    let date = chrono::Utc::now().format("%Y-%m-%d").to_string();
    let log_file = log_dir.join(format!("{}.md", date));
    assert!(log_file.exists(), "Log file should exist");

    let log_content = fs::read_to_string(&log_file).await.unwrap();
    assert!(log_content.contains("CoordinatorAgent starting"));
    assert!(log_content.contains("CoordinatorAgent completed"));
}
