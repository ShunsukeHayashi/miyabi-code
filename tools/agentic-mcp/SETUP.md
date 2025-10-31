# Agentic MCP Server - Claude Code統合ガイド

## ✅ セットアップ完了状態

以下のファイルが準備されています:

```
tools/agentic-mcp/
├── dist/server.js          # ビルド済みMCP Server
├── mcp-wrapper.cjs         # Claude Code用エントリーポイント
├── .env                    # 環境変数設定
├── .claude/mcp.json        # MCP設定ファイル
└── README.md               # 詳細ドキュメント
```

## 🚀 Claude Codeで使用する手順

### Step 1: 環境変数を設定

`tools/agentic-mcp/.env` を編集:

```bash
# GitHub Personal Access Token
GITHUB_TOKEN=your_github_token_here

# Anthropic API Key
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# その他の設定はデフォルトのままでOK
```

**GitHub Token取得方法**:
1. https://github.com/settings/tokens
2. "Generate new token (classic)"
3. 権限: `repo`, `workflow`, `issues`, `pull_requests`

### Step 2: MCP Serverが動作確認

```bash
cd tools/agentic-mcp
echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | node mcp-wrapper.cjs
```

7つのツールが表示されればOK:
- ✅ agentic_codegen_execute
- ✅ agentic_review_execute
- ✅ agentic_issue_analyze
- ✅ agentic_pr_create
- ✅ agentic_coordinator_decompose
- ✅ agentic_kpi_collect
- ✅ agentic_metrics_view

### Step 3: Claude Codeで使用

MCP Serverは既に `.claude/mcp.json` で設定済みです。

Claude Codeセッション内で以下のように使用できます:

```
Issue #95を分析して、Label推奨してください
```

または

```
現在のコードをReviewAgentでチェックしてください
```

## 📚 利用可能なツール

### 1. CodeGenAgent - コード生成
```
Issue #123の実装をCodeGenAgentに実行させてください
```

### 2. ReviewAgent - コードレビュー
```
現在の実装をReviewAgentで品質チェックしてください
```

### 3. IssueAgent - Issue分析
```
Issue #456を分析して、識学理論Labelを推奨してください
```

### 4. PRAgent - PR作成
```
Issue #789の実装が完了したので、PRAgentでPR作成してください
```

### 5. CoordinatorAgent - タスク分解
```
大規模な機能実装タスクをCoordinatorAgentで分解してください
```

### 6. KPI収集
```
過去24時間のKPIを収集してください
```

### 7. メトリクス表示
```
現在のKPIダッシュボードを表示してください
```

## 🔧 トラブルシューティング

### ツールが表示されない
1. `.env`ファイルの設定確認
2. Claude Codeを再起動

### Agent実行エラー
1. `GITHUB_TOKEN`が正しく設定されているか確認
2. `ANTHROPIC_API_KEY`が正しく設定されているか確認
3. GitHub Actionsワークフローが有効か確認

## 📖 詳細ドキュメント

- `README.md` - 詳細な使用方法
- `.claude/mcp.json` - MCP設定
- `server.ts` - MCP Server実装

---

**🤖 Agentic Orchestration MCP Server - Ready for Claude Code!**
