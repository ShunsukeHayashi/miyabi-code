# CLAUDE.md

このファイルは、Claude Code（claude.ai/code）がこのリポジトリのコードを操作する際のガイドラインを提供します。

---

## プロジェクト概要

**Agentic MCP Server**は、Claude Code用のModel Context Protocol (MCP) Serverです。識学理論に基づいたAI Agentシステムを提供し、GitHub Issue管理からコード生成、レビュー、PR作成、デプロイまでの開発プロセスを完全自動化します。

### 技術スタック

- **言語**: TypeScript 5.8+
- **ランタイム**: Node.js 20+
- **MCP SDK**: @modelcontextprotocol/sdk ^1.0.4
- **AI Integration**: @anthropic-ai/sdk ^0.32.1
- **GitHub Integration**: @octokit/rest ^21.0.2
- **環境変数**: dotenv ^17.2.2

---

## 開発コマンド

### 基本コマンド

```bash
npm install         # 依存関係インストール
npm run build       # TypeScriptコンパイル
npm run dev         # 開発モード（ウォッチ）
npm run start       # MCP Server起動
```

### テストコマンド

```bash
# MCP Server起動テスト
echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | node mcp-wrapper.cjs

# tools/list の期待結果: 7つのツール表示
# - agentic_codegen_execute
# - agentic_review_execute
# - agentic_issue_analyze
# - agentic_pr_create
# - agentic_coordinator_decompose
# - agentic_kpi_collect
# - agentic_metrics_view
```

---

## ディレクトリ構成

```
agentic-mcp-server/
├── server.ts              # MCP Server実装（メインファイル）
├── mcp-wrapper.cjs        # Claude Code用エントリーポイント
├── package.json           # 依存関係定義
├── tsconfig.json          # TypeScript設定
├── .env.example           # 環境変数テンプレート
├── .env                   # 環境変数（gitignore済み）
├── dist/                  # ビルド出力（gitignore済み）
│   └── server.js          # コンパイル済みサーバー
├── README.md              # プロジェクト概要
├── SETUP.md               # セットアップガイド
├── AGENTS.md              # Agent仕様書
└── CLAUDE.md              # このファイル
```

---

## コーディング規約

### TypeScript設定

- **target**: ES2022
- **module**: CommonJS
- **strict**: true
- **esModuleInterop**: true

### コードスタイル

1. **関数コメント**: JSDocスタイルで記述
   ```typescript
   /**
    * Issue内容をAI分析してLabel推奨
    * @param issueNumber - GitHub Issue番号
    * @param title - Issue タイトル
    * @param body - Issue 本文
    * @returns Label推奨結果
    */
   ```

2. **エラーハンドリング**: try-catchで必ず補足
   ```typescript
   try {
     // 処理
   } catch (error) {
     console.error('エラー詳細:', error);
     throw error;
   }
   ```

3. **環境変数アクセス**: process.env経由
   ```typescript
   const githubToken = process.env.GITHUB_TOKEN;
   if (!githubToken) {
     throw new Error('GITHUB_TOKEN is required');
   }
   ```

---

## MCP Server開発ガイド

### Tool定義

すべてのToolは以下の形式で定義:

```typescript
{
  name: 'tool_name',
  description: 'ツールの説明',
  inputSchema: {
    type: 'object',
    properties: {
      param_name: {
        type: 'string',
        description: 'パラメータ説明'
      }
    },
    required: ['param_name']
  }
}
```

### Tool実装

Tool実装は`server.ts`の`server.setRequestHandler(CallToolRequestSchema, ...)`内:

```typescript
case 'agentic_issue_analyze':
  // 1. パラメータ取得
  const { issue_number, title, body } = args;

  // 2. 処理実行
  const result = await analyzeIssue(issue_number, title, body);

  // 3. レスポンス返却
  return {
    content: [{
      type: 'text',
      text: JSON.stringify(result)
    }]
  };
```

### エラーハンドリング

```typescript
try {
  // 処理
} catch (error) {
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        error: true,
        message: error.message
      })
    }],
    isError: true
  };
}
```

---

## 環境変数管理

### 必須環境変数

| 変数名 | 説明 | 必須 |
|--------|------|------|
| `GITHUB_TOKEN` | GitHub Personal Access Token | ✅ |
| `ANTHROPIC_API_KEY` | Anthropic Claude API Key | ✅ |
| `GITHUB_REPOSITORY` | owner/repo形式 | ✅ |
| `GITHUB_REPOSITORY_PATH` | ローカルリポジトリパス | ❌ |

### 設定方法

`.env`ファイルを作成:

```bash
cp .env.example .env
# .envを編集してAPIキーを設定
```

---

## GitHub Actions統合

