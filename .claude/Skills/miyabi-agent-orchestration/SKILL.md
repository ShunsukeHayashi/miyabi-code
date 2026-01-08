---
name: miyabi-agent-orchestration
description: Orchestrate multiple Miyabi AI agents for complex task execution. Use when coordinating しきるん (Conductor), カエデ (CodeGen), サクラ (Review), ツバキ (PR), ボタン (Deploy) agents. Triggers include "orchestrate agents", "coordinate task", "multi-agent workflow", "parallel execution", "agent pipeline", or when a task requires multiple specialized agents working together.
context: fork
agent: conductor
hooks:
  PreToolUse:
    - validate_agent_availability
    - check_pane_status
  PostToolUse:
    - log_execution_result
    - update_task_status
  Stop:
    - aggregate_results
    - notify_guardian
---

# Miyabi Agent Orchestration

Coordinate multiple specialized AI agents for complex software development workflows.

## Claude Code 2.1.0 Enhanced Features

### Fork Context Mode
This skill runs in **isolated fork context** to prevent main conversation pollution:
- Sub-agent execution doesn't affect main context
- Clean separation between orchestration and execution
- Automatic context cleanup after completion

### Agent-Level Selection
Skills can specify target agent type:
```yaml
agent: conductor  # Run on conductor agent
# Options: conductor, codegen, review, pr, deploy
```

### Hook Automation
Lifecycle hooks for refined automation:
- `PreToolUse`: Validate before execution
- `PostToolUse`: Log and update after execution
- `Stop`: Aggregate and cleanup on completion

## Agent Registry

| Agent | Japanese | Role | Pane | Agent Type |
|-------|----------|------|------|------------|
| Conductor | しきるん | Task coordination, workflow management | %1 | conductor |
| CodeGen | カエデ | Code generation, implementation | %2-4 | codegen |
| Review | サクラ | Code review, quality assurance | %5 | review |
| PR | ツバキ | Pull request management | %6 | pr |
| Deploy | ボタン | Deployment operations | %7 | deploy |
| Issue | みつけるん | Issue analysis, task breakdown | %8 | analysis |

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

### Review Loop with Auto-Retry (2.1.0)
```
CodeGen → Review → [Pass] → PR
              ↓
          [Fail] → CodeGen (auto-continue)
                   ↑
                   └─ Auto-continuation on token limit
```

## Fork Context Execution

### Spawn Sub-Agent in Fork
```yaml
# In skill frontmatter
context: fork
agent: codegen
```

### Manual Fork Creation
```bash
# Create isolated context for parallel tasks
claude /context fork --name "feature-implementation"
```

### Fork Lifecycle
1. Fork created from main context
2. Sub-agent executes in isolation
3. Results returned to main context
4. Fork automatically cleaned up

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

## Hook Definitions

### PreToolUse Hook
```javascript
// Validate agent availability before execution
async function validate_agent_availability(context) {
  const pane = context.targetPane;
  const status = await checkPaneStatus(pane);
  if (status !== 'ready') {
    throw new Error(`Agent at ${pane} not ready`);
  }
}
```

### PostToolUse Hook
```javascript
// Log execution result
async function log_execution_result(context, result) {
  await logToMiyabi({
    agent: context.agent,
    task: context.taskId,
    result: result.success ? 'success' : 'failure',
    duration: result.duration
  });
}
```

### Stop Hook
```javascript
// Aggregate all results on completion
async function aggregate_results(context) {
  const results = await collectAllAgentResults();
  await notifyGuardian({
    summary: results.summary,
    details: results.agents
  });
}
```

## Workflow Execution

### 1. Task Initialization with Fork
```bash
# Conductor receives task in forked context
claude /context fork --execute "START: Issue #123 - Feature X"
```

### 2. Agent Assignment with Type
```python
assignments = {
    "issue-123": {
        "agent": "カエデ",
        "agent_type": "codegen",
        "pane": "%2",
        "worktree": "feature/issue-123",
        "context": "fork"
    }
}
```

### 3. Progress Monitoring with Auto-Continue
```bash
# Check agent status (auto-continues on token limit)
tmux capture-pane -t miyabi-orchestra:%2 -p | tail -20
```

### 4. Result Aggregation via Hooks
Results automatically aggregated by Stop hook.

## Wildcard Permissions (2.1.0)

Configure flexible bash permissions:
```json
{
  "permissions": {
    "bash": [
      "Bash(npm *)",
      "Bash(git *)",
      "Bash(tmux *)",
      "Bash(miyabi *)"
    ]
  }
}
```

## Error Handling

### Agent Timeout
If no response in 5 minutes:
1. Check pane status (PreToolUse hook)
2. Send heartbeat request
3. Escalate to Guardian (Stop hook)

### Auto-Continuation on Token Limit
Claude Code 2.1.0 automatically continues generation when response is cut off.

### Task Failure
1. Log failure details (PostToolUse hook)
2. Notify Conductor
3. Trigger retry or escalate

## Best Practices

1. Use `context: fork` for isolated sub-agent execution
2. Define hooks for automation patterns
3. Always use PUSH communication (workers report to conductor)
4. Include sleep 0.5 after tmux send-keys
5. Use structured message formats
6. Monitor resource usage during parallel execution
7. Leverage auto-continuation for long tasks
8. Use wildcard permissions to reduce prompt fatigue

## Related Skills

- `tmux-a2a-communication`: Message protocols
- `codex-danger-full-access`: Full autonomy mode
- `miyabi-session-recovery`: Session restoration
