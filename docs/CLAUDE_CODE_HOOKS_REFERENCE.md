# Claude Code Hooks - Complete Reference

**Version**: 1.0.0
**Last Updated**: 2025-10-22
**Status**: Production

---

## 📚 Table of Contents

1. [Overview](#overview)
2. [Quick Reference Table](#quick-reference-table)
3. [Hook Lifecycle Map](#hook-lifecycle-map)
4. [Detailed Hook Specifications](#detailed-hook-specifications)
5. [Configuration Guide](#configuration-guide)
6. [Implementation Patterns](#implementation-patterns)
7. [Security Guidelines](#security-guidelines)
8. [Debugging & Troubleshooting](#debugging--troubleshooting)
9. [Miyabi Integration](#miyabi-integration)

---

## Overview

### What are Claude Code Hooks?

Claude Code Hooksは、Agent実行のライフサイクル上の特定のポイントで**決定論的に実行されるシェルコマンド**です。LLMの提案に依存せず、確実に実行されるルールとしてエンコードできます。

### Core Principles

1. **Deterministic Control** - 期待通りに毎回実行される
2. **Event-Driven Architecture** - 9種類のイベントトリガー
3. **Shell Command Execution** - 任意のBashコマンドを実行可能
4. **Blocking Capability** - PreToolUseでツール実行を阻止可能
5. **Parallel Execution** - 複数Hooksの並列実行と自動デデュプリケーション

### Available Hook Events

| ID | Event Name | Trigger Point | Blocking | Frequency |
|----|------------|--------------|----------|-----------|
| 1 | **SessionStart** | セッション開始・再開時 | ❌ | 1回/セッション |
| 2 | **UserPromptSubmit** | プロンプト送信後、Claude処理前 | ❌ | 1回/プロンプト |
| 3 | **PreCompact** | コンテキスト圧縮前 | ❌ | 1回/圧縮 |
| 4 | **PreToolUse** | ツール実行前（パラメータ生成後） | ✅ | 1回/ツール |
| 5 | **PostToolUse** | ツール実行完了後 | ❌ | 1回/ツール |
| 6 | **Notification** | 通知送信時 | ❌ | 1回/通知 |
| 7 | **SubagentStop** | Subagent完了時 | ❌ | 1回/Subagent |
| 8 | **Stop** | メイン応答完了時 | ❌ | 1回/応答 |
| 9 | **SessionEnd** | セッション終了時 | ❌ | 1回/セッション |

---

## Quick Reference Table

### Hook Events Summary

| Event | Matcher Required | Context Added | Exit Code 2 Effect | Special Variables |
|-------|-----------------|---------------|-------------------|-------------------|
| SessionStart | ❌ | ❌ | Non-blocking error | `$CLAUDE_ENV_FILE` |
| UserPromptSubmit | ❌ | ✅ (exit 0) | Non-blocking error | - |
| PreCompact | ❌ | ❌ | Non-blocking error | `$transcript_path` |
| PreToolUse | ✅ | ❌ | **Blocks tool** | Tool-specific |
| PostToolUse | ✅ | ❌ | Non-blocking error | Tool-specific |
| Notification | ❌ | ❌ | Non-blocking error | - |
| SubagentStop | ❌ | ❌ | Non-blocking error | Subagent-specific |
| Stop | ❌ | ❌ | Non-blocking error | - |
| SessionEnd | ❌ | ❌ | Non-blocking error | - |

### Tool Matchers

| Matcher | Description | Use Cases |
|---------|-------------|-----------|
| `Bash` | Command execution | Audit logging, validation |
| `Edit` | File editing | Auto-formatting, protection |
| `Write` | File writing | Auto-formatting, protection |
| `Read` | File reading | Access logging |
| `Glob` | File pattern search | - |
| `Grep` | Content search | - |
| `WebFetch` | Web content fetch | - |
| `WebSearch` | Web search | - |
| `Task` | Subagent execution | Monitoring |
| `*` or `""` | All tools | Universal monitoring |
| `Edit\|Write` | Multiple tools (pipe) | Combined matchers |

### Exit Codes

| Exit Code | Behavior | stderr Handling | Use Case |
|-----------|----------|-----------------|----------|
| `0` | Success | Ignored | Normal operation |
| `2` | **Blocking Error** | Fed to Claude | Block tool execution (PreToolUse only) |
| Other | Non-blocking Error | Shown to user | Warnings, non-critical errors |

---

## Hook Lifecycle Map

```
┌─────────────────────────────────────────────────────────────┐
│                    CLAUDE CODE SESSION                       │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
    ┌──────────────────────────────────────┐
    │  1️⃣ SessionStart Hook                │
    │  Trigger: セッション開始・再開          │
    │  Blocking: No                         │
    │  Special: $CLAUDE_ENV_FILE            │
    │  Use Cases:                           │
    │  - 環境変数永続化                      │
    │  - ログディレクトリ作成                 │
    │  - 依存関係チェック                    │
    └──────────────────────────────────────┘
                           │
                           ▼
    ┌──────────────────────────────────────┐
    │  2️⃣ UserPromptSubmit Hook            │
    │  Trigger: プロンプト送信後             │
    │  Blocking: No                         │
    │  Context: stdout → context (exit 0)   │
    │  Use Cases:                           │
    │  - git status自動追加                 │
    │  - プロジェクト状態収集                │
    │  - 入力検証                           │
    └──────────────────────────────────────┘
                           │
                           ▼
    ┌──────────────────────────────────────┐
    │  3️⃣ PreCompact Hook                  │
    │  Trigger: コンテキスト圧縮前           │
    │  Blocking: No                         │
    │  Use Cases:                           │
    │  - トランスクリプトバックアップ         │
    │  - 統計情報収集                       │
    └──────────────────────────────────────┘
                           │
                           ▼
    ┌──────────────────────────────────────┐
    │  4️⃣ PreToolUse Hook                  │
    │  Trigger: ツール実行前                │
    │  Blocking: YES (exit 2)               │
    │  Matcher: Required                    │
    │  Use Cases:                           │
    │  - ファイル保護（.env, .git/）         │
    │  - コマンド監査ログ                    │
    │  - パラメータ検証                      │
    │  - セキュリティチェック                │
    └──────────────────────────────────────┘
                           │
                           ▼
        [ Tool Execution: Bash, Edit, Write, etc. ]
                           │
                           ▼
    ┌──────────────────────────────────────┐
    │  5️⃣ PostToolUse Hook                 │
    │  Trigger: ツール実行完了後             │
    │  Blocking: No                         │
    │  Matcher: Required                    │
    │  Use Cases:                           │
    │  - コード自動フォーマット               │
    │  - Linter自動実行                     │
    │  - テスト実行                         │
    │  - 出力検証                           │
    └──────────────────────────────────────┘
                           │
                           ▼
    ┌──────────────────────────────────────┐
    │  6️⃣ Notification Hook                │
    │  Trigger: 通知送信時                  │
    │  Blocking: No                         │
    │  Use Cases:                           │
    │  - デスクトップ通知                    │
    │  - Slack/Discord通知                  │
    │  - メール送信                         │
    └──────────────────────────────────────┘
                           │
                  ┌────────┴────────┐
                  │                 │
                  ▼                 ▼
    ┌──────────────────┐  ┌──────────────────┐
    │ 7️⃣ SubagentStop  │  │ 8️⃣ Stop Hook      │
    │ Trigger: Sub完了  │  │ Trigger: 応答完了 │
    │ Blocking: No      │  │ Blocking: No      │
    │ Use Cases:        │  │ Use Cases:        │
    │ - 並列タスク監視   │  │ - 自動commit      │
    │ - 統計収集        │  │ - ログ保存        │
    └──────────────────┘  └──────────────────┘
                  │                 │
                  └────────┬────────┘
                           ▼
    ┌──────────────────────────────────────┐
    │  9️⃣ SessionEnd Hook                  │
    │  Trigger: セッション終了               │
    │  Blocking: No                         │
    │  Use Cases:                           │
    │  - セッション統計出力                  │
    │  - 自動バックアップ                    │
    │  - デスクトップ通知                    │
    │  - リソースクリーンアップ               │
    └──────────────────────────────────────┘
```

---

## Detailed Hook Specifications

### 1️⃣ SessionStart Hook

**Trigger Point**: セッション開始・再開時
**Execution Frequency**: 1回/セッション
**Blocking Capability**: ❌ No
**Matcher Required**: ❌ No

#### Special Features

- **Environment Variable Persistence**: `$CLAUDE_ENV_FILE` で環境変数を永続化
- 以降のBashコマンドで利用可能
- セッション初期化の最適なタイミング

#### Configuration Template

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "echo 'PROJECT_ID=miyabi-001' >> \"$CLAUDE_ENV_FILE\"",
            "timeout": 60
          }
        ]
      }
    ]
  }
}
```

#### stdin JSON Format

```json
{
  "session_id": "abc123def456",
  "transcript_path": "/Users/user/.claude/transcripts/session.json",
  "cwd": "/Users/user/project",
  "hook_event_name": "SessionStart"
}
```

#### Use Cases

1. **環境変数の永続化**
   ```bash
   echo "MIYABI_VERSION=v1.0.0" >> "$CLAUDE_ENV_FILE"
   echo "MIYABI_SESSION_ID=$(uuidgen)" >> "$CLAUDE_ENV_FILE"
   ```

2. **ログディレクトリ作成**
   ```bash
   mkdir -p "$CLAUDE_PROJECT_DIR/.ai/logs/$(date +%Y-%m-%d)"
   ```

3. **依存関係チェック**
   ```bash
   if ! command -v rustc &> /dev/null; then
     echo "Error: Rust not installed" >&2
     exit 1
   fi
   ```

4. **セッションログ初期化**
   ```bash
   echo "[$(date)] Session started: $session_id" >> ~/.claude/session-log.txt
   ```

#### Environment Variables

- `$CLAUDE_ENV_FILE` - 環境変数永続化ファイル（**SessionStartのみ利用可能**）
- `$CLAUDE_PROJECT_DIR` - プロジェクトルート絶対パス
- `$CLAUDE_CODE_REMOTE` - リモート実行フラグ（`"true"`）

---

### 2️⃣ UserPromptSubmit Hook

**Trigger Point**: ユーザープロンプト送信後、Claude処理前
**Execution Frequency**: 1回/プロンプト送信
**Blocking Capability**: ❌ No
**Matcher Required**: ❌ No

#### Special Features

- **Context Injection**: Exit code 0の場合、stdoutがコンテキストに追加される
- プロンプト処理前にプロジェクト状態を自動収集可能
- 入力検証・サニタイズの最適なタイミング

#### Configuration Template

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "git status --short | jq -R -s -c '{type: \"git_status\", output: .}'"
          }
        ]
      }
    ]
  }
}
```

#### stdin JSON Format

```json
{
  "session_id": "abc123def456",
  "transcript_path": "/Users/user/.claude/transcripts/session.json",
  "cwd": "/Users/user/project",
  "hook_event_name": "UserPromptSubmit",
  "user_prompt": "Fix the authentication bug"
}
```

#### Use Cases

1. **Git Status自動追加**
   ```bash
   git status --short
   ```

2. **プロジェクト状態収集**
   ```bash
   cat <<EOF
   Current branch: $(git branch --show-current)
   Uncommitted changes: $(git status --short | wc -l)
   Last commit: $(git log -1 --oneline)
   EOF
   ```

3. **Issue番号抽出**
   ```bash
   echo "$user_prompt" | grep -oE '#[0-9]+' | head -1
   ```

4. **タイムスタンプ記録**
   ```bash
   echo "[$(date)] Prompt: $user_prompt" >> ~/.claude/prompt-log.txt
   ```

---

### 3️⃣ PreCompact Hook

**Trigger Point**: コンテキスト圧縮操作の直前
**Execution Frequency**: 1回/圧縮が必要な時点
**Blocking Capability**: ❌ No
**Matcher Required**: ❌ No

#### Configuration Template

```json
{
  "hooks": {
    "PreCompact": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "cp \"$transcript_path\" \"$HOME/.claude/backups/$(date +%s).json\""
          }
        ]
      }
    ]
  }
}
```

#### stdin JSON Format

```json
{
  "session_id": "abc123def456",
  "transcript_path": "/Users/user/.claude/transcripts/session.json",
  "cwd": "/Users/user/project",
  "hook_event_name": "PreCompact"
}
```

#### Use Cases

1. **トランスクリプトバックアップ**
   ```bash
   cp "$transcript_path" "$HOME/.claude/backups/$(date +%s).json"
   ```

2. **統計情報収集**
   ```bash
   jq '.messages | length' "$transcript_path" >> ~/.claude/message-stats.log
   ```

---

### 4️⃣ PreToolUse Hook ⭐

**Trigger Point**: ツール実行直前（パラメータ生成後）
**Execution Frequency**: 1回/ツール呼び出し
**Blocking Capability**: ✅ **YES (Exit code 2)**
**Matcher Required**: ✅ Yes

#### Special Features

- **Blocking**: Exit code 2でツール実行を阻止可能
- **Parameter Access**: ツールパラメータを検証可能
- **Security Gate**: セキュリティチェックの最適なポイント

#### Configuration Template

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "python3 -c \"import json,sys;d=json.load(sys.stdin);p=d.get('tool_input',{}).get('file_path','');sys.exit(2 if any(x in p for x in ['.env','package-lock.json','.git/']) else 0)\""
          }
        ]
      }
    ]
  }
}
```

#### stdin JSON Format

```json
{
  "session_id": "abc123def456",
  "transcript_path": "/Users/user/.claude/transcripts/session.json",
  "cwd": "/Users/user/project",
  "hook_event_name": "PreToolUse",
  "tool_name": "Bash",
  "tool_input": {
    "command": "rm -rf /",
    "description": "Clean temporary files"
  }
}
```

#### Blocking Mechanism

```bash
# Exit code 2 → ツール実行がブロックされる
# stderrの内容がClaudeに渡され、エラー処理される

