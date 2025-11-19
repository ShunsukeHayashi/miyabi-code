# Miyabi MCP - Workflow Patterns
# MCPツール活用ワークフローパターン集

**Last Updated**: 2025-11-19
**Purpose**: 状況別の最適なツール使用パターンを提供

---

## 📋 ワークフローカテゴリー

```
Workflow Patterns
├── 1. Development Workflows (開発フロー)
├── 2. Monitoring Workflows (監視フロー)
├── 3. Troubleshooting Workflows (トラブルシューティング)
├── 4. Integration Workflows (統合フロー)
└── 5. Reporting Workflows (レポート)
```

---

## 1️⃣ Development Workflows

### WF-D1: 作業開始フロー

**目的**: 作業開始時の完全な状況把握

**Step 1: Git状態確認**
```typescript
git_status()
// → ブランチ、変更ファイル、ステータス確認
```

**Step 2: 未完了タスク確認**
```typescript
github_list_issues({ state: "open", assignee: "@me" })
// → 自分のタスク一覧取得
```

**Step 3: バックグラウンド確認**
```typescript
tmux_list_panes()
// → 実行中のプロセス・セッション確認
```

**Step 4: エラー確認**
```typescript
log_get_errors({ minutes: 60 })
// → 過去1時間のエラー確認
```

**Step 5: システム状態確認**
```typescript
resource_overview()
// → CPU・メモリ・ディスク確認
```

**期待される成果**:
- ✅ 現在の作業状態を完全に把握
- ✅ 優先すべきタスクを特定
- ✅ 問題があれば早期発見

---

### WF-D2: 実装作業フロー

**目的**: 効率的なコーディングとテスト

**Step 1: Issue確認**
```typescript
github_get_issue({ issue_number: XXX })
// → 実装内容・要件確認
```

**Step 2: ブランチ作成（必要時）**
```typescript
// git操作はgit_statusで現状確認後、Bashツールで実行
git_status()
// → 現在のブランチ確認
```

**Step 3: 実装中の定期確認**
```typescript
// 30分ごとに実行
file_recent_changes({ minutes: 30 })
git_diff()
log_get_recent({ minutes: 30 })
```

**Step 4: 実装完了確認**
```typescript
git_status()
git_diff()
// → 変更内容の最終確認
```

**Step 5: コミット・PR作成**
```typescript
// Bashツールでcommit後
github_create_pr({
  title: "Implement feature X",
  head: "feature-x",
  base: "main",
  body: "Closes #XXX..."
})
```

---

### WF-D3: コードレビューフロー

**目的**: 効率的なレビュー実施

**Step 1: PR詳細取得**
```typescript
github_get_pr({ pull_number: XXX })
// → PR内容確認
```

**Step 2: 変更ファイル確認**
```typescript
git_diff() // または該当ブランチで
file_recent_changes()
```

**Step 3: 関連Issue確認**
```typescript
github_get_issue({ issue_number: XXX })
// → 元の要件確認
```

**Step 4: レビューコメント**
```typescript
github_add_comment({
  issue_number: XXX,
  body: "レビューコメント..."
})
```

**Step 5: 承認・マージ**
```typescript
github_merge_pr({
  pull_number: XXX,
  merge_method: "squash"
})
```

---

## 2️⃣ Monitoring Workflows

### WF-M1: システム定期監視

**頻度**: 30分ごと

**Step 1: リソース確認**
```typescript
resource_overview()
// → CPU・メモリ・ディスク一括確認
```

**Step 2: プロセス確認**
```typescript
process_top({ limit: 10 })
// → CPU使用率TOP 10
```

**Step 3: エラー確認**
```typescript
log_get_errors({ minutes: 30 })
// → 新しいエラー検出
```

**Step 4: ネットワーク確認**
```typescript
network_overview()
// → ネットワーク状態確認
```

**アラート条件**:
- CPU使用率 > 80%
- メモリ使用率 > 90%
- 新規エラーログ検出
- ネットワーク接続異常

---

### WF-M2: ファイル変更監視

**頻度**: リアルタイムまたは10分ごと

**Step 1: 最近の変更確認**
```typescript
file_recent_changes({ minutes: 10, limit: 50 })
// → 変更されたファイル一覧
```

**Step 2: 重要ファイル確認**
```typescript
file_search({ pattern: "**/*.{ts,tsx,json}" })
// → 重要ファイルの変更
```

**Step 3: Git状態確認**
```typescript
git_status()
// → 未コミット変更確認
```

---

### WF-M3: Claude Code自己監視

**頻度**: 1時間ごと

**Step 1: Claude状態確認**
```typescript
claude_status()
// → Claude Code総合ステータス
```

**Step 2: MCPサーバー状態**
```typescript
claude_mcp_status()
// → 全MCPサーバー稼働確認
```

**Step 3: Claude ログ確認**
```typescript
claude_logs({ lines: 100 })
// → 最新ログ確認
```

**Step 4: 異常時のログ検索**
```typescript
claude_log_search({ query: "error" })
// → エラー詳細調査
```

---

## 3️⃣ Troubleshooting Workflows

### WF-T1: エラー原因調査

**トリガー**: エラーログ検出時

**Step 1: エラー詳細取得**
```typescript
log_get_errors({ minutes: 60 })
log_search({ query: "エラーメッセージ" })
// → エラーの詳細情報取得
```

**Step 2: 関連プロセス確認**
```typescript
process_search({ query: "関連プロセス名" })
process_info({ pid: XXX })
// → エラー発生プロセス特定
```

