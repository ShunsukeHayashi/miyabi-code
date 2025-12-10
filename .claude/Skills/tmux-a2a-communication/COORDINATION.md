# tmux A2A Communication - Coordination Integration

**Skill**: tmux-a2a-communication
**Category**: Coordination (Core)
**Dependencies**: tmux-permanent-pane-targeting
**Dependents**: All tmux-based skills, miyabi-agent-orchestration

---

## Auto-Trigger Points

### Incoming Triggers
| From Skill | Trigger Condition | Action |
|------------|------------------|--------|
| miyabi-agent-orchestration | Agent assignment | Send task message |
| codex-danger-full-access | Progress update | Relay to conductor |
| All skills | Status report | Format and send |

### Outgoing Triggers
| To Skill | Trigger Condition | Signal |
|----------|------------------|--------|
| miyabi-agent-orchestration | Message received | `A2A_MESSAGE: {from, to, content}` |
| codex-danger-full-access | Task assignment | `A2A_TASK: {task_id, details}` |
| objective-observation-reporting | Communication error | `A2A_ERROR: {details}` |

---

## Resource Sharing

### Produces
```yaml
- type: message_delivery_status
  data:
    message_id: "msg-uuid"
    from: "%2"
    to: "%1"
    status: "delivered"
    timestamp: "2025-12-07T10:00:00Z"
```

### Consumes
```yaml
- type: pane_id
  from: tmux-permanent-pane-targeting
- type: agent_status
  from: miyabi-agent-orchestration
```

---

## Communication Protocol

### P0.2 Protocol (MANDATORY)
```bash
# Correct format - ALWAYS use this
tmux send-keys -t <PANE_ID> '<MESSAGE>' && sleep 0.5 && tmux send-keys -t <PANE_ID> Enter
```

### Message Format
```
[Agent] {Status}: {Details}
```

### Relay Format
```
[Sender->Receiver] {Action}: {Details}
```

### Status Types
| Status | Japanese | Meaning |
|--------|----------|---------|
| Complete | `完了` | Task finished |
| Working | `進行中` | In progress |
| Error | `エラー` | Failed |
| Waiting | `待機` | Waiting for dependency |
| Started | `開始` | Task begun |

---

## Chain Sequences

### Sequence: Task Assignment Flow
```
miyabi-agent-orchestration [Assign task]
    |
    v
tmux-a2a-communication [FORMAT message]
    |
    v
tmux-permanent-pane-targeting [GET pane ID]
    |
    v
[SEND via P0.2 protocol]
    |
    v
codex-danger-full-access [Receive task]
```

### Sequence: Progress Reporting Flow
```
codex-danger-full-access [Progress update]
    |
    v
tmux-a2a-communication [FORMAT report]
    |
    v
[SEND to conductor pane %1]
    |
    v
miyabi-agent-orchestration [Process update]
```

### Sequence: Error Escalation Flow
```
[Error in any pane]
    |
    v
tmux-a2a-communication [FORMAT error report]
    |
    v
[SEND to conductor]
    |
    v
objective-observation-reporting [Generate error report]
    |
    v
miyabi-session-recovery [If needed]
```

---

## PUSH Communication Rule (MANDATORY)

```
Worker agents proactively report to Conductor (%1):

DO:
- Report task started
- Report progress every 30s (for long tasks)
- Report task completed
- Report errors immediately

DON'T:
- Wait for conductor to ask for status (PULL)
- Skip progress reports
- Delay error reporting
```

---

## Momentum Multiplier

### Optimization 1: Batch Messaging
```bash
# Send to multiple panes efficiently
for pane in %2 %3 %4; do
    tmux send-keys -t $pane "[Broadcast] System update" && sleep 0.5 && tmux send-keys -t $pane Enter &
done
wait
```

### Optimization 2: Chunked Long Messages
```bash
# For messages > 200 chars
tmux_send_chunked() {
    local pane_id="$1"
    local message="$2"
    local chunk_size=200

    local i=0
    local len=${#message}

    while [ $i -lt $len ]; do
        local chunk="${message:$i:$chunk_size}"
        tmux send-keys -t "$pane_id" -l "$chunk"
        sleep 0.1
        ((i+=chunk_size))
    done
    sleep 0.3
    tmux send-keys -t "$pane_id" Enter
}
```

### Optimization 3: Reliable Delivery
```bash
# With confirmation
send_and_confirm() {
    local pane_id="$1"
    local message="$2"

    tmux send-keys -t $pane_id "$message" && sleep 0.5 && tmux send-keys -t $pane_id Enter
    sleep 1

    # Check if message received
    local output=$(tmux capture-pane -t $pane_id -p | tail -3)
    if echo "$output" | grep -q "ACK"; then
        return 0
    else
        return 1
    fi
}
```

---

## Integration with miyabi-a2a (Async)

### Hybrid Pattern
```bash
# For persistent, recoverable tasks
TASK_ID=$(miyabi a2a create --title "Critical fix" --task-type codegen --priority 5)

# Immediate notification
tmux send-keys -t %21 "Critical task: start immediately" && sleep 0.5 && tmux send-keys -t %21 Enter

# Update status
miyabi a2a update --id $TASK_ID --status working
```

---

## Monitoring

### Capture Pane Output
```bash
# Last 20 lines
tmux capture-pane -t %21 -p | tail -20

# Search for errors
tmux capture-pane -t %21 -p | grep -E "(error|Error|failed|panic)"
```

### Monitor All Panes
```bash
for pane in %1 %2 %3 %4 %5 %6; do
    echo "=== $pane ==="
    tmux capture-pane -t $pane -p | tail -5
done
```

---

## Health Check Integration

```bash
# Check communication health
check_a2a_health() {
    # Test message delivery
    local test_pane="%1"
    tmux send-keys -t $test_pane "[HEALTH_CHECK] $(date +%s)" && sleep 0.5 && tmux send-keys -t $test_pane Enter
    sleep 2

    local output=$(tmux capture-pane -t $test_pane -p | tail -5)
    if echo "$output" | grep -q "HEALTH_CHECK"; then
        echo "[A2A] HEALTH: OK"
        return 0
    else
        echo "[A2A] HEALTH: FAIL"
        return 1
    fi
}
```

---

## Perpetual Activation

### Auto-triggers
- Agent needs to communicate: Use A2A
- Status change: Report via A2A
- Error detected: Escalate via A2A
- Heartbeat interval: Send health check

### Continuous Communication Loop
```
[Agent operation]
    |
    v
[Status change?]
    |
    +--[Yes]--> tmux-a2a-communication [Send update]
    +--[No]--> [Continue operation]
    |
    v
[Loop]
```

### Reliability Guarantees
```
1. Always use permanent pane IDs (%N)
2. Always include sleep 0.5 after send-keys
3. Always send Enter separately
4. Chunk long messages (>200 chars)
5. Confirm delivery for critical messages
```
