# Progress Tracking with Observable Agents

This document explains how to use the Observable Agent pattern to add real-time progress tracking to any agent.

## Quick Start

```rust
use miyabi_agent_core::{ObservableAgent, ProgressObserver, ProgressUpdate, LogEntry};
use std::sync::Arc;

// 1. Wrap your agent
let agent = YourAgent::new(config);
let observable = ObservableAgent::new(agent);

// 2. Add observer(s)
observable.add_observer(Arc::new(YourObserver::new())).await;

// 3. Execute with automatic progress tracking
let result = observable.execute(&task).await?;
```

## Architecture

```
┌─────────────────────────────────────────┐
│         ObservableAgent<A>              │
│  ┌───────────────────────────────────┐  │
│  │        Wrapped Agent (A)          │  │
│  │  implements BaseAgent trait       │  │
│  └───────────────────────────────────┘  │
│                  │                       │
│                  │ execute()             │
│                  ▼                       │
│  ┌───────────────────────────────────┐  │
│  │    Progress Notification System   │  │
│  │  - notify_start()                 │  │
│  │  - notify_progress()              │  │
│  │  - notify_log()                   │  │
│  │  - notify_complete()              │  │
│  └───────────────────────────────────┘  │
│         │         │         │            │
└─────────┼─────────┼─────────┼────────────┘
          │         │         │
          ▼         ▼         ▼
    Observer1  Observer2  Observer3
    (CLI)      (WebSocket) (Metrics)
```

## Core Types

### ProgressUpdate

Represents a progress update with percentage and message:

```rust
pub struct ProgressUpdate {
    pub percentage: u8,           // 0-100
    pub message: String,          // Human-readable status
    pub timestamp: DateTime<Utc>, // When the update occurred
    pub metadata: Option<serde_json::Value>, // Optional extra data
}

// Create updates
let update = ProgressUpdate::new(50, "Generating code");
let update = ProgressUpdate::with_metadata(75, "Running tests", json!({"test_count": 15}));
```

### LogEntry

Represents a log message from the agent:

```rust
pub struct LogEntry {
    pub level: LogLevel,           // Debug, Info, Warn, Error
    pub message: String,           // Log message
    pub timestamp: DateTime<Utc>,  // When logged
    pub context: Option<serde_json::Value>, // Optional context
}

// Create log entries
LogEntry::info("Starting code generation");
LogEntry::warn("Deprecated API detected");
LogEntry::error("Compilation failed");
LogEntry::debug("Variable value: 42");
```

### ProgressObserver Trait

Implement this trait to create custom observers:

```rust
#[async_trait]
pub trait ProgressObserver: Send + Sync {
    /// Called when progress is updated (percentage changed)
    async fn on_progress(&self, update: ProgressUpdate);

    /// Called when a log entry is emitted
    async fn on_log(&self, entry: LogEntry);

    /// Called when agent starts execution
    async fn on_start(&self, task: &Task) {
        // Default: do nothing
    }

    /// Called when agent completes execution
    async fn on_complete(&self, result: &AgentResult) {
        // Default: do nothing
    }
}
```

## Example Implementations

### CLI Progress Bar Observer

```rust
use indicatif::{ProgressBar, ProgressStyle};

struct CLIProgressObserver {
    progress_bar: ProgressBar,
}

impl CLIProgressObserver {
    fn new() -> Self {
        let pb = ProgressBar::new(100);
        pb.set_style(
            ProgressStyle::default_bar()
                .template("[{elapsed_precise}] {bar:40.cyan/blue} {pos:>3}% {msg}")
                .expect("Invalid template")
                .progress_chars("█▓▒░"),
        );
        Self { progress_bar: pb }
    }
}

#[async_trait]
impl ProgressObserver for CLIProgressObserver {
    async fn on_progress(&self, update: ProgressUpdate) {
        self.progress_bar.set_position(update.percentage as u64);
        self.progress_bar.set_message(update.message);
    }

    async fn on_log(&self, entry: LogEntry) {
        let icon = match entry.level {
            LogLevel::Info => "ℹ️",
            LogLevel::Warn => "⚠️",
            LogLevel::Error => "❌",
            LogLevel::Debug => "🔍",
        };
        self.progress_bar.println(format!("{} {}", icon, entry.message));
    }

    async fn on_complete(&self, _result: &AgentResult) {
        self.progress_bar.finish_with_message("✅ Complete");
    }
}
```

### WebSocket Observer (for Web Dashboard)

```rust
use tokio::sync::broadcast;

struct WebSocketObserver {
    tx: broadcast::Sender<String>,
}

#[async_trait]
impl ProgressObserver for WebSocketObserver {
    async fn on_progress(&self, update: ProgressUpdate) {
        let msg = serde_json::json!({
            "type": "progress",
            "percentage": update.percentage,
            "message": update.message,
            "timestamp": update.timestamp,
        });
        let _ = self.tx.send(msg.to_string());
    }

    async fn on_log(&self, entry: LogEntry) {
        let msg = serde_json::json!({
            "type": "log",
            "level": format!("{:?}", entry.level),
            "message": entry.message,
            "timestamp": entry.timestamp,
        });
        let _ = self.tx.send(msg.to_string());
    }
}
```

