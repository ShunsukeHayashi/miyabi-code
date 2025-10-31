# Agent Monitor

**Version**: 1.0.0
**Last Updated**: 2025-10-31
**Priority**: 🔴 MVP Critical
**Feature ID**: F-3
**Implementation**: Sprint 4

---

## Overview

The Agent Monitor displays real-time execution status of all running Miyabi agents. It provides:
- Live agent logs (streaming)
- Progress indicators (percentage, step counters)
- Agent actions (pause, cancel, resume)
- Agent metadata (issue number, duration, agent type)
- Final results (success, failure, needs review)

---

## Layout Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│  🤖 Active Agents (3)              [Pause All] [⚙️ Settings]           │ ← Header
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │ CodeGenAgent (#270)                                    [− Collapse]│ │
│  │ ──────────────────────────────────────────────────────────────── │ │
│  │ ██████████░░░░░░░░░░ 50%   Step 3/6                              │ │
│  │ Generating service layer for user authentication                 │ │
│  │                                                                  │ │
│  │ ▼ Logs (Cmd+L to expand)                     [🔍 Search] [⤓ Save]│ │
│  │ ┌────────────────────────────────────────────────────────────┐  │ │
│  │ │ [12:45:32] Starting code generation                        │  │ │
│  │ │ [12:45:35] Analyzing Issue #270                            │  │ │
│  │ │ [12:45:40] Creating files:                                 │  │ │
│  │ │            • src/services/auth.service.ts                  │  │ │
│  │ │            • src/controllers/auth.controller.ts            │  │ │
│  │ │ [12:45:48] Running tests...                                │  │ │
│  │ │ [12:45:55] ✅ All tests passed (8/8)                        │  │ │
│  │ │ [12:46:02] Committing changes...                           │  │ │
│  │ │ [12:46:05] 🔄 Currently: Generating documentation           │  │ │
│  │ └────────────────────────────────────────────────────────────┘  │ │
│  │                                                                  │ │
│  │ • Issue: #270 - Implement user authentication                   │ │
│  │ • Duration: 8m 34s                                               │ │
│  │ • Files changed: 12                                              │ │
│  │ • Worktree: worktree-issue-270-codegen                           │ │
│  │                                                                  │ │
│  │ [Pause] [Cancel] [Show in Worktree] [Copy Logs]                 │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │ ReviewAgent (#271)                                     [− Collapse]│ │
│  │ ──────────────────────────────────────────────────────────────── │ │
│  │ ⏸️  Paused - Waiting for approval                                │ │
│  │                                                                  │ │
│  │ ▼ Review Summary                                                 │ │
│  │ ┌────────────────────────────────────────────────────────────┐  │ │
│  │ │ ✅ Code quality: 85/100                                     │  │ │
│  │ │ ⚠️  3 issues found:                                          │  │ │
│  │ │    1. Missing error handling in line 42                    │  │ │
│  │ │    2. Unused variable 'foo' in line 78                     │  │ │
│  │ │    3. Consider adding JSDoc comments                       │  │ │
│  │ │                                                            │  │ │
│  │ │ ✅ 2 issues auto-fixed:                                     │  │ │
│  │ │    • Formatted code with Prettier                          │  │ │
│  │ │    • Fixed linting errors (ESLint)                         │  │ │
│  │ └────────────────────────────────────────────────────────────┘  │ │
│  │                                                                  │ │
│  │ • Issue: #271 - Fix validation error in login form              │ │
│  │ • Duration: 5m 12s (paused 8 minutes ago)                       │ │
│  │ • Files reviewed: 3                                              │ │
│  │                                                                  │ │
│  │ [Approve & Continue] [Request Changes] [View PR] [View Diff]    │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │ ✅ DeploymentAgent (#269) - Completed                  [+ Expand]  │ │
│  │ ──────────────────────────────────────────────────────────────── │ │
│  │ ✅ Successfully deployed to production (12:30:45)                │ │
│  │                                                                  │ │
│  │ • Duration: 3m 45s                                               │ │
│  │ • Deployed to: Firebase (miyabi-prod)                            │ │
│  │ • URL: https://miyabi-prod.web.app                               │ │
│  │                                                                  │ │
│  │ [View Logs] [View Deployment] [Close]                            │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Component Breakdown

### 1. Header

**Elements**:
- **Title**: "🤖 Active Agents (X)" - count of running agents
- **Pause All**: Pause all running agents (confirm dialog)
- **Settings**: Agent notification settings, log level

**Styling**:
```css
.agent-monitor-header {
  padding: 24px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
```

---

### 2. Agent Progress Card

**Status Types**:
- 🔵 **Running**: Agent actively executing
- 🟡 **Paused**: Agent paused, awaiting user action
- ✅ **Completed**: Agent finished successfully
- ❌ **Failed**: Agent encountered error

**Card Structure**:

```typescript
interface AgentCardProps {
  agentType: string; // e.g., "CodeGenAgent"
  issueNumber: number;
  status: 'running' | 'paused' | 'completed' | 'failed';
  progress?: number; // 0-100, only for running
  currentStep?: string; // e.g., "Step 3/6: Generating service layer"
  logs: LogEntry[];
  metadata: {
    issue: string;
    duration: string;
    filesChanged?: number;
    worktree?: string;
    error?: string; // If failed
  };
  actions: Action[];
}
```

---

### 3. Progress Bar

**Visual**:
```
██████████░░░░░░░░░░ 50%   Step 3/6
```

**Segments**:
- **Filled**: Blue gradient (`--primary`)
- **Empty**: Gray (`--border`)
- **Percentage**: 16px font, semibold, right-aligned
- **Step**: 12px font, muted, below bar

**Styling**:
```css
.agent-progress {
  width: 100%;
  margin-bottom: 8px;
}

.agent-progress-bar {
  width: 100%;
  height: 12px;
  background: var(--border);
  border-radius: 6px;
  overflow: hidden;
  position: relative;
}

.agent-progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #1f6feb, #58a6ff);
  transition: width 0.5s ease;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}
```

---

### 4. Logs Panel

**Log Entry Structure**:
```typescript
interface LogEntry {
  timestamp: string; // e.g., "12:45:32"
  level: 'info' | 'warn' | 'error' | 'success'; // Log level
  message: string; // Log message
}
```

**Visual**:
```
[12:45:32] Starting code generation
[12:45:35] Analyzing Issue #270
[12:45:40] Creating files:
           • src/services/auth.service.ts
           • src/controllers/auth.controller.ts
[12:45:48] Running tests...
[12:45:55] ✅ All tests passed (8/8)
```

**Log Levels** (color-coded):
- `info`: White text
- `warn`: Yellow text (`--warning`)
- `error`: Red text (`--danger`)
- `success`: Green text (`--success`)

**Features**:
- **Auto-scroll**: Scrolls to bottom as new logs arrive (can disable by scrolling up)
- **Search**: `[🔍 Search]` - search logs (Cmd+F)
- **Save**: `[⤓ Save]` - save logs to file (text or JSON)
- **Copy**: Select text → right-click → Copy

**Styling**:
```css
.agent-logs {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px;
  max-height: 300px;
  overflow-y: auto;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  line-height: 1.6;
}

.agent-log-entry {
  display: flex;
  gap: 8px;
  margin-bottom: 4px;
}

.agent-log-timestamp {
  color: var(--foreground-muted);
  flex-shrink: 0;
}

.agent-log-message {
  color: var(--foreground);
  white-space: pre-wrap;
  word-break: break-word;
}

.agent-log-message.info { color: var(--foreground); }
.agent-log-message.warn { color: var(--warning); }
.agent-log-message.error { color: var(--danger); }
.agent-log-message.success { color: var(--success); }
```

---

### 5. Metadata

**Fields**:
- **Issue**: GitHub Issue number + title
- **Duration**: Time elapsed (e.g., "8m 34s")
- **Files changed**: Count (only for running/completed)
- **Worktree**: Worktree name (link to worktree view)
- **Error**: Error message (if failed)

**Example**:
```
• Issue: #270 - Implement user authentication
• Duration: 8m 34s
• Files changed: 12
• Worktree: worktree-issue-270-codegen
```

---

### 6. Actions

**Action Buttons** (vary by status):

| Status | Actions |
|--------|---------|
| **Running** | Pause, Cancel, Show in Worktree, Copy Logs |
| **Paused** | Approve & Continue, Request Changes, View PR, View Diff |
| **Completed** | View Logs, View Deployment, Close |
| **Failed** | View Logs, Retry, Debug, Cancel |

**Styling**:
```css
.agent-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

.agent-action-btn {
  padding: 8px 16px;
  font-size: 13px;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: transparent;
  color: var(--foreground);
  cursor: pointer;
  transition: all 0.2s ease;
}

.agent-action-btn:hover {
  background: var(--surface-hover);
  border-color: var(--primary);
}

.agent-action-btn.primary {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}

.agent-action-btn.danger {
  background: var(--danger);
  color: white;
  border-color: var(--danger);
}
```

---

## Interactions

### Pause Agent

**Flow**:
1. User clicks "Pause"
2. Show confirmation dialog: "Pause CodeGenAgent? Work can be resumed later."
3. If confirmed:
   - Send IPC: `pause-agent { executionId: "abc123" }`
   - Update UI: Progress bar → Paused state
   - Show "Resume" button

---

### Cancel Agent

**Flow**:
1. User clicks "Cancel"
2. Show confirmation dialog: "Cancel CodeGenAgent? This cannot be undone."
3. If confirmed:
   - Send IPC: `cancel-agent { executionId: "abc123" }`
   - Show cancellation progress (spinner)
   - Remove card when cancelled

---

### View Logs

**Flow**:
1. User clicks "View Logs"
2. Open modal with full logs (searchable, filterable by level)
3. Allow export as text/JSON

---

### Copy Logs

**Flow**:
1. User clicks "Copy Logs"
2. Copy all logs to clipboard (plaintext format)
3. Show toast notification: "Logs copied to clipboard"

---

## States

### Loading State (Fetching Agents)

**Skeleton**:
```
┌────────────────────────────────┐
│ 🤖 ███████████████             │
│ ──────────────────────────────│
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
└────────────────────────────────┘
```

---

### Empty State (No Active Agents)

```
┌─────────────────────────────────┐
│                                 │
│         🤖                      │
│                                 │
│    No Active Agents             │
│                                 │
│    Agents you start will appear │
│    here with real-time logs     │
│                                 │
│    [Run Agent on Issue]         │
│                                 │
└─────────────────────────────────┘
```

---

### Error State (Agent Failed)

**Card**:
```
┌────────────────────────────────────┐
│ ❌ CodeGenAgent (#270) - Failed     │
│ ────────────────────────────────── │
│ ❌ Error: Command timeout           │
│                                    │
│ ▼ Error Details                    │
│ ┌────────────────────────────────┐ │
│ │ TimeoutError: Command           │ │
│ │ 'cargo build' timed out after   │ │
│ │ 300 seconds                     │ │
│ │                                 │ │
│ │ Stack trace:                    │ │
│ │   at executeCommand (cli.ts:42) │ │
│ │   at runAgent (agent.ts:89)     │ │
│ └────────────────────────────────┘ │
│                                    │
│ [View Full Logs] [Retry] [Debug]   │
└────────────────────────────────────┘
```

---

## Data Flow

### Fetch Active Agents

```typescript
// src/renderer/hooks/useAgents.ts
import { useQuery } from '@tanstack/react-query';

export function useAgents() {
  return useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      return await window.electron.invoke('get-running-agents');
    },
    refetchInterval: 1000, // Poll every 1s for real-time updates
  });
}
```

---

### Stream Logs (WebSocket)

```typescript
// src/renderer/services/websocket.ts
export class WebSocketClient {
  private ws: WebSocket;

  connect() {
    this.ws = new WebSocket('ws://localhost:8080/ws');

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'agent-log') {
        this.handleAgentLog(message);
      }
    };
  }

  private handleAgentLog(message: any) {
    // Append log to agent card
    const { executionId, log } = message;
    // Update Zustand store or trigger React re-render
  }
}
```

---

### IPC Handlers

```typescript
// src/main/ipc-handlers.ts
ipcMain.handle('get-running-agents', async () => {
  // Read from .ai/agents/*.json
  return agents;
});

ipcMain.handle('pause-agent', async (event, { executionId }) => {
  // Send signal to agent process (SIGSTOP)
  return { success: true };
});

ipcMain.handle('cancel-agent', async (event, { executionId }) => {
  // Send signal to agent process (SIGTERM)
  return { success: true };
});
```

---

## Accessibility

### ARIA Labels

```html
<section aria-label="Active agents" role="region">
  <div role="list">
    <article
      role="listitem"
      aria-label="CodeGenAgent, Issue 270, 50% complete"
    >
      <div role="log" aria-live="polite" aria-atomic="false">
        <!-- Logs -->
      </div>
      <div role="group" aria-label="Agent actions">
        <button aria-label="Pause agent">Pause</button>
        <button aria-label="Cancel agent">Cancel</button>
      </div>
    </article>
  </div>
</section>
```

### Screen Reader

- Announce new logs (aria-live="polite")
- Announce progress updates ("50% complete")
- Announce state changes ("Agent paused", "Agent completed")

---

## Implementation Notes

### React Component

```typescript
// src/renderer/components/agent/AgentMonitor.tsx
export function AgentMonitor() {
  const { data: agents, isLoading } = useAgents();
  const { logs } = useWebSocketLogs(); // Subscribe to log stream

  if (isLoading) return <AgentSkeleton />;
  if (!agents?.length) return <AgentEmptyState />;

  return (
    <div className="agent-monitor">
      <AgentMonitorHeader count={agents.length} />
      <div className="agent-list">
        {agents.map((agent) => (
          <AgentCard
            key={agent.executionId}
            agent={agent}
            logs={logs[agent.executionId] || []}
          />
        ))}
      </div>
    </div>
  );
}
```

---

## Changelog

**v1.0.0** (2025-10-31):
- Initial agent monitor design
- Defined card structure, progress bar, logs panel
- Added pause/cancel/resume actions
- Specified WebSocket integration for real-time logs