if [[ "$dangerous_pattern" == true ]]; then
  echo "ERROR: Dangerous operation detected" >&2
  exit 2  # ツール実行を阻止
fi
```

#### Use Cases

1. **ファイル保護（.env, .git/, etc.）**
   ```bash
   jq -r '.tool_input.file_path // empty' | \
   grep -E '\.(env|key|pem|git/)' && \
   echo "Protected file access denied" >&2 && exit 2
   ```

2. **コマンド監査ログ**
   ```bash
   jq -r '.tool_input | "\(.command) - \(.description // "No description")"' \
   >> ~/.claude/bash-audit.log
   ```

3. **危険なコマンドのブロック**
   ```bash
   jq -r '.tool_input.command' | \
   grep -E '(rm -rf|sudo|chmod 777)' && \
   echo "Dangerous command blocked" >&2 && exit 2
   ```

4. **パストラバーサル防止**
   ```bash
   jq -r '.tool_input.file_path // empty' | \
   grep -E '\.\.' && \
   echo "Path traversal detected" >&2 && exit 2
   ```

---

### 5️⃣ PostToolUse Hook

**Trigger Point**: ツール実行完了直後
**Execution Frequency**: 1回/ツール呼び出し
**Blocking Capability**: ❌ No
**Matcher Required**: ✅ Yes

#### Configuration Template

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "jq -r '.tool_input.file_path // empty' | grep '\\.ts$' | xargs -I {} npx prettier --write {}"
          }
        ]
      }
    ]
  }
}
```