### Metrics Observer (for Performance Tracking)

```rust
struct MetricsObserver {
    start_time: Arc<Mutex<Option<DateTime<Utc>>>>,
    metrics: Arc<Mutex<HashMap<String, f64>>>,
}

#[async_trait]
impl ProgressObserver for MetricsObserver {
    async fn on_start(&self, _task: &Task) {
        let mut start = self.start_time.lock().unwrap();
        *start = Some(Utc::now());
    }

    async fn on_progress(&self, update: ProgressUpdate) {
        let mut metrics = self.metrics.lock().unwrap();
        metrics.insert(
            format!("progress_at_{}", update.percentage),
            update.timestamp.timestamp_millis() as f64,
        );
    }

    async fn on_complete(&self, _result: &AgentResult) {
        let start = self.start_time.lock().unwrap().unwrap();
        let duration = Utc::now() - start;
        let mut metrics = self.metrics.lock().unwrap();
        metrics.insert("total_duration_ms".to_string(), duration.num_milliseconds() as f64);
    }
}
```

## Usage from Agent Implementation

Agents that want to report progress can get the `ObservableAgent` reference and call notification methods:

```rust
// Inside your agent's execute() method:
impl BaseAgent for MyAgent {
    async fn execute(&self, task: &Task) -> Result<AgentResult> {
        // Progress can be reported if the agent is wrapped with ObservableAgent
        // The wrapping is done by the caller, not the agent itself

        // Perform work...
        // The ObservableAgent wrapper will automatically call on_start() and on_complete()

        Ok(AgentResult { /* ... */ })
    }
}

// When using the agent:
let observable = ObservableAgent::new(MyAgent::new(config));
observable.add_observer(Arc::new(CLIProgressObserver::new())).await;

// For manual progress updates within the agent, you would need to pass
// the observable reference into the agent's methods
```

## Multiple Observers

You can attach multiple observers to track progress in different ways simultaneously:

```rust
let observable = ObservableAgent::new(agent);

// CLI progress bar for user feedback
observable.add_observer(Arc::new(CLIProgressObserver::new())).await;

// WebSocket for dashboard
observable.add_observer(Arc::new(WebSocketObserver::new(ws_sender))).await;

// Metrics for performance tracking
observable.add_observer(Arc::new(MetricsObserver::new())).await;

// All three observers will receive the same events
let result = observable.execute(&task).await?;
```

## Running the Example

```bash
# Run the CLI progress observer example
cargo run --example cli_progress_observer --package miyabi-agent-core

# Expected output:
# 🎨 CLI Progress Observer Example
#
# Executing task with progress tracking...
#
# 🚀 Starting: Generate Rust code for user authentication
# [00:00:00] ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   0% Starting...
# ℹ️ Starting execution of task: Generate Rust code for user authentication
#   → Executing task: Generate Rust code for user authentication
# [00:00:00] ████████████████████████████████████████ 100% Completed
# ℹ️ Task completed successfully
# ✅ Status: Success
```

## Best Practices

1. **Keep Updates Meaningful**: Only update progress when something significant happens
2. **Use Percentage Ranges**: 0-25% for analysis, 25-75% for implementation, 75-100% for testing
3. **Log Important Events**: Use `on_log()` for key milestones, not every small step
4. **Handle Errors Gracefully**: Observers should not crash if one fails
5. **Thread Safety**: All observers must be `Send + Sync`

## Integration with Existing Agents

To add progress tracking to existing agents:

```rust
// Before (no progress tracking)
let agent = CodeGenAgent::new(config);
let result = agent.execute(&task).await?;

// After (with progress tracking)
let agent = CodeGenAgent::new(config);
let observable = ObservableAgent::new(agent);
observable.add_observer(Arc::new(CLIProgressObserver::new())).await;
let result = observable.execute(&task).await?;
```

No changes to the agent implementation are required! The Observable Agent pattern is non-invasive.

## Performance Considerations

- **Async Notifications**: All observer methods are async to prevent blocking
- **Parallel Notifications**: Observers are called concurrently using `Arc<RwLock<Vec<...>>>`
- **Zero Cost When Unused**: If no observers are registered, the overhead is minimal

## Future Enhancements

Potential improvements for future versions:

1. **Filtering**: Allow observers to subscribe to specific event types
2. **Priorities**: Observer execution order based on priority
3. **Batching**: Batch multiple progress updates to reduce notification overhead
4. **History**: Keep a buffer of recent events for late-joining observers
5. **Agent-Aware Updates**: Allow agents to call `notify_progress()` directly

---

For implementation details, see:
- `crates/miyabi-agent-core/src/observable.rs` - Core implementation
- `crates/miyabi-agent-core/examples/cli_progress_observer.rs` - Working example
- `crates/miyabi-agent-core/src/observable.rs` tests - Unit test examples
