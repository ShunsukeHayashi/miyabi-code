---
name: miyabi-session-recovery
description: Recover and restore Miyabi tmux sessions after crashes or disconnections. Use when sessions are lost, agents are unresponsive, or system needs restoration. Triggers include "recover session", "restore tmux", "session crashed", "agent unresponsive", "rebuild environment", or after system restart.
---

# Miyabi Session Recovery

Procedures to recover tmux sessions, agents, and development environment.

## Quick Diagnosis

### Check Session Status
```bash
# List all sessions
tmux list-sessions

# Expected sessions
# miyabi: 8 windows
# miyabi-orchestra: 2 windows
# miyabi-reconstruction: 6 windows
# miyabi-apex-deploy: 4 windows
```

### Check MCP Servers
```bash
# Via MCP tool
miyabi-claude-code:claude_mcp_status

# Manual check
ps aux | grep -E "mcp|miyabi" | grep -v grep
```

## Recovery Procedures

### Level 1: Session Detached
```bash
# Reattach to existing session
tmux attach -t miyabi

# If multiple clients
tmux attach -t miyabi -d
```

### Level 2: Pane Unresponsive
```bash
# Kill specific pane
tmux kill-pane -t miyabi:0.2

# Recreate pane
tmux split-window -t miyabi:0

# Restart agent in pane
tmux send-keys -t miyabi:0.2 "codex -s danger-full-access" Enter
```

### Level 3: Window Lost
```bash
# Create new window
tmux new-window -t miyabi -n "codegen"

# Setup panes
tmux split-window -h -t miyabi:codegen
tmux split-window -v -t miyabi:codegen
```

### Level 4: Session Lost
```bash
# Recreate session
tmux new-session -d -s miyabi -n main

# Add windows
tmux new-window -t miyabi -n codegen
tmux new-window -t miyabi -n review
tmux new-window -t miyabi -n deploy
# ... continue for all windows
```

### Level 5: Full Environment Rebuild
```bash
# 1. Kill all miyabi sessions
tmux kill-server

# 2. Start fresh
tmux new-session -d -s miyabi -n main

# 3. Run setup script
~/repos/miyabi/scripts/setup-tmux.sh

# 4. Start MCP servers
cd ~/repos/miyabi && npm run mcp:start

# 5. Verify
tmux list-sessions
```

## Session Templates

### miyabi (Main Development)
```
Window 0: main       - Guardian interaction
Window 1: codegen-1  - CodeGen Agent 1
Window 2: codegen-2  - CodeGen Agent 2
Window 3: codegen-3  - CodeGen Agent 3
Window 4: review     - Review Agent
Window 5: pr         - PR Agent
Window 6: deploy     - Deploy Agent
Window 7: monitor    - System monitoring
```

### miyabi-orchestra
```
Window 0: conductor  - Conductor Agent (しきるん)
Window 1: workers    - Worker status dashboard
```

## Agent Restart Commands

### CodeGen Agent (カエデ)
```bash
tmux send-keys -t miyabi:codegen-1 "cd ~/repos/miyabi && codex -s danger-full-access" Enter
sleep 0.5
```

### Review Agent (サクラ)
```bash
tmux send-keys -t miyabi:review "cd ~/repos/miyabi && claude --dangerously-skip-permissions" Enter
sleep 0.5
```

### Conductor (しきるん)
```bash
tmux send-keys -t miyabi-orchestra:conductor "cd ~/repos/miyabi && ./scripts/conductor.sh" Enter
sleep 0.5
```

## Health Check Script

```bash
#!/bin/bash
# health-check.sh

echo "=== Miyabi Health Check ==="

# Sessions
echo -n "Sessions: "
tmux list-sessions 2>/dev/null | wc -l

# MCP Servers
echo -n "MCP Servers: "
ps aux | grep -c "mcp"

# Memory
echo -n "Memory Available: "
free -h | awk '/Mem:/ {print $7}'

# Disk
echo -n "Disk Free: "
df -h ~ | awk 'NR==2 {print $4}'

echo "==========================="
```

## Best Practices

1. Run health check before starting work
2. Save session layouts with tmux-resurrect
3. Keep recovery scripts in ~/scripts/
4. Document custom session configurations
5. Test recovery procedures periodically
