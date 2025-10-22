# Agent Lifecycle Hook Integration Guide

This guide demonstrates how to integrate the auto-indexing lifecycle hook into Miyabi Agents.

## Overview

The auto-indexing feature allows agents to automatically index their execution logs into a vector database for future knowledge retrieval.

## Quick Start

### 1. Enable the Feature

Add the `knowledge-integration` feature to your `Cargo.toml`:

```toml
[dependencies]
miyabi-agents = { version = "0.1.0", features = ["knowledge-integration"] }
miyabi-knowledge = "0.1.0"
```

### 2. Configure Knowledge Base

Create `~/.config/miyabi/knowledge.json`:

```json
{
  "vector_db": {
    "type": "qdrant",
    "host": "localhost",
    "port": 6333,
    "collection": "miyabi-knowledge"
  },
  "embeddings": {
    "provider": "ollama",
    "model": "all-MiniLM-L6-v2",
    "dimension": 384
  },
  "workspace": {
    "name": "default",
    "hierarchy": "project > worktree > agent"
  },
  "collection": {
    "log_dir": ".ai/logs",
    "worktree_dir": ".worktrees",
    "auto_index": true,
    "batch_size": 100
  },
  "search": {
    "default_limit": 10,
    "min_score": 0.7
  },
  "auto_index": {
    "enabled": true,
    "delay_seconds": 2,
    "retry_count": 3
  }
}
```

Or use the CLI:

```bash
# Enable auto-indexing
miyabi knowledge config --auto-index true

# Set delay to 5 seconds
miyabi knowledge config --delay-seconds 5

# Set retry count to 5
miyabi knowledge config --retry-count 5

# View current configuration
miyabi knowledge config --show
```

### 3. Integrate Hook with Agent

#### Using HookedAgent Wrapper

```rust
use miyabi_agents::{HookedAgent, AuditLogHook, MetricsHook};
use miyabi_agent_coordinator::CoordinatorAgent;
use miyabi_knowledge::KnowledgeConfig;
use miyabi_types::AgentConfig;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Create base agent
    let config = AgentConfig::default();
    let agent = CoordinatorAgent::new(config.clone());

    // Wrap with hooks
    let mut hooked_agent = HookedAgent::new(agent);

    // Add metrics hook
    hooked_agent.register_hook(MetricsHook::new());

    // Add audit log hook with auto-indexing
    let knowledge_config = KnowledgeConfig::from_file("~/.config/miyabi/knowledge.json")?;
    let audit_hook = AuditLogHook::new(".ai/logs")
        .with_auto_index(knowledge_config);
    hooked_agent.register_hook(audit_hook);

    // Execute task
    let task = create_sample_task();
    let result = hooked_agent.execute(&task).await?;

    println!("Task completed: {:?}", result.status);

    // Wait for background indexing to complete (optional)
    tokio::time::sleep(std::time::Duration::from_secs(3)).await;

    Ok(())
}
```

#### Conditional Auto-Indexing

```rust
use miyabi_agents::{HookedAgent, AuditLogHook};
use miyabi_knowledge::KnowledgeConfig;

// Load configuration
let knowledge_config = KnowledgeConfig::from_file("~/.config/miyabi/knowledge.json")?;

// Create audit hook
let audit_hook = AuditLogHook::new(".ai/logs");

// Conditionally enable auto-indexing based on configuration
let audit_hook = if knowledge_config.auto_index.enabled {
    audit_hook.with_auto_index(knowledge_config)
} else {
    audit_hook
};

hooked_agent.register_hook(audit_hook);
```

## How It Works

### Execution Flow

```
Agent Task Execution
        ↓
1. Pre-Execute Hook (Metrics)
        ↓
2. Agent Execution (BaseAgent::execute)
        ↓
3. Post-Execute Hook (AuditLogHook)
        ↓
4. Write to .ai/logs/{date}.md
        ↓
5. Trigger Background Auto-Indexing (if enabled)
        ↓
6. Wait configured delay (default: 2s)
        ↓
7. Index log to Vector DB with retries
        ↓
8. Agent execution completes
```

### Background Processing

Auto-indexing runs in the background using `tokio::spawn()`:

- **Non-blocking**: Agent execution completes immediately
- **Delayed**: Waits `delay_seconds` before indexing (default: 2s)
- **Retry Logic**: Attempts `retry_count` times on failure (default: 3)
- **Error Handling**: Failures are logged but don't affect agent execution