**Step 3: 変更ファイル確認**
```typescript
file_changes_since({ since: "エラー発生時刻" })
git_log({ limit: 10 })
// → エラー前後の変更確認
```

**Step 4: システム状態確認**
```typescript
resource_overview()
network_connections()
// → リソース・ネットワーク確認
```

**Step 5: Issue作成**
```typescript
github_create_issue({
  title: "Error: エラー概要",
  body: "詳細調査結果...",
  labels: ["bug", "high-priority"]
})
```

---

### WF-T2: パフォーマンス問題調査

**トリガー**: システム遅延検出時

**Step 1: リソース状況確認**
```typescript
resource_overview()
resource_cpu()
resource_memory()
```

**Step 2: ボトルネック特定**
```typescript
process_top({ limit: 20 })
// → CPU・メモリ使用率TOP 20
```

**Step 3: プロセス詳細調査**
```typescript
process_info({ pid: XXX })
process_file_descriptors({ pid: XXX })
// → 問題プロセスの詳細
```

**Step 4: ネットワーク確認**
```typescript
network_bandwidth()
network_connections()
// → ネットワークI/O確認
```

**Step 5: ログ調査**
```typescript
log_search({ query: "slow|timeout|performance" })
// → パフォーマンス関連ログ
```

---

### WF-T3: ネットワーク問題調査

**トリガー**: 接続エラー・タイムアウト

**Step 1: ネットワーク状態確認**
```typescript
network_overview()
network_interfaces()
```

**Step 2: 接続確認**
```typescript
network_connections()
network_listening_ports()
```

**Step 3: 到達性テスト**
```typescript
network_ping({ host: "target.com" })
network_gateway()
```

**Step 4: 関連プロセス確認**
```typescript
process_search({ query: "ネットワーク関連プロセス" })
```

---

## 4️⃣ Integration Workflows

### WF-I1: GitHub Issue → 実装 → PR

**完全自動化フロー**

**Step 1: Issue取得**
```typescript
github_list_issues({ state: "open", labels: "ready" })
github_get_issue({ issue_number: XXX })
```

**Step 2: 作業環境準備**
```typescript
git_status()
tmux_list_panes()
```

**Step 3: 実装**
```
// コーディング作業
```

**Step 4: 確認**
```typescript
git_diff()
file_recent_changes()
log_get_recent()
```

**Step 5: PR作成**
```typescript
github_create_pr({
  title: "Fix #XXX: タイトル",
  head: "fix-xxx",
  base: "main",
  body: "Closes #XXX\n\n実装内容..."
})
```

**Step 6: Issue更新**
```typescript
github_add_comment({
  issue_number: XXX,
  body: "PR created: #YYY"
})
```

---

### WF-I2: エラー検出 → Issue自動作成

**Step 1: エラー監視**
```typescript
log_get_errors({ minutes: 10 })
// → 定期的にエラー確認
```

**Step 2: エラー詳細調査**
```typescript
log_search({ query: "エラーメッセージ" })
process_search({ query: "関連プロセス" })
file_changes_since({ since: "エラー時刻" })
```

**Step 3: Issue自動作成**
```typescript
github_create_issue({
  title: "Error detected: エラー概要",
  body: `
**Error Details:**
${errorDetails}

**Process Info:**
${processInfo}

**Recent Changes:**
${recentChanges}

**Logs:**
${logEntries}
  `,
  labels: ["bug", "auto-generated"]
})
```

---

## 5️⃣ Reporting Workflows

### WF-R1: デイリースタンドアップレポート

**頻度**: 毎日1回（朝）

**Step 1: 昨日の作業確認**
```typescript
git_log({ since: "昨日", limit: 50 })
github_list_issues({ state: "closed", since: "昨日" })
github_list_prs({ state: "merged", since: "昨日" })
```

**Step 2: 変更ファイル確認**
```typescript
file_changes_since({ since: "昨日" })
```

**Step 3: エラー確認**
```typescript
log_get_errors({ minutes: 1440 }) // 24時間
```

**Step 4: レポート生成**
```
**Yesterday's Work:**
- Commits: X件
- Issues Closed: Y件
- PRs Merged: Z件
- Files Changed: W件
- Errors: E件
```

---

### WF-R2: 週次システムレポート

**頻度**: 毎週1回

**Step 1: システム状態**
```typescript
resource_overview()
resource_uptime()
claude_status()
```

**Step 2: GitHub活動**
```typescript
github_list_issues({ state: "all", since: "1 week ago" })
github_list_prs({ state: "all", since: "1 week ago" })
```

**Step 3: エラー統計**
```typescript
log_get_errors({ minutes: 10080 }) // 1週間
log_get_warnings({ minutes: 10080 })
```

**Step 4: パフォーマンストレンド**
```typescript
resource_processes()
process_top({ limit: 20 })
network_bandwidth()
```

---

## 🎯 ワークフロー選択ガイド

### 状況別推奨ワークフロー

| 状況 | 推奨ワークフロー |
|------|----------------|
| 作業開始時 | WF-D1 |
| 実装作業中 | WF-D2 |
| コードレビュー | WF-D3 |
| 定期監視 | WF-M1, WF-M2, WF-M3 |
| エラー発生 | WF-T1 |
| 性能低下 | WF-T2 |
| ネットワーク問題 | WF-T3 |
| タスク管理 | WF-I1 |
| エラー管理 | WF-I2 |
| 日次レポート | WF-R1 |
| 週次レポート | WF-R2 |

---

**これらのワークフローパターンを参考に、状況に応じた最適なツール使用を実現してください。**
