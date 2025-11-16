# Miyabi tmux + A2A Hybrid Architecture
**Version**: 1.0.0
**Last Updated**: 2025-11-04
**Status**: Production Ready

## 🎯 Overview

This document defines the hybrid communication architecture for Miyabi's multi-agent orchestration system, combining:
- **tmux send-keys**: Real-time, synchronous command execution
- **miyabi-a2a**: Persistent, asynchronous task queue via GitHub Issues

### Key Principles

1. **Dual-Channel Communication**: Use both tmux and A2A based on task characteristics
2. **Persistence First**: A2A provides audit trail and recovery
3. **Real-time When Needed**: tmux for urgent, interactive tasks
4. **GitHub as Source of Truth**: All structured tasks stored as Issues

---

## 📊 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Miyabi Orchestrator                       │
│                  (Main Control Pane)                         │
└─────────┬───────────────────────────────────┬───────────────┘
          │                                   │
          ▼                                   ▼
┌─────────────────────┐           ┌─────────────────────────┐
│   tmux send-keys    │           │     miyabi-a2a          │
│  (Synchronous)      │           │   (Asynchronous)        │
└──────┬──────────────┘           └──────┬──────────────────┘
       │                                 │
       │  "Execute now!"                 │  "Task #123"
       │                                 │
       ▼                                 ▼
┌─────────────────────┐           ┌─────────────────────────┐
│  Agent Pane %2      │◄─────────►│  GitHub Issues          │
│  (Claude Code)      │  Polling  │  (Persistent Queue)     │
└─────────────────────┘           └─────────────────────────┘
       │                                 │
       │  Result (stdout)                │  Update Status
       │                                 │
       ▼                                 ▼
┌─────────────────────────────────────────────────────────────┐
│                    Execution Report                          │
│                  (Aggregated Results)                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔀 Decision Matrix: tmux vs A2A

### Use tmux send-keys when:
- ✅ **Urgency**: Task must start immediately
- ✅ **Interactive**: Requires real-time user feedback
- ✅ **Simple**: One-shot commands (e.g., "/clear", restart)
- ✅ **Stateless**: No need to track execution history
- ✅ **Debugging**: Manual intervention during development

**Examples**:
```bash
# Clear agent context
tmux send-keys -t %2 "/clear" && sleep 0.5 && tmux send-keys -t %2 Enter

# Emergency stop
tmux send-keys -t %3 "Ctrl-C を送信" && sleep 0.5 && tmux send-keys -t %3 Enter
```

### Use miyabi-a2a when:
- ✅ **Persistence**: Task must survive crashes/restarts
- ✅ **Audit Trail**: Need historical record
- ✅ **Coordination**: Multiple agents working on related tasks
- ✅ **Async**: Task can be processed later
- ✅ **Structured**: Well-defined input/output
- ✅ **Retry**: Task may need multiple attempts

**Examples**:
```bash
# Create persistent code generation task
miyabi a2a create \
  --title "Implement user authentication" \
  --task-type codegen \
  --context "feature-auth" \
  --description "Add JWT-based authentication to API"

# Agent polls for tasks
miyabi a2a list --status submitted --context "feature-auth"
```

---

## 🏗️ Implementation Patterns

### Pattern 1: Hybrid Urgent + Persistent

**Scenario**: Start urgent task now, but keep persistent record

```bash
#!/bin/bash
# Create A2A task first (for audit trail)
TASK_ID=$(miyabi a2a create \
  --title "Fix critical bug #500" \
  --task-type codegen \
  --context "hotfix" \
  --priority 5 | grep "Task ID:" | awk '{print $3}')

# Immediately notify agent via tmux
tmux send-keys -t %2 "Critical task created: #${TASK_ID}. Start immediately!" \
  && sleep 0.5 && tmux send-keys -t %2 Enter

# Update task status
miyabi a2a update --id $TASK_ID --status working
```

### Pattern 2: Agent Polling Loop

**Scenario**: Agent continuously checks for new tasks

