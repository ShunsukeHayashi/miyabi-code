---
title: 【完全版】Claude Desktop向けMCPサーバーの決定版 - miyabi-mcp-bundle
tags:
  - Claude
  - MCP
  - AI
  - TypeScript
  - 開発効率化
private: false
---

# 【完全版】Claude Desktop向けMCPサーバーの決定版

## TL;DR

- **102ツール**を1つのMCPサーバーで提供
- Claude DesktopからGit/GitHub/ファイル操作が可能に
- 日本語完全対応
- インストールは1分で完了

```bash
git clone https://github.com/ShunsukeHayashi/miyabi-mcp-bundle.git
cd miyabi-mcp-bundle && npm install && npm run build
```

## なぜ miyabi-mcp-bundle なのか

### 問題：MCPサーバーの乱立

MCP（Model Context Protocol）が登場し、様々なMCPサーバーが公開されています。しかし：

- サーバーごとに**個別設定が必要**
- 機能が**断片化**している
- **日本語ドキュメント**が少ない
- 相互連携が**難しい**

### 解決：All-in-One Bundle

miyabi-mcp-bundleは、開発者が必要とする機能を**1つのサーバー**に統合：

```
┌────────────────────────────────────────────┐
│           miyabi-mcp-bundle                │
├─────────┬─────────┬─────────┬─────────────┤
│   Git   │ GitHub  │  File   │   System    │
│Inspector│ Integr. │  Ops    │   Monitor   │
├─────────┼─────────┼─────────┼─────────────┤
│ Society │ Metrics │ Bridge  │   Context   │
│ Health  │ Aggreg. │   API   │  Foundation │
└─────────┴─────────┴─────────┴─────────────┘
```

## 機能詳細

### 1. Git Inspector（12ツール）

| ツール名 | 説明 |
|---------|------|
| `git_status` | 作業ツリーの状態 |
| `git_log` | コミット履歴 |
| `git_diff` | 差分表示 |
| `git_branch_list` | ブランチ一覧 |
| `git_blame` | 行ごとの変更者 |
| `git_show` | コミット詳細 |
| `git_stash_list` | スタッシュ一覧 |
| `git_remote_info` | リモート情報 |
| `git_tag_list` | タグ一覧 |
| `git_config` | Git設定 |
| `git_reflog` | 参照ログ |
| `git_shortlog` | 貢献者別集計 |

#### 使用例

```
Q: 「最近1週間のコミットを教えて」
A: （git_logを実行）
   - 3日前: fix: ログイン時のバリデーションエラー修正
   - 5日前: feat: ダッシュボード機能追加
   - 6日前: docs: README更新
```

### 2. GitHub Integration（15ツール）

| ツール名 | 説明 |
|---------|------|
| `gh_issue_list` | Issue一覧 |
| `gh_issue_create` | Issue作成 |
| `gh_issue_view` | Issue詳細 |
| `gh_pr_list` | PR一覧 |
| `gh_pr_create` | PR作成 |
| `gh_pr_view` | PR詳細 |
| `gh_pr_merge` | PRマージ |
| `gh_workflow_list` | ワークフロー一覧 |
| `gh_workflow_run` | ワークフロー実行 |
| `gh_release_list` | リリース一覧 |
| `gh_repo_view` | リポジトリ情報 |
| `gh_repo_clone` | クローン |
| `gh_gist_create` | Gist作成 |
| `gh_search_repos` | リポジトリ検索 |
| `gh_search_code` | コード検索 |

### 3. Society Health（5ツール）- NEW!

Miyabi Systemの26個のSocietyを監視：

| ツール名 | 説明 |
|---------|------|
| `society_health_all` | 全Society一括チェック |
| `society_health_single` | 単一Societyチェック |
| `society_agent_status` | Agent稼働状況 |
| `society_mcp_status` | MCPサーバー状況 |
| `society_metrics_summary` | メトリクスサマリー |

### 4. Metrics Aggregator（5ツール）- NEW!

| ツール名 | 説明 |
|---------|------|
| `metrics_collect` | メトリクス収集 |
| `metrics_aggregate` | 集計 |
| `metrics_query` | クエリ |
| `metrics_export` | エクスポート |
| `metrics_dashboard` | ダッシュボード |

### 5. Society Bridge API（6ツール）- NEW!

Society間通信を実現：

| ツール名 | 説明 |
|---------|------|
| `bridge_send` | メッセージ送信 |
| `bridge_receive` | メッセージ受信 |
| `bridge_context_share` | コンテキスト共有 |
| `bridge_context_get` | コンテキスト取得 |
| `bridge_queue_status` | キュー状況 |
| `bridge_history` | 通信履歴 |

### 6. Context Foundation（6ツール）- NEW!

| ツール名 | 説明 |
|---------|------|
| `context_store` | コンテキスト保存 |
| `context_get` | コンテキスト取得 |
| `context_list` | 一覧表示 |
| `context_expire` | 有効期限管理 |
| `context_share` | Society間共有 |
| `context_search` | 検索 |

## インストール手順

### 前提条件

- Node.js 18以上
- Claude Desktop
- Git（オプション）
- GitHub CLI（オプション）

### Step 1: クローン＆ビルド

```bash
git clone https://github.com/ShunsukeHayashi/miyabi-mcp-bundle.git
cd miyabi-mcp-bundle
npm install
npm run build
```

### Step 2: Claude Desktop設定

**Mac**:
```bash
code ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

**Windows**:
```bash
code %APPDATA%\Claude\claude_desktop_config.json
```

以下を追加：

```json
{
  "mcpServers": {
    "miyabi-mcp-bundle": {
      "command": "node",
      "args": ["/absolute/path/to/miyabi-mcp-bundle/dist/index.js"]
    }
  }
}
```

### Step 3: 再起動

Claude Desktopを完全に終了し、再起動。

### Step 4: 動作確認

Claude Desktopで以下を入力：

```
利用可能なツール一覧を教えて
```

102ツールがリストされれば成功！

## トラブルシューティング

### MCPサーバーが認識されない

1. パスが正しいか確認（絶対パス必須）
2. `dist/index.js`が存在するか確認
3. Node.jsのバージョン確認（18以上）

### ツールが実行されない

1. 必要な外部コマンドがインストールされているか確認
   - Git: `git --version`
   - GitHub CLI: `gh --version`
2. 権限設定を確認

### エラーログの確認

```bash
# Mac
tail -f ~/Library/Logs/Claude/mcp*.log

# Windows
type %APPDATA%\Claude\logs\mcp*.log
```

## まとめ

miyabi-mcp-bundleは：

- **102ツール**を1つのサーバーで提供
- **日本語完全対応**
- **1分でインストール**可能
- **Miyabi System**との完全統合

## リンク

- [GitHub](https://github.com/ShunsukeHayashi/miyabi-mcp-bundle)
- [Discussions](https://github.com/ShunsukeHayashi/miyabi-mcp-bundle/discussions)
- [Issues](https://github.com/ShunsukeHayashi/miyabi-mcp-bundle/issues)

---

参考になったら「いいね」お願いします！
質問はコメントまたはGitHub Discussionsまで。
