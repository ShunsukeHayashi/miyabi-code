# AntiGravity MCP Integration Guide

## 🔌 MCP Overview

Model Context Protocol (MCP) は、AIエージェントとツール間の標準化された通信プロトコルです。

---

## 📡 Available MCP Servers

### Tier 1 - Core (必須)
| Server | Port | Description |
|--------|------|-------------|
| `miyabi-mcp` | 3100 | メインMCPサーバー |
| `miyabi-github` | 3101 | GitHub操作 |
| `miyabi-tmux` | 3102 | tmux管理 |

### Tier 2 - Development (開発用)
| Server | Port | Description |
|--------|------|-------------|
| `miyabi-git-inspector` | 3103 | Git分析 |
| `miyabi-file-watcher` | 3104 | ファイル監視 |
| `miyabi-log-aggregator` | 3105 | ログ集約 |
| `miyabi-resource-monitor` | 3106 | リソース監視 |

### Tier 3 - AI Integration (AI連携)
| Server | Port | Description |
|--------|------|-------------|
| `gemini3-uiux-designer` | 3110 | UI/UXレビュー |
| `miyabi-codex` | 3111 | Codex統合 |
| `context7` | 3112 | ライブラリドキュメント |

---

## 🛠️ Tool Usage Patterns

### GitHub Operations
```python
# Issue作成
miyabi-github:github_create_issue(
    title="新機能: ダッシュボード改善",
    body="## 概要\n...",
    labels=["enhancement", "dashboard"]
)

# PR作成
miyabi-github:github_create_pr(
    title="feat(dashboard): add agent status panel",
    head="feature/issue-123",
    base="develop"
)
```

### Git Operations
```python
# 状態確認
miyabi-git-inspector:git_status()

# ブランチ一覧
miyabi-git-inspector:git_branch_list()

# コミット履歴
miyabi-git-inspector:git_log(limit=20)
```

### Tmux Operations
```python
# セッション一覧
miyabi-tmux:tmux_list_sessions()

# メッセージ送信
miyabi-tmux:tmux_send_message(
    pane_id="%50",
    message="TASK_COMPLETE: issue-123"
)

# ペイン出力取得
miyabi-tmux:tmux_pane_capture(pane_id="%50", lines=100)
```

### Resource Monitoring
```python
# システム概要
miyabi-resource-monitor:resource_overview()

# CPU使用率
miyabi-resource-monitor:resource_cpu()

# メモリ使用量
miyabi-resource-monitor:resource_memory()
```

---

## 🔄 MCP Communication Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Claude    │───▶│  MCP Client │───▶│ MCP Server  │
│   Agent     │◀───│             │◀───│   (Tool)    │
└─────────────┘    └─────────────┘    └─────────────┘
                         │
                         ▼
                   ┌─────────────┐
                   │   Result    │
                   │  Processing │
                   └─────────────┘
```

---

## ⚙️ Configuration

### claude_desktop_config.json
```json
{
  "mcpServers": {
    "miyabi-mcp": {
      "command": "node",
      "args": ["path/to/miyabi-mcp/dist/index.js"],
      "env": {
        "MIYABI_ROOT": "/path/to/AntiGravity"
      }
    },
    "miyabi-github": {
      "command": "node",
      "args": ["path/to/miyabi-github/dist/index.js"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      }
    }
  }
}
```

---

## 🔧 Troubleshooting

### 接続エラー
```bash
# MCP サーバー状態確認
miyabi-claude-code:claude_mcp_status()

# ログ確認
miyabi-log-aggregator:log_get_recent(source="mcp", limit=50)
```

### ツール実行エラー
```bash
# エラーログ確認
miyabi-log-aggregator:log_get_errors(minutes=30)

# プロセス確認
miyabi-process-inspector:process_search(query="node mcp")
```
