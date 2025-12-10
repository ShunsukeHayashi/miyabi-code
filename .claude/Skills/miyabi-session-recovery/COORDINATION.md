# Miyabi Session Recovery - Coordination Integration

**Skill**: miyabi-session-recovery
**Category**: Coordination (Recovery)
**Dependencies**: All coordination skills
**Dependents**: All skills (recovery provider)

---

## Auto-Trigger Points

### Incoming Triggers
| From Skill | Trigger Condition | Action |
|------------|------------------|--------|
| tmux-a2a-communication | Agent unresponsive | Check and recover pane |
| miyabi-agent-orchestration | Agent timeout | Restart agent |
| codex-danger-full-access | Session crash | Restore session |
| aws-ec2-management | Instance failure | Coordinate infrastructure recovery |

### Outgoing Triggers
| To Skill | Trigger Condition | Signal |
|----------|------------------|--------|
| All coordination skills | Recovery complete | `RECOVERY_COMPLETE: {level}` |
| miyabi-agent-orchestration | Agents restored | `RECOVERY_AGENTS_READY` |
| objective-observation-reporting | Recovery summary | `RECOVERY_REPORT: {details}` |

---

## Resource Sharing

### Produces
```yaml
- type: recovery_status
  data:
    level: "L2_session"
    affected: ["pane_%2", "pane_%3"]
    restored: true
    duration: "45s"
- type: session_snapshot
  data:
    sessions: ["miyabi", "miyabi-orchestra"]
    windows: 12
    panes: 24
```

### Consumes
```yaml
- type: health_status
  from: All skills
- type: error_report
  from: objective-observation-reporting
```

---

## Communication Protocol

### Status Report Format
```
[RECOVERY] {LEVEL}: {action} - {details}
```

### Examples
```bash
# Report recovery start
tmux send-keys -t %1 '[RECOVERY] L2_SESSION: Starting pane restoration' && sleep 0.5 && tmux send-keys -t %1 Enter

# Report completion
tmux send-keys -t %1 '[RECOVERY] COMPLETE: All agents restored' && sleep 0.5 && tmux send-keys -t %1 Enter
```

---

## Recovery Levels

### Level 1: Pane Recovery
```
[Single pane unresponsive]
    |
    v
tmux kill-pane -t %X
    |
    v
tmux split-window -t miyabi:0
    |
    v
[Restart agent in new pane]
    |
    v
tmux-permanent-pane-targeting [Update pane ID]
```

### Level 2: Session Recovery
```
[Multiple panes affected]
    |
    v
[Save session state]
    |
    v
tmux kill-window -t miyabi:affected
    |
    v
[Recreate window with panes]
    |
    v
[Restart all agents]
    |
    v
miyabi-agent-orchestration [Re-assign tasks]
```

### Level 3: Full Session Recovery
```
[Session lost]
    |
    v
tmux new-session -d -s miyabi -n main
    |
    v
[Recreate all windows]
    |
    v
[Run setup script]
    |
    v
[Start MCP servers]
    |
    v
[Restore agent assignments]
```

### Level 4: Infrastructure Recovery
```
[Server/instance failure]
    |
    v
aws-ec2-management [Restart instance]
    |
    v
[Wait for instance ready]
    |
    v
[SSH and run recovery script]
    |
    v
[Full session recovery]
```

---

## Chain Sequences

### Sequence: Agent Crash Recovery
```
[Agent crash detected via tmux-a2a]
    |
    v
miyabi-session-recovery [START]
    |
    v
[Assess damage level]
    |
    +--[L1: Single pane]--> Pane recovery
    +--[L2: Session]--> Session recovery
    +--[L3: Full]--> Full recovery
    |
    v
[Recovery complete]
    |
    v
miyabi-agent-orchestration [Re-establish orchestration]
    |
    v
objective-observation-reporting [Generate recovery report]
```

### Sequence: Proactive Health Check
```
[Scheduled health check]
    |
    v
miyabi-session-recovery [Check all components]
    |
    +---> Check tmux sessions
    +---> Check MCP servers
    +---> Check agent panes
    +---> Check resources
    |
    v
[Any issues found?]
    |
    +--[Yes]--> Trigger appropriate recovery level
    +--[No]--> [HEALTH_OK]
```

---

## Momentum Multiplier

### Optimization 1: Fast Recovery
```
[Minimize downtime]
- Pre-configured session templates
- Cached agent configurations
- Parallel pane restoration

Recovery time targets:
- L1: < 10s
- L2: < 30s
- L3: < 60s
- L4: < 5min
```

### Optimization 2: State Preservation
```bash
# Regular snapshots
tmux-resurrect save
# Enables instant session restore
```

### Optimization 3: Auto-Recovery
```
[Error detected]
    |
    v
[Automatic recovery attempt]
    |
    +--[Success]--> Continue operation
    +--[Fail]--> Escalate to Guardian
```

---

## Health Check Integration

### Comprehensive Check Script
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

# Agent panes
echo "Agent Status:"
for pane in %1 %2 %3 %4 %5; do
    status=$(tmux capture-pane -t $pane -p 2>/dev/null | tail -1)
    echo "  $pane: ${status:0:50}..."
done

echo "==========================="
```

---

## Error Patterns

### Common Errors and Recovery
| Error | Indicator | Recovery Action |
|-------|-----------|-----------------|
| Pane unresponsive | No output > 5min | L1: Pane recovery |
| Session detached | tmux ls shows detached | Reattach |
| Session crashed | Session not found | L3: Full recovery |
| MCP server down | MCP status fail | Restart MCP servers |
| Agent loop | Repeated same output | Kill and restart agent |

---

## Perpetual Activation

### Auto-triggers
- Agent timeout detected: Start recovery
- Health check failure: Start recovery
- System restart: Full environment check
- Error logged: Assess and recover

### Continuous Monitoring
```
[Background health monitor]
    |
    +---> Check every 60s
    +---> Log status
    +---> Trigger recovery if needed
    |
    v
[Loop continuously]
```

### Self-Healing Ecosystem
```
[Any skill fails]
    |
    v
objective-observation-reporting [Log error]
    |
    v
miyabi-session-recovery [Assess and recover]
    |
    v
[All skills restored]
    |
    v
[Continue normal operation]
```
