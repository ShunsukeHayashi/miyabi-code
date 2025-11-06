# Claude Code Hooks - Implementation Guide

**Version**: 1.0.0
**Last Updated**: 2025-10-22
**Target Audience**: Developers implementing Claude Code Hooks

---

## 📖 Quick Navigation

- [Getting Started](#getting-started) - 5分でHooksを始める
- [Step-by-Step Setup](#step-by-step-setup) - 詳細なセットアップ手順
- [Common Use Cases](#common-use-cases) - 頻出パターン集
- [Testing & Validation](#testing--validation) - テスト方法
- [Troubleshooting](#troubleshooting) - よくある問題と解決策
- [Miyabi Project Templates](#miyabi-project-templates) - Miyabi用推奨設定

---

## Getting Started

### Prerequisites

- Claude Code CLI installed
- Basic understanding of Bash/shell scripting
- `jq` installed (JSON parsing)

```bash
# Check prerequisites
claude --version
jq --version
```

### 5-Minute Quick Start

#### 1. Create Settings File

```bash
# Project-level (recommended for Miyabi)
mkdir -p .claude
touch .claude/settings.json

# Or user-level (applies to all projects)
mkdir -p ~/.claude
touch ~/.claude/settings.json
```

#### 2. Add Your First Hook

**Example: Session Start Notification**

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "echo '🚀 Miyabi session started at '$(date)"
          }
        ]
      }
    ]
  }
}
```

#### 3. Test It

```bash
claude
# You should see: 🚀 Miyabi session started at ...
```

**Congratulations!** Your first hook is working.

---

## Step-by-Step Setup

### Phase 1: Basic Configuration

#### Step 1: Choose Configuration Level

| Level | File | Scope | Use Case |
|-------|------|-------|----------|
| **User** | `~/.claude/settings.json` | All projects | Global defaults |
| **Project** | `.claude/settings.json` | Current project, team-shared | Project-specific rules |
| **Local** | `.claude/settings.local.json` | Current project, personal | Personal overrides (gitignored) |

**Recommendation for Miyabi**:
- Use `.claude/settings.json` for team-shared hooks
- Use `.claude/settings.local.json` for personal experiments

#### Step 2: Create Base Configuration

```bash
# Create project-level settings
cat > .claude/settings.json <<'EOF'
{
  "hooks": {},
  "disableAllHooks": false
}
EOF
```

#### Step 3: Validate JSON Syntax

```bash
# Validate with jq
cat .claude/settings.json | jq .

# Expected output: Parsed JSON without errors
```

### Phase 2: Implementing Your First Production Hook

#### Use Case: File Protection System

**Goal**: Prevent accidental edits to `.env`, `Cargo.lock`, `.git/`

**Implementation**:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "python3 -c \"import json,sys;d=json.load(sys.stdin);p=d.get('tool_input',{}).get('file_path','');blocked=['.env','Cargo.lock','.git/'];sys.exit(2 if any(b in p for b in blocked) else 0); print(f'⛔ Blocked: {p}', file=sys.stderr) if any(b in p for b in blocked) else None\"",
            "timeout": 60
          }
        ]
      }
    ]
  }
}
```

**Testing**:

```bash
# Test with mock input
echo '{"tool_input": {"file_path": ".env"}}' | \
python3 -c "import json,sys;d=json.load(sys.stdin);p=d.get('tool_input',{}).get('file_path','');blocked=['.env','Cargo.lock','.git/'];sys.exit(2 if any(b in p for b in blocked) else 0); print(f'⛔ Blocked: {p}', file=sys.stderr) if any(b in p for b in blocked) else None"

echo $?  # Should be 2 (blocked)
```

### Phase 3: Multi-Hook Configuration

#### Example: Complete File Workflow

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "python3 .claude/hooks/scripts/file-protection.py",
            "timeout": 60
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "bash .claude/hooks/scripts/auto-format.sh",
            "timeout": 120
          }
        ]
      }
    ]
  }
}
```

**File Structure**:
```
.claude/
├── settings.json
└── hooks/
    └── scripts/
        ├── file-protection.py
        └── auto-format.sh
```

---

## Common Use Cases

### Use Case 1: Command Audit Trail

**Goal**: Log all Bash commands executed by Claude Code

**Configuration**:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "jq -r '.tool_input | \"[$(date +%Y-%m-%d\\ %H:%M:%S)] \\(.command) - \\(.description // \\\"No description\\\")\"' >> .ai/logs/bash-audit-$(date +%Y-%m-%d).log"
          }
        ]
      }
    ]
  }
}
```

**Result**: Creates `.ai/logs/bash-audit-2025-10-22.log`

