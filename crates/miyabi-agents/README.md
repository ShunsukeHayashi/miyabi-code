# miyabi-agents

**Note**: This crate is deprecated in favor of specialized agent crates:
- `miyabi-agent-coordinator`
- `miyabi-agent-codegen`
- `miyabi-agent-review`
- `miyabi-agent-workflow`
- `miyabi-agent-business`
- `miyabi-agent-integrations`

This crate now serves as a unified re-export layer for backward compatibility.

## Features

### Agent Lifecycle Hooks

The hooks system allows you to extend agent behavior with lifecycle events:

- **Pre-Execute**: Validate environment, check prerequisites
- **Post-Execute**: Log results, trigger actions, index knowledge
- **On Error**: Handle failures, trigger alerts

### Built-in Hooks

- `EnvironmentCheckHook`: Validate required environment variables
- `MetricsHook`: Record execution metrics using `tracing`
- `AuditLogHook`: Append execution details to `.ai/logs`

### Auto-Indexing (Optional)

When the `knowledge-integration` feature is enabled, `AuditLogHook` can automatically index agent execution logs into a vector database for future knowledge retrieval.

```rust
use miyabi_agents::{HookedAgent, AuditLogHook};
use miyabi_knowledge::KnowledgeConfig;

let config = KnowledgeConfig::from_file("~/.config/miyabi/knowledge.json")?;
let hook = AuditLogHook::new(".ai/logs").with_auto_index(config);
```

**See**: [Hook Integration Guide](./HOOK_INTEGRATION_GUIDE.md) for complete documentation.

## Usage

### Basic Hook Usage

```rust
use miyabi_agents::{HookedAgent, MetricsHook, AuditLogHook};
use miyabi_agent_coordinator::CoordinatorAgent;
use miyabi_types::{AgentConfig, Task};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Create agent
    let config = AgentConfig::default();
    let agent = CoordinatorAgent::new(config);

    // Wrap with hooks
    let mut hooked_agent = HookedAgent::new(agent);
    hooked_agent.register_hook(MetricsHook::new());
    hooked_agent.register_hook(AuditLogHook::new(".ai/logs"));

    // Execute
    let task = create_sample_task();
    let result = hooked_agent.execute(&task).await?;

    Ok(())
}
```

### With Auto-Indexing

```rust
use miyabi_agents::{HookedAgent, AuditLogHook};
use miyabi_knowledge::KnowledgeConfig;

// Load configuration
let knowledge_config = KnowledgeConfig::from_file("~/.config/miyabi/knowledge.json")?;

// Create hooked agent with auto-indexing
let mut hooked_agent = HookedAgent::new(agent);
hooked_agent.register_hook(
    AuditLogHook::new(".ai/logs").with_auto_index(knowledge_config)
);

// Execute - logs will be auto-indexed in the background
let result = hooked_agent.execute(&task).await?;
```

## Features

- `default`: Standard hooks (Metrics, Environment Check, Audit Log)
- `knowledge-integration`: Enable auto-indexing with `miyabi-knowledge`

## Documentation

- [Hook Integration Guide](./HOOK_INTEGRATION_GUIDE.md) - Complete auto-indexing setup
- [API Documentation](https://docs.rs/miyabi-agents) - Rust API reference
- [Knowledge Management](../miyabi-knowledge/README.md) - Vector DB setup

## Migration from Legacy Agents

If you're using the legacy agent implementations in this crate, please migrate to the specialized crates:

```rust
// Old (deprecated)
use miyabi_agents::CoordinatorAgent;

// New (recommended)
use miyabi_agent_coordinator::CoordinatorAgent;
```

## License

See [LICENSE](../../LICENSE) in the repository root.
