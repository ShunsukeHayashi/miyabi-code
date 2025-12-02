# AntiGravity Agent Orchestra - Pane Mapping
# Session: miyabi-orchestra
# Updated: 2025-12-02

## Active Agents

| Agent | Japanese | Pane ID | Status |
|-------|----------|---------|--------|
| Coordinator | しきろーん | %18 | ✅ Active |
| CodeGen | つくろーん | %20 | ✅ Active |
| Review | めだまん | %19 | ✅ Active |
| PR | まとめろーん | %21 | ✅ Active |
| Deployment | はこぼーん | %23 | ✅ Active |
| Issue | みつけろーん | %22 | ✅ Active |

## Communication Protocol

### Send Message to Agent
```bash
# Via MCP
miyabi-tmux:tmux_send_message(pane_id="%18", message="YOUR_MESSAGE")

# Via tmux directly
tmux send-keys -t miyabi-orchestra:%18 "YOUR_MESSAGE" Enter
```

### Broadcast to All
```bash
miyabi-tmux:tmux_broadcast(message="BROADCAST_MESSAGE", from_source="Conductor")
```

### Capture Agent Output
```bash
miyabi-tmux:tmux_pane_capture(pane_id="%18", lines=50)
```

## Agent Responsibilities

### Coordinator (%18)
- Task distribution
- Progress monitoring
- Agent coordination

### CodeGen (%20)
- Code generation
- Test creation
- Documentation

### Review (%19)
- Code review
- Security checks
- Quality assurance

### PR (%21)
- PR creation
- Review requests
- Merge management

### Deployment (%23)
- Build execution
- Deploy automation
- Rollback handling

### Issue (%22)
- Issue creation
- Label management
- Priority tracking

## Quick Reference

```bash
# Check all panes
tmux list-panes -t miyabi-orchestra -F "#{pane_id}: #{pane_current_command}"

# Attach to session
tmux attach -t miyabi-orchestra

# Select specific pane
tmux select-pane -t miyabi-orchestra:%18
```
