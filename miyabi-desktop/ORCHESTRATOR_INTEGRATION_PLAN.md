# Orchestrator PTY Integration - Implementation Plan

**Status**: Planning Phase
**Version**: 1.0.0
**Date**: 2025-01-31
**Estimated Effort**: 3-5 days

---

## Executive Summary

This plan outlines the integration of PTY (Pseudo-Terminal) management into Miyabi's autonomous agent orchestration system. The implementation will enable CoordinatorAgent and other agents to spawn, manage, and monitor terminal sessions programmatically.

### Key Objectives

1. ✅ **Multi-PTY Support** - Each terminal tab has independent shell session
2. ✅ **UTF-8 Encoding Fix** - Proper handling of multi-byte characters
3. ✅ **Orchestrator Management APIs** - Full programmatic control
4. 🔄 **Hybrid Architecture** - Both Tauri IPC and direct crate integration
5. 🔄 **Parallel Execution** - Multi-agent concurrent task execution
6. 🔄 **Output Monitoring** - Real-time output capture and analysis
7. 🔄 **Session Lifecycle** - Automatic cleanup and resource management

---

## Architecture Overview

### Hybrid Integration Strategy

We will implement **both** approaches to maximize flexibility:

```
┌─────────────────────────────────────────────────────────────────┐
│                     Miyabi Ecosystem                             │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Miyabi CLI (Rust)                                         │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │  CoordinatorAgent                                     │ │ │
│  │  │                                                        │ │ │
│  │  │  Mode 1: Direct Integration                          │ │ │
│  │  │  ┌────────────────────────────────┐                  │ │ │
│  │  │  │  use miyabi_pty_manager;       │                  │ │ │
│  │  │  │  let manager = PtyManager::new()│                  │ │ │
│  │  │  └────────────────────────────────┘                  │ │ │
│  │  │                                                        │ │ │
│  │  │  Mode 2: Desktop IPC (optional)                      │ │ │
│  │  │  ┌────────────────────────────────┐                  │ │ │
│  │  │  │  if desktop_available() {      │                  │ │ │
│  │  │  │    use desktop_ipc;            │                  │ │ │
│  │  │  │  }                              │                  │ │ │
│  │  │  └────────────────────────────────┘                  │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────┘ │
│                           │                     │                 │
│                    Direct │                     │ IPC             │
│                           │                     │                 │
│  ┌────────────────────────▼─────────────────────▼──────────────┐ │
│  │              miyabi-pty-manager (Shared Crate)             │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │  PtyManager                                          │ │ │
│  │  │  - spawn_shell_with_manager()                        │ │ │
│  │  │  - execute_command()                                 │ │ │
│  │  │  - list_sessions_by_manager()                        │ │ │
│  │  │  - SessionOutputBuffer (new)                         │ │ │
│  │  │  - ProcessMonitor (new)                              │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────┘ │
│                           │                                       │
│                  portable-pty                                     │
│                           │                                       │
│  ┌────────────────────────▼─────────────────────────────────┐   │
│  │              Shell Processes (bash/zsh/powershell)       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Miyabi Desktop (Tauri) - Optional UI                     │ │
│  │  - Visual terminal tabs                                   │ │
│  │  - Real-time monitoring dashboard                         │ │
│  │  - IPC server for remote control                          │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Shared Crate Extraction (Day 1)

### 1.1 Create `miyabi-pty-manager` Crate

**Location**: `/Users/shunsuke/Dev/miyabi-private/crates/miyabi-pty-manager`

**Structure**:
```
crates/miyabi-pty-manager/
├── Cargo.toml
├── src/
│   ├── lib.rs              # Public API
│   ├── manager.rs          # PtyManager (from miyabi-desktop)
│   ├── session.rs          # Session types
│   ├── output_buffer.rs    # NEW: Output buffering
│   ├── process_monitor.rs  # NEW: Process status tracking
│   └── errors.rs           # Error types
└── tests/
    └── integration_tests.rs
