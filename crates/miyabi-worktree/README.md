# miyabi-worktree

Git worktree management for parallel agent execution in Miyabi.

## Features

- **Automated Worktree Management**: Create, manage, and cleanup Git worktrees for isolated parallel task execution
- **Concurrency Control**: Built-in Semaphore-based parallel execution limiting
- **WorktreePool**: High-level abstraction for batch parallel task execution
- **Status Tracking**: Monitor worktree lifecycle (Active, Idle, Completed, Failed)
- **Timeout Support**: Configurable task execution timeouts
- **Auto-cleanup**: Automatic worktree removal after task completion
- **Telemetry & Observability**: Built-in lifecycle event tracking with structured logging and metrics

## Architecture

### WorktreeManager

Low-level worktree operations with automatic concurrency control via `tokio::sync::Semaphore`.

```rust
use miyabi_worktree::WorktreeManager;

// Automatic repository discovery from current directory
let manager = WorktreeManager::new_with_discovery(
    Some(".worktrees"),
    3 // max concurrency
)?;

// Create worktree for issue #123
let worktree = manager.create_worktree(123).await?;
println!("Worktree path: {:?}", worktree.path);

// Push changes
manager.push_worktree(&worktree.id).await?;

// Merge to main
manager.merge_worktree(&worktree.id).await?;

// Cleanup
manager.remove_worktree(&worktree.id).await?;
```

### WorktreePool

High-level parallel task execution with lifecycle management.

```rust
use miyabi_worktree::{WorktreePool, PoolConfig, WorktreeTask};

let config = PoolConfig {
    max_concurrency: 3,
    timeout_seconds: 1800,
    fail_fast: false,
    auto_cleanup: true,
};

let pool = WorktreePool::new(config)?;

// Execute tasks in parallel
let tasks = vec![
    WorktreeTask {
        issue_number: 100,
        description: "Task 1".to_string(),
        agent_type: Some("CodeGenAgent".to_string()),
        metadata: None,
    },
    WorktreeTask {
        issue_number: 101,
        description: "Task 2".to_string(),
        agent_type: Some("ReviewAgent".to_string()),
        metadata: None,
    },
];

let result = pool.execute_parallel(tasks, |worktree_info, task| async move {
    // Your task execution logic here
    let output = serde_json::json!({"status": "completed"});
    Ok(output)
}).await;

println!("Success rate: {:.2}%", result.success_rate());
println!("Total duration: {}ms", result.total_duration_ms);
```

## Simplified API

For simple use cases, `execute_simple()` provides automatic lifecycle management:

```rust
use miyabi_worktree::{WorktreePool, PoolConfig};

let config = PoolConfig::default();
let pool = WorktreePool::new(config)?;

let issue_numbers = vec![200, 201, 202];

let result = pool.execute_simple(issue_numbers, |worktree_path, issue_number| async move {
    // Your task logic here
    println!("Processing issue #{} in {:?}", issue_number, worktree_path);

    // Example: Create a file
    let file_path = worktree_path.join("output.txt");
    tokio::fs::write(&file_path, format!("Result for #{}", issue_number)).await?;

    Ok(())
}).await;

if result.all_successful() {
    println!("All tasks completed successfully!");
}
```

## Concurrency Control

The WorktreeManager internally uses `tokio::sync::Semaphore` to limit concurrent worktree operations:

```rust
// Semaphore is automatically managed
let manager = WorktreeManager::new_with_discovery(Some(".worktrees"), 3)?;

// These calls will be limited to 3 concurrent executions
for i in 0..10 {
    let worktree = manager.create_worktree(i).await?; // Semaphore acquired
    // ... do work ...
} // Semaphore permit released
```

## Statistics & Monitoring

```rust
// Get worktree statistics
let stats = manager.stats().await;
println!("Active: {}, Completed: {}, Failed: {}",
    stats.active, stats.completed, stats.failed);
println!("Available slots: {}/{}",
    stats.available_slots, stats.max_concurrency);

// Get pool statistics
let pool_stats = pool.stats().await;
println!("Active tasks: {}", pool_stats.active_tasks);
```

## Telemetry & Observability

The `WorktreeManager` includes built-in telemetry for lifecycle event tracking:

### Event Recording

Automatically records the following events:
- **CreateStart** / **CreateComplete**: Worktree creation lifecycle
- **CleanupStart** / **CleanupComplete**: Worktree cleanup lifecycle
- **ExecuteStart** / **ExecuteComplete**: Agent execution (via hooks)
- **Error**: Error events with context

