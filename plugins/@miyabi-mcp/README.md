# Miyabi MCP Servers Plugin

**Version**: 2.0.0
**Category**: Integrations
**License**: Apache-2.0

24のMCPサーバー設定を提供する Claude Code プラグイン。Gemini 3、Lark、Obsidian、GitHub、tmux など、外部サービスとの統合を実現します。

## Installation

```bash
# マーケットプレイス追加
/plugin marketplace add customer-cloud/miyabi-private

# プラグインインストール
/plugin install miyabi-mcp-servers@miyabi-official-plugins

# Claude Code 再起動
```

## MCP Servers Overview

### 全24サーバー一覧

| # | Server | カテゴリ | 説明 |
|---|--------|---------|------|
| 1 | `gemini3-uiux-designer` | AI | UI/UX設計レビュー (Jonathan Ive哲学) |
| 2 | `gemini3-adaptive-runtime` | AI | 適応的ランタイム |
| 3 | `lark-openapi-enhanced` | Communication | Larkメッセージ・ドキュメント操作 |
| 4 | `lark-wiki-agents` | Communication | Lark Wiki操作 |
| 5 | `lark-mcp-enhanced` | Communication | 拡張Lark機能 |
| 6 | `miyabi-obsidian` | Knowledge | Obsidian Vault操作 |
| 7 | `miyabi-github` | DevOps | GitHub操作 (Issue/PR/Workflow) |
| 8 | `miyabi-tmux` | DevOps | tmux管理 |
| 9 | `miyabi-file-access` | System | ファイル操作 |
| 10 | `miyabi-file-watcher` | System | ファイル監視 |
| 11 | `miyabi-git-inspector` | DevOps | Git検査 |
| 12 | `miyabi-log-aggregator` | Monitoring | ログ集約 |
| 13 | `miyabi-network-inspector` | Monitoring | ネットワーク監視 |
| 14 | `miyabi-process-inspector` | Monitoring | プロセス監視 |
| 15 | `miyabi-resource-monitor` | Monitoring | リソース監視 |
| 16 | `miyabi-rules` | Automation | ルールエンジン |
| 17 | `miyabi-sse-gateway` | Communication | SSEゲートウェイ |
| 18 | `miyabi-mcp` | Core | メインMCPサーバー |
| 19 | `miyabi-codex` | AI | Codex統合 |
| 20 | `miyabi-openai-assistant` | AI | OpenAI Assistant |
| 21 | `miyabi-commercial-agents` | Business | 商用Agent群 |
| 22 | `context-engineering` | AI | コンテキストエンジニアリング |
| 23 | `miyabi-claude-code` | AI | Claude Code統合 |
| 24 | `miyabi-pixel-mcp` | Mobile | Pixel専用MCPサーバー |

---

## Server Categories

### 1. AI Integration (6個)

#### gemini3-uiux-designer

**用途**: Gemini 3 Pro Preview による UI/UX デザインレビュー

**ツール**:
- `design_review`: デザインレビュー実行
- `accessibility_check`: アクセシビリティチェック
- `style_guide_generate`: スタイルガイド生成

**設定**:
```json
{
  "gemini3-uiux-designer": {
    "command": "node",
    "args": ["${MCP_ROOT}/gemini3-uiux/index.js"],
    "env": {
      "GEMINI_API_KEY": "${GEMINI_API_KEY}"
    }
  }
}
```

#### miyabi-codex

**用途**: OpenAI Codex 統合

**ツール**:
- `code_completion`: コード補完
- `code_edit`: コード編集
- `code_explain`: コード説明

---

### 2. Communication (5個)

#### lark-openapi-enhanced

**用途**: Lark (Feishu) メッセージング・ドキュメント

**ツール**:
- `im_v1_message_create`: メッセージ送信
- `im_v1_chat_list`: グループ一覧取得
- `im_v1_chatMembers_get`: メンバー取得

**設定**:
```json
{
  "lark-openapi-enhanced": {
    "command": "npx",
    "args": ["-y", "@anthropic/lark-mcp"],
    "env": {
      "LARK_APP_ID": "${LARK_APP_ID}",
      "LARK_APP_SECRET": "${LARK_APP_SECRET}"
    }
  }
}
```

---

### 3. Knowledge Management (1個)

#### miyabi-obsidian

**用途**: Obsidian Vault 操作

**ツール**:
- `create_note`: ノート作成
- `update_note`: ノート更新
- `search_notes`: ノート検索
- `link_notes`: ノートリンク

**Vault Path**:
- macOS: `~/Obsidian/MIYABI/`
- Pixel: `~/storage/shared/Obsidian/MiyabiVault/`

---

### 4. DevOps (4個)

#### miyabi-github