```

**Dependencies**:
```toml
[dependencies]
portable-pty = "0.8"
tokio = { version = "1", features = ["full", "sync"] }
uuid = { version = "1", features = ["v4"] }
serde = { version = "1", features = ["derive"] }
thiserror = "1.0"
tracing = "0.1"
```

### 1.2 Extract Core PTY Logic

**Tasks**:
- ✅ Move `PtySession`, `TerminalSession`, `SessionInfo` from `miyabi-desktop/src-tauri/src/pty.rs`
- ✅ Move `PtyManager` implementation
- 🔄 Add `OutputBuffer` for session output capture
- 🔄 Add `ProcessMonitor` for process lifecycle tracking
- 🔄 Implement proper error types with `thiserror`

### 1.3 Add Output Buffering

**New Feature**: `SessionOutputBuffer`

```rust
// crates/miyabi-pty-manager/src/output_buffer.rs

use std::collections::VecDeque;
use std::sync::{Arc, Mutex};

pub struct SessionOutputBuffer {
    buffer: Arc<Mutex<VecDeque<String>>>,
    max_lines: usize,
}

impl SessionOutputBuffer {
    pub fn new(max_lines: usize) -> Self {
        Self {
            buffer: Arc::new(Mutex::new(VecDeque::with_capacity(max_lines))),
            max_lines,
        }
    }

    pub fn push(&self, line: String) {
        let mut buf = self.buffer.lock().unwrap();
        if buf.len() >= self.max_lines {
            buf.pop_front();
        }
        buf.push_back(line);
    }

    pub fn get_recent(&self, n: usize) -> Vec<String> {
        let buf = self.buffer.lock().unwrap();
        buf.iter()
            .rev()
            .take(n)
            .rev()
            .cloned()
            .collect()
    }

    pub fn search(&self, pattern: &str) -> Vec<String> {
        let buf = self.buffer.lock().unwrap();
        buf.iter()
            .filter(|line| line.contains(pattern))
            .cloned()
            .collect()
    }

    pub fn clear(&self) {
        self.buffer.lock().unwrap().clear();
    }
}
```

### 1.4 Add Process Monitoring

**New Feature**: `ProcessMonitor`

```rust
// crates/miyabi-pty-manager/src/process_monitor.rs

use std::process::Child;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

pub struct ProcessMonitor {
    start_time: Instant,
    exit_code: Arc<Mutex<Option<i32>>>,
}

impl ProcessMonitor {
    pub fn new(mut child: Child) -> Self {
        let exit_code = Arc::new(Mutex::new(None));
        let exit_code_clone = exit_code.clone();

        // Monitor process in background
        tokio::spawn(async move {
            match child.wait() {
                Ok(status) => {
                    *exit_code_clone.lock().unwrap() = status.code();
                }
                Err(e) => {
                    tracing::error!("Process monitor error: {}", e);
                }
            }
        });

        Self {
            start_time: Instant::now(),
            exit_code,
        }
    }

    pub fn is_alive(&self) -> bool {
        self.exit_code.lock().unwrap().is_none()
    }

    pub fn exit_code(&self) -> Option<i32> {
        *self.exit_code.lock().unwrap()
    }

    pub fn uptime(&self) -> Duration {
        self.start_time.elapsed()
    }
}
```

---

## Phase 2: CoordinatorAgent Integration (Day 2)

### 2.1 Add PTY Trait to Agent Core

**Location**: `crates/miyabi-agent-core/src/pty_trait.rs` (NEW)

```rust
use async_trait::async_trait;
use miyabi_pty_manager::{TerminalSession, SessionInfo};

#[async_trait]
pub trait PtyOperations {
    /// Spawn a new PTY session managed by this agent
    async fn spawn_session(&self, cols: u16, rows: u16) -> Result<TerminalSession>;

    /// Execute a command in a session
    async fn execute(&self, session_id: &str, command: &str) -> Result<()>;

