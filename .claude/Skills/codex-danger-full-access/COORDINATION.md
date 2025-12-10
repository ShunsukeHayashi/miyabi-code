# Codex Danger Full Access - Coordination Integration

**Skill**: codex-danger-full-access
**Category**: Infrastructure (Autonomous Execution)
**Dependencies**: tmux-a2a-communication, tmux-permanent-pane-targeting
**Dependents**: miyabi-agent-orchestration, miyabi-worktree-management

---

## Auto-Trigger Points

### Incoming Triggers
| From Skill | Trigger Condition | Action |
|------------|------------------|--------|
| miyabi-agent-orchestration | Agent assignment | Start codex in pane |
| miyabi-worktree-management | Worktree ready | Execute in worktree |
| tmux-a2a-communication | Task message | Process task |

### Outgoing Triggers
| To Skill | Trigger Condition | Signal |
|----------|------------------|--------|
| tmux-a2a-communication | Task progress | `CODEX_PROGRESS: {%}` |
| miyabi-agent-orchestration | Task complete | `CODEX_COMPLETE: {result}` |
| objective-observation-reporting | Error/warning | `CODEX_ERROR: {details}` |

---

## Resource Sharing

### Produces
```yaml
- type: code_changes
  data:
    files_modified: ["file1.rs", "file2.rs"]
    lines_added: 150
    lines_removed: 30
- type: execution_log
  data:
    session_id: "uuid"
    duration: "5m30s"
    cost: "$0.15"
```

### Consumes
```yaml
- type: pane_id
  from: tmux-permanent-pane-targeting
- type: worktree_path
  from: miyabi-worktree-management
- type: task_assignment
  from: miyabi-agent-orchestration
```

---

## Communication Protocol

### Status Report Format
```
[CODEX] {STATUS}: {task_id} - {details}
```

### Examples
```bash
# Report progress to conductor
tmux send-keys -t %1 '[CODEX] PROGRESS: issue-123 - 60% complete' && sleep 0.5 && tmux send-keys -t %1 Enter

# Report completion
tmux send-keys -t %1 '[CODEX] COMPLETE: issue-123 - Implementation finished' && sleep 0.5 && tmux send-keys -t %1 Enter

# Report error
tmux send-keys -t %1 '[CODEX] ERROR: issue-123 - Build failed' && sleep 0.5 && tmux send-keys -t %1 Enter
```

---

## Chain Sequences

### Sequence: Autonomous Task Execution
```
miyabi-agent-orchestration [ASSIGN: agent to task]
    |
    v
tmux-permanent-pane-targeting [GET: pane ID]
    |
    v
miyabi-worktree-management [CREATE: worktree]
    |
    v
codex-danger-full-access [START]
    |
    +---> [Execute task autonomously]
    +---> [SIGNAL: CODEX_PROGRESS every 30s]
    |
    v
tmux-a2a-communication [SIGNAL: CODEX_COMPLETE]
    |
    v
miyabi-agent-orchestration [Next task]
```

### Sequence: Parallel Multi-Agent
```
miyabi-agent-orchestration [ASSIGN: 3 tasks]
    |
    +---> codex-danger-full-access [Pane %2] - Task A
    +---> codex-danger-full-access [Pane %3] - Task B
    +---> codex-danger-full-access [Pane %4] - Task C
    |
    v
[All complete: SIGNAL to orchestration]
```

---

## Momentum Multiplier

### Optimization 1: T-MAX Parallel Execution
```bash
# Launch N parallel codex instances
for pane in %2 %3 %4; do
    tmux send-keys -t $pane "codex -s danger-full-access 'task'" && sleep 0.5 && tmux send-keys -t $pane Enter &
done
wait
# Multiplier: Nx throughput
```

### Optimization 2: Session Persistence
```bash
# Resume instead of restart
codex -s danger-full-access --resume
# Saves context rebuild time
```

### Optimization 3: Pre-loaded Context
```bash
# Use CLAUDE.md for project context
codex -s danger-full-access -C /path/to/project
# Faster task understanding
```

---

## Health Check Integration

```bash
# Monitor codex pane health
check_codex_health() {
    local pane_id="$1"
    local output=$(tmux capture-pane -t $pane_id -p | tail -5)

    if echo "$output" | grep -qE "(error|Error|panic|PANIC)"; then
        echo "[CODEX] HEALTH_FAIL: $pane_id"
        # Trigger recovery
        return 1
    fi
    return 0
}
```

---

## Safety Integration

### Pre-execution Checks
```bash
# Before danger mode
1. Verify worktree (isolated environment)
2. Verify git branch (not main)
3. Create snapshot if needed
```

### Post-execution Checks
```bash
# After completion
1. Review changes: git diff
2. Run tests: cargo test
3. Report to objective-observation-reporting
```

---

## Perpetual Activation

### Auto-triggers
- Agent assigned to task: Start execution
- Task in queue: Process next
- Session ended: Auto-restart with queue

### Self-healing
```
[Codex crash detected]
    |
    v
miyabi-session-recovery [RESTART]
    |
    v
codex-danger-full-access [RESUME]
    |
    v
tmux-a2a-communication [SIGNAL: CODEX_RECOVERED]
```