```bash
#!/bin/bash
# Agent-side polling script (runs in tmux pane)
while true; do
  # Fetch new submitted tasks
  TASKS=$(miyabi a2a list --status submitted --limit 1 --context "my-context")

  if [ -n "$TASKS" ]; then
    TASK_ID=$(echo "$TASKS" | grep "ID:" | head -1 | awk '{print $2}')

    # Claim task
    miyabi a2a update --id $TASK_ID --status working

    # Execute task (simplified)
    echo "Working on task #${TASK_ID}..."
    # ... actual work ...

    # Mark complete
    miyabi a2a update --id $TASK_ID --status completed
  fi

  sleep 5  # Poll every 5 seconds
done
```

### Pattern 3: Webhook-Driven (Future)

**Scenario**: GitHub webhook triggers tmux notification

```yaml
# .github/workflows/a2a-webhook.yml
name: A2A Task Notification
on:
  issues:
    types: [opened, labeled]

jobs:
  notify-agent:
    if: contains(github.event.issue.labels.*.name, 'a2a:submitted')
    runs-on: ubuntu-latest
    steps:
      - name: Notify tmux pane
        run: |
          # Send notification to tmux session (requires remote access)
          ssh agent-host "tmux send-keys -t %2 'New task: #${{ github.event.issue.number }}' && sleep 0.5 && tmux send-keys -t %2 Enter"
```

### Pattern 4: Context-Based Routing

**Scenario**: Different agents handle different contexts

```bash
#!/bin/bash
# Orchestrator distributes tasks by context

# CodeGen tasks → Pane %2
CODEGEN_TASKS=$(miyabi a2a list --status submitted --context "codegen" --limit 10)
if [ -n "$CODEGEN_TASKS" ]; then
  tmux send-keys -t %2 "Process codegen queue" && sleep 0.5 && tmux send-keys -t %2 Enter
fi

# Review tasks → Pane %3
REVIEW_TASKS=$(miyabi a2a list --status submitted --context "review" --limit 10)
if [ -n "$REVIEW_TASKS" ]; then
  tmux send-keys -t %3 "Process review queue" && sleep 0.5 && tmux send-keys -t %3 Enter
fi

# Deployment tasks → Pane %4
DEPLOY_TASKS=$(miyabi a2a list --status submitted --context "deployment" --limit 10)
if [ -n "$DEPLOY_TASKS" ]; then
  tmux send-keys -t %4 "Process deployment queue" && sleep 0.5 && tmux send-keys -t %4 Enter
fi
```

---

## 📋 Task Lifecycle

### 1. Task Creation
```bash
# Orchestrator creates task
TASK_ID=$(miyabi a2a create \
  --title "Feature: Add dark mode" \
  --task-type codegen \
  --context "feature-darkmode" \
  --description "Implement dark mode toggle in settings" \
  --priority 3 | grep "Task ID:" | awk '{print $3}')

echo "Created task #${TASK_ID}"
```

### 2. Task Assignment (via tmux)
```bash
# Notify specific agent
tmux send-keys -t %2 "New task assigned: #${TASK_ID}" \
  && sleep 0.5 && tmux send-keys -t %2 Enter
```

### 3. Task Execution
```bash
# Agent claims task
miyabi a2a update --id $TASK_ID --status working

# Agent works on task
# ... implementation ...

# Agent completes task
miyabi a2a update --id $TASK_ID --status completed
```

### 4. Task Monitoring
```bash
# Check task status
miyabi a2a get --id $TASK_ID

# List all active tasks
miyabi a2a list --status working
```

---

## 🎨 Best Practices

### 1. Context Naming Convention
```
<category>-<feature>-<component>

Examples:
- feature-auth-jwt
- bugfix-login-validation
- refactor-api-routes
- test-integration-auth
```

### 2. Priority Guidelines
```
Priority 5: Critical (hotfix, production down)
Priority 4: High (blocking issue)
Priority 3: Normal (feature development)
Priority 2: Low (nice-to-have)
Priority 1: Minimal (cleanup, documentation)
Priority 0: Backlog
```

### 3. Status Transitions
```
submitted → working → completed
           ↓
         failed → submitted (retry)
           ↓
        cancelled
```

