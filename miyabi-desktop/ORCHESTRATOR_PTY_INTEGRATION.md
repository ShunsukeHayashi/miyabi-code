# Orchestrator PTY Integration Guide

This document describes how Miyabi's CoordinatorAgent (Orchestrator) can manage PTY (Pseudo-Terminal) sessions through the Desktop App.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Miyabi Orchestrator                   │
│                  (CoordinatorAgent)                      │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ IPC Commands
                     │
┌────────────────────▼────────────────────────────────────┐
│              Miyabi Desktop (Tauri)                      │
│  ┌───────────────────────────────────────────────────┐  │
│  │              PTY Manager                          │  │
│  │  - Session lifecycle management                   │  │
│  │  - Multi-session support                          │  │
│  │  - Agent-based ownership tracking                 │  │
│  └───────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────┘
                       │
                       │ portable-pty
                       │
┌──────────────────────▼──────────────────────────────────┐
│                 Shell Processes                          │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                 │
│  │ bash #1 │  │ bash #2 │  │ bash #3 │  ...            │
│  └─────────┘  └─────────┘  └─────────┘                 │
└─────────────────────────────────────────────────────────┘
```

## PTY Session Data Model

Each PTY session includes the following metadata:

```typescript
interface TerminalSession {
  id: string;              // UUID v4
  cols: number;            // Terminal width
  rows: number;            // Terminal height
  cwd: string;             // Working directory
  shell: string;           // Shell path (e.g., /bin/bash)
  created_at: number;      // Unix timestamp
  managed_by?: string;     // "user" or "orchestrator:{agent_id}"
}

interface SessionInfo {
  session: TerminalSession;
  is_alive: boolean;       // Process status
}
```

## Available APIs

### 1. Spawn Terminal (User)

Spawn a terminal session for manual user interaction.

```typescript
import { spawnTerminal } from './lib/tauri-api';

const session = await spawnTerminal(80, 24);
console.log('Session ID:', session.id);
console.log('Managed by:', session.managed_by); // undefined (user-managed)
```

### 2. Spawn Terminal (Orchestrator-Managed)

Spawn a terminal session managed by a specific agent.

```typescript
import { spawnTerminalManaged } from './lib/tauri-api';

const session = await spawnTerminalManaged(
  80,                              // cols
  24,                              // rows
  'orchestrator:coordinator-001'   // agent ID
);

console.log('Session ID:', session.id);
console.log('Managed by:', session.managed_by); // "orchestrator:coordinator-001"
```

### 3. List All Sessions

Get all active PTY sessions.

```typescript
import { listTerminalSessions } from './lib/tauri-api';

const sessions = await listTerminalSessions();
sessions.forEach(session => {
  console.log(`${session.id}: ${session.shell} (${session.managed_by || 'user'})`);
});
```

### 4. Get Session Info

Get detailed information about a specific session.

```typescript
import { getTerminalSessionInfo } from './lib/tauri-api';

const info = await getTerminalSessionInfo('session-uuid');
console.log('Session:', info.session);
console.log('Is alive:', info.is_alive);
```

### 5. Execute Command

Execute a command in a specific session.

```typescript
import { executeTerminalCommand } from './lib/tauri-api';

// Execute with automatic newline
await executeTerminalCommand('session-uuid', 'ls -la');
await executeTerminalCommand('session-uuid', 'cd /tmp');
await executeTerminalCommand('session-uuid', 'git status');
```

### 6. List Sessions by Manager

Get all sessions managed by a specific agent.

```typescript
import { listSessionsByManager } from './lib/tauri-api';

const sessions = await listSessionsByManager('orchestrator:coordinator-001');
console.log(`Agent manages ${sessions.length} sessions`);
```

### 7. Kill Sessions by Manager

Terminate all sessions managed by a specific agent.

```typescript
import { killSessionsByManager } from './lib/tauri-api';

const count = await killSessionsByManager('orchestrator:coordinator-001');
console.log(`Killed ${count} sessions`);
```

### 8. Listen to Output

Monitor real-time output from a session.

```typescript
import { listenToTerminalOutput } from './lib/tauri-api';

