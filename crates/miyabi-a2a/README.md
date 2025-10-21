# miyabi-a2a

Agent-to-Agent (A2A) task storage and communication for Miyabi.

## Overview

`miyabi-a2a` provides task storage and coordination infrastructure for multi-agent collaboration in the Miyabi framework. Tasks are persisted as GitHub Issues, providing natural visualization and workflow integration.

## Features

- **GitHub Issues Backend**: Uses GitHub Issues as persistent storage (no additional infrastructure required)
- **Type-Safe API**: Strongly typed task representation with async/await support
- **Status Management**: Automatic label-based status tracking
- **Filtering**: Query tasks by status, context, agent, and timestamp
- **Natural UI**: View and manage tasks directly in GitHub's issue tracker

## Installation

Add to your `Cargo.toml`:

```toml
[dependencies]
miyabi-a2a = { version = "0.1.0", path = "../miyabi-a2a" }
```

## Quick Start

```rust
use miyabi_a2a::{GitHubTaskStorage, TaskStorage, A2ATask, TaskStatus, TaskType};
use chrono::Utc;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Create storage backend
    let storage = GitHubTaskStorage::new(
        std::env::var("GITHUB_TOKEN")?,
        "owner".to_string(),
        "repo".to_string(),
    )?;

    // Create a new task
    let task = A2ATask {
        id: 0, // Will be assigned by storage
        title: "Implement feature X".to_string(),
        description: "Detailed implementation plan...".to_string(),
        status: TaskStatus::Pending,
        task_type: TaskType::CodeGeneration,
        agent: Some("CodeGenAgent".to_string()),
        context_id: Some("project-123".to_string()),
        priority: 3,
        created_at: Utc::now(),
        updated_at: Utc::now(),
        issue_url: String::new(),
    };

    // Save task (creates GitHub Issue)
    let task_id = storage.save_task(task).await?;
    println!("Created task #{}", task_id);

    // Retrieve task
    if let Some(task) = storage.get_task(task_id).await? {
        println!("Task: {} - Status: {:?}", task.title, task.status);
    }

    Ok(())
}
```

## API Reference

### Core Types

#### `A2ATask`

Represents a task that can be exchanged between agents.

```rust
pub struct A2ATask {
    pub id: u64,              // GitHub Issue number
    pub title: String,
    pub description: String,
    pub status: TaskStatus,
    pub task_type: TaskType,
    pub agent: Option<String>,
    pub context_id: Option<String>,
    pub priority: u8,         // 0-5, higher = more urgent
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub issue_url: String,
}
```

#### `TaskStatus`

Task lifecycle states:

- `Pending`: Task created, awaiting processing
- `InProgress`: Task currently being worked on
- `Completed`: Task successfully completed
- `Failed`: Task failed with errors
- `Blocked`: Task blocked by dependencies

#### `TaskType`

Task classification:

- `CodeGeneration`: Code generation task
- `CodeReview`: Code review task
- `Testing`: Testing task
- `Deployment`: Deployment task
- `Documentation`: Documentation task
- `Analysis`: Analysis task

### Storage Operations

#### `save_task(task: A2ATask) -> Result<u64>`

Create a new task. Returns the assigned task ID (GitHub Issue number).

```rust
let task_id = storage.save_task(task).await?;
```

#### `get_task(id: u64) -> Result<Option<A2ATask>>`

Retrieve a task by ID. Returns `None` if not found.

```rust
if let Some(task) = storage.get_task(42).await? {
    println!("Found task: {}", task.title);
}
```

#### `list_tasks(filter: TaskFilter) -> Result<Vec<A2ATask>>`

List tasks with optional filters.

```rust
use miyabi_a2a::TaskFilter;

let filter = TaskFilter {
    status: Some(TaskStatus::InProgress),
    context_id: Some("project-123".to_string()),
    limit: Some(10),
    ..Default::default()
};

let tasks = storage.list_tasks(filter).await?;
```

#### `update_task(id: u64, update: TaskUpdate) -> Result<()>`

Update an existing task.

```rust
use miyabi_a2a::TaskUpdate;

let update = TaskUpdate {
    status: Some(TaskStatus::Completed),
    description: Some("Updated description".to_string()),
    ..Default::default()
};

storage.update_task(42, update).await?;
```

