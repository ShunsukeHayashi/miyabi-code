# miyabi-session-sync

Claude Code セッション同期 MCP Server (A2A対応)

## 概要

異なるデバイス間でClaude Codeのセッションを同期するためのMCPサーバー。
Agent-to-Agent (A2A) プロトコルに対応し、自律的なセッション管理を実現。

## 機能

### Core Tools

| ツール名 | 説明 |
|---------|------|
| `session.list` | 全セッション一覧取得 |
| `session.get` | 特定セッションの詳細取得 |
| `session.sync` | リモートからセッション同期 |
| `session.push` | ローカルセッションをリモートへプッシュ |
| `session.search` | セッション内容検索 |
| `session.handoff` | デバイス間セッション引き継ぎ |

### A2A Capabilities

| Capability | 説明 |
|------------|------|
| `session_sync` | セッション同期処理 |
| `session_transfer` | デバイス間転送 |
| `session_discovery` | リモートセッション検出 |

## アーキテクチャ

```
┌─────────────────────────────────────────────────────┐
│ miyabi-session-sync MCP Server                      │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────┐    ┌─────────────┐                │
│  │ Tool Layer  │    │  A2A Layer  │                │
│  └──────┬──────┘    └──────┬──────┘                │
│         │                   │                       │
│  ┌──────┴───────────────────┴──────┐               │
│  │      Session Manager             │               │
│  └──────┬───────────────────┬──────┘               │
│         │                   │                       │
│  ┌──────┴──────┐     ┌──────┴──────┐               │
│  │ Local Store │     │ Remote Sync │               │
│  └─────────────┘     └─────────────┘               │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## 使用方法

### MCP設定

```json
{
  "mcpServers": {
    "session-sync": {
      "command": "miyabi-session-sync",
      "args": ["--remote", "mugen,majin,pixel"]
    }
  }
}
```

### ツール呼び出し例

```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "session.sync",
    "arguments": {
      "remote": "mugen",
      "session_id": "0a48d761-d6b5-464f-80df-e92accf50c67"
    }
  }
}
```

### A2A経由での呼び出し

```rust
// A2A Bridge経由
let result = a2a_bridge.execute(
    "session_sync_agent",
    "sync_session",
    json!({
        "source": "mugen",
        "target": "pixel",
        "session_id": "abc123"
    })
).await?;
```

## 設定

### 環境変数

| 変数名 | 説明 | デフォルト |
|--------|------|-----------|
| `CLAUDE_PROJECTS_DIR` | セッション保存ディレクトリ | `~/.claude/projects` |
| `SESSION_SYNC_REMOTES` | リモートホスト一覧 | なし |
| `SESSION_SYNC_PORT` | 同期ポート | `9876` |

### 設定ファイル

```yaml
# ~/.config/miyabi/session-sync.yaml
remotes:
  mugen:
    host: 192.168.1.10
    user: shunsuke
    port: 22
  majin:
    host: ec2-xxx.compute.amazonaws.com
    user: ubuntu
    key: ~/.ssh/majin.pem
  pixel:
    host: 192.168.1.20
    user: termux
    port: 8022

sync:
  auto: true
  interval: 300  # 5分ごと
  cleanup_days: 30
```

## ビルド

```bash
cargo build -p miyabi-session-sync --release
```

## テスト

```bash
cargo test -p miyabi-session-sync
```

## 関連コンポーネント

- `miyabi-mcp-server` - メインMCPサーバー
- `miyabi-a2a` - A2Aプロトコル実装
- `miyabi-agent-core` - Agentコア機能

## ライセンス

MIT