    /// Get recent output from a session
    async fn get_output(&self, session_id: &str, lines: usize) -> Result<Vec<String>>;

    /// Search output for a pattern
    async fn search_output(&self, session_id: &str, pattern: &str) -> Result<Vec<String>>;

    /// Wait for command completion (detect prompt)
    async fn wait_for_completion(&self, session_id: &str, timeout: Duration) -> Result<Vec<String>>;

    /// Kill session
    async fn kill_session(&self, session_id: &str) -> Result<()>;

    /// List all sessions managed by this agent
    async fn list_sessions(&self) -> Result<Vec<TerminalSession>>;

    /// Cleanup all sessions
    async fn cleanup_all(&self) -> Result<usize>;
}
```

### 2.2 Implement for CoordinatorAgent

**Location**: `crates/miyabi-agent-core/src/coordinator.rs`

```rust
use miyabi_pty_manager::PtyManager;
use std::sync::Arc;
use tokio::sync::Mutex;

pub struct CoordinatorAgent {
    agent_id: String,
    pty_manager: Arc<Mutex<PtyManager>>,
    // ... existing fields
}

impl CoordinatorAgent {
    pub fn new(agent_id: String) -> Self {
        Self {
            agent_id,
            pty_manager: Arc::new(Mutex::new(PtyManager::new())),
        }
    }

    pub async fn execute_build_task(&self) -> Result<TaskOutput> {
        // Spawn session
        let session = self.spawn_session(80, 24).await?;

        // Execute commands
        self.execute(&session.id, "cd /path/to/repo").await?;
        self.execute(&session.id, "cargo build --release").await?;

        // Wait for completion
        let output = self.wait_for_completion(&session.id, Duration::from_secs(300)).await?;

        // Cleanup
        self.kill_session(&session.id).await?;

        // Parse output
        let success = output.iter().any(|line| line.contains("Finished release"));

        Ok(TaskOutput { success, output })
    }
}

#[async_trait]
impl PtyOperations for CoordinatorAgent {
    async fn spawn_session(&self, cols: u16, rows: u16) -> Result<TerminalSession> {
        let manager = self.pty_manager.lock().await;
        manager.spawn_shell_with_manager(
            cols,
            rows,
            Some(self.agent_id.clone())
        )
    }

    async fn execute(&self, session_id: &str, command: &str) -> Result<()> {
        let manager = self.pty_manager.lock().await;
        manager.execute_command(session_id, command)
    }

    // ... implement other methods
}
```

---

## Phase 3: Parallel Execution Pattern (Day 3)

### 3.1 Parallel Task Orchestration

**Location**: `crates/miyabi-agent-core/src/parallel.rs` (NEW)

```rust
use tokio::task::JoinSet;
use std::collections::HashMap;

pub struct ParallelExecutor {
    coordinator: Arc<CoordinatorAgent>,
}

