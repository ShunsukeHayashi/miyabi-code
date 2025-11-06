# miyabi-integration

**Status**: Experimental
**Category**: Integration

## Overview

Integration layer providing a thin facade (`MiyabiClient`) for external callers (e.g., Codex CLI) to interact with Miyabi Rust Edition crates. Enables seamless agent execution and worktree management from external tools.

## Features

- **Unified Client API**: Single `MiyabiClient` interface for all Miyabi operations
- **Agent Execution**: Execute any of the 7 Miyabi agents (Coordinator, CodeGen, Review, etc.)
- **Worktree Management**: Create, list, and cleanup Git worktrees
- **Status Monitoring**: Health check and version reporting
- **Type-Safe Interface**: Strongly typed requests and responses
- **GitHub Integration**: Built-in GitHub client initialization

## Usage

### Basic Setup

```rust
use miyabi_integration::{MiyabiClient, Config, AgentKind};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Create client with configuration
    let config = Config {
        workdir: Some(".".to_string()),
        github_token: Some("ghp_xxx".to_string()),
        repo_owner: Some("ShunsukeHayashi".to_string()),
        repo_name: Some("Miyabi".to_string()),
    };

    let client = MiyabiClient::new(config);

    // Check status
    let status = client.status().await?;
    println!("Miyabi status: OK={}, version={}", status.ok, status.version);

    Ok(())
}
```

### Execute Agent

```rust
use miyabi_integration::{MiyabiClient, Config, AgentKind};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let config = Config {
        workdir: Some(".".to_string()),
        github_token: Some(std::env::var("GITHUB_TOKEN")?),
        repo_owner: Some("ShunsukeHayashi".to_string()),
        repo_name: Some("Miyabi".to_string()),
    };

    let client = MiyabiClient::new(config);

    // Execute Coordinator agent for Issue #123
    let report = client
        .execute_agent(AgentKind::Coordinator, Some(123))
        .await?;

    println!("Agent: {:?}", report.agent);
    println!("Issue: {:?}", report.issue);
    println!("Result: {}", report.message);

    Ok(())
}
```

### Worktree Operations

```rust
use miyabi_integration::{MiyabiClient, Config};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let config = Config {
        workdir: Some("/path/to/project".to_string()),
        github_token: Some("ghp_xxx".to_string()),
        repo_owner: Some("ShunsukeHayashi".to_string()),
        repo_name: Some("Miyabi".to_string()),
    };

    let client = MiyabiClient::new(config);

    // List existing worktrees
    let worktrees = client.worktree_list().await?;
    for wt in worktrees {
        println!("Worktree: {} -> {}", wt.name, wt.path);
    }

    // Create new worktree for Issue #456
    let result = client.worktree_create(456).await?;
    if result.ok {
        println!("Created worktree: {:?}", result.worktree);
    }

    // Cleanup worktree
    let cleanup = client.worktree_cleanup(456).await?;
    println!("Cleanup: {}", cleanup.message);

    Ok(())
}
```

## API Reference

### `MiyabiClient`

Main client for interacting with Miyabi Rust Edition.

#### Constructor

**`new(config: Config) -> Self`**
- Create new Miyabi client with configuration

#### Methods

**`async fn status(&self) -> Result<Status, IntegrationError>`**
- Returns health status and version information
- Always succeeds unless internal error occurs

**`async fn execute_agent(&self, agent_kind: AgentKind, issue: Option<u64>) -> Result<ExecutionReport, IntegrationError>`**
- Execute a Miyabi agent with optional Issue number
- Requires `github_token`, `repo_owner`, and `repo_name` in config
- Returns execution report with agent details and result message

**`async fn worktree_list(&self) -> Result<Vec<WorktreeInfo>, IntegrationError>`**
- List all existing worktrees in the project
- Returns vector of `WorktreeInfo` with name, issue, and path

**`async fn worktree_create(&self, issue: u64) -> Result<WorktreeActionResult, IntegrationError>`**
- Create new Git worktree for specified Issue
- Returns action result with worktree info

**`async fn worktree_cleanup(&self, issue: u64) -> Result<WorktreeActionResult, IntegrationError>`**
- Schedule cleanup for specified worktree
- Returns action result with status message

---

### `Config`

Configuration for `MiyabiClient`.

#### Fields

- **`workdir: Option<String>`**: Working directory for operations (default: ".")
- **`github_token: Option<String>`**: GitHub access token (required for agent execution)
- **`repo_owner: Option<String>`**: Repository owner (required for agent execution)
- **`repo_name: Option<String>`**: Repository name (required for agent execution)

---

### `AgentKind`

Enum representing different agent types.

#### Variants