### Performance Impact

- **Overhead**: +100ms or less (measured in benchmarks)
- **Memory**: Minimal (clone of KnowledgeConfig only)
- **Network**: Background async HTTP to Qdrant
- **Disk**: Log file append (already happening)

## Configuration Options

### Auto-Index Settings

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `enabled` | `bool` | `true` | Enable/disable auto-indexing |
| `delay_seconds` | `u64` | `2` | Delay before indexing (seconds) |
| `retry_count` | `u32` | `3` | Number of retry attempts |

### Tuning Recommendations

**Fast Indexing (Low Latency)**:
```json
{
  "auto_index": {
    "enabled": true,
    "delay_seconds": 1,
    "retry_count": 2
  }
}
```

**Reliable Indexing (High Reliability)**:
```json
{
  "auto_index": {
    "enabled": true,
    "delay_seconds": 5,
    "retry_count": 5
  }
}
```

**Disabled (Manual Only)**:
```json
{
  "auto_index": {
    "enabled": false,
    "delay_seconds": 0,
    "retry_count": 0
  }
}
```

## Testing

### Verify Auto-Indexing

```bash
# 1. Run an agent with auto-indexing enabled
cargo run --bin miyabi -- agent run coordinator --issue 270

# 2. Wait a few seconds for background indexing
sleep 5

# 3. Search for the execution
miyabi knowledge search "Issue #270"

# 4. Should see results from the recent execution
```

### Troubleshooting

#### Auto-Indexing Not Working

1. **Check configuration**:
   ```bash
   miyabi knowledge config --show
   ```

2. **Verify Qdrant is running**:
   ```bash
   curl http://localhost:6333/collections
   ```

3. **Check logs**:
   ```bash
   # Look for auto-indexing messages
   grep "Auto-indexing" .ai/logs/$(date +%Y-%m-%d).md
   ```

4. **Enable debug logging**:
   ```bash
   RUST_LOG=miyabi_agents=debug,miyabi_knowledge=debug \
     cargo run --bin miyabi -- agent run coordinator --issue 270
   ```

#### Performance Issues

If auto-indexing is slowing down agent execution:

1. **Increase delay**:
   ```bash
   miyabi knowledge config --delay-seconds 10
   ```

2. **Reduce retry count**:
   ```bash
   miyabi knowledge config --retry-count 1
   ```

3. **Disable temporarily**:
   ```bash
   miyabi knowledge config --auto-index false
   ```

## Advanced Usage

### Multiple Hooks

```rust
let mut hooked_agent = HookedAgent::new(agent);

// Environment check hook
hooked_agent.register_hook(EnvironmentCheckHook::new(vec![
    "GITHUB_TOKEN",
    "ANTHROPIC_API_KEY",
]));

// Metrics hook
hooked_agent.register_hook(MetricsHook::new());

// Audit log hook with auto-indexing
let knowledge_config = KnowledgeConfig::from_file("~/.config/miyabi/knowledge.json")?;
hooked_agent.register_hook(
    AuditLogHook::new(".ai/logs").with_auto_index(knowledge_config)
);
```

### Custom Hook Implementation

```rust
use miyabi_agents::AgentHook;
use async_trait::async_trait;

struct CustomIndexingHook {
    config: KnowledgeConfig,
}

#[async_trait]
impl AgentHook for CustomIndexingHook {
    async fn on_post_execute(
        &self,
        agent: AgentType,
        task: &Task,
        result: &AgentResult,
    ) -> Result<()> {
        // Custom indexing logic
        tracing::info!("Custom indexing triggered for {:?}", agent);

        // Your implementation here

        Ok(())
    }
}
```

## Examples

See also:
- [`examples/hooked_agent.rs`](../examples/hooked_agent.rs) - Basic hook usage
- [`examples/auto_indexing.rs`](../examples/auto_indexing.rs) - Auto-indexing demo
- [`tests/hook_integration_tests.rs`](../tests/hook_integration_tests.rs) - Integration tests

## Related Documentation

- [Agent Lifecycle Hooks](./hooks.rs) - Hook trait and built-in hooks
- [Knowledge Management](../miyabi-knowledge/README.md) - Vector DB setup
- [CLI Reference](../miyabi-cli/README.md) - `miyabi knowledge` commands

---

**Last Updated**: 2025-10-22
**Feature Status**: ✅ Stable (v0.1.1+)