impl ParallelExecutor {
    pub async fn execute_parallel(
        &self,
        tasks: Vec<Task>
    ) -> Result<HashMap<String, TaskOutput>> {
        let mut join_set = JoinSet::new();

        for task in tasks {
            let coordinator = self.coordinator.clone();

            join_set.spawn(async move {
                // Spawn session
                let session = coordinator.spawn_session(80, 24).await?;

                // Execute task
                let output = coordinator.execute_task(&session.id, &task).await?;

                // Cleanup
                coordinator.kill_session(&session.id).await?;

                Ok::<_, Error>((task.name.clone(), output))
            });
        }

        let mut results = HashMap::new();
        while let Some(result) = join_set.join_next().await {
            match result? {
                Ok((name, output)) => {
                    results.insert(name, output);
                }
                Err(e) => {
                    tracing::error!("Task failed: {}", e);
                }
            }
        }

        Ok(results)
    }
}
```

### 3.2 Real-World Example: CI/CD Pipeline

```rust
pub async fn run_ci_pipeline(&self) -> Result<PipelineResult> {
    let tasks = vec![
        Task::new("build", vec!["cargo build --release"]),
        Task::new("test", vec!["cargo test --all"]),
        Task::new("clippy", vec!["cargo clippy -- -D warnings"]),
        Task::new("fmt", vec!["cargo fmt --check"]),
        Task::new("audit", vec!["cargo audit"]),
    ];

    let executor = ParallelExecutor::new(self.coordinator.clone());
    let results = executor.execute_parallel(tasks).await?;

    // Aggregate results
    let all_passed = results.values().all(|r| r.success);

    Ok(PipelineResult {
        success: all_passed,
        results,
    })
}
```

---

## Phase 4: Desktop App Integration (Day 4)

### 4.1 Update Tauri Backend

**Changes to**: `miyabi-desktop/src-tauri/Cargo.toml`

```toml
[dependencies]
miyabi-pty-manager = { path = "../../../crates/miyabi-pty-manager" }
tauri = { version = "2.0", features = ["ipc"] }
# Remove: portable-pty, uuid (now in shared crate)
```

**Changes to**: `miyabi-desktop/src-tauri/src/lib.rs`

```rust
use miyabi_pty_manager::{PtyManager, TerminalSession, SessionInfo};