#### stdin JSON Format

```json
{
  "session_id": "abc123def456",
  "transcript_path": "/Users/user/.claude/transcripts/session.json",
  "cwd": "/Users/user/project",
  "hook_event_name": "PostToolUse",
  "tool_name": "Edit",
  "tool_input": {
    "file_path": "/Users/user/project/src/main.ts",
    "old_string": "const x = 1",
    "new_string": "const x = 2"
  },
  "tool_output": "Edit successful"
}
```

#### Use Cases

1. **TypeScript自動フォーマット**
   ```bash
   jq -r '.tool_input.file_path // empty' | \
   grep '\\.ts$' | \
   xargs -I {} npx prettier --write {}
   ```

2. **Rust自動フォーマット**
   ```bash
   jq -r '.tool_input.file_path // empty' | \
   grep '\\.rs$' | \
   xargs -I {} cargo fmt --manifest-path {}
   ```

3. **Linter自動実行**
   ```bash
   jq -r '.tool_input.file_path // empty' | \
   grep '\\.ts$' | \
   xargs -I {} npx eslint --fix {}
   ```

4. **テスト自動実行**
   ```bash
   if jq -e '.tool_name == "Edit"' > /dev/null; then
     npm test 2>&1 | head -20
   fi
   ```

---

### 6️⃣ Notification Hook

