# Miyabi Agent Orchestration - Coordination Integration

**Skill**: miyabi-agent-orchestration
**Category**: Coordination (Core)
**Dependencies**: tmux-a2a-communication, tmux-permanent-pane-targeting, tmux-multiagent-messaging
**Dependents**: All agent-related skills

---

## Auto-Trigger Points

### Incoming Triggers
| From Skill | Trigger Condition | Action |
|------------|------------------|--------|
| tmux-a2a-communication | Task message received | Assign to agent |
| miyabi-worktree-management | Worktree created | Assign CodeGen agent |
| codex-danger-full-access | Task complete | Assign next task |
| miyabi-session-recovery | Session restored | Re-assign agents |

### Outgoing Triggers
| To Skill | Trigger Condition | Signal |
|----------|------------------|--------|
| codex-danger-full-access | Agent assigned | `ORCH_ASSIGN: {agent, pane, task}` |
| tmux-a2a-communication | Status update | `ORCH_STATUS: {agents}` |
| miyabi-worktree-management | New task | `ORCH_WORKTREE_REQ: {issue}` |
| objective-observation-reporting | Pipeline complete | `ORCH_COMPLETE: {summary}` |

---

## Resource Sharing

### Produces
```yaml
- type: agent_assignment
  data:
    agent: "CodeGen"
    pane_id: "%2"
    task: "issue-123"
    worktree: "/path/to/worktree"
- type: orchestration_status
  data:
    active_agents: 4
    tasks_pending: 3
    tasks_complete: 12
```

### Consumes
```yaml
- type: pane_id
  from: tmux-permanent-pane-targeting
- type: worktree_path
  from: miyabi-worktree-management
- type: task_completion
  from: codex-danger-full-access
```

---

## Communication Protocol

### Status Report Format
```
[ORCH] {STATUS}: {details}
```

### Agent Assignment Format
```
[ORCH->Agent] ASSIGN: {task_id} in pane {pane_id}
```

### Examples
```bash
# Assign task to CodeGen
tmux send-keys -t %2 '[ORCH] ASSIGN: issue-123 - Implement feature X' && sleep 0.5 && tmux send-keys -t %2 Enter

# Report orchestration status
tmux send-keys -t %1 '[ORCH] STATUS: 3 agents active, 2 tasks pending' && sleep 0.5 && tmux send-keys -t %1 Enter
```

---

## Chain Sequences

### Sequence: Issue to PR Pipeline
```
[Issue received]
    |
    v
miyabi-agent-orchestration [START]
    |
    +---> miyabi-worktree-management [CREATE worktree]
    |
    v
tmux-permanent-pane-targeting [GET pane ID]
    |
    v
[ASSIGN: CodeGen agent]
    |
    v
codex-danger-full-access [Execute in pane]
    |
    +---> [Progress reports via tmux-a2a]
    |
    v
[Task complete: SIGNAL to orchestration]
    |
    v
[ASSIGN: Review agent]
    |
    v
[Review complete: SIGNAL to orchestration]
    |
    v
[ASSIGN: PR agent]
    |
    v
objective-observation-reporting [SIGNAL: PIPELINE_COMPLETE]
```

### Sequence: Parallel Execution (T-MAX)
```
miyabi-agent-orchestration [Receive multiple issues]
    |
    +---> Issue 1 -> CodeGen %2 -> Worktree A
    +---> Issue 2 -> CodeGen %3 -> Worktree B
    +---> Issue 3 -> CodeGen %4 -> Worktree C
    |
    v
[All parallel: tmux-a2a-communication coordinates]
    |
    v
[All complete: Aggregate results]
    |
    v
Review Agent [Sequential review of all]
```

---

## Momentum Multiplier

### Optimization 1: T-MAX Parallel Agents
```
# Maximum parallelization
N issues -> N worktrees -> N panes -> N concurrent agents
Multiplier: N times throughput (limited by resources)
```

### Optimization 2: Pipeline Overlap
```
Issue 1: [CodeGen]----[Review]--[PR]
Issue 2:     [CodeGen]----[Review]--[PR]
Issue 3:         [CodeGen]----[Review]--[PR]
# Overlapped execution for continuous throughput
```

### Optimization 3: Smart Agent Routing
```
[High priority issue] -> Experienced agent (longer sessions)
[Simple fix] -> Quick agent
[Documentation] -> Doc-specialized agent
```

---

## Agent Registry

### Standard Configuration
```yaml
agents:
  conductor:
    name: "Shikiroon"
    pane: "%1"
    role: "Task coordination"
    priority: P0

  codegen:
    - name: "Kaede"
      pane: "%2"
      role: "Code generation"
      parallel: true
    - name: "Kaede-2"
      pane: "%3"
      role: "Code generation"
      parallel: true
    - name: "Kaede-3"
      pane: "%4"
      role: "Code generation"
      parallel: true

  review:
    name: "Sakura"
    pane: "%5"
    role: "Code review"
    parallel: false

  pr:
    name: "Tsubaki"
    pane: "%6"
    role: "PR management"
    parallel: false

  deploy:
    name: "Botan"
    pane: "%7"
    role: "Deployment"
    parallel: false
```

---

## Health Check Integration

```bash
# Monitor all agents
check_orchestration_health() {
    local panes=(%1 %2 %3 %4 %5 %6 %7)
    for pane in "${panes[@]}"; do
        local status=$(tmux capture-pane -t $pane -p | tail -1)
        if echo "$status" | grep -qE "(error|crash|unresponsive)"; then
            echo "[ORCH] HEALTH_FAIL: $pane"
            # Trigger recovery
        fi
    done
}
```

### Agent Heartbeat
```bash
# Request heartbeat from all agents
for pane in %2 %3 %4 %5; do
    tmux send-keys -t $pane 'echo "[HEARTBEAT] $(date +%s)"' && sleep 0.5 && tmux send-keys -t $pane Enter
done
```

---

## Error Handling

### Agent Timeout
```
[No response in 5 minutes]
    |
    v
miyabi-agent-orchestration [TIMEOUT detected]
    |
    +---> Check pane status
    +---> Send heartbeat request
    |
    +--[Unresponsive]--> miyabi-session-recovery [SIGNAL: AGENT_FAILED]
    +--[Responsive]--> Resume monitoring
```

### Task Failure
```
[Agent reports failure]
    |
    v
miyabi-agent-orchestration [FAILURE handling]
    |
    +---> Log failure details
    +---> objective-observation-reporting [SIGNAL: TASK_FAILED]
    |
    +--[Retriable]--> Re-assign task
    +--[Fatal]--> Escalate to Guardian
```

---

## Perpetual Activation

### Auto-triggers
- New issue in queue: Assign agent
- Agent idle: Assign next task
- Agent complete: Assign next task or mark idle
- Session recovered: Re-establish assignments

### PUSH Communication Rule (Mandatory)
```
Worker agents proactively report to Conductor (%1):
- Task started
- Progress updates (every 30s for long tasks)
- Task completed
- Errors encountered

NEVER poll workers for status (PULL is forbidden)
```

### Continuous Loop
```
[Initialize orchestration]
    |
    v
[Monitor agent status]
    |
    +--[Task complete]--> Assign next task
    +--[New issue]--> Create worktree -> Assign agent
    +--[Agent idle]--> Check queue -> Assign if available
    +--[Error]--> Handle error -> Continue
    |
    v
[Loop back to monitor]
```