```
[2025-10-22 14:30:15] cargo build --release - Build release binary
[2025-10-22 14:32:45] git status - Check working tree status
```

### Use Case 2: Auto-Formatting Pipeline

**Goal**: Auto-format Rust files after edit

**Configuration**:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "bash -c 'file=$(jq -r \".tool_input.file_path // empty\"); [[ $file =~ \\.rs$ ]] && cargo fmt --manifest-path \"$file\" 2>/dev/null || true'",
            "timeout": 120
          }
        ]
      }
    ]
  }
}
```

**Testing**:

```bash
# Mock Edit event
echo '{"tool_input": {"file_path": "src/main.rs"}}' | \
bash -c 'file=$(jq -r ".tool_input.file_path // empty"); [[ $file =~ \.rs$ ]] && echo "Would format: $file"'
```

### Use Case 3: Context Injection

**Goal**: Auto-add git status to every prompt

**Configuration**:

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "cat <<EOF\n📊 Project Context:\n\nGit Status:\n$(git status --short)\n\nLast Commit:\n$(git log -1 --oneline)\n\nActive Worktrees:\n$(git worktree list | tail -n +2)\nEOF"
          }
        ]
      }
    ]
  }
}
```

**Result**: Every prompt includes:
```
📊 Project Context:

Git Status:
 M src/main.rs
?? new-file.txt

Last Commit:
abc123 feat: Add new feature

Active Worktrees:
/path/.worktrees/issue-270  abc123  [issue-270]
```

### Use Case 4: Multi-Platform Notifications

**Goal**: Desktop notifications across macOS/Linux/Windows

**Configuration**:

```json
{
  "hooks": {
    "Notification": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "bash .claude/hooks/scripts/notify.sh"
          }
        ]
      }
    ]
  }
}
```

**Script**: `.claude/hooks/scripts/notify.sh`

```bash
#!/bin/bash
set -euo pipefail

message="Claude Code needs attention"

if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  osascript -e "display notification \"$message\" with title \"Miyabi\" sound name \"Glass\""
elif command -v notify-send &> /dev/null; then
  # Linux with notify-send
  notify-send "Miyabi" "$message"
elif command -v powershell.exe &> /dev/null; then
  # WSL/Windows
  powershell.exe -Command "New-BurntToastNotification -Text 'Miyabi', '$message'"
else
  # Fallback: Log to file
  echo "[$(date)] Notification: $message" >> ~/.claude/notifications.log
fi
```

### Use Case 5: Session Statistics

**Goal**: Track session metrics

**SessionStart Hook**:

```bash
#!/bin/bash
echo "SESSION_START=$(date +%s)" >> "$CLAUDE_ENV_FILE"
echo "SESSION_ID=$(uuidgen)" >> "$CLAUDE_ENV_FILE"
```

**SessionEnd Hook**:

```bash
#!/bin/bash
start_time=$SESSION_START
end_time=$(date +%s)
duration=$((end_time - start_time))

cat >> .ai/logs/session-stats.log <<EOF
Session ID: $SESSION_ID
Duration: $duration seconds
Start: $(date -r $start_time)
End: $(date -r $end_time)
---
EOF
```

---

## Testing & Validation

### Testing Strategy

#### 1. Syntax Validation

```bash
# Validate JSON
cat .claude/settings.json | jq . > /dev/null
echo "✅ JSON syntax valid"

# Validate command syntax (dry-run)
bash -n .claude/hooks/scripts/your-script.sh
echo "✅ Bash syntax valid"
```

#### 2. Unit Testing Individual Hooks

**Create Test Input**:

```bash
cat > /tmp/test-input.json <<EOF
{
  "session_id": "test-123",
  "transcript_path": "/tmp/transcript.json",
  "cwd": "/Users/user/project",
  "hook_event_name": "PreToolUse",
  "tool_name": "Edit",
  "tool_input": {
    "file_path": ".env"
  }
}
EOF
```

**Test Hook**:

```bash
# Test file protection hook
cat /tmp/test-input.json | python3 -c \
"import json,sys;d=json.load(sys.stdin);p=d.get('tool_input',{}).get('file_path','');sys.exit(2 if '.env' in p else 0)"

echo "Exit code: $?"  # Should be 2 (blocked)
```

#### 3. Integration Testing

**Enable Debug Mode**:

```bash
# Run Claude Code with debug output
claude --debug

# Check hook execution logs
tail -f ~/.claude/debug.log
```

**Verify Hook Execution**:

```
[DEBUG] Hook matched: PreToolUse | Matcher: Edit
[DEBUG] Executing command: python3 file-protection.py
[DEBUG] Exit code: 2 (blocking)
[DEBUG] stderr: ⛔ Blocked: .env
```

