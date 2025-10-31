# Claude Code Hooks - Miyabi Project

**Status**: ✅ Active
**Version**: v3.0.0 (Orchestrator Pattern)
**Last Updated**: 2025-10-31

---

## 📋 Overview

This directory contains Claude Code hooks for:
1. **Orchestrator Pattern** - Automated worktree creation for Sub-Agent execution (NEW)
2. **VOICEVOX Real-time Narration** - Audio feedback for operations
3. **Worktree Automation** - Manual worktree lifecycle management
4. **Session Management** - Keep-alive and session tracking
5. **Code Quality** - Auto-formatting and validation

---

## 🎯 Available Hooks

### 1. Orchestrator Pattern (NEW - v3.0.0)

**Architecture**:
```
Main Session (Orchestrator) - stays in main branch
    │
    ├─ User: "Use CodeGenAgent to implement feature X"
    │   └─ PreToolUse(Task) Hook → Create worktree
    │
    ├─ Task tool launches CodeGenAgent
    │   └─ CodeGenAgent executes in worktree
    │   └─ CodeGenAgent commits changes
    │
    └─ PostToolUse(Task) Hook → Cleanup worktree
```

**Scripts**:
- `agent-worktree-pre.sh` - PreToolUse(Task) hook - Creates worktree before Sub-Agent execution
- `agent-worktree-post.sh` - PostToolUse(Task) hook - Cleans up worktree after Sub-Agent completion
- `worktree-manager.sh` - Core worktree lifecycle functions (updated with Orchestrator support)

**Triggers**:
- **PreToolUse(Task)**: Automatically creates worktree when Task tool is invoked
- **PostToolUse(Task)**: Automatically cleans up worktree after Task tool completes

**Features**:
- Main session stays in main branch (Orchestrator never enters worktree)
- Each Sub-Agent gets its own isolated worktree
- Automatic worktree naming: `{subagent-type}-issue-{num}-{timestamp}` or `{subagent-type}-{timestamp}`
- Agent context tracking (`.agent-context.json`)
- Automatic merge to main after successful execution
- Safety checks: prevents nested worktrees, checks for uncommitted changes
- VOICEVOX notifications for worktree lifecycle events
- Logs all operations to `.ai/logs/agent-worktrees-YYYY-MM-DD.log`

**Usage** (Automatic - via hooks):
```bash
# Main session (Orchestrator) stays in main
# User: "Use CodeGenAgent to implement feature X for Issue #123"
# → PreToolUse(Task) hook automatically creates worktree
# → Task tool launches CodeGenAgent in worktree
# → CodeGenAgent executes, commits changes
# → PostToolUse(Task) hook automatically cleans up and merges
```

**Agent Context File** (`.agent-context.json`):
```json
{
  "subagentType": "CodeGenAgent",
  "taskDescription": "Implement feature X",
  "issueNumber": 123,
  "worktreeName": "CodeGenAgent-issue-123-20251031-143022",
  "worktreePath": "/path/to/.worktrees/CodeGenAgent-issue-123-20251031-143022",
  "branchName": "worktree/CodeGenAgent-issue-123-20251031-143022",
  "createdAt": "2025-10-31T14:30:22Z",
  "sessionId": "abc123",
  "status": "active",
  "prompt": "Implement feature X for Issue #123"
}
```

**Safety Features**:
- Orchestrator cannot be in worktree (error if already in worktree)
- Prevents nested worktrees
- Verifies Sub-Agent completion before merge
- Checks for uncommitted changes before cleanup
- Preserves worktree on failure for manual inspection
- Timeout handling (cleanup after 30 min inactivity - planned)

**New Functions**:
- `create_subagent_worktree <subagent_type> <task_desc> [issue_number] [prompt]` - Create worktree for Sub-Agent
- `get_last_created_worktree_path` - Get path of last created worktree
- `find_recent_agent_worktree <subagent_type>` - Find most recent worktree for subagent type

### 2. Worktree Automation (Manual)

