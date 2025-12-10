---
name: tmux-a2a-communication
description: Agent-to-Agent communication protocol using tmux send-keys (sync) and miyabi-a2a (async). Use this skill when orchestrating multiple agents across tmux panes, sending inter-agent messages, managing distributed task execution, or coordinating workflows between AI agents. Triggers include "send message to agent", "notify pane", "broadcast", "A2A task", "agent communication", "PUSH to conductor".
---

# tmux A2A Communication Protocol

Unified protocol for Agent-to-Agent (A2A) communication in multi-agent tmux environments.

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

## Hybrid Pattern

Combine A2A persistence with tmux immediacy:

```bash
# 1. Create persistent task
TASK_ID=$(miyabi a2a create --title "Critical fix" --task-type codegen --priority 5)

# 2. Immediate tmux notification
tmux send-keys -t %21 "Critical task: start immediately" && sleep 0.5 && tmux send-keys -t %21 Enter

# 3. Update status
miyabi a2a update --id $TASK_ID --status working
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

## Quick Reference

For message templates, see `references/message-templates.md`.
For complete scripts, see `scripts/` directory.