#### 4. End-to-End Testing

**Test Scenario**: File protection prevents `.env` edit

```bash
# Start Claude Code
claude

# Try to edit .env
> "Edit .env and add API_KEY=test"

# Expected: Hook blocks with error message
# Actual: ⛔ Blocked: .env
```

### Automated Testing Script

**File**: `.claude/hooks/scripts/test-hooks.sh`

```bash
#!/bin/bash
set -euo pipefail

echo "🧪 Testing Claude Code Hooks..."

# Test 1: File Protection
echo -n "Test 1: File Protection... "
result=$(echo '{"tool_input": {"file_path": ".env"}}' | \
  python3 -c "import json,sys;d=json.load(sys.stdin);p=d.get('tool_input',{}).get('file_path','');sys.exit(2 if '.env' in p else 0)" 2>&1 || echo $?)

if [[ "$result" == "2" ]]; then
  echo "✅ PASS"
else
  echo "❌ FAIL (expected exit code 2, got $result)"
fi

# Test 2: Auto-Format Detection
echo -n "Test 2: Auto-Format Detection... "
result=$(echo '{"tool_input": {"file_path": "src/main.rs"}}' | \
  bash -c 'file=$(jq -r ".tool_input.file_path // empty"); [[ $file =~ \.rs$ ]] && echo "rust" || echo "other"')

if [[ "$result" == "rust" ]]; then
  echo "✅ PASS"
else
  echo "❌ FAIL (expected 'rust', got '$result')"
fi

echo "✅ All tests passed!"
```

**Run Tests**:

```bash
bash .claude/hooks/scripts/test-hooks.sh
```

---

## Troubleshooting

### Problem 1: Hook Not Executing

**Symptoms**: Hook doesn't run, no output

**Diagnosis**:
```bash
# Check settings file syntax
cat .claude/settings.json | jq .

# Verify hook is registered
claude
> /hooks
```

**Solutions**:
1. Fix JSON syntax errors
2. Check matcher pattern (case-sensitive: `"Edit"` not `"edit"`)
3. Verify file permissions: `chmod +x .claude/hooks/scripts/*.sh`
4. Check executable is in PATH: `which python3`

### Problem 2: Exit Code 2 Not Blocking (PreToolUse)

**Symptoms**: Tool executes despite exit code 2

**Diagnosis**:
```bash
# Test exit code
echo '{"tool_input": {"file_path": ".env"}}' | your-hook-command
echo $?  # Must be exactly 2
```

**Solutions**:
1. Ensure hook returns exit code `2` (not `1` or other)
2. Verify stderr contains error message
3. Check hook is attached to PreToolUse (not PostToolUse)
4. Confirm matcher matches the tool (e.g., `"Edit|Write"`)

### Problem 3: Timeout Errors

**Symptoms**: Hook execution interrupted

**Diagnosis**:
```bash
# Measure execution time
time your-hook-command < test-input.json
```

**Solutions**:
1. Increase timeout: `"timeout": 120`
2. Optimize command (remove slow operations)
3. Use background jobs: `command & disown`

### Problem 4: jq Parsing Errors

**Symptoms**: `jq: error`, `parse error`

**Diagnosis**:
```bash
# Capture stdin
cat > /tmp/hook-input.json

# Test jq command
cat /tmp/hook-input.json | jq -r '.tool_input.file_path'
```

**Solutions**:
1. Use `// empty` for optional fields: `jq -r '.tool_input.file_path // empty'`
2. Add error handling: `jq -r '.field' || echo "default"`
3. Check for null: `jq -e '.field' || echo "Field missing"`

### Problem 5: Environment Variables Not Available

**Symptoms**: `$CLAUDE_ENV_FILE` not found

**Diagnosis**:
```bash
# Check which hook you're using
echo "Hook event: $hook_event_name"
```

**Solutions**:
1. `$CLAUDE_ENV_FILE` is **only available in SessionStart**
2. Use `$CLAUDE_PROJECT_DIR` for other hooks
3. Set variables in SessionStart, access in later hooks

### Debug Checklist

- [ ] JSON syntax valid (`jq .`)
- [ ] Matcher pattern correct (case-sensitive)
- [ ] Command executable (`which command`)
- [ ] File permissions correct (`chmod +x`)
- [ ] Exit codes correct (0, 2, or other)
- [ ] stdin format matches expectation (test with mock data)
- [ ] Timeout configured (default 60s)
- [ ] Error handling implemented (`|| true` for non-critical)
- [ ] Logs configured (stderr → visible output)
- [ ] Debug mode enabled (`claude --debug`)

---

## Miyabi Project Templates

### Template 1: Minimal (Recommended for New Users)