// Tauri commands now delegate to shared crate
#[tauri::command]
async fn spawn_terminal_managed(
    cols: u16,
    rows: u16,
    managed_by: String,
    state: State<'_, AppState>,
) -> Result<TerminalSession, String> {
    state.pty_manager
        .lock()
        .unwrap()
        .spawn_shell_with_manager(cols, rows, Some(managed_by))
        .map_err(|e| e.to_string())
}
```

### 4.2 Add Monitoring Dashboard

**New Component**: `src/components/OrchestratorDashboard.tsx`

```typescript
export function OrchestratorDashboard() {
  const [sessions, setSessions] = useState<TerminalSession[]>([]);

  useEffect(() => {
    const interval = setInterval(async () => {
      const allSessions = await listTerminalSessions();
      setSessions(allSessions);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const orchestratorSessions = sessions.filter(s =>
    s.managed_by?.startsWith('orchestrator:')
  );

  return (
    <div className="p-8">
      <h2 className="text-2xl font-light mb-6">Orchestrator Sessions</h2>

      {orchestratorSessions.map(session => (
        <SessionCard key={session.id} session={session} />
      ))}
    </div>
  );
}
```

---

## Phase 5: Testing & Documentation (Day 5)

### 5.1 Integration Tests

**Location**: `crates/miyabi-pty-manager/tests/integration_tests.rs`

```rust
#[tokio::test]
async fn test_spawn_and_execute() {
    let manager = PtyManager::new();
    let session = manager.spawn_shell_with_manager(80, 24, Some("test-agent".into())).unwrap();

    manager.execute_command(&session.id, "echo 'Hello, World!'").unwrap();

    // Wait and verify output
    tokio::time::sleep(Duration::from_millis(500)).await;

    let output = manager.get_session_output(&session.id, 10).unwrap();
    assert!(output.iter().any(|line| line.contains("Hello, World!")));

    manager.kill_session(&session.id).unwrap();
}

#[tokio::test]
async fn test_parallel_execution() {
    let coordinator = CoordinatorAgent::new("test-coordinator".into());

    let tasks = vec![
        Task::new("task1", vec!["sleep 1", "echo 'Task 1'"]),
        Task::new("task2", vec!["sleep 1", "echo 'Task 2'"]),
        Task::new("task3", vec!["sleep 1", "echo 'Task 3'"]),
    ];

    let executor = ParallelExecutor::new(Arc::new(coordinator));
    let results = executor.execute_parallel(tasks).await.unwrap();

    assert_eq!(results.len(), 3);
    assert!(results.values().all(|r| r.success));
}
```

### 5.2 Documentation Updates

**Files to Create/Update**:

1. `crates/miyabi-pty-manager/README.md` - Crate documentation
2. `docs/ORCHESTRATOR_PTY_USAGE.md` - Usage guide for agent developers
3. `CLAUDE.md` - Update with PTY integration info
4. `.claude/context/agents.md` - Add PTY capabilities to agent descriptions

---

## Deployment Strategy

### Development Workflow

```bash
# 1. Build shared crate
cd /Users/shunsuke/Dev/miyabi-private/crates/miyabi-pty-manager
cargo build

# 2. Update CLI
cd ../miyabi-cli
cargo build --release

# 3. Update Desktop App
cd ../../miyabi-desktop
pnpm tauri build

# 4. Test integration
cargo test --package miyabi-pty-manager
cargo test --package miyabi-agent-core
```

### Production Deployment

**Option A: CLI Only** (No Desktop App)
```bash
# Agents use miyabi-pty-manager directly
miyabi agent run coordinator --issue 123
# → Spawns PTY sessions programmatically
```

**Option B: CLI + Desktop App** (With Visual Monitoring)
```bash
# 1. Start Desktop App in background
miyabi-desktop &

# 2. Run agents (they auto-detect Desktop App)
miyabi agent run coordinator --issue 123
# → Uses Desktop App IPC if available, falls back to direct
```

---

## Success Metrics

### Functional Requirements

- ✅ Multi-PTY support with independent sessions
- ✅ UTF-8 encoding for international characters
- ✅ Orchestrator management APIs (spawn, execute, kill)
- 🔄 Session output buffering and search
- 🔄 Process lifecycle monitoring
- 🔄 Parallel task execution
- 🔄 Integration with CoordinatorAgent
- 🔄 Desktop App monitoring dashboard

### Performance Requirements

- Session spawn time: < 100ms
- Command execution latency: < 10ms
- Output buffer search: < 50ms for 1000 lines
- Concurrent sessions: Support 10+ parallel sessions
- Memory footprint: < 50MB per session

### Reliability Requirements

- Automatic session cleanup on agent termination
- Graceful handling of process crashes
- No memory leaks in long-running sessions
- Proper UTF-8 handling for all locales

---

## Risk Assessment

### High Risk

1. **Process Lifecycle Management**
   - Risk: Zombie processes if cleanup fails
   - Mitigation: Implement process monitoring + timeout-based cleanup

2. **Output Buffer Memory**
   - Risk: Unbounded memory growth
   - Mitigation: Implement ring buffer with configurable max size

### Medium Risk

1. **Cross-Platform Compatibility**
   - Risk: Shell differences (bash vs PowerShell)
   - Mitigation: Test on macOS, Linux, Windows

2. **Concurrent Access**
   - Risk: Race conditions in session management
   - Mitigation: Proper mutex usage, async-aware locks

### Low Risk

1. **UTF-8 Edge Cases**
   - Risk: Partial multi-byte sequences
   - Mitigation: Already implemented buffered reading

---

## Next Steps

### Immediate (Today)

1. ✅ Create planning document (this file)
2. 🔄 Get approval on architecture
3. 🔄 Create `miyabi-pty-manager` crate skeleton

### Week 1 (Days 1-3)

1. Extract PTY logic to shared crate
2. Implement output buffering
3. Implement process monitoring
4. Create CoordinatorAgent integration

### Week 2 (Days 4-5)

1. Implement parallel execution pattern
2. Update Desktop App to use shared crate
3. Create monitoring dashboard
4. Write integration tests
5. Update documentation

---

## Questions to Resolve

1. **Agent ID Convention**: Confirm naming scheme for `managed_by` field
2. **Session Limits**: Should we enforce per-agent session limits?
3. **Output Retention**: How long to keep session output after termination?
4. **IPC Protocol**: Use HTTP, gRPC, or Tauri's built-in IPC?
5. **Process Timeouts**: Default timeout for long-running commands?

---

**Status**: ✅ Planning Complete - Ready for Implementation
**Approval Required**: Architecture Review
**Timeline**: 5 days (aggressive), 7-10 days (realistic)