**Scripts**:
- `worktree-manager.sh` - Core worktree lifecycle functions
- `worktree-prompt.sh` - Interactive task prompt

**Triggers**:
- **Manual**: Call `worktree-prompt.sh` to interactively create worktree
- **SessionEnd**: Reminds to cleanup worktree (if manual worktree exists)

**Features**:
- Auto-create worktree based on task name
- Issue number integration (e.g., `issue-123-fix-auth-bug`)
- Stale worktree detection (older than 7 days)
- Auto-cleanup with safety checks
- Task context tracking (`.task-context.json`)
- macOS notifications via VOICEVOX

**Usage**:
```bash
# Manual usage
.claude/hooks/worktree-manager.sh create "fix auth bug" 123
.claude/hooks/worktree-manager.sh cleanup
.claude/hooks/worktree-manager.sh list-stale
.claude/hooks/worktree-manager.sh auto-cleanup 7 false

# Automatic usage (via hooks)
# - SessionStart: Prompts for task
# - SessionEnd: Reminds to cleanup
```

**Functions**:
- `create_task_worktree <task_name> [issue_number]` - Create worktree
- `cleanup_task_worktree [force]` - Cleanup and merge worktree
- `list_stale_worktrees [days]` - List old worktrees
- `auto_cleanup_stale [days] [dry_run]` - Auto-cleanup stale worktrees
- `is_in_worktree` - Check if currently in worktree
- `get_current_worktree_name` - Get current worktree name

**Safety Features**:
- Prevents nested worktrees
- Checks for uncommitted changes before cleanup
- Confirms before merge
- Logs all operations to `.ai/logs/worktree-YYYY-MM-DD.log`
- Creates backup context files

### 3. VOICEVOX Narration

**Script**: `tool-use.sh`
**Trigger**: PostToolUse (after every tool execution)
**Speaker**: ずんだもん (ID: 3)
**Mode**: Detailed operation narration in Japanese

**Configuration**:
```bash
VOICEVOX_NARRATION_ENABLED=true
VOICEVOX_SPEAKER=3
VOICEVOX_SPEED=1.2
```

### 4. Session Management

**Scripts**:
- `session-keepalive.sh` - Prevent session timeout
- `session-continue.sh` - Prompt to continue or save state
- `session-start.sh` - Session initialization

**Triggers**:
- **SessionStart**: Initialize session, start keep-alive
- **SessionEnd**: Stop keep-alive, show statistics
- **Stop**: Prompt to continue

### 5. Code Quality

**Scripts**:
- `auto-format.sh` - Auto-format code before edit
- `validate-rust.sh` - Validate Rust code after edit
- `validate-typescript.sh` - Validate TypeScript code

**Triggers**:
- **PreToolUse**: Auto-format before Edit/Write
- **PostToolUse**: Validate after Edit/Write

### 6. Other Hooks

**Scripts**:
- `log-commands.sh` - Log user prompts for LDD
- `agent-event.sh` - Send agent progress events
- `agent-complete.sh` - Mark agent task completion
- `notification.sh` - Desktop notifications
- `autocompact-manager.sh` - Context compaction tips

---

## 🔧 Configuration

Hooks are configured in `.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Task",
        "command": "jq -r '.tool_input' | .claude/hooks/agent-worktree-pre.sh",
        "description": "Create worktree for Sub-Agent execution (Orchestrator pattern)",
        "timeout": 60000
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Task",
        "command": "jq -r '.tool_input' | .claude/hooks/agent-worktree-post.sh",
        "description": "Cleanup worktree after Sub-Agent execution (Orchestrator pattern)",
        "timeout": 120000
      }
    ],
    "SessionStart": [
      {"command": "echo \"🚀 Miyabi Orchestrator Session Started\"", "description": "Display session start"}
    ],
    "SessionEnd": [
      {"command": "bash -c 'if in_worktree; then remind_cleanup; fi'", "description": "Remind to cleanup worktree"}
    ]
  }
}
```

