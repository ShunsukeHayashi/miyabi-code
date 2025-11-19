# Miyabi MCP - Tool Index
# 階層化・優先度付きツールインデックス

**Last Updated**: 2025-11-19
**Total Tools**: 75

---

## 📊 ツール階層構造

```
Miyabi MCP (75 tools)
├── Layer 1: Development Environment (25 tools) ★★★
│   ├── Git Operations (10 tools)
│   ├── Tmux Sessions (9 tools)
│   └── Log Aggregation (6 tools)
│
├── Layer 2: System Resources (16 tools) ★★
│   ├── Resource Monitor (8 tools)
│   └── Network Inspector (8 tools)
│
├── Layer 3: Process & Files (14 tools) ★★
│   ├── Process Inspector (8 tools)
│   └── File Watcher (6 tools)
│
├── Layer 4: Self-Monitoring (8 tools) ★
│   └── Claude Code Monitor (8 tools)
│
└── Layer 5: External Integration (12 tools) ★★★
    └── GitHub Integration (12 tools)
```

---

## 🎯 優先度マトリクス

### P0 - Critical (即座に確認すべき)

| Tool | Category | Use Case |
|------|----------|----------|
| `git_status` | Git | 現在の作業状態確認 |
| `log_get_errors` | Logs | エラー検出 |
| `resource_overview` | Resources | システム状態確認 |
| `github_list_issues` | GitHub | 未完了タスク確認 |

### P1 - High Priority (頻繁に使用)

| Tool | Category | Use Case |
|------|----------|----------|
| `git_log` | Git | コミット履歴 |
| `git_diff` | Git | 変更内容確認 |
| `tmux_list_panes` | Tmux | セッション確認 |
| `tmux_pane_capture` | Tmux | ペイン出力確認 |
| `file_recent_changes` | Files | 最近の変更 |
| `process_top` | Process | リソース使用状況 |
| `github_create_issue` | GitHub | Issue作成 |

### P2 - Medium Priority (状況に応じて)

| Tool | Category | Use Case |
|------|----------|----------|
| `git_worktree_list` | Git | Worktree管理 |
| `network_connections` | Network | ネットワーク確認 |
| `file_search` | Files | ファイル検索 |
| `claude_mcp_status` | Claude | MCP状態確認 |

### P3 - Low Priority (詳細調査時)

| Tool | Category | Use Case |
|------|----------|----------|
| `git_file_history` | Git | ファイル履歴 |
| `process_environment` | Process | 環境変数確認 |
| `network_ping` | Network | 到達性テスト |

---

## 🔄 ツール使用フロー

### フロー1: 作業開始時の状況確認

```
1. git_status ────────────────> 作業ブランチ・変更確認
2. github_list_issues ────────> 未完了タスク確認
3. tmux_list_panes ───────────> バックグラウンド確認
4. log_get_errors ────────────> エラー有無確認
5. resource_overview ─────────> システム状態確認
```

### フロー2: 開発作業中

```
1. file_recent_changes ───────> 変更ファイル確認
2. git_diff ──────────────────> 差分確認
3. process_top ───────────────> リソース確認
4. log_get_recent ────────────> 最新ログ確認
```

### フロー3: タスク完了時

```
1. git_status ────────────────> 変更確認
2. github_create_issue ───────> Issue作成（必要時）
3. github_create_pr ──────────> PR作成
4. github_add_comment ────────> コメント追加
```

### フロー4: トラブルシューティング

```
1. log_get_errors ────────────> エラー検出
2. log_search ────────────────> エラー詳細検索
3. process_search ────────────> 関連プロセス確認
4. network_connections ───────> ネットワーク確認
5. file_changes_since ────────> 変更ファイル特定
```

---

## 📖 カテゴリー別ツール一覧

### Category 1: Git Operations (10 tools)
**命令系統**: Development Environment > Version Control
**優先度**: P0-P2

| Tool | Priority | Description |
|------|----------|-------------|
| `git_status` | P0 | 現在のGit状態 |
| `git_branch_list` | P1 | ブランチ一覧 |
| `git_current_branch` | P1 | 現在のブランチ |
| `git_log` | P1 | コミット履歴 |
| `git_worktree_list` | P2 | Worktree一覧 |
| `git_diff` | P1 | 未ステージング差分 |
| `git_staged_diff` | P1 | ステージング済み差分 |
| `git_remote_list` | P2 | リモート一覧 |
| `git_branch_ahead_behind` | P2 | ブランチ同期状態 |
| `git_file_history` | P3 | ファイル履歴 |

### Category 2: Tmux Sessions (9 tools)
**命令系統**: Development Environment > Session Management
**優先度**: P1-P2

| Tool | Priority | Description |
|------|----------|-------------|
| `tmux_list_sessions` | P1 | セッション一覧 |
| `tmux_list_windows` | P1 | ウィンドウ一覧 |
| `tmux_list_panes` | P1 | ペイン一覧 |
| `tmux_send_keys` | P1 | コマンド送信 |
| `tmux_pane_capture` | P1 | ペイン内容キャプチャ |
| `tmux_pane_search` | P2 | ペイン内容検索 |
| `tmux_pane_tail` | P2 | ペイン末尾取得 |
| `tmux_pane_is_busy` | P2 | ペインビジー状態 |
| `tmux_pane_current_command` | P2 | 実行中コマンド |

### Category 3: Log Aggregation (6 tools)
**命令系統**: Development Environment > Logging
**優先度**: P0-P2