### 4. Error Handling
```bash
# Retry failed tasks (max 3 attempts)
FAILED_TASKS=$(miyabi a2a list --status failed)
for TASK_ID in $FAILED_TASKS; do
  RETRY_COUNT=$(miyabi a2a get --id $TASK_ID | grep "Retries:" | awk '{print $2}')

  if [ $RETRY_COUNT -lt 3 ]; then
    echo "Retrying task #${TASK_ID} (attempt $((RETRY_COUNT + 1)))"
    miyabi a2a update --id $TASK_ID --status submitted
  else
    echo "Task #${TASK_ID} exceeded max retries, cancelling"
    miyabi a2a update --id $TASK_ID --status cancelled
  fi
done
```

### 5. Cleanup Strategy
```bash
# Archive completed tasks older than 7 days
WEEK_AGO=$(date -u -d '7 days ago' +%Y-%m-%dT%H:%M:%SZ)
COMPLETED_TASKS=$(miyabi a2a list --status completed)

for TASK_ID in $COMPLETED_TASKS; do
  UPDATED=$(miyabi a2a get --id $TASK_ID | grep "Updated:" | cut -d' ' -f4-)

  if [[ "$UPDATED" < "$WEEK_AGO" ]]; then
    echo "Archiving task #${TASK_ID}"
    miyabi a2a delete --id $TASK_ID
  fi
done
```

---

## 🚀 Quick Start Examples

### Example 1: Single Task Workflow
```bash
#!/bin/bash
# Create task
TASK_ID=$(miyabi a2a create \
  --title "Add user profile page" \
  --task-type codegen \
  --context "feature-profile" \
  -d "Create user profile page with avatar, bio, and stats" \
  --priority 3 | grep "Task ID:" | awk '{print $3}')

# Assign to agent pane %2
tmux send-keys -t %2 "Work on task #${TASK_ID}" && sleep 0.5 && tmux send-keys -t %2 Enter

# Monitor progress
watch -n 5 "miyabi a2a get --id ${TASK_ID}"
```

### Example 2: Batch Task Processing
```bash
#!/bin/bash
# Create multiple related tasks
for FEATURE in "authentication" "authorization" "session-management"; do
  miyabi a2a create \
    --title "Implement ${FEATURE}" \
    --task-type codegen \
    --context "feature-auth" \
    --priority 3
done

# Notify agent
tmux send-keys -t %2 "Process auth feature queue (3 tasks)" \
  && sleep 0.5 && tmux send-keys -t %2 Enter
```

### Example 3: Multi-Agent Coordination
```bash
#!/bin/bash
# Orchestrator assigns tasks to different agents

# Agent 1 (CodeGen) - Pane %2
CODEGEN_ID=$(miyabi a2a create --title "Implement API endpoints" --task-type codegen --context "api" | grep "Task ID:" | awk '{print $3}')
tmux send-keys -t %2 "Task #${CODEGEN_ID}" && sleep 0.5 && tmux send-keys -t %2 Enter

# Agent 2 (Review) - Pane %3
REVIEW_ID=$(miyabi a2a create --title "Review API implementation" --task-type review --context "api" | grep "Task ID:" | awk '{print $3}')
tmux send-keys -t %3 "Task #${REVIEW_ID}" && sleep 0.5 && tmux send-keys -t %3 Enter

# Agent 3 (Testing) - Pane %4
TEST_ID=$(miyabi a2a create --title "Write API integration tests" --task-type testing --context "api" | grep "Task ID:" | awk '{print $3}')
tmux send-keys -t %4 "Task #${TASK_ID}" && sleep 0.5 && tmux send-keys -t %4 Enter

# Wait for all to complete
while true; do
  STATUS1=$(miyabi a2a get --id $CODEGEN_ID | grep "Status:" | awk '{print $2}')
  STATUS2=$(miyabi a2a get --id $REVIEW_ID | grep "Status:" | awk '{print $2}')
  STATUS3=$(miyabi a2a get --id $TEST_ID | grep "Status:" | awk '{print $2}')

  if [[ "$STATUS1" == "Completed" ]] && [[ "$STATUS2" == "Completed" ]] && [[ "$STATUS3" == "Completed" ]]; then
    echo "All tasks completed!"
    break
  fi

  sleep 10
done
```