このMCP Serverは、GitHub Actionsワークフローと連携して動作します。

### ワークフロー例

```yaml
name: Agentic System

on:
  issues:
    types: [opened]

jobs:
  analyze_issue:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run agents:build
      - name: IssueAgent実行
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          node dist/agents/issue-agent.js \
            --issue-number=${{ github.event.issue.number }}
```

---

## 識学理論対応

このプロジェクトは識学理論に基づいて設計されています。

### 責任と権限の明確化

| 権限レベル | 該当Agent | 責務 |
|-----------|-----------|------|
| 🔴 決裁権限 | CoordinatorAgent | タスク分解・Agent選定 |
| 🔵 実行権限 | CodeGenAgent, IssueAgent, PRAgent | コード生成・Issue管理 |
| 🟡 確認権限 | ReviewAgent | コードレビュー・品質判定 |

### Label体系

#### ステータスLabel
- `00.未着手` - 責任者未定・作業未開始
- `01.設計中` - 要件定義・設計フェーズ
- `02.実装中` - コーディング中
- `03.レビュー中` - コードレビュー待ち
- `04.テスト中` - QAテスト中
- `05.完了` - 実装完了・クローズ

#### 優先度Label
- `➡️P0-緊急` - 即座対応・サービス停止レベル
- `➡️P1-高` - 24時間以内対応・重大な機能制限
- `➡️P2-中` - 1週間以内対応・一部機能制限
- `➡️P3-低` - 計画的対応・改善要望

---

## 開発ガイドライン

### 新しいTool追加手順

1. **Tool定義追加**
   ```typescript
   const TOOLS: Tool[] = [
     // 既存ツール...
     {
       name: 'new_tool_name',
       description: '新ツールの説明',
       inputSchema: { /* ... */ }
     }
   ];
   ```

2. **Tool実装追加**
   ```typescript
   case 'new_tool_name':
     // 処理実装
     return { /* ... */ };
   ```

3. **ビルド・テスト**
   ```bash
   npm run build
   echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | node mcp-wrapper.cjs
   ```

4. **ドキュメント更新**
   - `README.md` - ツール一覧更新
   - `AGENTS.md` - Agent仕様追加

### Agent実装追加手順

1. **Agentファイル作成** (別リポジトリ)
   ```bash
   # メインリポジトリ側で実装
   touch src/agents/new-agent.ts
   ```

2. **BaseAgent継承**
   ```typescript
   import { BaseAgent } from './base-agent';

   export class NewAgent extends BaseAgent {
     async execute(params: any) {
       // 実装
     }
   }
   ```

3. **GitHub Actions統合**
   - `.github/workflows/` にワークフロー追加

---

## トラブルシューティング

### ビルドエラー

```bash
# node_modules削除して再インストール
rm -rf node_modules package-lock.json
npm install
npm run build
```

### MCP Server起動エラー

```bash
# 環境変数確認
cat .env

# dotenvインストール確認
npm list dotenv

# 起動テスト
node mcp-wrapper.cjs
```

### Tool実行エラー

1. `.env`ファイルの設定確認
2. GITHUB_TOKEN権限確認（repo, workflow, issues, pull_requests）
3. ANTHROPIC_API_KEY有効性確認

---

## パフォーマンス最適化

### Claude API呼び出し

- **Caching**: Prompt Caching活用で80%コスト削減
- **Retry**: 3回まで自動リトライ
- **Timeout**: 30秒でタイムアウト

### GitHub API呼び出し

- **Rate Limit**: 5000 req/hour制限に注意
- **Pagination**: 大量データ取得時はページング

---

## セキュリティ

### 機密情報管理

- ✅ `.env`ファイルは`.gitignore`に含める
- ✅ APIキーはハードコード禁止
- ✅ Secretsはprocess.env経由のみアクセス

### 権限管理

- GitHub Token最小権限原則
- 読み取り専用操作にはread権限のみ

---

## 関連ドキュメント

- [README.md](./README.md) - プロジェクト概要・クイックスタート
- [SETUP.md](./SETUP.md) - 詳細セットアップガイド
- [AGENTS.md](./AGENTS.md) - Agent仕様書・識学理論詳細
- [Model Context Protocol](https://modelcontextprotocol.io/) - MCP公式ドキュメント

---

## 開発タスク優先順位

Claude Codeで作業する際の優先順位:

1. **P0-緊急**: MCP Server起動エラー・Tool実行失敗
2. **P1-高**: 新Agent実装・GitHub Actions統合
3. **P2-中**: パフォーマンス最適化・ドキュメント更新
4. **P3-低**: リファクタリング・コメント追加

---

**🤖 Agentic MCP Server - Ready for Claude Code Development!**
