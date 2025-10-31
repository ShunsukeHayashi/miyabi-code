# Claude Code MCP Tool統合ガイド

## 🎯 概要

Agentic Orchestration SystemをClaude Code（ローカル）のMCP Toolとして使用する方法

## 📋 セットアップ手順

### Step 1: Claude Desktop設定ファイル編集

ファイル: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "agentic-orchestration": {
      "command": "node",
      "args": [
        "/Users/shunsuke/Dev/ai-course-content-generator-v.0.0.1/tools/agentic-mcp/mcp-wrapper.js"
      ],
      "env": {
        "GITHUB_TOKEN": "ghp_your_github_token_here",
        "ANTHROPIC_API_KEY": "sk-ant-your_anthropic_api_key_here",
        "GITHUB_REPOSITORY": "ShunsukeHayashi/ai-course-content-generator-v.0.0.1"
      }
    }
  }
}
```

### Step 2: MCP Wrapperスクリプト作成

このスクリプトは既に作成されています: `tools/agentic-mcp/mcp-wrapper.js`

### Step 3: Claude Desktop再起動

設定を反映させるため、Claude Desktopアプリを再起動してください。

---

## 🔧 利用可能なコマンド

Claude Codeで以下のように使用できます:

### CodeGenAgent実行
```
Issue #123の実装をCodeGenAgentに実行させてください
```

### ReviewAgent実行
```
現在のコードをReviewAgentで品質チェックしてください
```

### IssueAgent実行
```
Issue #456を分析して識学理論Labelを推奨してください
```

### KPIダッシュボード表示
```
現在のKPIダッシュボードを表示してください
```

---

## 🧪 動作確認

```bash
# MCP Server動作テスト
node tools/agentic-mcp/mcp-wrapper.js test
```

---

**🤖 準備完了後、Claude Codeで直接Agentを呼び出せます！**