**Trigger Point**: Claude Codeが通知を送信する時
**Execution Frequency**: 1回/通知発生
**Blocking Capability**: ❌ No
**Matcher Required**: ❌ No

#### Configuration Template

```json
{
  "hooks": {
    "Notification": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "osascript -e 'display notification \"Claude Code needs your attention\" with title \"Miyabi Project\" sound name \"Frog\"'"
          }
        ]
      }
    ]
  }
}
```

#### stdin JSON Format

```json
{
  "session_id": "abc123def456",
  "transcript_path": "/Users/user/.claude/transcripts/session.json",
  "cwd": "/Users/user/project",
  "hook_event_name": "Notification",
  "notification_type": "permission_request",
  "notification_message": "Claude Code needs permission to edit package.json"
}
```

#### Use Cases

1. **macOSデスクトップ通知**
   ```bash
   osascript -e 'display notification "Input needed" with title "Claude Code" sound name "Glass"'
   ```

2. **Linuxデスクトップ通知**
   ```bash
   notify-send 'Claude Code' 'Awaiting your input'
   ```

3. **Slack通知**
   ```bash
   curl -X POST -H 'Content-type: application/json' \
   --data "{\"text\":\"Claude Code notification: $notification_message\"}" \
   "$SLACK_WEBHOOK_URL"
   ```

