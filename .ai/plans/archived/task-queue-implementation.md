# タスクキュー管理システム実装

**Created**: 2025-11-11
**Status**: In Progress
**Owner**: Leader Agent (pane %8)
**Related**: multi-agent-task-distribution-design.md

## 🎯 目的

優先度ベースのタスクキュー管理システムを実装し、効率的なタスク割り当てを実現

## 📋 タスクキュー仕様

### Priority Levels

```rust
enum Priority {
    P0, // Critical - システム停止につながるタスク
    P1, // High - 必須実行タスク
    P2, // Normal - 通常タスク
    P3, // Low - 最適化・改善タスク
}
```

### Task Structure

```rust
struct Task {
    id: String,
    priority: Priority,
    description: String,
    assigned_to: Option<String>, // pane ID
    status: TaskStatus,
    created_at: DateTime<Utc>,
    started_at: Option<DateTime<Utc>>,
    completed_at: Option<DateTime<Utc>>,
    dependencies: Vec<String>, // Task IDs
}

enum TaskStatus {
    Pending,
    Assigned,
    InProgress,
    Completed,
    Failed,
    Blocked,
}
```

### Queue Operations

```rust
trait TaskQueue {
    // Add task to queue
    fn enqueue(&mut self, task: Task) -> Result<()>;

    // Get next highest priority task
    fn dequeue(&mut self) -> Option<Task>;

    // Get task by ID
    fn get(&self, task_id: &str) -> Option<&Task>;

    // Update task status
    fn update_status(&mut self, task_id: &str, status: TaskStatus) -> Result<()>;

    // List all tasks by priority
    fn list_by_priority(&self, priority: Priority) -> Vec<&Task>;

    // Get agent's current tasks
    fn get_agent_tasks(&self, agent_id: &str) -> Vec<&Task>;
}
```

## 🏗️ 実装案

### 1. In-Memory Implementation (Phase 2.1)

```rust
use std::collections::{HashMap, BTreeMap};
use std::sync::{Arc, Mutex};

struct InMemoryTaskQueue {
    tasks: HashMap<String, Task>,
    priority_index: BTreeMap<(Priority, DateTime<Utc>), String>,
    agent_index: HashMap<String, Vec<String>>,
}

impl InMemoryTaskQueue {
    fn new() -> Self {
        InMemoryTaskQueue {
            tasks: HashMap::new(),
            priority_index: BTreeMap::new(),
            agent_index: HashMap::new(),
        }
    }
}
```

### 2. File-Based Persistence (Phase 2.2)

```rust
// Persist to .ai/queue/tasks.json
fn save_to_file(&self, path: &Path) -> Result<()> {
    let json = serde_json::to_string_pretty(&self.tasks)?;
    fs::write(path, json)?;
    Ok(())
}

fn load_from_file(path: &Path) -> Result<Self> {
    let json = fs::read_to_string(path)?;
    let tasks: HashMap<String, Task> = serde_json::from_str(&json)?;
    // Rebuild indexes
    Ok(Self::from_tasks(tasks))
}
```

### 3. Agent Assignment Logic

```rust
struct AgentCapability {
    agent_id: String,
    pane_id: String,
    skills: Vec<String>,
    max_concurrent_tasks: usize,
    current_load: usize,
}

fn assign_task_to_agent(
    task: &Task,
    agents: &[AgentCapability]
) -> Option<String> {
    agents
        .iter()
        .filter(|a| {
            // Has required skills
            task.required_skills.iter()
                .all(|s| a.skills.contains(s))
        })
        .filter(|a| {
            // Not at max capacity
            a.current_load < a.max_concurrent_tasks
        })
        .min_by_key(|a| a.current_load)
        .map(|a| a.agent_id.clone())
}
```

## 📊 現在のタスクキュー状態

### Active Tasks (2025-11-11)

```json
{
  "task_001": {
    "id": "task_001",
    "priority": "P1",
    "description": "エージェント間通信プロトコルの実装",
    "assigned_to": "%11",
    "status": "InProgress",
    "created_at": "2025-11-11T00:00:00Z",
    "started_at": "2025-11-11T00:01:00Z",
    "dependencies": []
  },
  "task_002": {
    "id": "task_002",
    "priority": "P1",
    "description": "マルチエージェント協調動作のテストケース作成",
    "assigned_to": "%11",
    "status": "Pending",
    "created_at": "2025-11-11T00:00:00Z",
    "dependencies": ["task_001"]
  },
  "task_003": {
    "id": "task_003",
    "priority": "P1",
    "description": "タスク分散設計の策定",
    "assigned_to": "%8",
    "status": "Completed",
    "created_at": "2025-11-11T00:00:00Z",
    "started_at": "2025-11-11T00:01:00Z",
    "completed_at": "2025-11-11T00:15:00Z",
    "dependencies": []
  },
  "task_004": {
    "id": "task_004",
    "priority": "P2",
    "description": "進捗管理とモニタリング",
    "assigned_to": "%8",
    "status": "InProgress",
    "created_at": "2025-11-11T00:00:00Z",
    "started_at": "2025-11-11T00:15:00Z",
    "dependencies": ["task_003"]
  },
  "task_005": {
    "id": "task_005",
    "priority": "P2",
    "description": "品質チェックと統合テスト",
    "assigned_to": null,
    "status": "Pending",
    "created_at": "2025-11-11T00:00:00Z",
    "dependencies": ["task_001", "task_002"]
  }
}
```

### Agent Status

```
Agent: Leader (pane %8)
- Current Load: 1/3
- Active Tasks: ["task_004"]
- Completed Tasks: ["task_003"]
- Skills: ["design", "monitoring", "coordination"]

Agent: Worker1 (pane %11)
- Current Load: 1/2
- Active Tasks: ["task_001"]
- Pending Tasks: ["task_002"]
- Skills: ["implementation", "testing", "rust"]
```

## 🚀 Implementation Steps

### Phase 2.1: Core Queue (In Progress)
- [x] Define data structures
- [x] Document queue operations
- [x] Design assignment algorithm
- [ ] Implement in-memory queue
- [ ] Write unit tests

### Phase 2.2: Persistence
- [ ] Implement file-based storage
- [ ] Add auto-save functionality
- [ ] Implement load/restore on startup

### Phase 2.3: Integration
- [ ] Integrate with tmux communication
- [ ] Add metrics collection
- [ ] Create monitoring dashboard

## 📝 Next Actions

1. Worker1からの進捗報告を待つ
2. Phase 2.1の実装を開始（Rust code）
3. 30秒後にWorker1の状態を再確認
4. task_001完了次第、task_002をWorker1に割り当て

## 🎯 Success Metrics

- Queue operations < 10ms
- Task assignment accuracy > 95%
- Zero task loss (persistence)
- Support 10+ concurrent tasks

---

**Status**: Design Complete, Implementation Starting | **Last Updated**: 2025-11-11