**用途**: GitHub API 統合

**ツール**:
- `list_issues`: Issue一覧
- `create_issue`: Issue作成
- `create_pr`: PR作成
- `trigger_workflow`: Workflow実行

**設定**:
```json
{
  "miyabi-github": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-github"],
    "env": {
      "GITHUB_TOKEN": "${GITHUB_TOKEN}"
    }
  }
}
```

#### miyabi-tmux

**用途**: tmux セッション管理

**ツール**:
- `create_session`: セッション作成
- `send_keys`: キー送信
- `capture_pane`: ペイン内容取得

---

### 5. System Monitoring (5個)

#### miyabi-resource-monitor

**用途**: システムリソース監視

**メトリクス**:
- CPU使用率
- メモリ使用率
- ディスク使用率
- ネットワークI/O

#### miyabi-process-inspector

**用途**: プロセス監視

**機能**:
- プロセス一覧
- リソース消費
- 子プロセス追跡

#### miyabi-log-aggregator

**用途**: ログ集約・検索

**対応ログ**:
- アプリケーションログ
- システムログ
- Agentログ

---

### 6. Core (1個)

#### miyabi-mcp

**用途**: Miyabi メインMCPサーバー (Rust実装)

**A2A Bridge Tools**:
```
a2a.code_generation_agent.generate_code
a2a.task_coordination_and_parallel_execution_agent.decompose_issue
a2a.code_quality_review_agent.review_code
...
```

**起動**:
```bash
cargo run -p miyabi-mcp-server
```

---

## Configuration

### mcp.json 構造

```json
{
  "mcpServers": {
    "server-name": {
      "command": "node",
      "args": ["path/to/server.js"],
      "env": {
        "API_KEY": "${API_KEY}"
      },
      "disabled": false
    }
  }
}
```

### 環境変数

必要な環境変数:

| 変数 | 用途 |
|------|------|
| `ANTHROPIC_API_KEY` | Claude API |
| `GEMINI_API_KEY` | Gemini API |
| `GITHUB_TOKEN` | GitHub API |
| `LARK_APP_ID` | Lark App ID |
| `LARK_APP_SECRET` | Lark Secret |
| `XAI_API_KEY` | Grok API |

---

## MCP Tool Invocation

### Python Client

```bash
python3 ~/mcp-call.py <server-name> <method> [params]

# 例
python3 ~/mcp-call.py gemini3-uiux-designer tools/list
python3 ~/mcp-call.py lark-openapi-enhanced tools/call '{"name":"send_message",...}'
```

### Alias

```bash
mcp-gemini <args>     # Gemini 3呼び出し
mcp-lark <args>       # Lark操作
mcp-obsidian <args>   # Obsidian操作
mcp-github <args>     # GitHub操作
mcp-tools             # 全MCPサーバーリスト
```

---

## Server Health Check

### 全サーバー状態確認

```bash
miyabi-cli mcp health-check
```

**出力**:
```
MCP Server Health Check
━━━━━━━━━━━━━━━━━━━━━━━━
[✅] gemini3-uiux-designer
[✅] lark-openapi-enhanced
[✅] miyabi-github
[⚠️] miyabi-codex (API key missing)
[❌] miyabi-pixel-mcp (not running)

Status: 22/24 servers healthy
```

---

## Adding Custom MCP Server

### 1. サーバー実装

```javascript
// my-mcp-server.js
const { Server } = require('@modelcontextprotocol/sdk');

const server = new Server({
  name: 'my-mcp-server',
  version: '1.0.0'
});

server.addTool({
  name: 'my_tool',
  description: 'My custom tool',
  inputSchema: { type: 'object', properties: {} },
  handler: async (input) => {
    return { result: 'Success' };
  }
});

server.start();
```

### 2. 設定追加

```json
{
  "mcpServers": {
    "my-mcp-server": {
      "command": "node",
      "args": ["./my-mcp-server.js"]
    }
  }
}
```

---

## Troubleshooting

### よくある問題

| 問題 | 原因 | 解決策 |
|------|------|--------|
| サーバー起動失敗 | Node.js未インストール | `nvm install 20` |
| API接続エラー | 環境変数未設定 | `.env`確認 |
| タイムアウト | ネットワーク問題 | 接続確認 |

### デバッグ

```bash
# MCPサーバーログ
tail -f ~/.miyabi/mcp-server.log

# 詳細ログ有効化
export MCP_DEBUG=true
```

---

## Related Plugins

- [miyabi-hooks](../miyabi-hooks/) - フック設定
- [miyabi-full](../miyabi-full/) - フルパッケージ

---

**Author**: Shunsuke Hayashi
**Created**: 2025-11-29
**Version**: 2.0.0
