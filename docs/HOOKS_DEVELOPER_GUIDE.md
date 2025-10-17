# Hooks Developer Guide

**Version**: 1.0.0
**Last Updated**: 2025-10-17
**Status**: Production Ready ✅

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Core Concepts](#core-concepts)
4. [Standard Hooks](#standard-hooks)
5. [Creating Custom Hooks](#creating-custom-hooks)
6. [Hook Registration](#hook-registration)
7. [Parallel Execution](#parallel-execution)
8. [Best Practices](#best-practices)
9. [Testing](#testing)
10. [Troubleshooting](#troubleshooting)

---

## Overview

The Miyabi Hooks system provides lifecycle management for agent execution, enabling observability, metrics collection, audit logging, and custom behaviors without modifying agent code.

### What are Hooks?

Hooks are callback functions that execute at specific points in the agent lifecycle:

```
┌─────────────────────────────────────────────┐
│ Agent Execution Lifecycle                    │
│                                              │
│  on_pre_execute()                            │
│       ↓                                      │
│  [Agent.execute()]                           │
│       ↓                                      │
│  on_post_execute()  OR  on_error()           │
└─────────────────────────────────────────────┘
```

### Why Use Hooks?

✅ **Separation of Concerns**: Keep cross-cutting concerns (logging, metrics) separate from business logic
✅ **Reusability**: Write once, apply to multiple agents
✅ **Testability**: Mock or spy on agent behavior without changing implementation
✅ **Extensibility**: Add new behaviors without modifying existing code
✅ **Observability**: Gain insight into agent execution without instrumentation

---

## Architecture

### Component Structure

```
crates/
├── miyabi-agents/
│   ├── src/
│   │   ├── hooks.rs          # Hook infrastructure
│   │   │   ├── AgentHook      # Trait definition
│   │   │   ├── HookedAgent<A> # Wrapper for applying hooks
│   │   │   ├── MetricsHook    # Standard hook
│   │   │   ├── EnvironmentCheckHook # Standard hook
│   │   │   └── AuditLogHook   # Standard hook
│   │   └── base.rs           # BaseAgent trait
│   └── tests/
└── miyabi-cli/
    └── src/
        └── commands/
            └── agent.rs      # Hook registration in CLI
```

### Key Types

```rust
use async_trait::async_trait;
use miyabi_types::{AgentType, Task, AgentResult, MiyabiError};
use miyabi_types::error::Result;

#[async_trait]
pub trait AgentHook: Send + Sync {
    async fn on_pre_execute(&self, agent: AgentType, task: &Task) -> Result<()>;
    async fn on_post_execute(&self, agent: AgentType, task: &Task, result: &AgentResult) -> Result<()>;
    async fn on_error(&self, agent: AgentType, task: &Task, error: &MiyabiError) -> Result<()>;
}

pub struct HookedAgent<A: BaseAgent> {
    agent: A,
    hooks: Vec<Box<dyn AgentHook>>,
}
```

---

## Core Concepts

### 1. AgentHook Trait

The `AgentHook` trait defines three lifecycle methods:

```rust
#[async_trait]
pub trait AgentHook: Send + Sync {
    /// Called before the agent begins executing the task.
    async fn on_pre_execute(&self, _agent: AgentType, _task: &Task) -> Result<()> {
        Ok(())
    }

    /// Called after the agent successfully executes the task.
    async fn on_post_execute(
        &self,
        _agent: AgentType,
        _task: &Task,
        _result: &AgentResult,
    ) -> Result<()> {
        Ok(())
    }

    /// Called if the agent encounters an error during execution.
    async fn on_error(&self, _agent: AgentType, _task: &Task, _error: &MiyabiError) -> Result<()> {
        Ok(())
    }
}
```

**Key Points**:
- All methods have default no-op implementations
- Only override the methods you need
- Must be `Send + Sync` for parallel execution
- Async methods support I/O operations (file writes, network calls)

### 2. HookedAgent Wrapper

The `HookedAgent<A>` wrapper applies hooks to any agent implementing `BaseAgent`:

```rust
let agent = CoordinatorAgent::new(config);
let mut hooked_agent = HookedAgent::new(agent);

// Register hooks
hooked_agent.register_hook(MetricsHook::new());
hooked_agent.register_hook(AuditLogHook::new(log_dir));

// Execute with hooks
let result = hooked_agent.execute(&task).await?;
```

**Execution Flow**:
```rust
impl<A: BaseAgent> BaseAgent for HookedAgent<A> {
    async fn execute(&self, task: &Task) -> Result<AgentResult> {
        // 1. Call on_pre_execute for all hooks
        for hook in &self.hooks {
            hook.on_pre_execute(self.agent.agent_type(), task).await?;
        }

        // 2. Execute the wrapped agent
        let result = self.agent.execute(task).await;

        // 3. Call on_post_execute or on_error
        match &result {
            Ok(agent_result) => {
                for hook in &self.hooks {
                    hook.on_post_execute(self.agent.agent_type(), task, agent_result).await?;
                }
            }
            Err(error) => {
                for hook in &self.hooks {
                    hook.on_error(self.agent.agent_type(), task, error).await?;
                }
            }
        }

        result
    }
}
```

### 3. Hook Registration Order

Hooks are executed in the order they are registered:

```rust
hooked_agent.register_hook(Hook1::new());  // Executes first
hooked_agent.register_hook(Hook2::new());  // Executes second
hooked_agent.register_hook(Hook3::new());  // Executes third
```

**Important**: If a hook returns `Err()` in `on_pre_execute()`, the agent will not execute and subsequent hooks will not run.

---

## Standard Hooks

Miyabi provides three standard hooks out of the box:

### 1. MetricsHook

Collects execution metrics using the `tracing` crate.

**Features**:
- Start/end timestamps
- Duration measurement
- Agent type tracking
- Task ID correlation

**Usage**:
```rust
use miyabi_agents::hooks::MetricsHook;

hooked_agent.register_hook(MetricsHook::new());
```

**Output** (via tracing):
```
2025-10-17T10:30:00Z INFO CoordinatorAgent starting task: task-270
2025-10-17T10:30:05Z INFO CoordinatorAgent completed in 5000ms
```

**Implementation**:
```rust
pub struct MetricsHook;

impl MetricsHook {
    pub fn new() -> Box<dyn AgentHook> {
        Box::new(Self)
    }
}

#[async_trait]
impl AgentHook for MetricsHook {
    async fn on_pre_execute(&self, agent: AgentType, task: &Task) -> Result<()> {
        tracing::info!("{:?} starting task: {}", agent, task.id);
        Ok(())
    }

    async fn on_post_execute(&self, agent: AgentType, task: &Task, result: &AgentResult) -> Result<()> {
        if let Some(metrics) = &result.metrics {
            tracing::info!(
                "{:?} completed in {}ms (quality: {:?})",
                agent,
                metrics.duration_ms,
                metrics.quality_score
            );
        }
        Ok(())
    }

    async fn on_error(&self, agent: AgentType, task: &Task, error: &MiyabiError) -> Result<()> {
        tracing::error!("{:?} failed task {}: {:?}", agent, task.id, error);
        Ok(())
    }
}
```

### 2. EnvironmentCheckHook

Validates required environment variables before execution.

**Features**:
- Pre-execution validation
- Custom error messages
- Configurable required variables
- Prevents execution if variables missing

**Usage**:
```rust
use miyabi_agents::hooks::EnvironmentCheckHook;

// Check for GITHUB_TOKEN
hooked_agent.register_hook(EnvironmentCheckHook::new(["GITHUB_TOKEN"]));

// Check for multiple variables
hooked_agent.register_hook(EnvironmentCheckHook::new([
    "GITHUB_TOKEN",
    "ANTHROPIC_API_KEY",
    "DATABASE_URL"
]));
```

**Implementation**:
```rust
pub struct EnvironmentCheckHook {
    required_vars: Vec<String>,
}

impl EnvironmentCheckHook {
    pub fn new<I, S>(vars: I) -> Box<dyn AgentHook>
    where
        I: IntoIterator<Item = S>,
        S: Into<String>,
    {
        Box::new(Self {
            required_vars: vars.into_iter().map(|s| s.into()).collect(),
        })
    }
}

#[async_trait]
impl AgentHook for EnvironmentCheckHook {
    async fn on_pre_execute(&self, agent: AgentType, _task: &Task) -> Result<()> {
        for var in &self.required_vars {
            if std::env::var(var).is_err() {
                return Err(MiyabiError::Configuration(format!(
                    "{:?} requires environment variable: {}",
                    agent, var
                )));
            }
        }
        Ok(())
    }
}
```

### 3. AuditLogHook

Creates markdown audit logs for agent execution.

**Features**:
- Markdown-formatted logs
- Date-based file naming
- Worktree-specific logs (for parallel execution)
- Structured execution records

**Usage**:
```rust
use miyabi_agents::hooks::AuditLogHook;
use std::path::PathBuf;

let log_dir = PathBuf::from(".ai/logs");
hooked_agent.register_hook(AuditLogHook::new(log_dir));
```

**Log File Naming**:
- **Single execution**: `.ai/logs/2025-10-17.md`
- **Parallel execution**: `.ai/logs/2025-10-17-worktree-abc123.md`

**Log Format**:
```markdown
## [10:30:00] CoordinatorAgent starting

**Task**: task-270
**Title**: Decompose Issue #270
**Type**: Feature
**Priority**: 0

---

## [10:30:05] CoordinatorAgent completed

**Status**: Success
**Duration**: 5000ms
**Quality Score**: 95

---
```

**Implementation Highlights**:
```rust
pub struct AuditLogHook {
    log_dir: PathBuf,
}

impl AuditLogHook {
    async fn append(&self, entry: &str, worktree_id: Option<&str>) -> Result<()> {
        let date = Utc::now().format("%Y-%m-%d").to_string();

        // Generate filename based on worktree_id
        let filename = if let Some(wt_id) = worktree_id {
            format!("{}-worktree-{}.md", date, wt_id)
        } else {
            format!("{}.md", date)
        };

        let path = self.log_dir.join(filename);

        // Append to file (thread-safe via filesystem)
        let mut file = OpenOptions::new()
            .create(true)
            .append(true)
            .open(&path)
            .await?;

        file.write_all(entry.as_bytes()).await?;
        Ok(())
    }

    fn extract_worktree_id(task: &Task) -> Option<String> {
        task.metadata
            .as_ref()
            .and_then(|m| m.get("worktree_id"))
            .and_then(|v| v.as_str())
            .map(|s| s.to_string())
    }
}
```

---

## Creating Custom Hooks

### Step 1: Define Your Hook Struct

```rust
use miyabi_agents::hooks::AgentHook;
use async_trait::async_trait;
use miyabi_types::{AgentType, Task, AgentResult, MiyabiError};
use miyabi_types::error::Result;

pub struct SlackNotificationHook {
    webhook_url: String,
}

impl SlackNotificationHook {
    pub fn new(webhook_url: String) -> Box<dyn AgentHook> {
        Box::new(Self { webhook_url })
    }
}
```

### Step 2: Implement AgentHook Trait

```rust
#[async_trait]
impl AgentHook for SlackNotificationHook {
    async fn on_pre_execute(&self, agent: AgentType, task: &Task) -> Result<()> {
        // Send Slack notification when task starts
        let message = format!(
            "🚀 {:?} started task: {} ({})",
            agent, task.id, task.title
        );
        self.send_slack_message(&message).await?;
        Ok(())
    }

    async fn on_post_execute(
        &self,
        agent: AgentType,
        task: &Task,
        result: &AgentResult,
    ) -> Result<()> {
        // Send success notification
        let message = format!(
            "✅ {:?} completed task: {} (status: {:?})",
            agent, task.id, result.status
        );
        self.send_slack_message(&message).await?;
        Ok(())
    }

    async fn on_error(&self, agent: AgentType, task: &Task, error: &MiyabiError) -> Result<()> {
        // Send error notification
        let message = format!(
            "❌ {:?} failed task: {} (error: {:?})",
            agent, task.id, error
        );
        self.send_slack_message(&message).await?;
        Ok(())
    }
}

impl SlackNotificationHook {
    async fn send_slack_message(&self, message: &str) -> Result<()> {
        // Implementation using reqwest or similar
        let client = reqwest::Client::new();
        let payload = serde_json::json!({
            "text": message
        });

        client.post(&self.webhook_url)
            .json(&payload)
            .send()
            .await
            .map_err(|e| MiyabiError::Unknown(e.to_string()))?;

        Ok(())
    }
}
```

### Step 3: Register Your Hook

```rust
use my_hooks::SlackNotificationHook;

let slack_hook = SlackNotificationHook::new(
    "https://hooks.slack.com/services/YOUR/WEBHOOK/URL".to_string()
);

hooked_agent.register_hook(slack_hook);
```

### Example: DatabaseLogHook

```rust
pub struct DatabaseLogHook {
    db_pool: sqlx::PgPool,
}

impl DatabaseLogHook {
    pub fn new(db_pool: sqlx::PgPool) -> Box<dyn AgentHook> {
        Box::new(Self { db_pool })
    }
}

#[async_trait]
impl AgentHook for DatabaseLogHook {
    async fn on_pre_execute(&self, agent: AgentType, task: &Task) -> Result<()> {
        sqlx::query!(
            r#"
            INSERT INTO agent_executions (agent_type, task_id, status, started_at)
            VALUES ($1, $2, $3, $4)
            "#,
            format!("{:?}", agent),
            task.id,
            "running",
            chrono::Utc::now()
        )
        .execute(&self.db_pool)
        .await
        .map_err(|e| MiyabiError::Unknown(e.to_string()))?;

        Ok(())
    }

    async fn on_post_execute(
        &self,
        agent: AgentType,
        task: &Task,
        result: &AgentResult,
    ) -> Result<()> {
        sqlx::query!(
            r#"
            UPDATE agent_executions
            SET status = $1, completed_at = $2, result = $3
            WHERE task_id = $4
            "#,
            format!("{:?}", result.status),
            chrono::Utc::now(),
            serde_json::to_value(result).unwrap(),
            task.id
        )
        .execute(&self.db_pool)
        .await
        .map_err(|e| MiyabiError::Unknown(e.to_string()))?;

        Ok(())
    }

    async fn on_error(&self, agent: AgentType, task: &Task, error: &MiyabiError) -> Result<()> {
        sqlx::query!(
            r#"
            UPDATE agent_executions
            SET status = $1, completed_at = $2, error = $3
            WHERE task_id = $4
            "#,
            "failed",
            chrono::Utc::now(),
            format!("{:?}", error),
            task.id
        )
        .execute(&self.db_pool)
        .await
        .map_err(|e| MiyabiError::Unknown(e.to_string()))?;

        Ok(())
    }
}
```

---

## Hook Registration

### In CLI Commands

The recommended pattern for CLI commands is to use a helper method:

```rust
// crates/miyabi-cli/src/commands/agent.rs

impl AgentCommand {
    /// Register standard lifecycle hooks for agents
    fn register_standard_hooks<A: BaseAgent>(
        &self,
        agent: &mut HookedAgent<A>,
        config: &AgentConfig,
    ) {
        agent.register_hook(MetricsHook::new());
        agent.register_hook(EnvironmentCheckHook::new(["GITHUB_TOKEN"]));
        agent.register_hook(AuditLogHook::new(config.log_directory.clone()));
    }

    async fn run_coordinator_agent(&self, config: AgentConfig) -> Result<()> {
        let agent = CoordinatorAgentWithLLM::new(config.clone());
        let mut hooked_agent = HookedAgent::new(agent);

        // Apply standard hooks
        self.register_standard_hooks(&mut hooked_agent, &config);

        // Execute
        let task = self.create_task();
        let result = hooked_agent.execute(&task).await?;

        Ok(())
    }
}
```

### In Tests

```rust
use miyabi_agents::hooks::{AgentHook, HookedAgent};

struct RecordingHook {
    events: Arc<Mutex<Vec<String>>>,
}

#[async_trait]
impl AgentHook for RecordingHook {
    async fn on_pre_execute(&self, agent: AgentType, task: &Task) -> Result<()> {
        self.events.lock().unwrap().push(format!("pre:{}", task.id));
        Ok(())
    }

    async fn on_post_execute(&self, agent: AgentType, task: &Task, _result: &AgentResult) -> Result<()> {
        self.events.lock().unwrap().push(format!("post:{}", task.id));
        Ok(())
    }
}

#[tokio::test]
async fn test_agent_with_hooks() {
    let recording_hook = RecordingHook::new();
    let agent = TestAgent::new();
    let mut hooked_agent = HookedAgent::new(agent);
    hooked_agent.register_hook(recording_hook.clone());

    let task = create_test_task();
    hooked_agent.execute(&task).await.unwrap();

    let events = recording_hook.events.lock().unwrap();
    assert_eq!(events.len(), 2);
    assert_eq!(events[0], "pre:task-1");
    assert_eq!(events[1], "post:task-1");
}
```

---

## Parallel Execution

### Worktree-Specific Hooks

When using `WorktreePool` for parallel execution, hooks must handle concurrency:

**Problem**: Multiple worktrees writing to the same log file causes race conditions.

**Solution**: Use worktree-specific file naming via task metadata.

```rust
// Task metadata includes worktree_id
let mut metadata = HashMap::new();
metadata.insert("worktree_id".to_string(), serde_json::json!("abc123"));

let task = Task {
    id: "task-1".to_string(),
    metadata: Some(metadata),
    // ...
};

// AuditLogHook extracts worktree_id and creates separate log files
// .ai/logs/2025-10-17-worktree-abc123.md
```

### Hook Safety Checklist

✅ **Thread-Safe**: Use `Arc<Mutex<T>>` or atomic types for shared state
✅ **Async-Safe**: Don't block the async runtime
✅ **Error Handling**: Don't panic, return `Result<()>`
✅ **Idempotent**: Hooks should be safe to run multiple times
✅ **Fast**: Minimize overhead (< 100ms per hook call)

### Example: Thread-Safe Counter Hook

```rust
use std::sync::Arc;
use std::sync::atomic::{AtomicU64, Ordering};

pub struct CounterHook {
    pre_count: Arc<AtomicU64>,
    post_count: Arc<AtomicU64>,
    error_count: Arc<AtomicU64>,
}

impl CounterHook {
    pub fn new() -> Self {
        Self {
            pre_count: Arc::new(AtomicU64::new(0)),
            post_count: Arc::new(AtomicU64::new(0)),
            error_count: Arc::new(AtomicU64::new(0)),
        }
    }

    pub fn stats(&self) -> (u64, u64, u64) {
        (
            self.pre_count.load(Ordering::SeqCst),
            self.post_count.load(Ordering::SeqCst),
            self.error_count.load(Ordering::SeqCst),
        )
    }
}

#[async_trait]
impl AgentHook for CounterHook {
    async fn on_pre_execute(&self, _agent: AgentType, _task: &Task) -> Result<()> {
        self.pre_count.fetch_add(1, Ordering::SeqCst);
        Ok(())
    }

    async fn on_post_execute(&self, _agent: AgentType, _task: &Task, _result: &AgentResult) -> Result<()> {
        self.post_count.fetch_add(1, Ordering::SeqCst);
        Ok(())
    }

    async fn on_error(&self, _agent: AgentType, _task: &Task, _error: &MiyabiError) -> Result<()> {
        self.error_count.fetch_add(1, Ordering::SeqCst);
        Ok(())
    }
}
```

---

## Best Practices

### 1. Keep Hooks Lightweight

❌ **Bad**: Heavy computation in hook
```rust
async fn on_post_execute(&self, agent: AgentType, task: &Task, result: &AgentResult) -> Result<()> {
    // DON'T: Run expensive analysis
    let analysis = run_expensive_ml_model(&result).await?;
    self.save_analysis(analysis).await?;
    Ok(())
}
```

✅ **Good**: Offload to background task
```rust
async fn on_post_execute(&self, agent: AgentType, task: &Task, result: &AgentResult) -> Result<()> {
    // DO: Queue for background processing
    self.job_queue.enqueue(AnalysisJob {
        task_id: task.id.clone(),
        result: result.clone(),
    }).await?;
    Ok(())
}
```

### 2. Use Structured Logging

❌ **Bad**: Unstructured strings
```rust
tracing::info!("Agent {} completed task {} in {}ms", agent, task.id, duration);
```

✅ **Good**: Structured fields
```rust
tracing::info!(
    agent = ?agent,
    task_id = %task.id,
    duration_ms = duration,
    "Agent completed task"
);
```

### 3. Handle Errors Gracefully

❌ **Bad**: Panic on error
```rust
async fn on_pre_execute(&self, agent: AgentType, task: &Task) -> Result<()> {
    let config = load_config().expect("Config must exist"); // Panics!
    Ok(())
}
```

✅ **Good**: Return Result
```rust
async fn on_pre_execute(&self, agent: AgentType, task: &Task) -> Result<()> {
    let config = load_config().map_err(|e| {
        MiyabiError::Configuration(format!("Failed to load config: {}", e))
    })?;
    Ok(())
}
```

### 4. Document Hook Behavior

```rust
/// SlackNotificationHook sends Slack messages for agent lifecycle events.
///
/// # Configuration
/// - Requires `SLACK_WEBHOOK_URL` environment variable
/// - Rate limited to 1 message per second
///
/// # Behavior
/// - `on_pre_execute`: Sends "Agent started" message
/// - `on_post_execute`: Sends "Agent completed" message with metrics
/// - `on_error`: Sends "Agent failed" message with error details
///
/// # Thread Safety
/// Safe for parallel execution. Uses reqwest's connection pooling.
pub struct SlackNotificationHook {
    webhook_url: String,
}
```

### 5. Use Type-Safe Configuration

❌ **Bad**: Stringly-typed config
```rust
impl EnvironmentCheckHook {
    pub fn new(vars: Vec<&str>) -> Box<dyn AgentHook> {
        // ...
    }
}
```

✅ **Good**: Generic iterator
```rust
impl EnvironmentCheckHook {
    pub fn new<I, S>(vars: I) -> Box<dyn AgentHook>
    where
        I: IntoIterator<Item = S>,
        S: Into<String>,
    {
        // Accepts &str, String, Vec<String>, etc.
    }
}
```

---

## Testing

### Unit Testing Hooks

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;
    use tokio::fs;

    #[tokio::test]
    async fn test_audit_log_hook_creates_file() {
        let temp_dir = TempDir::new().unwrap();
        let log_dir = temp_dir.path().to_path_buf();

        let hook = AuditLogHook::new(log_dir.clone());
        let agent = AgentType::CoordinatorAgent;
        let task = create_test_task();

        // Test on_pre_execute
        hook.on_pre_execute(agent, &task).await.unwrap();

        // Verify log file exists
        let date = chrono::Utc::now().format("%Y-%m-%d").to_string();
        let log_file = log_dir.join(format!("{}.md", date));
        assert!(log_file.exists());

        // Verify content
        let content = fs::read_to_string(&log_file).await.unwrap();
        assert!(content.contains("CoordinatorAgent starting"));
        assert!(content.contains(&task.id));
    }

    #[tokio::test]
    async fn test_audit_log_hook_worktree_specific() {
        let temp_dir = TempDir::new().unwrap();
        let log_dir = temp_dir.path().to_path_buf();

        let hook = AuditLogHook::new(log_dir.clone());
        let agent = AgentType::CoordinatorAgent;

        // Create task with worktree_id
        let mut metadata = HashMap::new();
        metadata.insert("worktree_id".to_string(), serde_json::json!("wt123"));
        let task = Task {
            id: "task-1".to_string(),
            metadata: Some(metadata),
            // ...
        };

        hook.on_pre_execute(agent, &task).await.unwrap();

        // Verify worktree-specific log file
        let date = chrono::Utc::now().format("%Y-%m-%d").to_string();
        let log_file = log_dir.join(format!("{}-worktree-wt123.md", date));
        assert!(log_file.exists());
    }
}
```

### Integration Testing

```rust
#[tokio::test]
async fn test_hooked_agent_execution() {
    let recording_hook = RecordingHook::new();
    let agent = TestAgent::new(true); // success
    let mut hooked_agent = HookedAgent::new(agent);
    hooked_agent.register_hook(recording_hook.clone());

    let task = create_test_task();
    let result = hooked_agent.execute(&task).await.unwrap();

    assert_eq!(result.status, ResultStatus::Success);

    let events = recording_hook.events();
    assert_eq!(events.len(), 2); // pre + post
    assert_eq!(events[0].event_type, "pre_execute");
    assert_eq!(events[1].event_type, "post_execute");
}

#[tokio::test]
async fn test_hooked_agent_error_handling() {
    let recording_hook = RecordingHook::new();
    let agent = TestAgent::new(false); // failure
    let mut hooked_agent = HookedAgent::new(agent);
    hooked_agent.register_hook(recording_hook.clone());

    let task = create_test_task();
    let result = hooked_agent.execute(&task).await;

    assert!(result.is_err());

    let events = recording_hook.events();
    assert_eq!(events.len(), 2); // pre + error
    assert_eq!(events[0].event_type, "pre_execute");
    assert_eq!(events[1].event_type, "error");
}
```

### Testing Parallel Execution

See `crates/miyabi-worktree/tests/hooks_integration_test.rs` for comprehensive examples:

```rust
#[tokio::test]
#[serial]
async fn test_parallel_execution_with_hooks() {
    let recording_hook = RecordingHook::new();
    let config = PoolConfig {
        max_concurrency: 2,
        fail_fast: false,
        // ...
    };

    let pool = WorktreePool::new(repo_path, config).unwrap();

    let tasks = vec![
        WorktreeTask { issue_number: 301, /* ... */ },
        WorktreeTask { issue_number: 302, /* ... */ },
        WorktreeTask { issue_number: 303, /* ... */ },
    ];

    let result = pool.execute_parallel(tasks, |worktree_info, task| {
        let hook = recording_hook.clone();
        async move {
            let agent = TestAgent::new();
            let mut hooked_agent = HookedAgent::new(agent);
            hooked_agent.register_hook(hook);

            // Execute with hooks
            hooked_agent.execute(&task).await
        }
    }).await.unwrap();

    // Verify all hooks were called
    assert_eq!(recording_hook.count_by_type("pre_execute"), 3);
    assert_eq!(recording_hook.count_by_type("post_execute"), 3);
}
```

---

## Troubleshooting

### Issue: Hook not being called

**Symptom**: Your hook methods don't execute.

**Possible Causes**:
1. Hook not registered before `execute()` call
2. Hook implementation returns `Err()` in `on_pre_execute()`
3. Agent is not wrapped in `HookedAgent`

**Solution**:
```rust
// ✅ Correct order
let mut hooked_agent = HookedAgent::new(agent);
hooked_agent.register_hook(MyHook::new());
let result = hooked_agent.execute(&task).await?;

// ❌ Wrong: registering after execution
let result = hooked_agent.execute(&task).await?;
hooked_agent.register_hook(MyHook::new()); // Too late!
```

### Issue: Hook panics in parallel execution

**Symptom**: Panic when running multiple worktrees.

**Possible Causes**:
1. Non-thread-safe shared state (e.g., `Rc`, `RefCell`)
2. File write race condition
3. Blocking I/O in async context

**Solution**:
```rust
// ❌ Bad: Non-thread-safe
struct BadHook {
    counter: Rc<RefCell<u64>>, // Not Send + Sync!
}

// ✅ Good: Thread-safe
struct GoodHook {
    counter: Arc<AtomicU64>, // Send + Sync
}
```

For file writes, use worktree-specific naming:
```rust
fn get_log_path(&self, task: &Task) -> PathBuf {
    let worktree_id = task.metadata
        .as_ref()
        .and_then(|m| m.get("worktree_id"))
        .and_then(|v| v.as_str())
        .unwrap_or("main");

    self.log_dir.join(format!("log-{}.txt", worktree_id))
}
```

### Issue: Hook slows down execution

**Symptom**: Agent execution takes much longer with hooks enabled.

**Possible Causes**:
1. Synchronous I/O operations
2. Network calls without timeout
3. Heavy computation in hook

**Solution**:

Use async I/O:
```rust
// ❌ Bad: Blocks async runtime
std::fs::write("log.txt", data)?;

// ✅ Good: Async I/O
tokio::fs::write("log.txt", data).await?;
```

Add timeouts:
```rust
// ✅ Good: With timeout
tokio::time::timeout(
    Duration::from_secs(5),
    send_webhook_request()
).await??;
```

Offload heavy work:
```rust
// ✅ Good: Background processing
tokio::spawn(async move {
    expensive_operation().await;
});
```

### Issue: Environment variables not found

**Symptom**: `EnvironmentCheckHook` fails with "requires environment variable" error.

**Solution**:
```bash
# Set required variables
export GITHUB_TOKEN=ghp_xxxxxxxxxxxxx
export ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx

# Or use .env file (requires dotenv)
echo "GITHUB_TOKEN=ghp_xxxxxxxxxxxxx" >> .env
```

### Issue: Log files not created

**Symptom**: `AuditLogHook` doesn't create log files.

**Possible Causes**:
1. Log directory doesn't exist
2. Permission denied
3. Disk full

**Solution**:
```rust
// Create log directory if it doesn't exist
tokio::fs::create_dir_all(&log_dir).await?;

// Check permissions
let metadata = tokio::fs::metadata(&log_dir).await?;
assert!(metadata.is_dir());
assert!(!metadata.permissions().readonly());
```

---

## Advanced Patterns

### Conditional Hook Execution

```rust
pub struct ConditionalHook<H: AgentHook> {
    inner: H,
    condition: Box<dyn Fn(&Task) -> bool + Send + Sync>,
}

impl<H: AgentHook> ConditionalHook<H> {
    pub fn new(inner: H, condition: impl Fn(&Task) -> bool + Send + Sync + 'static) -> Self {
        Self {
            inner,
            condition: Box::new(condition),
        }
    }
}

#[async_trait]
impl<H: AgentHook> AgentHook for ConditionalHook<H> {
    async fn on_pre_execute(&self, agent: AgentType, task: &Task) -> Result<()> {
        if (self.condition)(task) {
            self.inner.on_pre_execute(agent, task).await
        } else {
            Ok(())
        }
    }

    // ... similar for on_post_execute and on_error
}

// Usage
let slack_hook = SlackNotificationHook::new(webhook_url);
let conditional = ConditionalHook::new(slack_hook, |task| {
    task.priority == 0 // Only notify for P0 tasks
});

hooked_agent.register_hook(Box::new(conditional));
```

### Hook Composition

```rust
pub struct CompositeHook {
    hooks: Vec<Box<dyn AgentHook>>,
}

impl CompositeHook {
    pub fn new() -> Self {
        Self { hooks: Vec::new() }
    }

    pub fn add(mut self, hook: Box<dyn AgentHook>) -> Self {
        self.hooks.push(hook);
        self
    }
}

#[async_trait]
impl AgentHook for CompositeHook {
    async fn on_pre_execute(&self, agent: AgentType, task: &Task) -> Result<()> {
        for hook in &self.hooks {
            hook.on_pre_execute(agent, task).await?;
        }
        Ok(())
    }

    // ... similar for other methods
}

// Usage
let composite = CompositeHook::new()
    .add(MetricsHook::new())
    .add(AuditLogHook::new(log_dir))
    .add(SlackNotificationHook::new(webhook_url));

hooked_agent.register_hook(Box::new(composite));
```

---

## Examples

### Complete Example: Production Setup

```rust
use miyabi_agents::{CoordinatorAgent, HookedAgent};
use miyabi_agents::hooks::{MetricsHook, EnvironmentCheckHook, AuditLogHook};
use miyabi_core::config::AgentConfig;
use std::path::PathBuf;

async fn setup_production_agent(config: AgentConfig) -> HookedAgent<CoordinatorAgent> {
    // Create base agent
    let agent = CoordinatorAgent::new(config.clone());
    let mut hooked_agent = HookedAgent::new(agent);

    // Add standard hooks
    hooked_agent.register_hook(MetricsHook::new());
    hooked_agent.register_hook(EnvironmentCheckHook::new([
        "GITHUB_TOKEN",
        "ANTHROPIC_API_KEY",
    ]));
    hooked_agent.register_hook(AuditLogHook::new(
        PathBuf::from(".ai/logs")
    ));

    // Add custom hooks
    if let Ok(webhook_url) = std::env::var("SLACK_WEBHOOK_URL") {
        hooked_agent.register_hook(SlackNotificationHook::new(webhook_url));
    }

    if let Ok(db_url) = std::env::var("DATABASE_URL") {
        let pool = create_db_pool(&db_url).await.unwrap();
        hooked_agent.register_hook(DatabaseLogHook::new(pool));
    }

    hooked_agent
}

#[tokio::main]
async fn main() -> Result<()> {
    // Setup
    let config = AgentConfig::load()?;
    let hooked_agent = setup_production_agent(config).await;

    // Execute
    let task = create_task_from_cli();
    let result = hooked_agent.execute(&task).await?;

    println!("Task completed: {:?}", result.status);
    Ok(())
}
```

---

## References

- **Source Code**: `crates/miyabi-agents/src/hooks.rs`
- **Tests**: `crates/miyabi-worktree/tests/hooks_integration_test.rs`
- **E2E Test**: `crates/miyabi-cli/tests/e2e_coordinator_hooks_test.rs`
- **CLI Integration**: `crates/miyabi-cli/src/commands/agent.rs`
- **Parallel Execution Guide**: [PARALLEL_EXECUTION_GUIDE.md](./PARALLEL_EXECUTION_GUIDE.md)
- **Agent Specs**: `.claude/agents/specs/coding/hooks-integration.md`

---

**Last Updated**: 2025-10-17
**Maintained By**: Miyabi Development Team
**License**: Same as Miyabi project