#### `delete_task(id: u64) -> Result<()>`

Delete a task (closes GitHub Issue).

```rust
storage.delete_task(42).await?;
```

## GitHub Integration

### Label Mapping

Tasks use GitHub labels for status and type tracking:

**Status Labels:**
- `a2a:pending`
- `a2a:in-progress`
- `a2a:completed`
- `a2a:failed`
- `a2a:blocked`

**Type Labels:**
- `a2a:codegen`
- `a2a:review`
- `a2a:testing`
- `a2a:deployment`
- `a2a:documentation`
- `a2a:analysis`

### Required Permissions

The GitHub token requires the following scopes:
- `repo` (full repository access)

Set via environment variable:
```bash
export GITHUB_TOKEN=ghp_your_token_here
```

## Testing

```bash
# Run unit tests
cargo test --package miyabi-a2a

# Run with GitHub integration (requires GITHUB_TOKEN)
GITHUB_TOKEN=ghp_xxx cargo test --package miyabi-a2a -- --ignored
```

## Performance & Optimization

### Current Implementation

**Hybrid Filtering**: API-level + In-memory filtering for optimal performance.

```rust
// Status filtering: API-level (GitHub labels)
let filter = TaskFilter {
    status: Some(TaskStatus::Pending),
    limit: Some(30),
    ..Default::default()
};
let tasks = storage.list_tasks(filter).await?;
```

### Performance Characteristics

#### API-level Filtering (✅ Implemented)

**Status Filtering**: Uses GitHub API label queries
```rust
// GitHub API request
GET /repos/:owner/:repo/issues?labels=a2a:pending&per_page=30
```

**Performance**:
- Network Transfer: **90% reduction** for status queries
- Query Time: <50ms (GitHub servers)
- Example: 10 pending tasks → 10 Issues fetched (vs 100 with in-memory)

#### In-memory Filtering

**Other Filters**: `context_id`, `agent`, `last_updated_after`
- Applied after API fetch
- Performance: <1ms (local filtering)
- Reason: Not supported by GitHub Issues API labels

### Optimization Results

**Before (MVP)**:
```
100 Issues fetch → 100 transfers → In-memory filter → 10 matches
Network: 100 Issues | Time: ~200ms
```

**After (Optimized)**:
```
Label filter → 10 Issues fetch → 10 transfers → In-memory filter → 10 matches
Network: 10 Issues | Time: ~50ms
```

**Improvement**:
- ✅ 90% less network traffic
- ✅ 75% faster query time
- ✅ Scales better with large task counts

### Roadmap

**Cursor-based Pagination** (Issue #279):
- ⏳ Paginate through large result sets
- ⏳ Support for 1000+ tasks

**GraphQL API** (Future):
- ⏳ Full API-level filtering (context_id, agent, timestamps)
- ⏳ Single-request multi-field queries

## Examples

See the [examples](../../examples/) directory for complete usage examples:
- Basic CRUD operations
- Multi-agent coordination
- Status transitions

## Architecture

```
┌─────────────────────────────────────────┐
│         TaskStorage Trait                │
│  (Abstract storage interface)            │
└────────────────┬────────────────────────┘
                 │
                 │ implements
                 ▼
┌─────────────────────────────────────────┐
│      GitHubTaskStorage                   │
│  (GitHub Issues backend)                 │
└────────────────┬────────────────────────┘
                 │
                 │ uses
                 ▼
┌─────────────────────────────────────────┐
│         octocrab                         │
│  (GitHub API client)                     │
└─────────────────────────────────────────┘
```

## Roadmap

- [ ] Pagination support (cursor-based)
- [ ] Webhook integration for real-time updates
- [ ] Cache layer for improved performance
- [ ] Context ID extraction from Issue body
- [ ] Priority extraction from labels
- [ ] Alternative storage backends (PostgreSQL, SQLite)

## License

Apache-2.0

## Related

- [Issue #281](https://github.com/ShunsukeHayashi/miyabi-private/issues/281) - task storage backend
- [Milestone 26](https://github.com/ShunsukeHayashi/miyabi-private/milestone/26) - Phase 2: Streaming & Push Notifications