| Tool | Priority | Description |
|------|----------|-------------|
| `log_sources` | P2 | ログファイル一覧 |
| `log_get_recent` | P1 | 最新ログ取得 |
| `log_search` | P1 | ログ検索 |
| `log_get_errors` | P0 | エラーログ取得 |
| `log_get_warnings` | P1 | 警告ログ取得 |
| `log_tail` | P2 | ログtail |

### Category 4: Resource Monitor (8 tools)
**命令系統**: System Resources > Monitoring
**優先度**: P0-P2

| Tool | Priority | Description |
|------|----------|-------------|
| `resource_cpu` | P1 | CPU使用率 |
| `resource_memory` | P1 | メモリ使用率 |
| `resource_disk` | P2 | ディスク使用率 |
| `resource_load` | P2 | システム負荷 |
| `resource_overview` | P0 | 総合リソース状況 |
| `resource_processes` | P1 | プロセス一覧 |
| `resource_uptime` | P2 | システム稼働時間 |
| `resource_network_stats` | P2 | ネットワーク統計 |

### Category 5: Network Inspector (8 tools)
**命令系統**: System Resources > Network
**優先度**: P2-P3

| Tool | Priority | Description |
|------|----------|-------------|
| `network_interfaces` | P2 | インターフェース一覧 |
| `network_connections` | P2 | アクティブ接続 |
| `network_listening_ports` | P2 | リスニングポート |
| `network_stats` | P2 | ネットワーク統計 |
| `network_gateway` | P3 | ゲートウェイ情報 |
| `network_ping` | P3 | Pingテスト |
| `network_bandwidth` | P2 | 帯域幅使用量 |
| `network_overview` | P2 | ネットワーク概要 |

### Category 6: Process Inspector (8 tools)
**命令系統**: Process & Files > Process Management
**優先度**: P1-P3

| Tool | Priority | Description |
|------|----------|-------------|
| `process_info` | P2 | プロセス詳細 |
| `process_list` | P2 | プロセス一覧 |
| `process_search` | P1 | プロセス検索 |
| `process_tree` | P2 | プロセスツリー |
| `process_file_descriptors` | P3 | ファイルディスクリプタ |
| `process_environment` | P3 | 環境変数 |
| `process_children` | P3 | 子プロセス |
| `process_top` | P1 | TOP プロセス |

### Category 7: File Watcher (6 tools)
**命令系統**: Process & Files > File System
**優先度**: P1-P2

| Tool | Priority | Description |
|------|----------|-------------|
| `file_stats` | P2 | ファイル情報 |
| `file_recent_changes` | P1 | 最近の変更 |
| `file_search` | P2 | ファイル検索 |
| `file_tree` | P2 | ディレクトリツリー |
| `file_compare` | P2 | ファイル比較 |
| `file_changes_since` | P1 | 指定時刻以降の変更 |

### Category 8: Claude Code Monitor (8 tools)
**命令系統**: Self-Monitoring > Claude Code
**優先度**: P1-P2

| Tool | Priority | Description |
|------|----------|-------------|
| `claude_config` | P2 | Claude設定取得 |
| `claude_mcp_status` | P2 | MCPサーバー状態 |
| `claude_session_info` | P2 | セッション情報 |
| `claude_logs` | P1 | Claudeログ |
| `claude_log_search` | P1 | ログ検索 |
| `claude_log_files` | P2 | ログファイル一覧 |
| `claude_background_shells` | P2 | バックグラウンドシェル |
| `claude_status` | P1 | 総合ステータス |

### Category 9: GitHub Integration (12 tools)
**命令系統**: External Integration > GitHub
**優先度**: P0-P2

| Tool | Priority | Description |
|------|----------|-------------|
| `github_list_issues` | P0 | Issue一覧 |
| `github_get_issue` | P1 | Issue詳細 |
| `github_create_issue` | P1 | Issue作成 |
| `github_update_issue` | P1 | Issue更新 |
| `github_add_comment` | P1 | コメント追加 |
| `github_list_prs` | P1 | PR一覧 |
| `github_get_pr` | P1 | PR詳細 |
| `github_create_pr` | P1 | PR作成 |
| `github_merge_pr` | P1 | PRマージ |
| `github_list_labels` | P2 | ラベル一覧 |
| `github_add_labels` | P2 | ラベル追加 |
| `github_list_milestones` | P2 | マイルストーン一覧 |

---

## 🎓 使用ガイドライン

### 1. 状況確認時の優先順位

```
High Priority (必ず確認):
  ├─ git_status (作業状態)
  ├─ log_get_errors (エラー有無)
  └─ resource_overview (システム状態)

Medium Priority (推奨):
  ├─ github_list_issues (タスク状況)
  ├─ tmux_list_panes (バックグラウンド)
  └─ file_recent_changes (最近の変更)

Low Priority (必要時):
  ├─ claude_status (Claude状態)
  └─ network_overview (ネットワーク)
```

### 2. ツール選択の決定木

```
Question: 何を確認したい？

├─ コード変更? ────────> git_status, git_diff
├─ エラー発生? ────────> log_get_errors, log_search
├─ タスク状況? ────────> github_list_issues
├─ システム負荷? ──────> resource_overview, process_top
├─ ファイル変更? ──────> file_recent_changes
└─ ネットワーク? ──────> network_overview
```

### 3. 効率的なツール組み合わせ

**組み合わせ1: 作業開始**
```
git_status + github_list_issues + tmux_list_panes
→ 完全な作業環境確認
```

**組み合わせ2: エラー調査**
```
log_get_errors + process_search + file_changes_since
→ エラー原因特定
```

**組み合わせ3: パフォーマンス診断**
```
resource_overview + process_top + network_bandwidth
→ ボトルネック特定
```

---

**このインデックスを使用して、適切なツールを効率的に選択してください。**