**File**: `.claude/settings.json`

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "echo '🚀 Miyabi session started' && mkdir -p .ai/logs/$(date +%Y-%m-%d)"
          }
        ]
      }
    ],
    "SessionEnd": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "echo '✅ Miyabi session ended' && osascript -e 'display notification \"Session completed\" with title \"Miyabi\" sound name \"Frog\"' 2>/dev/null || true"
          }
        ]
      }
    ]
  }
}
```

### Template 2: Standard (Recommended for Miyabi Development)

**File**: `.claude/settings.json`

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "echo 'MIYABI_SESSION_ID='$(uuidgen) >> \"$CLAUDE_ENV_FILE\" && mkdir -p .ai/logs/$(date +%Y-%m-%d)",
            "timeout": 60
          }
        ]
      }
    ],
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "cat <<EOF\n📊 Context:\nGit: $(git status --short | wc -l) changes\nWorktrees: $(git worktree list | tail -n +2 | wc -l) active\nEOF",
            "timeout": 30
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "jq -r '.tool_input | \"[$(date +%Y-%m-%d\\ %H:%M:%S)] \\(.command) - \\(.description // \\\"No description\\\")\"' >> .ai/logs/bash-audit-$(date +%Y-%m-%d).log",
            "timeout": 30
          }
        ]
      },
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "python3 -c \"import json,sys;d=json.load(sys.stdin);p=d.get('tool_input',{}).get('file_path','');blocked=['.env','Cargo.lock','package-lock.json','.git/','target/'];sys.exit(2 if any(b in p for b in blocked) else 0); print(f'⛔ Blocked: {p}', file=sys.stderr) if any(b in p for b in blocked) else None\"",
            "timeout": 60
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "bash -c 'file=$(jq -r \".tool_input.file_path // empty\"); [[ $file =~ \\.rs$ ]] && cargo fmt --manifest-path \"$file\" 2>/dev/null || true'",
            "timeout": 120
          }
        ]
      }
    ],
    "Notification": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "osascript -e 'display notification \"Claude Code needs attention\" with title \"Miyabi\" sound name \"Glass\"' 2>/dev/null || notify-send 'Miyabi' 'Claude Code needs attention' 2>/dev/null || echo 'Notification' >> ~/.claude/notifications.log",
            "timeout": 30
          }
        ]
      }
    ],
    "SessionEnd": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "osascript -e 'display notification \"Session completed\" with title \"Miyabi\" sound name \"Frog\"' 2>/dev/null || true && echo \"[$(date)] Session ended: $MIYABI_SESSION_ID\" >> .ai/logs/sessions.log",
            "timeout": 60
          }
        ]
      }
    ]
  },
  "disableAllHooks": false
}
```

### Template 3: Advanced (Full Security & Monitoring)

**File**: `.claude/settings.json`

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "bash .claude/hooks/scripts/session-start.sh"
          }
        ]
      }
    ],
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "bash .claude/hooks/scripts/context-injection.sh"
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "bash .claude/hooks/scripts/bash-audit.sh"
          }
        ]
      },
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "python3 .claude/hooks/scripts/file-protection.py"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "bash .claude/hooks/scripts/auto-format.sh"
          }
        ]
      }
    ],
    "Notification": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "bash .claude/hooks/scripts/notify.sh"
          }
        ]
      }
    ],
    "SessionEnd": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "bash .claude/hooks/scripts/session-end.sh"
          }
        ]
      }
    ]
  }
}
```

**Required Scripts** (`.claude/hooks/scripts/`):
- `session-start.sh` - Session initialization
- `context-injection.sh` - Auto-add project context
- `bash-audit.sh` - Command logging
- `file-protection.py` - File access control
- `auto-format.sh` - Multi-language formatting
- `notify.sh` - Cross-platform notifications
- `session-end.sh` - Cleanup & statistics

---

## Next Steps

1. **Start Simple**: Use Template 1 (Minimal)
2. **Test Thoroughly**: Run `.claude/hooks/scripts/test-hooks.sh`
3. **Iterate**: Add hooks incrementally
4. **Monitor**: Use `claude --debug` to verify execution
5. **Document**: Update `.claude/hooks/INDEX.md` with your hooks

---

## Related Documentation

- **Complete Reference**: `docs/CLAUDE_CODE_HOOKS_REFERENCE.md`
- **Individual Triggers**: `.claude/hooks/triggers/*.md`
- **Hooks Index**: `.claude/hooks/INDEX.md`
- **Official Docs**: https://docs.claude.com/en/docs/claude-code/hooks

---

**Document Version**: 1.0.0
**Last Updated**: 2025-10-22
**Maintained By**: Miyabi Development Team
