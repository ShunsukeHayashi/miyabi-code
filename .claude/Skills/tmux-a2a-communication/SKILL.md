---
name: tmux-a2a-communication
description: Agent-to-Agent communication protocol using tmux send-keys (sync) and miyabi-a2a (async). Use this skill when orchestrating multiple agents across tmux panes, sending inter-agent messages, managing distributed task execution, or coordinating workflows between AI agents. Triggers include "send message to agent", "notify pane", "broadcast", "A2A task", "agent communication", "PUSH to conductor".
context: fork
hooks:
  PreToolUse:
    - validate_target_pane
    - check_agent_ready
  PostToolUse:
    - log_message_sent
    - update_communication_log
  Stop:
    - generate_communication_summary
---

# tmux A2A Communication Protocol

Unified protocol for Agent-to-Agent (A2A) communication in multi-agent tmux environments.

## Claude Code 2.1.0 Enhancements

### Fork Context for Message Handling
Messages processed in isolated context to prevent conversation pollution:
```yaml
context: fork
```

### Communication Hooks
Automated logging and validation:
- `PreToolUse`: Validate target pane before sending
- `PostToolUse`: Log all messages for audit trail
- `Stop`: Generate communication summary

### Wildcard Permissions for tmux
```json
{
  "permissions": {
    "bash": ["Bash(tmux *)"]
  }
}
```

## Communication Channels

**tmux send-keys (Synchronous)**
- Real-time, immediate execution
- Use for: urgent tasks, interactive operations, simple commands, debugging

**miyabi-a2a (Asynchronous)**
- Persistent, recoverable after restart
- Use for: audit trails, multi-agent coordination, retryable tasks, structured workflows

## P0.2 Protocol (MANDATORY)

Always use this exact format for tmux communication:

```bash
tmux send-keys -t <PANE_ID> '<MESSAGE>' && sleep 0.5 && tmux send-keys -t <PANE_ID> Enter
```

**Critical rules:**
- `sleep 0.5` is REQUIRED for message stability
- Use single quotes for messages
- Send `Enter` as separate command

## Hook Implementations

### PreToolUse: Validate Target
```javascript
async function validate_target_pane(context) {
  const paneId = context.targetPane;
  
  // Check pane exists
  const exists = await exec(`tmux list-panes -F "#{pane_id}" | grep -q "${paneId}"`);
  if (!exists) throw new Error(`Pane ${paneId} not found`);
  
  // Check pane is responsive
  const busy = await exec(`tmux display -t ${paneId} -p "#{pane_current_command}"`);
  if (busy === 'blocked') throw new Error(`Pane ${paneId} is blocked`);
}
```

### PostToolUse: Log Message
```javascript
async function log_message_sent(context, result) {
  await appendLog({
    timestamp: new Date().toISOString(),
    sender: context.senderAgent,
    receiver: context.targetPane,
    message: context.message,
    success: result.success,
    latency: result.duration
  });
}
```

### Stop: Generate Summary
```javascript
async function generate_communication_summary(context) {
  const logs = await getCommunicationLogs(context.sessionId);
  return {
    totalMessages: logs.length,
    successRate: calculateSuccessRate(logs),
    topAgents: getTopCommunicators(logs),
    timeline: generateTimeline(logs)
  };
}
```

## Message Formats

### Standard Report
```
[Agent名] {Status}: {Detail}
```

**Status types:**
- `完了` / `Complete`: Task finished
- `進行中` / `Working`: In progress
- `エラー` / `Error`: Failed
- `待機` / `Waiting`: Waiting for dependency
- `開始` / `Started`: Task begun

### Relay Format (Agent-to-Agent)
```
[Sender→Receiver] {Action}: {Detail}
```

Examples:
```bash
# Report to Conductor
tmux send-keys -t %18 '[カエデ] 実装完了' && sleep 0.5 && tmux send-keys -t %18 Enter

# Relay between agents
tmux send-keys -t %18 '[カエデ→サクラ] レビュー依頼: Issue #270' && sleep 0.5 && tmux send-keys -t %18 Enter
```

## PUSH Communication Rule

```
✅ PUSH (Required): Worker → Conductor
   Agents proactively report to Conductor pane

❌ PULL (Forbidden): Conductor → Worker
   Never poll workers for status
```

## miyabi-a2a Commands

### Create Task
```bash
miyabi a2a create --title "Task name" --task-type codegen --priority 4 --context "feature-x"
```

**Task types:** codegen, review, testing, deployment, documentation, analysis
**Priority:** 0-5 (5=critical)

### List/Get Tasks
```bash
miyabi a2a list --status submitted
miyabi a2a get --id 123
```

### Update Status
```bash
miyabi a2a update --id 123 --status working
miyabi a2a update --id 123 --status completed
```

**Status lifecycle:** submitted → working → completed/failed/cancelled

## Hybrid Pattern with Hooks

Combine A2A persistence with tmux immediacy and hook automation:

```bash
# 1. Create persistent task (logged by PostToolUse hook)
TASK_ID=$(miyabi a2a create --title "Critical fix" --task-type codegen --priority 5)

# 2. Immediate tmux notification (validated by PreToolUse hook)
tmux send-keys -t %21 "Critical task: start immediately" && sleep 0.5 && tmux send-keys -t %21 Enter

# 3. Update status (tracked by hooks)
miyabi a2a update --id $TASK_ID --status working

# 4. Summary generated on Stop hook
```

## Monitoring

### Capture pane output
```bash
tmux capture-pane -t %21 -p | tail -20
```

### Check all panes
```bash
for pane in %18 %19 %20 %21 %22 %23; do
  echo "=== $pane ==="
  tmux capture-pane -t $pane -p | tail -5
done
```

### Search for errors
```bash
tmux capture-pane -t %21 -p | grep -E "(error|Error|failed|panic)"
```

## Broadcast Messages (2.1.0)

### Broadcast to All Agents
```bash
# Define agent panes
AGENTS=(%18 %19 %20 %21 %22 %23)

# Broadcast message
for pane in "${AGENTS[@]}"; do
  tmux send-keys -t $pane '[Conductor] 全エージェント: 新タスク開始' && sleep 0.5 && tmux send-keys -t $pane Enter
done
```

### Selective Broadcast
```bash
# Broadcast to CodeGen agents only
CODEGEN_PANES=(%19 %20 %21)
for pane in "${CODEGEN_PANES[@]}"; do
  tmux send-keys -t $pane '[Conductor] CodeGen: 優先度変更' && sleep 0.5 && tmux send-keys -t $pane Enter
done
```

## Background Processing (2.1.0)

### Ctrl+B for Message Queue
```bash
# Start message processor in background
Ctrl+B

# Continue with other tasks
# Messages processed in parallel
```

## Best Practices

1. **Always use fork context** for message handling
2. **Define PreToolUse hooks** to validate targets
3. **Log all messages** via PostToolUse hooks
4. **Generate summaries** with Stop hooks
5. Use PUSH communication (workers report to conductor)
6. Include sleep 0.5 after tmux send-keys
7. Use structured message formats
8. Monitor pane status before sending
9. Use wildcard permissions for tmux commands

## Quick Reference

### Message Template
```bash
tmux send-keys -t <PANE> '<MESSAGE>' && sleep 0.5 && tmux send-keys -t <PANE> Enter
```

### Hook Template
```yaml
hooks:
  PreToolUse:
    - validate_target_pane
  PostToolUse:
    - log_message_sent
  Stop:
    - generate_communication_summary
```

For message templates, see `references/message-templates.md`.
For complete scripts, see `scripts/` directory.
