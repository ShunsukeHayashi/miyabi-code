# Mission Control API Documentation

## Overview

Mission Control API provides a unified interface for monitoring and controlling the Miyabi autonomous development system. It aggregates data from multiple subsystems including agents, TMUX sessions, timeline events, preflight checks, and worktrees.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Mission Control API                       │
│                      (/api/mission-control)                  │
└────────────┬────────────────────────────────────────────────┘
             │
             ├── /api/agents          (Agent metadata & status)
             ├── /api/tmux            (TMUX session management)
             ├── /api/timeline        (Execution timeline)
             ├── /api/preflight       (Environment checks)
             └── /api/worktrees       (Git worktree status)
```

## Endpoints

### Mission Control

#### GET /api/mission-control

Returns aggregated status from all subsystems.

**Response:**
```json
{
  "status": "healthy" | "degraded" | "unhealthy",
  "agents": {
    "total_agents": 21,
    "coding_agents": 7,
    "business_agents": 14,
    "idle_agents": 18,
    "running_agents": 3
  },
  "tmux": {
    "active_sessions": 2,
    "total_windows": 7,
    "total_panes": 15,
    "assigned_panes": 8
  },
  "timeline": {
    "total_events": 1247,
    "recent_events_count": 100,
    "running_tasks": 5,
    "idle_tasks": 3,
    "failed_tasks": 0
  },
  "preflight": {
    "status": "healthy",
    "passed_checks": 4,
    "failed_checks": 0,
    "total_checks": 4
  },
  "worktrees": {
    "active_worktrees": 5,
    "total_branches": 5
  },
  "timestamp": "2025-11-05T12:34:56.789Z"
}
```

#### GET /api/mission-control/detailed

Returns aggregated status with full details from all subsystems.

**Response:**
```json
{
  "summary": { /* Same as /api/mission-control */ },
  "agents_detail": { /* Full agent list from /api/agents */ },
  "tmux_detail": { /* Full TMUX session data */ },
  "timeline_detail": { /* Timeline events */ },
  "preflight_detail": { /* Preflight check details */ },
  "worktrees_detail": { /* Worktree details */ }
}
```

### TMUX Management

#### GET /api/tmux/sessions

Returns list of all TMUX sessions with windows and panes.

**Response:**
```json
{
  "sessions": [
    {
      "name": "miyabi-orchestra",
      "windows": [
        {
          "id": "@1",
          "name": "coordinator",
          "panes": [
            {
              "id": "%0",
              "index": 0,
              "active": true,
              "agent": "CoordinatorAgent",
              "pwd": "/Users/shunsuke/Dev/miyabi-private",
              "command": "claude"
            }
          ],
          "active": true
        }
      ],
      "created_at": "2025-11-05T10:00:00Z",
      "attached": true
    }
  ],
  "total_count": 1
}
```

#### GET /api/tmux/sessions/:session_name

Returns detailed information for a specific TMUX session.

#### POST /api/tmux/send-command

Sends a command to a specific TMUX pane.

**Query Parameters:**
- `pane` (required): Target pane ID (e.g., "miyabi-orchestra:1.0")
- `command` (required): Command to send

**Safety:** Only whitelisted commands are allowed:
- `miyabi`
- `cargo`
- `git`
- `ls`
- `pwd`
- `cd`
- `echo`

**Response:**
```json
{
  "success": true,
  "message": "Command sent to pane miyabi-orchestra:1.0"
}
```

#### POST /api/tmux/sessions/:session_name/kill

Kills a specific TMUX session.

**Response:**
```json
{
  "success": true,
  "message": "Session 'miyabi-orchestra' killed successfully"
}
```

### Agents

#### GET /api/agents

Returns list of all 21 Miyabi agents (7 Coding + 14 Business).

**Response:**
```json
{
  "agents": [
    {
      "name": "CoordinatorAgent",
      "type": "Coding",
      "status": "idle",
      "capabilities": ["task_planning", "dag_scheduling", "parallel_execution"],
      "current_task": null,
      "tmux_pane": null
    }
    /* ... 20 more agents ... */
  ]
}
```

#### GET /api/agents/:agent_name

Returns status for a specific agent.

#### POST /api/agents/:agent_type/execute

Executes a specific agent type.

**Request Body:**
```json
{
  "issue_number": 755,
  "task_id": "task-001"
}
```

### Preflight Checks

#### GET /api/preflight

Performs environment and system validation checks.

**Response:**
```json
{
  "status": "healthy" | "degraded" | "unhealthy",
  "checks": [
    {
      "name": "github_token",
      "status": "pass" | "fail",
      "message": "GITHUB_TOKEN environment variable is set"
    },
    {
      "name": "gh_auth",
      "status": "pass" | "fail",
      "message": "gh CLI is authenticated"
    },
    {
      "name": "logs_directory",
      "status": "pass" | "fail",
      "message": ".ai/logs directory exists at: /path/to/logs"
    }
  ],
  "timestamp": "2025-11-05T12:34:56.789Z"
}
```

### Timeline

#### GET /api/timeline

Returns execution timeline events from conductor logs.

**Query Parameters:**
- `window` (optional, default: 100): Number of recent events to return

**Response:**
```json
{
  "summary": {
    "total_events": 1247,
    "run_count": 5,
    "idle_count": 3,
    "dead_count": 0
  },
  "recent_events": [
    {
      "timestamp": "2025-11-05T12:34:56.789Z",
      "agent": "CoordinatorAgent",
      "state": "RUN",
      "task": "Issue #755"
    }
  ],
  "window_size": 100
}
```

### Worktrees

#### GET /api/worktrees

Returns list of all Git worktrees.

**Response:**
```json
{
  "worktrees": [
    {
      "id": "wt-001",
      "path": "/Users/shunsuke/Dev/miyabi-private/.worktrees/issue-755",
      "branch": "issue-755-mission-control-interface",
      "status": "Active",
      "issue_number": 755,
      "agent_type": "CoordinatorAgent",
      "created_at": "2025-11-05T10:00:00Z",
      "updated_at": "2025-11-05T12:34:56Z"
    }
  ],
  "total": 1
}
```

## System Health Status

The overall system health is determined by the following logic:

1. **Unhealthy**: Critical preflight checks failed (GITHUB_TOKEN or gh_auth)
2. **Degraded**: Non-critical checks failed OR timeline has failed tasks
3. **Healthy**: All checks passed AND no failed tasks

## Usage Examples

### Using curl

```bash
# Get Mission Control status
curl http://localhost:3000/api/v1/mission-control