const unlisten = await listenToTerminalOutput('session-uuid', (data) => {
  console.log('Output:', data);
});

// Later: stop listening
unlisten();
```

## Orchestrator Integration Pattern

### Pattern 1: Single-Agent Task Execution

```typescript
// 1. Spawn session for agent
const agentId = 'orchestrator:codegen-agent-42';
const session = await spawnTerminalManaged(80, 24, agentId);

// 2. Listen to output
const output: string[] = [];
await listenToTerminalOutput(session.id, (data) => {
  output.push(data);
});

// 3. Execute task commands
await executeTerminalCommand(session.id, 'cd /path/to/repo');
await executeTerminalCommand(session.id, 'git checkout -b feature/new-api');
await executeTerminalCommand(session.id, 'cargo build');

// 4. Wait for completion (implement your own logic)
await waitForCompletion(session.id);

// 5. Cleanup
await killTerminal(session.id);

// 6. Parse output for results
const buildSuccess = output.some(line => line.includes('Finished'));
```

### Pattern 2: Parallel Multi-Agent Execution

```typescript
const coordinatorId = 'orchestrator:coordinator-001';

// Spawn sessions for multiple sub-agents
const agents = [
  { name: 'codegen', task: 'cargo build' },
  { name: 'test', task: 'cargo test' },
  { name: 'lint', task: 'cargo clippy' },
];

const sessions = await Promise.all(
  agents.map(agent =>
    spawnTerminalManaged(80, 24, `${coordinatorId}:${agent.name}`)
  )
);

// Execute tasks in parallel
await Promise.all(
  sessions.map((session, i) =>
    executeTerminalCommand(session.id, agents[i].task)
  )
);

// Monitor all sessions
const results = await Promise.all(
  sessions.map(session => waitForCompletion(session.id))
);

// Cleanup all at once
await killSessionsByManager(coordinatorId);
```

### Pattern 3: Long-Running Agent with Monitoring

```typescript
const agentId = 'orchestrator:deployment-agent';

// Spawn persistent session
const session = await spawnTerminalManaged(80, 24, agentId);

// Setup monitoring
const logs: string[] = [];
await listenToTerminalOutput(session.id, (data) => {
  logs.push(data);

  // Real-time analysis
  if (data.includes('ERROR')) {
    notifyOrchestrator('error', data);
  } else if (data.includes('Deployed')) {
    notifyOrchestrator('success', data);
  }
});

// Execute long-running deployment
await executeTerminalCommand(session.id, './deploy.sh');

// Session remains active for subsequent commands
// ...

// Later: cleanup when agent is done
await killSessionsByManager(agentId);
```

## Best Practices

### 1. Agent ID Convention

Use consistent naming for agent IDs:

```
orchestrator:{agent-type}-{instance-id}

Examples:
- orchestrator:coordinator-001
- orchestrator:codegen-agent-42
- orchestrator:review-agent-7
- orchestrator:deployment-agent
```

### 2. Session Lifecycle

- **Spawn**: Create session when agent starts a task
- **Execute**: Run commands as needed
- **Monitor**: Listen to output for status
- **Cleanup**: Always kill sessions when done

### 3. Error Handling

```typescript
try {
  const session = await spawnTerminalManaged(80, 24, agentId);
  await executeTerminalCommand(session.id, 'cargo build');
  // ... wait for completion
} catch (error) {
  console.error('PTY error:', error);
  // Cleanup on error
  await killSessionsByManager(agentId);
}
```

### 4. Resource Management

- Limit concurrent sessions per agent
- Set timeouts for long-running commands
- Monitor memory usage for large output buffers
- Clean up sessions promptly after completion

## Rust Backend API Reference

### PTY Manager Methods

```rust
impl PtyManager {
    // Spawn shell with optional manager ID
    pub fn spawn_shell_with_manager(
        &self,
        cols: u16,
        rows: u16,
        app_handle: AppHandle,
        managed_by: Option<String>,
    ) -> Result<TerminalSession, String>;