---

## 📂 File Structure

```
.claude/hooks/
├── README.md                      # This file
├── agent-worktree-pre.sh          # PreToolUse(Task) - Create worktree (NEW v3.0.0)
├── agent-worktree-post.sh         # PostToolUse(Task) - Cleanup worktree (NEW v3.0.0)
├── worktree-manager.sh            # Worktree lifecycle management (UPDATED v3.0.0)
├── worktree-prompt.sh             # Interactive task prompt (manual worktree)
├── tool-use.sh                    # VOICEVOX narration
├── session-keepalive.sh           # Session keep-alive
├── session-continue.sh            # Session continuation prompt
├── session-start.sh               # Session initialization
├── auto-format.sh                 # Code auto-formatting
├── validate-rust.sh               # Rust validation
├── validate-typescript.sh         # TypeScript validation
├── log-commands.sh                # Command logging
├── agent-event.sh                 # Agent event tracking
├── agent-complete.sh              # Agent completion
├── notification.sh                # Notifications
└── autocompact-manager.sh         # Context compaction
```

---

## 🧪 Testing

### Test Orchestrator Pattern (Recommended)

Test with mock Task tool JSON input:

```bash
# Test PreToolUse hook (create worktree)
echo '{"subagent_type": "CodeGenAgent", "description": "Test task", "issue_number": "999", "prompt": "Test prompt"}' | \
  .claude/hooks/agent-worktree-pre.sh

# Verify worktree created
git worktree list
ls -la /Users/shunsuke/Dev/miyabi-private/.worktrees/

# Simulate Sub-Agent work (make some changes)
cd /Users/shunsuke/Dev/miyabi-private/.worktrees/CodeGenAgent-issue-999-*
echo "test" > test.txt
git add test.txt
git commit -m "test: mock Sub-Agent work"

# Test PostToolUse hook (cleanup worktree)
echo '{"subagent_type": "CodeGenAgent", "success": true}' | \
  .claude/hooks/agent-worktree-post.sh

# Verify cleanup
git worktree list
git log -1  # Should show the test commit merged to main
```

### Test Manual Worktree Creation

```bash
# Test creation
.claude/hooks/worktree-manager.sh create "test task" 999

# Verify worktree
git worktree list
pwd

# Test cleanup
.claude/hooks/worktree-manager.sh cleanup

# Test stale detection
.claude/hooks/worktree-manager.sh list-stale

# Dry run cleanup
.claude/hooks/worktree-manager.sh auto-cleanup 7 true
```

---

## 📖 Related Documentation

- **Hooks Guide**: `.claude/HOOKS_IMPLEMENTATION_GUIDE.md`
- **Worktree Protocol**: `.claude/context/worktree.md`
- **Settings Schema**: `.claude/settings.json`

---

**Created**: 2025-10-25
**Updated**: 2025-10-31
**Version**: v3.0.0 (Orchestrator Pattern)

---

## 🚀 Migration from v2.0.0 to v3.0.0

**Key Changes**:
1. **SessionStart hook removed** - No longer prompts for worktree creation at session start
2. **Orchestrator Pattern added** - Worktrees created automatically when Task tool is invoked
3. **New hooks**: `agent-worktree-pre.sh` and `agent-worktree-post.sh`
4. **New functions**: `create_subagent_worktree`, `get_last_created_worktree_path`, `find_recent_agent_worktree`
5. **Main session stays in main** - Orchestrator never enters worktree (Sub-Agents do)

**Migration Steps**:
1. Update `.claude/settings.json` with new PreToolUse/PostToolUse Task hooks
2. Ensure `jq` is installed (required for JSON parsing)
3. Test with mock Task tool JSON input (see Testing section)
4. Update any custom scripts that depend on SessionStart worktree creation

**Breaking Changes**:
- SessionStart no longer creates worktrees automatically
- Manual worktree creation via `worktree-prompt.sh` is still available for non-Agent tasks
