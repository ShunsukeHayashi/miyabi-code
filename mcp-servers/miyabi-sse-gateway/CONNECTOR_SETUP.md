# 🌸 Miyabi Society Connector - セットアップガイド

Claude & ChatGPT 両対応版

---

## 🎯 利用可能なサービス

| サービス | URL (Tailscale) | 説明 |
|---------|-----------------|------|
| **Miyabi Console** | http://100.112.127.63:5173 | Web Dashboard |
| **Web API** | http://100.112.127.63:3002 | REST API |
| **SSE Gateway** | http://100.112.127.63:3003 | MCP Connector |

---

## 📱 1. Claude Desktop/Code 設定

### Claude Desktop Config
**ファイル:** `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "miyabi-society": {
      "command": "node",
      "args": [
        "/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/mcp-servers/miyabi-sse-gateway/dist/index.js"
      ],
      "env": {
        "PORT": "3003"
      }
    }
  }
}
```

### Remote MCP (SSE) 設定
```json
{
  "remoteServers": {
    "miyabi-society-remote": {
      "url": "http://100.112.127.63:3003/sse/tmux",
      "transport": "sse"
    }
  }
}
```

---

## 🤖 2. ChatGPT Custom GPT 設定

### ステップ1: GPT作成
1. https://chat.openai.com/ → "Explore GPTs"
2. "Create a GPT" をクリック

### ステップ2: 設定

**Name:**
```
Miyabi Society Orchestrator
```

**Description:**
```
Miyabi Multi-Agent Society management system with autonomous agent orchestration
```

**Instructions:**
```
You are the Miyabi Society Orchestrator.

You have access to the Miyabi platform's autonomous agent network through:
1. Health monitoring
2. Tmux session management
3. Agent rules execution

Capabilities:
- Check system health
- Execute tmux commands
- Manage autonomous agents
- Validate configurations

Always verify system health before executing commands.
Confirm destructive actions with the user first.
```

### ステップ3: Actions設定

**Import from URL:**
```
http://100.112.127.63:3003/openapi.yaml
```

---

## 🔌 3. 利用可能なエンドポイント

### Health Check
```bash
curl http://100.112.127.63:3003/health
```

### SSE Streams (Claude用)
```
http://100.112.127.63:3003/sse/tmux
http://100.112.127.63:3003/sse/rules
```

### API Endpoints (ChatGPT用)
```
POST http://100.112.127.63:3003/mcp/tmux
POST http://100.112.127.63:3003/mcp/rules
GET  http://100.112.127.63:3003/openapi.yaml
```

---

## 🧪 テスト方法

### Claude Desktopでテスト
1. Claude Desktopを再起動
2. チャットで「Miyabi Society の状態を確認して」と入力
3. MCPツールが表示されることを確認

### ChatGPT Custom GPTでテスト
1. Custom GPTを開く
2. 「Check Miyabi health」と入力
3. APIが呼び出されることを確認

---

## 📊 次のステップ

1. ✅ SSE Gatewayにエンドポイント追加
2. ✅ OpenAPI specを完成
3. ✅ Claude Desktop設定
4. ✅ ChatGPT Custom GPT作成
5. 🔄 両方でテスト実行

---

**生成日時:** 2025-11-18
**バージョン:** 1.0.0