4. **Discord通知**
   ```bash
   curl -X POST -H 'Content-type: application/json' \
   --data "{\"content\":\"🤖 Claude Code: $notification_message\"}" \
   "$DISCORD_WEBHOOK_URL"
   ```

---

### 7️⃣ SubagentStop Hook

**Trigger Point**: Subagent（Task Agent）完了時
**Execution Frequency**: 1回/Subagentタスク
**Blocking Capability**: ❌ No
**Matcher Required**: ❌ No

#### Configuration Template

```json
{
  "hooks": {
    "SubagentStop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "echo \"[$(date)] Subagent completed\" >> ~/.claude/subagent-log.txt"
          }
        ]
      }
    ]
  }
}
```

#### Use Cases

1. **Subagent完了通知**
2. **並列タスク監視**
3. **統計情報収集**
4. **デバッグログ作成**

---

### 8️⃣ Stop Hook

**Trigger Point**: メインAgent応答完了時
**Execution Frequency**: 1回/Agent応答
**Blocking Capability**: ❌ No
**Matcher Required**: ❌ No

#### Configuration Template

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "git add -A && git commit -m 'Auto-commit after Claude Code session' || true"
          }
        ]
      }
    ]
  }
}
```

#### Use Cases

1. **自動git commit**
2. **ログ保存**
3. **統計更新**
4. **クリーンアップ処理**

---

### 9️⃣ SessionEnd Hook

**Trigger Point**: セッション終了時
**Execution Frequency**: 1回/セッション
**Blocking Capability**: ❌ No
**Matcher Required**: ❌ No

#### Configuration Template

```json
{
  "hooks": {
    "SessionEnd": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "osascript -e 'display notification \"Session completed\" with title \"Claude Code\" sound name \"Frog\"'"
          }
        ]
      }
    ]
  }
}
```

#### Use Cases

1. **セッション統計出力**
2. **自動バックアップ**
3. **デスクトップ通知（音声付き）**
4. **リソースクリーンアップ**
5. **レポート生成**

---

## Configuration Guide

### Settings File Hierarchy

**優先度（高→低）**:
1. **Enterprise Managed Policies** (`managed-settings.json`)
2. **Command Line Arguments** (`--allowedTools`, `--disallowedTools`)
3. **Local Project Settings** (`.claude/settings.local.json`)
4. **Shared Project Settings** (`.claude/settings.json`)
5. **User Settings** (`~/.claude/settings.json`)

### Settings File Locations

| Level | macOS | Linux/WSL | Windows |
|-------|-------|-----------|---------|
| **Enterprise** | `/Library/Application Support/ClaudeCode/managed-settings.json` | `/etc/claude-code/managed-settings.json` | `C:\ProgramData\ClaudeCode\managed-settings.json` |
| **User** | `~/.claude/settings.json` | `~/.claude/settings.json` | `%USERPROFILE%\.claude\settings.json` |
| **Project** | `.claude/settings.json` | `.claude/settings.json` | `.claude\settings.json` |
| **Local** | `.claude/settings.local.json` | `.claude/settings.local.json` | `.claude\settings.local.json` |

### Complete Configuration Structure

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "echo 'Session started' >> log.txt",
            "timeout": 60
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
            "command": "jq -r '.tool_input.command' >> bash-log.txt",
            "timeout": 30
          }
        ]
      },
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "python3 protect.py",
            "timeout": 60
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "echo 'Tool executed' >> tool-log.txt"
          }
        ]
      }
    ]
  },
  "disableAllHooks": false
}
```