### Human-Readable Reports

```rust
// Generate telemetry report
let report = manager.telemetry_report().await;
println!("{}", report);

// Output:
// 📊 Worktree実行レポート
// - 作成: 5回
// - 実行: 5回（成功: 4, 失敗: 1）
// - クリーンアップ: 5回
// - エラー: 1回
// - 平均実行時間: 12.34秒
// - 成功率: 80.0%
```

### Structured Statistics

```rust
use miyabi_worktree::telemetry::TelemetryStats;

let stats: TelemetryStats = manager.telemetry_stats().await;

println!("Creates: {}", stats.creates);
println!("Executions: {}", stats.executions);
println!("Success rate: {:.1}%", stats.success_rate());
println!("Average execution time: {:?}", stats.average_execution_time());
```

### Integration with Structured Logging

All telemetry events are also logged with `tracing`:

```rust
use tracing_subscriber;

// Initialize structured logging
tracing_subscriber::fmt::init();

// Telemetry events will be logged:
// INFO Worktree作成開始 worktree_id="abc123" branch="feature/issue-100"
// INFO Worktree作成完了 worktree_id="abc123" duration_ms=1234
```

## Task Results

```rust
let result = pool.execute_parallel(tasks, executor).await;

for task_result in result.results {
    match task_result.status {
        TaskStatus::Success => {
            println!("Issue #{} succeeded in {}ms",
                task_result.issue_number, task_result.duration_ms);
        }
        TaskStatus::Failed => {
            println!("Issue #{} failed: {:?}",
                task_result.issue_number, task_result.error);
        }
        TaskStatus::Timeout => {
            println!("Issue #{} timed out", task_result.issue_number);
        }
        _ => {}
    }
}

// Aggregate metrics
println!("Success rate: {:.2}%", result.success_rate());
println!("Average duration: {:.2}ms", result.average_duration_ms());
```

## Error Handling

All operations return `Result<T, MiyabiError>`:

```rust
use miyabi_types::error::Result;

async fn process_issue(manager: &WorktreeManager, issue: u64) -> Result<()> {
    let worktree = manager.create_worktree(issue).await?;

    // Do work...

    manager.remove_worktree(&worktree.id).await?;
    Ok(())
}
```

## Configuration Options

### PoolConfig

```rust
pub struct PoolConfig {
    /// Maximum number of concurrent worktrees (default: 3)
    pub max_concurrency: usize,

    /// Timeout for individual task execution in seconds (default: 1800)
    pub timeout_seconds: u64,

    /// Whether to fail fast on first error (default: false)
    pub fail_fast: bool,

    /// Whether to cleanup worktrees after execution (default: true)
    pub auto_cleanup: bool,
}
```

## Testing

Run unit tests:
```bash
cargo test --package miyabi-worktree --lib
```

Run integration tests (requires git repository):
```bash
cargo test --package miyabi-worktree --test pool_integration_test
```

## Integration with CoordinatorAgent

The `miyabi-worktree` crate is designed to integrate with Miyabi's CoordinatorAgent for parallel issue processing:

```rust
use miyabi_worktree::{WorktreePool, PoolConfig, WorktreeTask};

// CoordinatorAgent creates tasks from GitHub Issues
let tasks: Vec<WorktreeTask> = issues
    .into_iter()
    .map(|issue| WorktreeTask {
        issue_number: issue.number,
        description: issue.title.clone(),
        agent_type: Some("CodeGenAgent".to_string()),
        metadata: Some(serde_json::to_value(&issue).unwrap()),
    })
    .collect();

// Execute in parallel with concurrency limit
let pool = WorktreePool::new(PoolConfig {
    max_concurrency: 3,
    ..Default::default()
})?;

let result = pool.execute_parallel(tasks, |worktree_info, task| async move {
    // Agent execution logic
    execute_agent_in_worktree(worktree_info, task).await
}).await;
```

## Performance Considerations

- **Semaphore Overhead**: Minimal overhead for concurrency control
- **Git Operations**: Worktree creation/removal involves git CLI calls
- **Filesystem I/O**: Each worktree requires disk space and I/O operations
- **Recommended Concurrency**: 3-5 for optimal performance on typical hardware

## Safety & Cleanup

- Automatic cleanup with `auto_cleanup: true`
- Manual cleanup with `manager.cleanup_all().await`
- Git worktree prune on cleanup
- Proper error handling for failed operations

## License

This crate is part of the Miyabi project. See LICENSE for details.
