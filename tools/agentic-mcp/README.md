# Agentic Orchestration MCP Server

Claude Code用MCP Tool - 識学理論ベースAI Agent統合

## 🎯 概要

このMCP Serverは、Agentic Orchestration Systemの全AgentをローカルのClaude Codeから直接呼び出せるようにします。

## 🚀 セットアップ

### 1. 依存関係インストール

```bash
cd tools/agentic-mcp
npm install
```

### 2. 環境変数設定

`.env` ファイルを作成:

```bash
cp .env.example .env
```

`.env` を編集してAPIキーを設定:

```env
# GitHub Personal Access Token
# Required permissions: repo, workflow, issues, pull_requests
GITHUB_TOKEN=ghp_your_github_token_here

# Anthropic API Key (Claude AI)
ANTHROPIC_API_KEY=sk-ant-your_anthropic_api_key_here

# GitHub Repository
GITHUB_REPOSITORY=ShunsukeHayashi/ai-course-content-generator-v.0.0.1

# Repository local path
GITHUB_REPOSITORY_PATH=/Users/shunsuke/Dev/ai-course-content-generator-v.0.0.1
```

**⚠️ 重要**: `.env` ファイルは `.gitignore` に含まれており、Gitにコミットされません。

### 3. ビルド

```bash
npm run build
```

### 4. Claude Code CLI設定

Claude Code CLIの設定ファイルに追加:

**macOS/Linux**: `~/.config/claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "agentic-orchestration": {
      "command": "node",
      "args": [
        "/absolute/path/to/ai-course-content-generator-v.0.0.1/tools/agentic-mcp/dist/server.js"
      ],
      "env": {
        "GITHUB_TOKEN": "ghp_your_github_token_here",
        "ANTHROPIC_API_KEY": "sk-ant-your_anthropic_api_key_here",
        "GITHUB_REPOSITORY": "ShunsukeHayashi/ai-course-content-generator-v.0.0.1",
        "GITHUB_REPOSITORY_PATH": "/absolute/path/to/ai-course-content-generator-v.0.0.1"
      }
    }
  }
}
```

**⚠️ 重要**:
- パスは絶対パスを使用してください
- APIキーは直接記載（`.env`ではなくClaude Code設定で管理）
- Claude Code CLIを再起動して設定を反映

### 5. 動作確認

Claude Code CLIセッション内で以下を確認:

```
利用可能なMCPツール: agentic_codegen_execute, agentic_review_execute, ...
```

---

## 🔧 利用可能なTools

### 1. `agentic_codegen_execute`
**説明**: CodeGenAgent実行 - AI駆動コード生成・テスト自動生成

**パラメータ**:
- `issue_number` (required): GitHub Issue番号
- `title` (required): タスクタイトル
- `description` (required): タスク詳細
- `priority` (optional): 優先度（P0-緊急/P1-高/P2-中/P3-低）

**使用例**:
```
Claude Codeで以下のように使用:

Issue #123の実装をCodeGenAgentに実行させてください。
タイトル: ログイン機能実装
詳細: Firebase Authenticationでログイン画面を実装する
```

### 2. `agentic_review_execute`
**説明**: ReviewAgent実行 - 静的解析・セキュリティスキャン・品質判定

**パラメータ**:
- `issue_number` (required): GitHub Issue番号
- `target_files` (optional): レビュー対象ファイルパス配列

**使用例**:
```
現在の実装をReviewAgentで品質チェックしてください
```

### 3. `agentic_issue_analyze`
**説明**: IssueAgent実行 - Issue内容AI分析・Label自動付与

**パラメータ**:
- `issue_number` (required): GitHub Issue番号
- `title` (required): Issue タイトル
- `body` (required): Issue 本文

**使用例**:
```
Issue #456を分析して、識学理論Labelを推奨してください
```

### 4. `agentic_pr_create`
**説明**: PRAgent実行 - PR自動作成・説明文AI生成

**パラメータ**:
- `issue_number` (required): GitHub Issue番号
- `branch_name` (optional): ブランチ名

**使用例**:
```
Issue #789の実装が完了したので、PRAgentでPR作成してください
```

### 5. `agentic_coordinator_decompose`
**説明**: CoordinatorAgent実行 - タスク分解（DAG構築）・Agent選定

**パラメータ**:
- `issue_number` (required): GitHub Issue番号
- `title` (required): タスクタイトル
- `description` (required): タスク詳細

**使用例**:
```
大規模な機能実装タスクをCoordinatorAgentで分解してください
```

### 6. `agentic_kpi_collect`
**説明**: KPI収集・ダッシュボード生成

**パラメータ**:
- `period` (optional): 集計期間（6h/24h/7d/30d）

**使用例**:
```
過去24時間のKPIを収集してください
```

### 7. `agentic_metrics_view`
**説明**: 識学理論KPIダッシュボード表示

**パラメータ**: なし

**使用例**:
```
現在のKPIダッシュボードを表示してください
```

---

## 📊 識学理論対応

### 責任と権限の明確化
各Toolは対応するAgentの権限レベルで実行されます:
- CodeGenAgent: 🔵実行権限
- ReviewAgent: 🟡確認権限
- IssueAgent: 🔵実行権限
- PRAgent: 🔵実行権限
- CoordinatorAgent: 🔴決裁権限

### 結果重視
全Toolは`quality_score`を返し、客観的な評価を提供します。

### エスカレーション
品質基準未達時は自動的にエスカレーションし、適切な担当者に通知します。

---

## 🧪 テスト

```bash
# MCP Server起動テスト
npm run dev

# 別ターミナルで
echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | node dist/server.js
```

---

## 🔧 トラブルシューティング

### Tools が表示されない
1. Claude Desktop設定を確認
2. パスが正しいか確認
3. Claude Desktop再起動

### Agent実行エラー
1. GITHUB_TOKEN設定を確認
2. ANTHROPIC_API_KEY設定を確認
3. リポジトリパス確認

---

**🤖 Agentic Orchestration MCP Server - Ready for Claude Code!**