### Matcher Patterns

```json
// 単一ツール
{"matcher": "Bash"}

// 複数ツール（ORパターン）
{"matcher": "Edit|Write|Read"}

// 全ツール
{"matcher": "*"}
{"matcher": ""}

// matcher不要（イベント型Hook）
// SessionStart, UserPromptSubmit, PreCompact, Notification, SubagentStop, Stop, SessionEnd
```

---

## Implementation Patterns

### Pattern 1: File Protection System

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "python3 -c \"import json,sys;d=json.load(sys.stdin);p=d.get('tool_input',{}).get('file_path','');blocked=['.env','.git/','package-lock.json','Cargo.lock','node_modules/'];sys.exit(2 if any(b in p for b in blocked) else 0); print(f'Blocked: {p}', file=sys.stderr) if any(b in p for b in blocked) else None\""
          }
        ]
      }
    ]
  }
}
```

### Pattern 2: Auto-Formatting Pipeline

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "bash -c 'file=$(jq -r \".tool_input.file_path // empty\"); case $file in *.ts|*.tsx) npx prettier --write \"$file\" 2>/dev/null || true;; *.rs) cargo fmt --manifest-path \"$file\" 2>/dev/null || true;; *.go) gofmt -w \"$file\" 2>/dev/null || true;; esac'"
          }
        ]
      }
    ]
  }
}
```

### Pattern 3: Command Audit Trail

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "bash -c 'jq -r \".tool_input | \\\"[$(date +%Y-%m-%d\\ %H:%M:%S)] \\(.command) - \\(.description // \\\"No description\\\")\\\"\" >> ~/.claude/bash-audit-$(date +%Y-%m-%d).log'"
          }
        ]
      }
    ]
  }
}
```

### Pattern 4: Context Injection

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "cat <<EOF\nCurrent Git Status:\n$(git status --short)\n\nLast Commit:\n$(git log -1 --oneline)\n\nUncommitted Changes: $(git status --short | wc -l)\nEOF"
          }
        ]
      }
    ]
  }
}
```

### Pattern 5: Multi-Platform Notifications

```json
{
  "hooks": {
    "Notification": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "bash -c 'if [[ \"$OSTYPE\" == \"darwin\"* ]]; then osascript -e \"display notification \\\"Input needed\\\" with title \\\"Claude Code\\\" sound name \\\"Glass\\\"\"; elif command -v notify-send &> /dev/null; then notify-send \"Claude Code\" \"Input needed\"; else echo \"Notification: Input needed\" >> ~/.claude/notifications.log; fi'"
          }
        ]
      }
    ]
  }
}
```

---

## Security Guidelines

### ⚠️ Critical Security Warning

> **Claude Code hooksは、あなたのシステム上で任意のシェルコマンドを自動実行します。**
>
> Hooksを使用することで、あなたが設定したコマンドに対して**あなた自身が全責任を負う**ことを認識してください。
>
> 悪意のあるHooksは、データ損失やシステム侵害を引き起こす可能性があります。

### 🔒 Security Best Practices

#### 1. Input Validation

```bash
# ✅ GOOD: Validate input format
jq -r '.tool_input.file_path' | grep -E '^[a-zA-Z0-9/_.-]+$' || exit 2

# ❌ BAD: No validation
file=$(jq -r '.tool_input.file_path')
```

#### 2. Proper Quoting

```bash
# ✅ GOOD: Properly quoted
file="$(jq -r '.tool_input.file_path')"
prettier --write "$file"

# ❌ BAD: Unquoted (path traversal risk)
prettier --write $file
```

#### 3. Path Traversal Prevention

```bash
# ✅ GOOD: Block path traversal
[[ "$file" == *..* ]] && echo "Path traversal detected" >&2 && exit 2

# ✅ GOOD: Whitelist approach
[[ "$file" =~ ^/Users/user/project/.* ]] || exit 2
```

#### 4. Absolute Paths

```bash
# ✅ GOOD: Absolute path
/usr/bin/prettier --write "$file"

# ⚠️ CAUTION: Relative path (PATH injection risk)
prettier --write "$file"
```

#### 5. Sensitive File Protection

```bash
# ✅ GOOD: Block sensitive files
blocked_patterns=(".env" ".key" ".pem" ".git/" "id_rsa")
for pattern in "${blocked_patterns[@]}"; do
  [[ "$file" == *"$pattern"* ]] && echo "Blocked: $pattern" >&2 && exit 2
done
```

