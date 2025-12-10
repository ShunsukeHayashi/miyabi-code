---
name: miyabi-agent-orchestration
description: Orchestrate multiple Miyabi AI agents for complex task execution. Use when coordinating しきるん (Conductor), カエデ (CodeGen), サクラ (Review), ツバキ (PR), ボタン (Deploy) agents. Triggers include "orchestrate agents", "coordinate task", "multi-agent workflow", "parallel execution", "agent pipeline", or when a task requires multiple specialized agents working together.
---

# Miyabi Agent Orchestration

Coordinate multiple specialized AI agents for complex software development workflows.

## Agent Registry

| Agent | Japanese | Role | Pane |
|-------|----------|------|------|
| Conductor | しきるん | Task coordination, workflow management | %1 |
| CodeGen | カエデ | Code generation, implementation | %2-4 |
| Review | サクラ | Code review, quality assurance | %5 |
| PR | ツバキ | Pull request management | %6 |
| Deploy | ボタン | Deployment operations | %7 |
| Issue | みつけるん | Issue analysis, task breakdown | %8 |

## Orchestration Patterns

### Sequential Pipeline
```
Issue → CodeGen → Review → PR → Deploy
```

### Parallel Execution (T-MAX)
```
         ┌→ CodeGen-1 (feature-a) ─┐
Issue →  ├→ CodeGen-2 (feature-b) ─┼→ Review → PR → Deploy
         └→ CodeGen-3 (feature-c) ─┘
```

### Review Loop
```
CodeGen → Review → [Pass] → PR
              ↓
          [Fail] → CodeGen (fix)
```

## Communication Protocol

### PUSH-Type (Required)
Workers proactively report to Conductor (%1):
```bash
tmux send-keys -t miyabi-orchestra:%1 "TASK_COMPLETE: issue-123" Enter
sleep 0.5
```

### Message Format
```
[AGENT_NAME] [STATUS]: [DETAILS]
Example: [カエデ] COMPLETE: issue-123 implementation finished
```

## Workflow Execution

### 1. Task Initialization
```bash
# Conductor receives task
tmux send-keys -t miyabi-orchestra:%1 "START: Issue #123 - Feature X" Enter
```

### 2. Agent Assignment
```python
assignments = {
    "issue-123": {"agent": "カエデ", "pane": "%2", "worktree": "feature/issue-123"},
    "issue-124": {"agent": "カエデ", "pane": "%3", "worktree": "feature/issue-124"}
}
```

### 3. Progress Monitoring
```bash
# Check agent status
tmux capture-pane -t miyabi-orchestra:%2 -p | tail -20
```

### 4. Result Aggregation
Conductor collects all agent reports and generates summary.

## Error Handling

### Agent Timeout
If no response in 5 minutes:
1. Check pane status
2. Send heartbeat request
3. Escalate to Guardian if unresponsive

### Task Failure
1. Log failure details
2. Notify Conductor
3. Trigger retry or escalate

## Best Practices

1. Always use PUSH communication (workers report to conductor)
2. Include sleep 0.5 after tmux send-keys
3. Use structured message formats
4. Monitor resource usage during parallel execution
5. Aggregate results before reporting to Guardian