- **`Coordinator`**: CoordinatorAgent - Task decomposition and orchestration
- **`CodeGen`**: CodeGenAgent - Code generation
- **`Review`**: ReviewAgent - Code review
- **`Issue`**: IssueAgent - Issue management
- **`PR`**: PRAgent - Pull request management
- **`Deployment`**: DeploymentAgent - Deployment operations
- **`Test`**: TestAgent - Test execution
- **`Custom(String)`**: Custom agent (defaults to Coordinator)

---

### `Status`

Health status response.

#### Fields

- **`ok: bool`**: Whether system is operational
- **`version: String`**: Miyabi version

---

### `ExecutionReport`

Agent execution result.

#### Fields

- **`agent: AgentKind`**: Agent that was executed
- **`issue: Option<u64>`**: Issue number (if provided)
- **`message: String`**: Execution result message

---

### `WorktreeInfo`

Information about a Git worktree.

#### Fields

- **`name: String`**: Worktree name (e.g., "issue-123")
- **`issue: Option<u64>`**: Associated Issue number
- **`path: String`**: Absolute path to worktree

---

### `WorktreeActionResult`

Result of worktree operation.

#### Fields

- **`ok: bool`**: Whether operation succeeded
- **`message: String`**: Status message
- **`issue: Option<u64>`**: Associated Issue number
- **`worktree: Option<WorktreeInfo>`**: Worktree info (if created)

---

### `IntegrationError`

Error type for integration operations.

#### Variants

- **`NotImplemented(&'static str)`**: Feature not yet implemented
- **`Other(anyhow::Error)`**: Wrapped error from downstream crates

---

## Configuration Examples

### Minimal Configuration

```rust
let config = Config {
    workdir: None,
    github_token: Some("ghp_xxx".to_string()),
    repo_owner: Some("owner".to_string()),
    repo_name: Some("repo".to_string()),
};
```

### Full Configuration

```rust
let config = Config {
    workdir: Some("/path/to/project".to_string()),
    github_token: Some(std::env::var("GITHUB_TOKEN").unwrap()),
    repo_owner: Some("ShunsukeHayashi".to_string()),
    repo_name: Some("Miyabi".to_string()),
};
```

### From Environment Variables

```rust
let config = Config {
    workdir: std::env::var("MIYABI_WORKDIR").ok(),
    github_token: std::env::var("GITHUB_TOKEN").ok(),
    repo_owner: std::env::var("GITHUB_REPO_OWNER").ok(),
    repo_name: std::env::var("GITHUB_REPO_NAME").ok(),
};
```

---

## Error Handling

```rust
use miyabi_integration::{MiyabiClient, IntegrationError};

match client.execute_agent(AgentKind::CodeGen, Some(123)).await {
    Ok(report) => {
        println!("Success: {}", report.message);
    }
    Err(IntegrationError::NotImplemented(feature)) => {
        eprintln!("Feature not implemented: {}", feature);
    }
    Err(IntegrationError::Other(e)) => {
        eprintln!("Error: {}", e);
    }
}
```

---

## Dependencies

- `miyabi-agents`: Agent implementations
- `miyabi-github`: GitHub API client
- `miyabi-types`: Shared type definitions
- `serde`, `serde_json`: Serialization
- `tokio`: Async runtime
- `anyhow`: Error handling
- `thiserror`: Error derivation

---

## Development Status

- [x] Basic client API
- [x] Agent execution
- [x] Worktree operations (mock)
- [x] Status endpoint
- [x] Type-safe interfaces
- [ ] Real worktree implementation
- [ ] Tests
- [ ] Documentation
- [ ] Error recovery
- [ ] Async cancellation

---

## Integration with Codex CLI

This crate is designed to be used by Codex CLI (TypeScript/Node.js) via FFI or a thin REST API wrapper.

### Example: Node.js FFI (via napi-rs)

```typescript
import { MiyabiClient, Config, AgentKind } from '@miyabi/integration';

const config: Config = {
  workdir: process.cwd(),
  github_token: process.env.GITHUB_TOKEN,
  repo_owner: 'ShunsukeHayashi',
  repo_name: 'Miyabi',
};

const client = new MiyabiClient(config);

// Execute agent
const report = await client.executeAgent(AgentKind.Coordinator, 123);
console.log('Agent report:', report);
```

---

## Related Crates

- `miyabi-agents`: All agent implementations
- `miyabi-github`: GitHub API client
- `miyabi-types`: Shared types
- `miyabi-core`: Core utilities
- `miyabi-worktree`: Git worktree management (to be integrated)

---

## Notes

**Current Limitations**:
- Worktree operations are currently mocked (returning placeholder data)
- Always uses CoordinatorAgent internally regardless of `AgentKind`
- No streaming support for long-running agent executions
- Limited error context propagation

**Future Enhancements**:
- Integrate real `miyabi-worktree` implementation
- Support all 7 agent types directly
- Add streaming execution reports
- Implement cancellation tokens
- Add metrics and observability

---

## License

Apache-2.0