#### 6. Command Whitelisting

```bash
# ✅ GOOD: Whitelist approach
allowed_commands=("git status" "cargo fmt" "prettier")
command=$(jq -r '.tool_input.command')
for allowed in "${allowed_commands[@]}"; do
  [[ "$command" == "$allowed"* ]] && exit 0
done
echo "Command not whitelisted" >&2 && exit 2
```

#### 7. Audit Logging

```bash
# ✅ GOOD: Always log hook executions
echo "[$(date)] Hook: $hook_event_name | Tool: $tool_name | User: $USER" \
  >> ~/.claude/audit.log
```

### 🛡️ Security Checklist

Before deploying hooks, verify:

- [ ] All user inputs are validated
- [ ] Variables are properly quoted
- [ ] Path traversal is prevented
- [ ] Absolute paths are used where possible
- [ ] Sensitive files are protected
- [ ] Commands are whitelisted
- [ ] Audit logging is enabled
- [ ] Timeout is configured (prevent DoS)
- [ ] Error handling is implemented
- [ ] Hooks have been tested in isolation

---

## Debugging & Troubleshooting

### Debug Modes

#### CLI Debug Flag

```bash
# Enable debug output
claude --debug

# Verbose logging (full turn-by-turn)
claude --verbose

# JSON output for automation
claude --output-format json
```

#### View Hook Configurations

```bash
# Within Claude Code session
/hooks

# View current settings
cat ~/.claude/settings.json
cat .claude/settings.json
```

### Common Issues

#### Issue 1: Hook Not Executing

**Symptoms**: Hook doesn't run

**Diagnosis**:
```bash
# Check settings syntax
cat .claude/settings.json | jq .

# Verify matcher pattern
echo '{"tool_name": "Bash"}' | jq -r '.tool_name' | grep -E '^(Bash|Edit|Write)$'

# Test command manually
echo '{"session_id":"test"}' | your-hook-command
```

**Solutions**:
- Verify JSON syntax (`jq` validation)
- Check matcher pattern (case-sensitive)
- Ensure executable is in PATH
- Check file permissions

#### Issue 2: Hook Timeout

**Symptoms**: Hook execution interrupted

**Diagnosis**:
```bash
# Test command execution time
time your-hook-command < test-input.json
```

**Solutions**:
- Increase timeout value
- Optimize command execution
- Use background jobs for long-running tasks

#### Issue 3: Exit Code Confusion

**Symptoms**: Unexpected blocking behavior

**Diagnosis**:
```bash
# Test exit codes
your-hook-command < test-input.json
echo $?  # Check exit code
```

**Solutions**:
- Exit 0: Normal success
- Exit 2: Blocking error (PreToolUse only)
- Other: Non-blocking error

#### Issue 4: stdin Parsing Errors

**Symptoms**: `jq` errors, JSON parsing failures

**Diagnosis**:
```bash
# Capture stdin for debugging
cat > /tmp/hook-input.json
cat /tmp/hook-input.json | jq .
```

**Solutions**:
- Add error handling: `jq -r '.field // "default"'`
- Check for empty input: `jq -e '.field' || echo "Field missing"`
- Use `// empty` for optional fields

### Debugging Template

```bash
#!/bin/bash
# debug-hook.sh - Hook debugging template

set -euo pipefail

# Enable debugging
exec 2>> ~/.claude/hook-debug.log

# Log stdin
stdin=$(cat)
echo "[$(date)] Hook input: $stdin" >&2

# Parse JSON with error handling
file=$(echo "$stdin" | jq -r '.tool_input.file_path // empty' 2>&1) || {
  echo "[$(date)] jq error: $file" >&2
  exit 1
}

# Log parsed value
echo "[$(date)] Parsed file: $file" >&2

# Execute logic
if [[ -z "$file" ]]; then
  echo "[$(date)] No file path provided" >&2
  exit 0
fi

# Success
echo "[$(date)] Hook completed successfully" >&2
exit 0
```

### Log Locations

| Log Type | Location | Description |
|----------|----------|-------------|
| Session Transcripts | `~/.claude/transcripts/<session-id>.json` | Full session history |
| Hook Debug Logs | `~/.claude/hook-debug.log` | Custom debug logs |
| Audit Logs | `~/.claude/audit.log` | Security audit trail |
| Bash Commands | `~/.claude/bash-audit-YYYY-MM-DD.log` | Command execution log |

