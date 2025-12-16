---
title: "Claude Desktopを最強の開発ツールにする102ツール搭載MCPサーバー"
emoji: "🚀"
type: "tech"
topics: ["claude", "mcp", "ai", "開発ツール", "typescript"]
published: false
---

# Claude Desktopを最強の開発ツールにする102ツール搭載MCPサーバー

## はじめに

Claude Desktopを使っていますか？もし「AIとチャットするだけ」で終わっているなら、その可能性の10%も使えていないかもしれません。

**miyabi-mcp-bundle**を導入すれば、Claude Desktopが以下のことをできるようになります：

- Git操作（コミット履歴、ブランチ管理、差分確認）
- GitHub連携（Issue作成、PR管理、ワークフロー確認）
- ファイル操作（監視、検索、バックアップ）
- システム監視（リソース使用率、プロセス管理）
- そして**100以上の開発支援ツール**

## MCPとは？

MCP (Model Context Protocol) は、Anthropicが開発したプロトコルで、AIアシスタントに外部ツールへのアクセス権を与えます。

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Claude Desktop │ ←→  │   MCP Server    │ ←→  │  External Tools │
│    (AI Assistant)│     │ (miyabi-mcp)    │     │  (Git, GitHub)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

つまり、**Claudeが直接あなたのローカル環境やGitHubにアクセス**できるようになります。

## インストール（1分で完了）

### 1. リポジトリをクローン

```bash
git clone https://github.com/ShunsukeHayashi/miyabi-mcp-bundle.git
cd miyabi-mcp-bundle
npm install && npm run build
```

### 2. Claude Desktop設定

`~/Library/Application Support/Claude/claude_desktop_config.json`（Mac）または
`%APPDATA%\Claude\claude_desktop_config.json`（Windows）を編集：

```json
{
  "mcpServers": {
    "miyabi-mcp-bundle": {
      "command": "node",
      "args": ["/path/to/miyabi-mcp-bundle/dist/index.js"]
    }
  }
}
```

### 3. Claude Desktopを再起動

これだけで**102ツール**が使えるようになります！

## 主要機能紹介

### 1. Git Inspector（リポジトリ完全把握）

```
「現在のブランチの状況を教えて」
「最近のコミット履歴を見せて」
「main ブランチとの差分を確認して」
```

Claudeがgit log、git diff、git statusを実行し、結果を分かりやすく説明してくれます。

### 2. GitHub Integration（Issue/PR管理）

```
「バグ報告のIssueを作成して」
「オープン中のPRをリストアップして」
「GitHub Actionsの状態を確認して」
```

gh コマンドを使わずに、自然言語でGitHub操作が可能。

### 3. Society Health（26 Societies監視）

```
「全Societyの健康状態をチェックして」
「Agentの稼働状況を確認して」
```

Miyabiシステムの26個のSocietyをリアルタイム監視。

### 4. Metrics Aggregator（システム監視）

```
「現在のCPU・メモリ使用率は？」
「今日のメトリクスダッシュボードを見せて」
```

システムリソースの可視化と分析。

## ツール一覧（102ツール）

| カテゴリ | ツール数 | 主な機能 |
|---------|---------|---------|
| Git Inspector | 12 | コミット分析、ブランチ管理 |
| GitHub Integration | 15 | Issue/PR/Actions操作 |
| File Operations | 10 | ファイル監視、検索 |
| tmux Management | 8 | セッション管理 |
| Society Health | 5 | Miyabi Society監視 |
| Metrics | 5 | メトリクス収集 |
| Bridge API | 6 | Society間通信 |
| Context | 6 | コンテキスト管理 |
| その他 | 35 | システム、ユーティリティ |

## 実際の使用例

### コードレビュー支援

```
ユーザー: 「feature/loginブランチの変更内容をレビューして」

Claude: （Git Inspectorを使用）
feature/loginブランチでは以下の変更があります：

1. src/auth/login.ts (+45行)
   - ログイン処理の実装
   - バリデーション追加

2. src/components/LoginForm.tsx (+120行)
   - ログインフォームのUI
   - エラーハンドリング

改善提案:
- パスワードのバリデーションルールを追加することを推奨
- エラーメッセージの国際化対応を検討
```

### Issue自動作成

```
ユーザー: 「ログイン時にパスワードを表示/非表示する機能が欲しい」

Claude: （GitHub Integrationを使用）
Issue #42 を作成しました：
タイトル: 「ログインフォームにパスワード表示/非表示トグル追加」
ラベル: enhancement, ui
```

## 他のMCPサーバーとの違い

| 特徴 | miyabi-mcp-bundle | 一般的なMCPサーバー |
|------|------------------|-------------------|
| ツール数 | 102 | 5-20 |
| 日本語対応 | ◎ | △ |
| 統合性 | 全ツールが連携 | 個別動作 |
| Miyabi統合 | ◎ | - |
| セットアップ | 1コマンド | 個別設定必要 |

## まとめ

**miyabi-mcp-bundle**を導入すると：

✅ Claude Desktopが**本格的な開発環境**に進化
✅ Git/GitHub操作が**自然言語で可能**
✅ 102ツールを**1コマンドで導入**
✅ 日本語で完全サポート

ぜひ試してみてください！

## リンク

- [GitHub リポジトリ](https://github.com/ShunsukeHayashi/miyabi-mcp-bundle)
- [GitHub Discussions](https://github.com/ShunsukeHayashi/miyabi-mcp-bundle/discussions)

---

いいねとフォローをお願いします！質問はコメント欄またはGitHub Discussionsまで。
