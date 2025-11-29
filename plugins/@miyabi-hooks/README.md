# Miyabi Hooks Plugin

**Version**: 2.0.0
**Category**: Automation
**License**: Apache-2.0

Pre/Post Tool Hooks を提供する Claude Code プラグイン。ツール実行前後の自動処理、セッション管理、Git統合、MCP初期化など、開発ワークフローの自動化を実現します。

## Installation

```bash
# マーケットプレイス追加
/plugin marketplace add customer-cloud/miyabi-private

# プラグインインストール
/plugin install miyabi-hooks@miyabi-official-plugins

# Claude Code 再起動
```

## Hooks Overview

### Hook Types

| Hook Type | タイミング | 用途 |
|-----------|----------|------|
| **PreToolUse** | ツール実行前 | バリデーション、権限チェック |
| **PostToolUse** | ツール実行後 | ログ、通知、後処理 |
| **Notification** | 任意 | ユーザー通知 |
| **Stop** | エラー時 | 実行停止 |

---

## Hook Configuration

### hooks.json 構造

```json
{
  "PreToolUse": [
    {
      "matcher": "ToolName",
      "hooks": [
        {
          "type": "command",
          "command": "bash ./scripts/pre-hook.sh",
          "timeout": 5000
        }
      ]
    }
  ],
  "PostToolUse": [
    {
      "matcher": "*",
      "hooks": [
        {
          "type": "notification",
          "title": "Task Complete"
        }
      ]
    }
  ]
}
```

---

## Miyabi Default Hooks

### 1. Session Initialization Hook

**ファイル**: `session-hooks/init-mcp-environment.sh`

**目的**: セッション開始時のMCP環境初期化

```bash
#!/bin/bash
# MCP環境変数設定
export MIYABI_SESSION_ID=$(uuidgen)
export MIYABI_START_TIME=$(date +%s)

# MCP サーバー接続確認
echo "🚀 Miyabi Session Initialized"
echo "   Session ID: $MIYABI_SESSION_ID"
```

### 2. Permission Check Hook

**ファイル**: `pre-hooks/permission-check.sh`

**目的**: 危険なコマンドの実行前チェック

```bash
#!/bin/bash
TOOL=$1
COMMAND=$2

# 危険コマンドの検出
if [[ "$COMMAND" == *"rm -rf /"* ]]; then
    echo "❌ BLOCKED: Dangerous command detected"
    exit 1
fi

# 許可
exit 0
```

### 3. Git Status Check Hook

**ファイル**: `pre-hooks/git-status-check.sh`

**目的**: コミット前の未コミット変更チェック

```bash
#!/bin/bash
TOOL=$1
COMMAND=$2

if [[ "$COMMAND" == *"git commit"* ]]; then
    # 変更確認
    if [[ -z $(git status --porcelain) ]]; then
        echo "⚠️ No changes to commit"
        exit 1
    fi
fi

exit 0
```

### 4. Completion Notification Hook

**ファイル**: `post-hooks/notify-completion.sh`

**目的**: タスク完了時の通知

```bash
#!/bin/bash
TOOL=$1
RESULT=$2

# macOS通知
osascript -e "display notification \"$TOOL completed\" with title \"Miyabi\""

# VOICEVOX通知 (オプション)
if command -v voicevox &> /dev/null; then
    echo "$TOOL が完了しました" | voicevox
fi
```

---

## Hook Matchers

### Matcher Types

| Matcher | 説明 | 例 |
|---------|------|-----|
| `*` | 全ツール | すべてに適用 |
| `ToolName` | 特定ツール | `Bash`, `Read`, `Write` |
| `Tool:*` | ツールプレフィックス | `mcp__*` |
| `!ToolName` | 除外 | `!Read` (Read以外) |

### 例

```json
{
  "PreToolUse": [
    {
      "matcher": "Bash",
      "hooks": [
        {
          "type": "command",
          "command": "bash ./hooks/validate-bash.sh \"$COMMAND\""
        }
      ]
    },
    {
      "matcher": "Write",
      "hooks": [
        {
          "type": "command",
          "command": "bash ./hooks/backup-file.sh \"$FILE_PATH\""
        }
      ]
    }
  ]
}
```