# Get detailed status
curl http://localhost:3000/api/v1/mission-control/detailed

# List TMUX sessions
curl http://localhost:3000/api/v1/tmux/sessions

# Send command to TMUX pane
curl -X POST 'http://localhost:3000/api/v1/tmux/send-command?pane=miyabi-orchestra:1.0&command=miyabi%20status'

# Run preflight checks
curl http://localhost:3000/api/v1/preflight

# Get timeline
curl http://localhost:3000/api/v1/timeline?window=50
```

### Using JavaScript/TypeScript

```typescript
// Get Mission Control status
const response = await fetch('/api/v1/mission-control');
const status = await response.json();

if (status.status === 'healthy') {
  console.log('System is healthy');
} else if (status.status === 'degraded') {
  console.warn('System is degraded');
} else {
  console.error('System is unhealthy');
}

// Get detailed status with polling
async function pollMissionControl() {
  const response = await fetch('/api/v1/mission-control/detailed');
  const data = await response.json();

  updateUI(data);

  // Poll every 5 seconds
  setTimeout(pollMissionControl, 5000);
}
```

## Integration with Web UI

### Dashboard Components

The Mission Control API is designed to power the following UI components:

1. **Agent Board**: Displays all 21 agents with their status, current tasks, and capabilities
2. **TMUX Session View**: Shows active sessions, windows, panes, and assigned agents
3. **Timeline View**: Real-time event stream from conductor logs
4. **Preflight Panel**: System health checks with pass/fail indicators
5. **Worktree Manager**: Active worktrees with branch and agent information

### Real-time Updates

For real-time updates, implement polling or WebSocket connection:

```typescript
// Polling approach (simple)
setInterval(async () => {
  const response = await fetch('/api/v1/mission-control');
  const status = await response.json();
  updateDashboard(status);
}, 5000); // Update every 5 seconds

// WebSocket approach (future implementation)
const ws = new WebSocket('ws://localhost:3000/api/v1/ws/mission-control');
ws.onmessage = (event) => {
  const status = JSON.parse(event.data);
  updateDashboard(status);
};
```

## Security Considerations

### TMUX Command Safety

The `/api/tmux/send-command` endpoint implements a whitelist of safe commands to prevent unauthorized system access:

- Only commands starting with `miyabi`, `cargo`, `git`, `ls`, `pwd`, `cd`, `echo` are allowed
- Destructive commands (e.g., `rm`, `sudo`) are blocked
- Command execution is limited to TMUX panes only

### Future RBAC Implementation

The API is designed to support Role-Based Access Control (RBAC):

- **Viewer**: Read-only access to all endpoints
- **Operator**: Can send commands to TMUX panes, trigger preflight checks
- **Master**: Full access including session management, agent execution

## Testing

Run integration tests:

```bash
cargo test --package miyabi-web-api --test mission_control_integration
```

## Related Documentation

- [Mission Control POC](mission-control-poc.md)
- [AGENTS.md](../AGENTS.md)
- [TMUX_OPERATIONS.md](../.claude/TMUX_OPERATIONS.md)
- [Entity Relation Model](ENTITY_RELATION_MODEL.md)

## Changelog

### v1.0.0 (2025-11-05)

- Initial implementation of Mission Control API
- TMUX session management endpoints
- Agent metadata endpoints
- Preflight checks endpoint
- Timeline endpoint
- Worktrees endpoint
- Integration tests

## Future Enhancements

1. **WebSocket/SSE Real-time Updates**: Replace polling with push-based updates
2. **RBAC Implementation**: Add role-based access control
3. **Notification System**: Integrate with Slack/GitHub for alerts
4. **Tauri Desktop App**: Native desktop application wrapper
5. **Advanced Metrics**: Historical data, trends, performance metrics
6. **Agent Control**: Start, stop, restart agents via API
7. **Worktree Operations**: Create, delete, merge worktrees
8. **Timeline Filters**: Filter by agent, state, time range