---

## Miyabi Integration

### Current Implementation

Miyabiプロジェクトは、以下のHooks関連機能を実装済み：

#### 1. Rust Hooks System

**Location**: `crates/miyabi-agents/src/hooks.rs`

```rust
pub trait AgentHook: Send + Sync {
    async fn on_pre_execute(&self, task: &Task) -> Result<(), MiyabiError>;
    async fn on_post_execute(&self, result: &AgentResult) -> Result<(), MiyabiError>;
    async fn on_error(&self, error: &MiyabiError) -> Result<(), MiyabiError>;
}

pub struct HookedAgent<A: BaseAgent> {
    agent: A,
    hooks: Vec<Box<dyn AgentHook>>,
}
```

**Built-in Hooks**:
- `EnvironmentCheckHook` - 環境変数検証
- `MetricsHook` - メトリクス記録
- `AuditLogHook` - `.ai/logs/` への監査ログ

#### 2. Codex Playbooks

**Location**: `.codex/hooks/`

- `coordinator-playbook.md` - Coordinator実行ガイド
- `codegen-playbook.md` - CodeGen実行チェックリスト
- `review-playbook.md` - Review品質基準
- `pr-playbook.md` - PR作成ガイド
- `deployment-playbook.md` - デプロイオーケストレーション

#### 3. Claude Code Commands

**Location**: `.claude/commands/session-end.md`

```bash
#!/bin/bash
# SessionEnd Hook統合

osascript -e 'display notification "Claude Code session finished" with title "Miyabi Project" sound name "Frog"'
echo "[$(date)] Session ended" >> ~/.claude/session-log.txt
```

### Recommended Hooks Configuration

**File**: `.claude/settings.json`

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "echo 'MIYABI_SESSION_ID='$(uuidgen) >> \"$CLAUDE_ENV_FILE\" && mkdir -p .ai/logs/$(date +%Y-%m-%d)"
          }
        ]
      }
    ],
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "cat <<EOF\nGit Status:\n$(git status --short)\n\nWorktrees:\n$(git worktree list | grep -v '(bare)')\nEOF"
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
            "command": "jq -r '.tool_input | \"[$(date +%Y-%m-%d %H:%M:%S)] \\(.command) - \\(.description // \"No description\")\"' >> .ai/logs/bash-commands-$(date +%Y-%m-%d).log"
          }
        ]
      },
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "python3 -c \"import json,sys;d=json.load(sys.stdin);p=d.get('tool_input',{}).get('file_path','');blocked=['.env','Cargo.lock','package-lock.json','.git/','target/'];sys.exit(2 if any(b in p for b in blocked) else 0); print(f'Blocked: {p}', file=sys.stderr) if any(b in p for b in blocked) else None\""
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
            "command": "bash -c 'file=$(jq -r \".tool_input.file_path // empty\"); [[ $file =~ \\.rs$ ]] && cargo fmt --manifest-path \"$file\" 2>/dev/null || true'"
          }
        ]
      }
    ],
    "Notification": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "osascript -e 'display notification \"Claude Code needs attention\" with title \"Miyabi\" sound name \"Glass\"'"
          }
        ]
      }
    ],
    "SessionEnd": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "osascript -e 'display notification \"Session completed\" with title \"Miyabi\" sound name \"Frog\"' && echo \"[$(date)] Session ended: $session_id\" >> .ai/logs/sessions.log"
          }
        ]
      }
    ]
  }
}
```

### Integration with Knowledge Management

**Knowledge Indexing Hook** (Future - Issue #422):

```json
{
  "hooks": {
    "SessionEnd": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "miyabi knowledge index miyabi-private --auto"
          }
        ]
      }
    ]
  }
}
```

---

## Related Documentation

- **Hooks Implementation Guide**: `.claude/HOOKS_IMPLEMENTATION_GUIDE.md`
- **Individual Hook Definitions**: `.claude/hooks/triggers/*.md`
- **Hooks Index**: `.claude/hooks/INDEX.md`
- **Agent Lifecycle Hooks**: `crates/miyabi-agents/src/hooks.rs`
- **Codex Playbooks**: `.codex/hooks/*.md`

---

**Document Version**: 1.0.0
**Last Updated**: 2025-10-22
**Maintained By**: Miyabi Development Team