---

## Hook Actions

### 1. Command Hook

外部コマンドを実行

```json
{
  "type": "command",
  "command": "bash ./scripts/my-hook.sh",
  "timeout": 5000,
  "env": {
    "MY_VAR": "value"
  }
}
```

### 2. Notification Hook

ユーザーに通知

```json
{
  "type": "notification",
  "title": "Task Complete",
  "message": "The operation finished successfully"
}
```

### 3. Stop Hook

実行を停止

```json
{
  "type": "stop",
  "message": "Operation blocked by policy"
}
```

---

## Hook Environment Variables

Hookスクリプト内で利用可能な変数:

| 変数 | 説明 |
|------|------|
| `$MIYABI_TOOL` | 実行ツール名 |
| `$MIYABI_COMMAND` | 実行コマンド |
| `$MIYABI_FILE_PATH` | 対象ファイルパス |
| `$MIYABI_SESSION_ID` | セッションID |
| `$MIYABI_RESULT` | 実行結果 (PostToolUse) |

---

## Hook Directory Structure

```
plugins/miyabi-hooks/
├── .claude-plugin/
│   └── plugin.json
├── hooks/
│   ├── hooks.json              # メイン設定
│   ├── session-hooks/
│   │   └── init-mcp-environment.sh
│   ├── pre-hooks/
│   │   ├── permission-check.sh
│   │   ├── git-status-check.sh
│   │   └── validate-bash.sh
│   ├── post-hooks/
│   │   ├── notify-completion.sh
│   │   ├── log-execution.sh
│   │   └── update-metrics.sh
│   └── scripts/
│       └── common.sh
└── README.md
```

---

## Common Use Cases

### 1. 自動バックアップ

ファイル書き込み前に自動バックアップ:

```json
{
  "PreToolUse": [
    {
      "matcher": "Write",
      "hooks": [
        {
          "type": "command",
          "command": "cp \"$MIYABI_FILE_PATH\" \"$MIYABI_FILE_PATH.bak\" 2>/dev/null || true"
        }
      ]
    }
  ]
}
```

### 2. 実行ログ

全ツール実行のログ記録:

```json
{
  "PostToolUse": [
    {
      "matcher": "*",
      "hooks": [
        {
          "type": "command",
          "command": "echo \"$(date) - $MIYABI_TOOL\" >> ~/.miyabi/execution.log"
        }
      ]
    }
  ]
}
```

### 3. 危険コマンドブロック

`rm -rf /` などの危険なコマンドをブロック:

```json
{
  "PreToolUse": [
    {
      "matcher": "Bash",
      "hooks": [
        {
          "type": "command",
          "command": "bash ./hooks/block-dangerous.sh"
        }
      ]
    }
  ]
}
```

### 4. PR作成時の自動テスト

PR作成前にテスト実行:

```json
{
  "PreToolUse": [
    {
      "matcher": "Bash",
      "hooks": [
        {
          "type": "command",
          "command": "if [[ \"$MIYABI_COMMAND\" == *\"gh pr create\"* ]]; then cargo test; fi"
        }
      ]
    }
  ]
}
```

---

## Debugging Hooks

### デバッグログ有効化

```bash
export MIYABI_HOOK_DEBUG=true
```

### 手動テスト

```bash
# Pre-hook テスト
bash ./hooks/pre-hooks/permission-check.sh "Bash" "ls -la"

# Post-hook テスト
bash ./hooks/post-hooks/notify-completion.sh "Bash" "success"
```

---

## Related Plugins

- [miyabi-commands](../miyabi-commands/) - スラッシュコマンド
- [miyabi-mcp-servers](../miyabi-mcp-servers/) - MCP設定

---

**Author**: Shunsuke Hayashi
**Created**: 2025-11-29
**Version**: 2.0.0