    // List all sessions
    pub fn list_sessions(&self) -> Vec<TerminalSession>;

    // Get session info
    pub fn get_session_info(&self, session_id: &str)
        -> Result<SessionInfo, String>;

    // Execute command
    pub fn execute_command(&self, session_id: &str, command: &str)
        -> Result<(), String>;

    // List by manager
    pub fn list_sessions_by_manager(&self, manager_id: &str)
        -> Vec<TerminalSession>;

    // Kill by manager
    pub fn kill_sessions_by_manager(&self, manager_id: &str)
        -> Result<usize, String>;
}
```

### Tauri IPC Commands

```rust
#[tauri::command]
async fn spawn_terminal_managed(
    cols: u16,
    rows: u16,
    managed_by: String,
    app_handle: AppHandle,
    state: State<'_, AppState>,
) -> Result<TerminalSession, String>;

#[tauri::command]
async fn list_terminal_sessions(
    state: State<'_, AppState>
) -> Result<Vec<TerminalSession>, String>;

#[tauri::command]
async fn get_terminal_session_info(
    session_id: String,
    state: State<'_, AppState>,
) -> Result<SessionInfo, String>;

#[tauri::command]
async fn execute_terminal_command(
    session_id: String,
    command: String,
    state: State<'_, AppState>,
) -> Result<(), String>;

#[tauri::command]
async fn list_sessions_by_manager(
    manager_id: String,
    state: State<'_, AppState>,
) -> Result<Vec<TerminalSession>, String>;

#[tauri::command]
async fn kill_sessions_by_manager(
    manager_id: String,
    state: State<'_, AppState>,
) -> Result<usize, String>;
```

## Future Enhancements

### Planned Features

1. **Process Status Detection**
   - Detect when child process exits
   - Auto-cleanup dead sessions

2. **Output Buffering**
   - Buffer recent output for late listeners
   - Provide output history API

3. **Session Persistence**
   - Save/restore session state
   - Reconnect to existing sessions

4. **Enhanced Monitoring**
   - CPU/memory usage per session
   - Network I/O tracking
   - Exit code capture

5. **Security Features**
   - Session isolation
   - Permission-based access control
   - Audit logging

## Testing

### Manual Testing

```typescript
// Test basic spawn
const s1 = await spawnTerminal(80, 24);
console.log('User session:', s1);

// Test managed spawn
const s2 = await spawnTerminalManaged(80, 24, 'orchestrator:test');
console.log('Managed session:', s2);

// Test list
const all = await listTerminalSessions();
console.log('All sessions:', all);

// Test execute
await executeTerminalCommand(s2.id, 'echo "Hello from Orchestrator"');

// Test list by manager
const managed = await listSessionsByManager('orchestrator:test');
console.log('Managed sessions:', managed);

// Test cleanup
const count = await killSessionsByManager('orchestrator:test');
console.log('Killed sessions:', count);
```

## Integration with Miyabi Agent System

### CoordinatorAgent Pattern

```rust
// In CoordinatorAgent (Rust)

use miyabi_desktop_ipc::{
    spawn_terminal_managed,
    execute_terminal_command,
    list_sessions_by_manager,
    kill_sessions_by_manager,
};

pub struct CoordinatorAgent {
    agent_id: String,
    // ...
}

impl CoordinatorAgent {
    pub async fn execute_task(&self, task: Task) -> Result<TaskResult> {
        // Spawn PTY session
        let session = spawn_terminal_managed(
            80,
            24,
            &self.agent_id
        ).await?;

        // Execute commands
        for cmd in task.commands {
            execute_terminal_command(&session.id, &cmd).await?;
        }

        // Wait for completion
        let output = self.wait_for_output(&session.id).await?;

        // Cleanup
        kill_sessions_by_manager(&self.agent_id).await?;

        Ok(TaskResult { output })
    }
}
```

---

**Version**: 1.0.0
**Last Updated**: 2025-01-31
**Author**: Miyabi Team
