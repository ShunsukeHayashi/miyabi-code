# Miyabi MCP - Quick Start Guide

**所要時間**: 5分
**前提条件**: Claude Desktop がインストール済み

---

## 🚀 3ステップで開始

### Step 1: GitHub Token を更新 (2分)

1. GitHub Personal Access Token を作成:
   - https://github.com/settings/tokens にアクセス
   - "Generate new token (classic)" をクリック
   - Scopes: `repo`, `read:org`, `read:user` を選択
   - トークンをコピー

2. Claude Desktop 設定を編集:
   ```bash
   open ~/Library/Application\ Support/Claude/claude_desktop_config.json
   ```

3. `GITHUB_TOKEN` を更新:
   ```json
   "GITHUB_TOKEN": "ghp_YOUR_ACTUAL_TOKEN_HERE"
   ```

### Step 2: Claude Desktop を再起動 (1分)

```bash
# Claude Desktop を完全終了
pkill -f "Claude"

# 再起動
open -a "Claude"
```

### Step 3: 動作確認 (2分)

新しい Claude Code セッションで以下を実行:

```typescript
// Git状態確認
git_status()

// システム状態確認
resource_overview()

// Issue一覧取得
github_list_issues({ state: "open" })
```

**成功**: 全てのツールが正常に動作すれば完了です！

---

## 📋 毎日の使い方

### 作業開始時 (必須)

```typescript
// P0 ツール - 必ず確認
git_status()                              // 作業状態
log_get_errors({ minutes: 1440 })        // 過去24時間のエラー
resource_overview()                       // システム状態
github_list_issues({
  state: "open",
  assignee: "@me"
})                                        // 自分のタスク
```

### 開発作業中

```typescript
// 30分ごとに確認
file_recent_changes({ minutes: 30 })     // 最近の変更
git_diff()                                // 差分確認
log_get_recent({ minutes: 30 })          // 最新ログ
```

### エラー発生時

```typescript
// エラー調査フロー
log_get_errors({ minutes: 60 })          // エラー検出
log_search({ query: "エラーメッセージ" })  // 詳細検索
process_search({ query: "プロセス名" })    // 関連プロセス
file_changes_since({ since: "時刻" })     // 変更ファイル特定
```

---

## 🎯 よく使うツール Top 10

1. **git_status** - Git作業状態確認
2. **github_list_issues** - Issue一覧取得
3. **log_get_errors** - エラーログ検出
4. **resource_overview** - システム状態一覧
5. **git_diff** - 変更差分確認
6. **tmux_list_panes** - tmuxペイン一覧
7. **file_recent_changes** - 最近のファイル変更
8. **process_top** - CPU使用率TOP
9. **github_create_issue** - Issue作成
10. **claude_status** - Claude Code状態確認

---

## 🔍 トラブルシューティング

### ツールが動作しない場合

```typescript
// MCPサーバー状態確認
claude_mcp_status()

// Claudeログ確認
claude_logs({ lines: 100 })

// エラー検索
claude_log_search({ query: "error" })
```

### よくあるエラー

**1. GitHub APIエラー**
```
Error: Bad credentials
→ Solution: GitHub tokenを確認・更新
```

**2. MCPサーバー未起動**
```
Error: Server not found
→ Solution: Claude Desktopを再起動
```

**3. パス設定エラー**
```
Error: ENOENT: no such file or directory
→ Solution: 環境変数のパスを確認
```

---

## 📚 詳細ドキュメント

- **全ツールリファレンス**: `README.md`
- **階層的ツール索引**: `TOOL_INDEX.md`
- **ワークフローパターン**: `WORKFLOW_PATTERNS.md`
- **デプロイメント詳細**: `DEPLOYMENT_SUMMARY.md`

---

## ✅ 初回セットアップチェックリスト

- [ ] GitHub Personal Access Token 作成
- [ ] Claude Desktop 設定更新
- [ ] `GITHUB_TOKEN` 設定
- [ ] Claude Desktop 再起動
- [ ] `git_status()` 動作確認
- [ ] `github_list_issues()` 動作確認
- [ ] `resource_overview()` 動作確認
- [ ] ドキュメント確認

---

## 🎉 これで準備完了！

Miyabi MCP の 75 ツールが利用可能になりました。

**推奨**: まず `WORKFLOW_PATTERNS.md` を読んで、状況別の使い方を確認してください。

**Happy Coding with Miyabi MCP! 🚀**