---

## 🔧 Configuration

### Environment Variables
```bash
# Required for miyabi a2a commands
export GITHUB_TOKEN="ghp_xxxxx"
export GITHUB_REPOSITORY="customer-cloud/miyabi-private"

# Optional: Custom A2A settings
export A2A_POLL_INTERVAL=5  # seconds
export A2A_MAX_RETRIES=3
export A2A_CLEANUP_DAYS=7
```

### Repository Labels (Required)
Ensure these labels exist in your GitHub repository:

**Status Labels**:
- `a2a:submitted` - Task awaiting processing
- `a2a:working` - Task currently being worked on
- `a2a:completed` - Task successfully completed
- `a2a:failed` - Task failed with errors
- `a2a:cancelled` - Task cancelled by user

**Type Labels**:
- `a2a:codegen` - Code generation task
- `a2a:review` - Code review task
- `a2a:testing` - Testing task
- `a2a:deployment` - Deployment task
- `a2a:documentation` - Documentation task
- `a2a:analysis` - Analysis task

Create labels with:
```bash
gh label create "a2a:submitted" --description "A2A: Task submitted" --color "0E8A16"
# ... (see installation section)
```

---

## 📈 Monitoring & Metrics

### Dashboard Script
```bash
#!/bin/bash
# a2a-dashboard.sh - Real-time A2A task dashboard

while true; do
  clear
  echo "=== Miyabi A2A Dashboard ==="
  echo "Updated: $(date)"
  echo ""

  echo "📊 Task Summary:"
  SUBMITTED=$(miyabi a2a list --status submitted | grep -c "ID:")
  WORKING=$(miyabi a2a list --status working | grep -c "ID:")
  COMPLETED=$(miyabi a2a list --status completed | grep -c "ID:")
  FAILED=$(miyabi a2a list --status failed | grep -c "ID:")

  echo "  Submitted:  $SUBMITTED"
  echo "  Working:    $WORKING"
  echo "  Completed:  $COMPLETED"
  echo "  Failed:     $FAILED"
  echo ""

  echo "🔥 Active Tasks:"
  miyabi a2a list --status working --limit 5

  sleep 5
done
```

---

## 🔐 Security Considerations

1. **GitHub Token Scope**: Use fine-grained tokens with `repo` scope only
2. **Webhook Authentication**: Use HMAC-SHA256 for webhook verification (implemented in miyabi-a2a)
3. **Sensitive Data**: Never include secrets in task descriptions
4. **Rate Limiting**: Respect GitHub API limits (5,000 requests/hour)

---

## 🚧 Limitations & Future Work

### Current Limitations
- **Polling Overhead**: Agents poll GitHub API (300-500ms latency)
- **Rate Limits**: 5,000 GitHub API requests/hour
- **No Built-in Priority Queue**: Tasks processed FIFO within same status

### Planned Enhancements
- **Webhook Push Notifications**: Real-time task assignment (Issue #276)
- **Priority-based Scheduling**: Process high-priority tasks first
- **Task Dependencies**: DAG-based task execution (similar to Workflow DSL)
- **Agent Health Monitoring**: Track agent availability and performance

---

## 📚 Related Documentation

- [TMUX_OPERATIONS.md](.claude/TMUX_OPERATIONS.md) - tmux command reference
- [MIYABI_PARALLEL_ORCHESTRA.md](.claude/MIYABI_PARALLEL_ORCHESTRA.md) - Multi-agent philosophy
- [miyabi-a2a README](../crates/miyabi-a2a/README.md) - A2A crate documentation

---

## 📝 Changelog

### v1.0.0 (2025-11-04)
- Initial hybrid architecture design
- CLI implementation (`miyabi a2a` commands)
- Integration patterns and best practices
- Production-ready examples

---

**Maintained by**: Miyabi Team
**Questions?**: Create an issue with label `component:a2a`
